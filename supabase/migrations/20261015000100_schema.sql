-- ΑΛΤ! schema: extensions, enums, tables, indexes.
-- RLS policies live in 20261015000200_rls.sql, functions/RPCs in 20261015000300_functions.sql.
-- Every enum mirrors packages/core/src/enums.ts.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.member_role as enum ('guardian', 'protected');
create type public.plan_tier as enum ('free', 'family', 'family_plus');
create type public.verdict as enum ('safe', 'caution', 'scam');
create type public.scam_category as enum (
  'fake_relative', 'fake_police', 'fake_bank', 'fake_courier', 'fake_utility_refund', 'new_number',
  'prize', 'romance', 'investment', 'identity_request', 'other', 'none'
);
create type public.check_channel as enum ('in_app', 'viber', 'whatsapp');
create type public.check_input_kind as enum ('text', 'link', 'image', 'voice');
create type public.official_category as enum (
  'police', 'health', 'bank', 'tax_social', 'post_courier', 'utility', 'telco', 'emergency'
);
create type public.call_classification as enum ('family', 'official', 'reported_scam', 'risky', 'unknown');
create type public.protection_level as enum ('warn', 'silence', 'block');
create type public.alert_source as enum ('button', 'call', 'message');
create type public.alert_status as enum ('open', 'resolved');
create type public.delivery_channel as enum ('push', 'sms', 'email');
create type public.delivery_status as enum ('queued', 'sent', 'delivered', 'failed');
create type public.report_status as enum ('pending', 'approved', 'rejected');
create type public.quiz_result as enum ('correct', 'wrong', 'skipped');
create type public.subscription_status as enum ('trialing', 'active', 'past_due', 'canceled', 'incomplete');
create type public.relation as enum ('son', 'daughter', 'grandchild', 'sibling', 'spouse', 'neighbour', 'friend', 'other');
create type public.org_kind as enum ('municipality', 'kapi', 'bank', 'telco', 'other');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- E.164 ("+302101234567") or a Greek short code ("112").
create domain public.number_key as text check (value ~ '^(\+[1-9][0-9]{6,14}|1[0-9]{2,4})$');
create domain public.e164 as text check (value ~ '^\+[1-9][0-9]{6,14}$');

