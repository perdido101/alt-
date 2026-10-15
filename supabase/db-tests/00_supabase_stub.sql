-- Minimal stand-in for the parts of Supabase the migrations rely on, so they can be tested on plain Postgres
-- (scripts/db-test.sh). Not used in real Supabase projects.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
grant usage on schema public to anon, authenticated, service_role;

create schema auth;
grant usage on schema auth to anon, authenticated, service_role;
create table auth.users (
  id uuid primary key default gen_random_uuid(),
  instance_id uuid,
  aud text default 'authenticated',
  role text default 'authenticated',
  email text,
  phone text,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb default '{}'::jsonb,
  raw_user_meta_data jsonb default '{}'::jsonb,
  is_anonymous boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(auth.jwt() ->> 'sub', '')::uuid;
$$;
grant execute on function auth.jwt(), auth.uid() to anon, authenticated, service_role;

-- Supabase grants table access to service_role by default.
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;
