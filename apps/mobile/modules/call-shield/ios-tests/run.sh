#!/usr/bin/env bash
# Runs the DirectoryBuilder tests with any Swift 5.9+ toolchain (macOS or Linux).
set -euo pipefail
cd "$(dirname "$0")"
OUT="$(mktemp -d)/dirtests"
swiftc ../ios/DirectoryBuilder.swift main.swift -o "$OUT"
"$OUT"
