#!/usr/bin/env bash
# Spins up a throwaway Postgres, applies a Supabase auth stub + all migrations + seed, then runs the RLS/RPC tests.
# Usage: pnpm db:test   (needs Postgres 15+ binaries on PATH or in /usr/lib/postgresql/*/bin)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PGBIN="$(dirname "$(command -v initdb 2>/dev/null || ls -d /usr/lib/postgresql/*/bin/initdb | tail -1)")"
TMP="$(mktemp -d)"
PORT="${PGPORT_TEST:-55432}"
cleanup() { "$PGBIN/pg_ctl" -D "$TMP/data" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$TMP"; }
trap cleanup EXIT

RUNAS=()
if [ "$(id -u)" = "0" ]; then
  id pgtest >/dev/null 2>&1 || useradd -M pgtest
  chown -R pgtest "$TMP"
  RUNAS=(runuser -u pgtest --)
fi

"${RUNAS[@]}" "$PGBIN/initdb" -D "$TMP/data" -U postgres --locale=C.UTF-8 --encoding=UTF8 >/dev/null
"${RUNAS[@]}" "$PGBIN/pg_ctl" -D "$TMP/data" -o "-p $PORT -k $TMP -c listen_addresses=''" -l "$TMP/log" start >/dev/null

PSQL=(psql -h "$TMP" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q -X)
"${PSQL[@]}" -f "$ROOT/supabase/db-tests/00_supabase_stub.sql"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "migrate  $(basename "$f")"
  "${PSQL[@]}" -o /dev/null -f "$f"
done
echo "seed     seed.sql"
"${PSQL[@]}" -f "$ROOT/supabase/seed.sql"
for f in "$ROOT"/supabase/db-tests/[1-9]*.sql; do
  echo "test     $(basename "$f")"
  "${PSQL[@]}" -o /dev/null -f "$f"
done
echo "db tests passed"