-- ---------------------------------------------------------------------------
-- People and circles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  locale text not null default 'el' check (locale in ('el', 'en')),
  text_scale text not null default 'extraLarge' check (text_scale in ('large', 'extraLarge', 'huge')),
  analytics_opt_out boolean not null default false,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organisations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,60}$'),
  kind public.org_kind not null default 'municipality',
  name_el text not null,
  name_en text not null,
  logo_path text,
  cobranding_enabled boolean not null default false,
  seats_total integer not null default 0 check (seats_total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.org_members (
  org_id uuid not null references public.organisations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create table public.circles (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  -- Effective plan, maintained from subscriptions / gift codes / licence codes. Apps read entitlements from here.
  plan public.plan_tier not null default 'free',
  protection_level public.protection_level not null default 'warn',
  quiz_interval_days integer not null default 14 check (quiz_interval_days between 7 and 90),
  sponsor_org_id uuid references public.organisations (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.circle_members (
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  display_name text not null check (char_length(display_name) between 1 and 60),
  consented_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);
-- A protected person belongs to exactly one circle; guardians may be in several (both sides of the family).
create unique index circle_members_one_circle_per_protected on public.circle_members (user_id) where role = 'protected';
create index circle_members_user on public.circle_members (user_id);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  role public.member_role not null,
  invitee_name text check (char_length(invitee_name) <= 60),
  token_hash bytea not null unique,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz
);
create index invites_circle on public.invites (circle_id);

create table public.family_contacts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  phone public.e164 not null,
  relation public.relation not null default 'other',
  -- Guardians receive alerts; a backup contact (e.g. a neighbour) only gets the escalation SMS.
  is_guardian boolean not null default false,
  is_backup boolean not null default false,
  member_user_id uuid references auth.users (id) on delete set null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (circle_id, phone)
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('android', 'ios', 'web')),
  push_token text unique,
  app_version text,
  os_version text,
  -- Setup health reported by the parent's phone: {"callScreeningRole":true,"notifications":true,"overlay":false,"batteryExempt":true}
  health jsonb not null default '{}'::jsonb,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index devices_user on public.devices (user_id);

-- ---------------------------------------------------------------------------
-- Safe word (hash only)
-- ---------------------------------------------------------------------------
create table public.safe_words (
  circle_id uuid primary key references public.circles (id) on delete cascade,
  word_hash text not null,                  -- bcrypt of normalise_safe_word(word)
  set_by uuid references auth.users (id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.safe_word_quizzes (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  scheduled_for timestamptz not null,
  answered_at timestamptz,
  result public.quiz_result,
  attempts integer not null default 0,
  guardian_notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index safe_word_quizzes_circle on public.safe_word_quizzes (circle_id, scheduled_for desc);

-- ---------------------------------------------------------------------------
-- Checks, alerts, calls
-- ---------------------------------------------------------------------------
create table public.checks (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  channel public.check_channel not null default 'in_app',
  input_kind public.check_input_kind not null,
  verdict public.verdict not null,
  category public.scam_category not null,
  reason text not null,
  action text not null,
  suggest_alert boolean not null default false,
  locale text not null default 'el' check (locale in ('el', 'en')),
  created_at timestamptz not null default now()
);
create index checks_circle on public.checks (circle_id, created_at desc);

create table public.official_numbers (
  id uuid primary key default gen_random_uuid(),
  organisation_el text not null,
  organisation_en text not null,
  category public.official_category not null,
  -- Null only for placeholder rows that still need a verified number.
  number_key public.number_key unique,
  display_number text,
  source_url text,
  verified boolean not null default false,
  verified_by uuid references auth.users (id) on delete set null,
  verified_at timestamptz,
  active boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Never use an unverified number to tell someone a caller is official.
  constraint official_active_requires_verified check (not active or (verified and number_key is not null and display_number is not null and source_url is not null)),
  constraint official_verified_has_date check (not verified or verified_at is not null)
);
create index official_numbers_category on public.official_numbers (category) where active;

create table public.call_events (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  number_key public.number_key,             -- null for hidden numbers
  number_kind text not null check (number_kind in ('hidden', 'short', 'domestic', 'international', 'invalid')),
  classification public.call_classification not null,
  protection_action text not null default 'none' check (protection_action in ('none', 'warned', 'silenced', 'blocked')),
  official_number_id uuid references public.official_numbers (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  -- After-call check-in answers (no audio, ever).
  checkin_answer text check (checkin_answer in ('yes', 'no', 'unsure')),
  claimed_category public.official_category,
  claimed_relative boolean,
  official_match boolean,
  created_at timestamptz not null default now()
);
create index call_events_circle on public.call_events (circle_id, started_at desc);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles (id) on delete cascade,
  protected_user_id uuid not null references auth.users (id) on delete cascade,
  source public.alert_source not null,
  check_id uuid references public.checks (id) on delete set null,
  call_event_id uuid references public.call_events (id) on delete set null,
  caller_number text,
  status public.alert_status not null default 'open',
  escalate_at timestamptz not null default (now() + interval '5 minutes'),
  escalated_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index alerts_circle on public.alerts (circle_id, created_at desc);

create table public.alert_deliveries (
  id uuid primary key default gen_random_uuid(),
  alert_id uuid not null references public.alerts (id) on delete cascade,
  recipient_user_id uuid references auth.users (id) on delete cascade,
  recipient_phone public.e164,
  channel public.delivery_channel not null,
  status public.delivery_status not null default 'queued',
  provider_ref text,
  error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  seen_at timestamptz,
  created_at timestamptz not null default now(),
  check (recipient_user_id is not null or recipient_phone is not null)
);
create index alert_deliveries_alert on public.alert_deliveries (alert_id);

create table public.number_reports (
  id uuid primary key default gen_random_uuid(),
  number_key public.number_key not null,
  reporter_id uuid references auth.users (id) on delete set null,
  circle_id uuid references public.circles (id) on delete set null,
  claimed_category public.official_category,
  note text check (char_length(note) <= 500),
  status public.report_status not null default 'pending',
  moderated_by uuid references auth.users (id) on delete set null,
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);
create index number_reports_number on public.number_reports (number_key);
create index number_reports_pending on public.number_reports (created_at) where status = 'pending';

create table public.number_reputation (
  number_key public.number_key primary key,
  approved_reports integer not null default 0,
  flagged boolean not null default false,
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table public.scam_radar_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,80}$'),
  category public.scam_category not null,
  title_el text not null,
  title_en text not null,
  summary_el text not null,
  summary_en text not null,
  body_el text not null,                    -- Markdown
  body_en text not null,
  what_to_do_el text not null,
  what_to_do_en text not null,
  featured_week date,                       -- "Απάτη της εβδομάδας" for the week starting on this Monday
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Billing and organisations
-- ---------------------------------------------------------------------------
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null unique references public.circles (id) on delete cascade,
  plan public.plan_tier not null,
  status public.subscription_status not null,
  provider text not null check (provider in ('stripe', 'gift', 'org_licence', 'play', 'app_store')),
  provider_customer_id text,
  provider_subscription_id text unique,
  current_period_end timestamptz,
  trial_end timestamptz,
  grace_until timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gift_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  plan public.plan_tier not null default 'family',
  months integer not null check (months in (3, 6, 12)),
  purchaser_email text,
  stripe_checkout_session_id text unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 years'),
  redeemed_circle_id uuid references public.circles (id) on delete set null,
  redeemed_by uuid references auth.users (id) on delete set null,
  redeemed_at timestamptz
);

create table public.org_licence_codes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organisations (id) on delete cascade,
  code text not null unique,
  plan public.plan_tier not null default 'family',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  redeemed_circle_id uuid references public.circles (id) on delete set null,
  redeemed_by uuid references auth.users (id) on delete set null,
  redeemed_at timestamptz,
  revoked_at timestamptz
);
create index org_licence_codes_org on public.org_licence_codes (org_id);

-- Anonymised weekly aggregates. Never contains names, numbers or message content.
create table public.org_stats_weekly (
  org_id uuid not null references public.organisations (id) on delete cascade,
  week_start date not null,
  protected_people integer not null default 0,
  checks integer not null default 0,
  checks_scam integer not null default 0,
  alerts integer not null default 0,
  flagged_calls integer not null default 0,
  computed_at timestamptz not null default now(),
  primary key (org_id, week_start)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id text,
  circle_id uuid,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_circle on public.audit_log (circle_id, created_at desc);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['profiles', 'organisations', 'circles', 'family_contacts', 'official_numbers',
                           'scam_radar_items', 'subscriptions']
  loop
    execute format('create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
                   t || '_touch', t);
  end loop;
end $$;
