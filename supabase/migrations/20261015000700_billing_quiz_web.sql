-- Milestone 5: safe-word quizzes, subscriptions and gift codes, website forms, notification preferences.

-- Notification preferences ------------------------------------------------------------------
alter table public.profiles
  add column notify_digest_email boolean not null default true,
  add column notify_quiz_nudges boolean not null default true,
  add column email text;  -- copy of the auth email, for transactional mail (kept in sync by trigger)
grant update (notify_digest_email, notify_quiz_nudges) on public.profiles to authenticated;

create or replace function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id and email is distinct from new.email;
  return new;
end $$;
create trigger on_auth_user_email after insert or update of email on auth.users
for each row execute function public.sync_profile_email();
update public.profiles p set email = u.email from auth.users u where u.id = p.id;

-- Safe-word quiz --------------------------------------------------------------------------
-- The parent answers (typed or spoken). Wrong answers can be retried; "Αργότερα" skips.
create or replace function public.answer_quiz(p_quiz uuid, p_word text default null)
returns public.quiz_result
language plpgsql security definer set search_path = '' as $$
declare
  v_quiz public.safe_word_quizzes;
  v_hash text;
  v_result public.quiz_result;
begin
  select * into v_quiz from public.safe_word_quizzes where id = p_quiz for update;
  if not found or v_quiz.user_id <> auth.uid() then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_quiz.result = 'correct' then return 'correct'; end if;
  if v_quiz.attempts >= 5 then raise exception 'rate_limited' using errcode = '54000'; end if;

  if p_word is null or btrim(p_word) = '' then
    v_result := 'skipped';
  else
    select word_hash into v_hash from public.safe_words where circle_id = v_quiz.circle_id;
    v_result := case when v_hash is not null
                      and extensions.crypt(public.normalise_safe_word(p_word), v_hash) = v_hash
                     then 'correct' else 'wrong' end;
  end if;
  update public.safe_word_quizzes
     set result = v_result, answered_at = now(), attempts = attempts + case when p_word is null then 0 else 1 end
   where id = p_quiz;
  perform public.audit('quiz.answer', 'safe_word_quiz', p_quiz::text, v_quiz.circle_id, jsonb_build_object('result', v_result));
  return v_result;
end $$;

-- Subscriptions ---------------------------------------------------------------------------
-- Every Stripe webhook event is recorded once (idempotency).
create table public.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);
alter table public.stripe_events enable row level security;

alter table public.subscriptions add column stripe_price_lookup text;
alter table public.circles add column stripe_customer_id text;

-- Gift codes are redeemed by a guardian for their circle.
create or replace function public.redeem_gift_code(p_circle uuid, p_code text)
returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  v_gift public.gift_codes;
  v_sub public.subscriptions;
  v_end timestamptz;
begin
  if not public.is_guardian(p_circle) or public.is_anonymous_user() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into v_gift from public.gift_codes where code = upper(btrim(p_code)) for update;
  if not found or v_gift.redeemed_at is not null or v_gift.expires_at < now() then
    raise exception 'code_invalid' using errcode = 'P0002';
  end if;
  select * into v_sub from public.subscriptions where circle_id = p_circle for update;
  if found and v_sub.provider = 'stripe' and v_sub.status in ('active', 'trialing', 'past_due') then
    raise exception 'already_subscribed' using errcode = '23505';
  end if;
  v_end := greatest(now(), coalesce(case when v_sub.status in ('active', 'trialing') then v_sub.current_period_end end, now()))
           + make_interval(months => v_gift.months);
  insert into public.subscriptions (circle_id, plan, status, provider, current_period_end)
  values (p_circle, v_gift.plan, 'active', 'gift', v_end)
  on conflict (circle_id) do update set plan = excluded.plan, status = 'active', provider = 'gift',
    current_period_end = excluded.current_period_end, grace_until = null, cancel_at_period_end = true,
    provider_subscription_id = null, updated_at = now();
  update public.circles set plan = v_gift.plan where id = p_circle;
  update public.gift_codes set redeemed_at = now(), redeemed_by = auth.uid(), redeemed_circle_id = p_circle where id = v_gift.id;
  perform public.audit('gift.redeem', 'gift_code', v_gift.id::text, p_circle);
  return v_end;
end $$;

-- Website forms (B2B demo requests, contact) ------------------------------------------------
create table public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('b2b', 'contact')),
  organisation text check (char_length(organisation) <= 120),
  org_type text check (org_type in ('municipality', 'kapi', 'bank', 'telco', 'other')),
  name text not null check (char_length(name) between 1 and 120),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text check (char_length(phone) <= 40),
  message text check (char_length(message) <= 2000),
  locale text not null default 'el',
  created_at timestamptz not null default now(),
  handled_at timestamptz
);
alter table public.contact_requests enable row level security;
grant select, update on public.contact_requests to authenticated;
create policy contact_admin on public.contact_requests for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admin can see gift codes (support). Nobody else.
grant select on public.gift_codes to authenticated;
create policy gift_admin_select on public.gift_codes for select to authenticated using (public.is_admin());

revoke execute on function public.answer_quiz(uuid, text), public.redeem_gift_code(uuid, text) from public, anon;
grant execute on function public.answer_quiz(uuid, text), public.redeem_gift_code(uuid, text) to authenticated;

-- Private bucket for raw media, used only when RAW_MEDIA_RETENTION_HOURS > 0 (default: never stored).
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public) values ('check-media', 'check-media', false) on conflict (id) do nothing;
  end if;
end $$;
