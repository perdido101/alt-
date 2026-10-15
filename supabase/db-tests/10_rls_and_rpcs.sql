-- RLS and RPC tests. Run by scripts/db-test.sh after migrations + seed. Any failed assertion aborts.
\set giannis '00000000-0000-4000-8000-000000000001'
\set eleni   '00000000-0000-4000-8000-000000000002'
\set maria   '00000000-0000-4000-8000-000000000003'
\set admin   '00000000-0000-4000-8000-000000000009'
\set dimos   '00000000-0000-4000-8000-000000000010'
\set circle  '00000000-0000-4000-8000-0000000000c1'

create schema tests;
grant usage on schema tests to anon, authenticated;

-- Sign in as a user. p_auth_age is seconds since they authenticated (for re-auth checks).
create function tests.login(p_uid uuid, p_anonymous boolean default false, p_auth_age integer default 30) returns void
language sql as $$
  select set_config('request.jwt.claims', jsonb_build_object(
    'sub', p_uid, 'role', 'authenticated', 'is_anonymous', p_anonymous,
    'amr', jsonb_build_array(jsonb_build_object('method', 'otp',
                                                'timestamp', extract(epoch from now())::bigint - p_auth_age)))::text, false);
$$;

create function tests.expect_error(p_sql text, p_pattern text) returns void
language plpgsql as $$
begin
  execute p_sql;
  raise exception 'expected error matching "%" from: %', p_pattern, p_sql;
exception when others then
  if sqlerrm like 'expected error matching%' then raise; end if;
  if sqlerrm !~* p_pattern then
    raise exception 'expected error matching "%" but got "%" from: %', p_pattern, sqlerrm, p_sql;
  end if;
end $$;

create function tests.eq(p_actual anyelement, p_expected anyelement, p_label text) returns void
language plpgsql as $$
begin
  if p_actual is distinct from p_expected then
    raise exception 'FAIL %: expected %, got %', p_label, p_expected, p_actual;
  end if;
end $$;
grant execute on all functions in schema tests to anon, authenticated;

-- Extra users for the flow tests
insert into auth.users (id, email, raw_user_meta_data, is_anonymous) values
  ('00000000-0000-4000-8000-000000000101', 'stranger@example.com', '{"display_name":"Stranger"}', false),
  ('00000000-0000-4000-8000-000000000102', 'kostas@example.com', '{"display_name":"Κώστας"}', false),
  ('00000000-0000-4000-8000-000000000103', null, '{}', true),
  ('00000000-0000-4000-8000-000000000104', null, '{}', true);

-- ---------------------------------------------------------------------------------------------
-- Guardian (Γιάννης) sees his circle
-- ---------------------------------------------------------------------------------------------
select tests.login(:'giannis');
set role authenticated;
select tests.eq((select count(*) from public.circles), 1::bigint, 'guardian sees 1 circle');
select tests.eq((select count(*) from public.circle_members), 3::bigint, 'guardian sees 3 members');
select tests.eq((select count(*) from public.checks), 3::bigint, 'guardian sees parent checks');
select tests.eq((select count(*) from public.alerts), 1::bigint, 'guardian sees alert');
select tests.eq((select count(*) from public.alert_deliveries), 2::bigint, 'guardian sees deliveries');
select tests.eq((select count(*) from public.call_events), 3::bigint, 'guardian sees call events');
select tests.eq((select count(*) from public.devices), 1::bigint, 'guardian sees parent device health');
select tests.eq((select count(*) from public.subscriptions), 1::bigint, 'guardian sees subscription');
select tests.eq((select count(*) from public.family_contacts), 3::bigint, 'guardian sees family contacts');
select tests.eq((select count(*) from public.profiles), 3::bigint, 'guardian sees circle profiles only');
select tests.eq((select count(*) from public.org_stats_weekly), 0::bigint, 'guardian sees no org stats');
select tests.eq((select count(*) from public.audit_log), 0::bigint, 'guardian sees no audit log');
select tests.expect_error('select * from public.safe_words', 'permission denied');
select tests.expect_error('select * from public.gift_codes', 'permission denied');
select tests.expect_error($$update public.circles set plan = 'family_plus'$$, 'permission denied');
select tests.expect_error($$update public.profiles set is_admin = true$$, 'permission denied');
select tests.expect_error($$insert into public.checks (circle_id, user_id, input_kind, verdict, category, reason, action)
  values ('00000000-0000-4000-8000-0000000000c1', auth.uid(), 'text', 'safe', 'none', 'x', 'y')$$, 'permission denied');
update public.circles set protection_level = 'silence' where id = :'circle';
select tests.eq((select protection_level::text from public.circles where id = :'circle'), 'silence', 'guardian updates protection level');
select * from public.safe_word_status(:'circle');
select tests.eq((select is_set from public.safe_word_status(:'circle')), true, 'safe word status');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Protected person (Μαρία) sees her own data but no billing or invites
-- ---------------------------------------------------------------------------------------------
select tests.login(:'maria', true);
set role authenticated;
select tests.eq((select count(*) from public.checks), 3::bigint, 'parent sees own checks');
select tests.eq((select count(*) from public.subscriptions), 0::bigint, 'parent sees no subscription');
select tests.eq((select count(*) from public.invites), 0::bigint, 'parent sees no invites');
select tests.eq((select count(*) from public.family_contacts), 3::bigint, 'parent sees family contacts (call screening cache)');
select tests.eq((select count(*) from public.official_numbers), 4::bigint, 'parent sees active official numbers only');
select tests.eq((select count(*) from public.number_reputation), 2::bigint, 'parent reads reputation');
select tests.eq(public.check_safe_word(:'circle', 'ΛΕΜΟΝΟΠΙΤΑ '), true, 'safe word matches ignoring case/accents');
select tests.eq(public.check_safe_word(:'circle', 'πορτοκαλόπιτα'), false, 'wrong safe word');
select tests.expect_error($$select public.set_safe_word('00000000-0000-4000-8000-0000000000c1', 'καινούργια')$$, 'forbidden');
insert into public.call_events (circle_id, user_id, number_kind, classification) values (:'circle', :'maria', 'hidden', 'risky');
insert into public.number_reports (number_key, reporter_id, circle_id) values ('+306980000009', :'maria', :'circle');
select tests.expect_error($$insert into public.number_reports (number_key, reporter_id, status)
  values ('+306980000009', auth.uid(), 'approved')$$, 'row-level security');
reset role;

-- ---------------------------------------------------------------------------------------------
-- A stranger sees nothing private
-- ---------------------------------------------------------------------------------------------
select tests.login('00000000-0000-4000-8000-000000000101');
set role authenticated;
select tests.eq((select count(*) from public.circles), 0::bigint, 'stranger: no circles');
select tests.eq((select count(*) from public.circle_members), 0::bigint, 'stranger: no members');
select tests.eq((select count(*) from public.checks), 0::bigint, 'stranger: no checks');
select tests.eq((select count(*) from public.family_contacts), 0::bigint, 'stranger: no contacts');
select tests.eq((select count(*) from public.devices), 0::bigint, 'stranger: no devices');
select tests.eq((select count(*) from public.profiles), 1::bigint, 'stranger: own profile only');
select tests.eq((select count(*) from public.number_reports), 0::bigint, 'stranger: no reports of others');
select tests.expect_error($$insert into public.family_contacts (circle_id, name, phone, created_by)
  values ('00000000-0000-4000-8000-0000000000c1', 'x', '+306911111111', auth.uid())$$, 'row-level security');
select tests.expect_error($$select public.check_safe_word('00000000-0000-4000-8000-0000000000c1', 'λεμονόπιτα')$$, 'forbidden');
select tests.expect_error($$select public.create_invite('00000000-0000-4000-8000-0000000000c1', 'guardian')$$, 'forbidden');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Org admin sees only aggregates (and licence codes) for their org
-- ---------------------------------------------------------------------------------------------
select tests.login(:'dimos');
set role authenticated;
select tests.eq((select count(*) from public.org_stats_weekly), 2::bigint, 'org admin sees weekly stats');
select tests.eq((select count(*) from public.org_licence_codes), 2::bigint, 'org admin sees licence codes');
select tests.eq((select count(*) from public.circles), 0::bigint, 'org admin sees no circles');
select tests.eq((select count(*) from public.checks), 0::bigint, 'org admin sees no checks');
select tests.eq((select count(*) from public.profiles), 1::bigint, 'org admin sees no names');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Anonymous visitors (website) see public content only
-- ---------------------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{}', false);
set role anon;
select tests.eq((select count(*) from public.official_numbers), 4::bigint, 'anon: active official numbers');
select tests.eq((select count(*) from public.scam_radar_items), 3::bigint, 'anon: published scam radar');
select tests.expect_error('select * from public.checks', 'permission denied');
select tests.expect_error('select * from public.circles', 'permission denied');
select tests.expect_error($$select public.create_circle('x', 'y')$$, 'permission denied');
reset role;

-- ---------------------------------------------------------------------------------------------
-- Admin manages the directory; placeholders can't be activated without verification
-- ---------------------------------------------------------------------------------------------
select tests.login(:'admin');
set role authenticated;
select tests.eq((select count(*) from public.official_numbers), 19::bigint, 'admin sees placeholders');
select tests.expect_error($$update public.official_numbers set active = true where number_key is null$$, 'official_active_requires_verified');
select tests.eq((select count(*) from public.audit_log) > 0, true, 'admin reads audit log');
update public.number_reports set status = 'approved', moderated_by = auth.uid(), moderated_at = now() where number_key = '+306980000004';
reset role;

-- ---------------------------------------------------------------------------------------------
-- Full onboarding flow: guardian creates circle → invites parent → parent joins anonymously
-- ---------------------------------------------------------------------------------------------
select tests.login('00000000-0000-4000-8000-000000000102');
set role authenticated;
select public.create_circle('Οικογένεια Αλεξίου', 'Κώστας') as new_circle \gset
select tests.eq((select role::text from public.circle_members where circle_id = :'new_circle'), 'guardian', 'creator is guardian');
select tests.eq((select plan::text from public.circles where id = :'new_circle'), 'free', 'new circle is free');
select tests.expect_error(format($$select public.create_invite(%L, 'protected')$$, :'new_circle'), 'display_name_required');
select token as parent_token from public.create_invite(:'new_circle', 'protected', 'Κατερίνα') \gset
select tests.eq(length(:'parent_token') between 40 and 50, true, 'token is base64url');
select tests.eq((select count(*) from public.invites where circle_id = :'new_circle'), 1::bigint, 'invite stored');
select tests.eq((select count(*) from public.invites where token_hash = convert_to(:'parent_token', 'UTF8')), 0::bigint, 'token not stored in plaintext');
reset role;

-- An anonymous parent device can't create circles or accept guardian invites
select tests.login('00000000-0000-4000-8000-000000000103', true);
set role authenticated;
select tests.expect_error($$select public.create_circle('x', 'y')$$, 'anonymous_not_allowed');
select tests.expect_error($$select * from public.accept_invite('not-a-real-token-not-a-real-token-xx')$$, 'invite_invalid');
select circle_id as joined_circle, role as joined_role from public.accept_invite(:'parent_token') \gset
select tests.eq(:'joined_circle'::uuid, :'new_circle'::uuid, 'parent joined the right circle');
select tests.eq(:'joined_role'::text, 'protected', 'parent joined as protected');
select tests.eq((select display_name from public.circle_members where user_id = auth.uid()), 'Κατερίνα', 'name from invite');
select tests.eq((select consented_at from public.circle_members where user_id = auth.uid()) is null, true, 'consent pending');
select tests.eq((select count(*) from public.accept_invite(:'parent_token')), 1::bigint, 'accepting again is idempotent');
select public.record_consent(:'new_circle');
select tests.eq((select consented_at from public.circle_members where user_id = auth.uid()) is not null, true, 'consent recorded');
-- Setup step 3 on the parent's phone
insert into public.family_contacts (circle_id, name, phone, relation, is_guardian, created_by)
values (:'new_circle', 'Κώστας', '+306900000102', 'son', true, auth.uid());
select tests.expect_error(format($$insert into public.family_contacts (circle_id, name, phone, created_by) values (%L, 'x', '6900', auth.uid())$$, :'new_circle'), 'e164');
-- Setup step 4 on the parent's phone
select tests.expect_error(format($$select public.set_safe_word(%L, ' ά ')$$, :'new_circle'), 'safe_word_too_short');
select public.set_safe_word(:'new_circle', 'Κόκκινος Γάιδαρος');
select tests.eq(public.check_safe_word(:'new_circle', 'κοκκινος   γαιδαρος'), true, 'safe word normalised');
select tests.expect_error(format($$select public.set_safe_word(%L, 'άλλη λέξη')$$, :'new_circle'), 'forbidden');
reset role;

-- Someone else can't reuse the accepted link
select tests.login('00000000-0000-4000-8000-000000000104', true);
set role authenticated;
select tests.expect_error(format($$select * from public.accept_invite(%L)$$, :'parent_token'), 'invite_invalid');
reset role;

-- Free plan allows 1 parent: a second parent invite is refused. Changing the word needs fresh auth.
select tests.login('00000000-0000-4000-8000-000000000102', false, 3600);
set role authenticated;
select tests.expect_error(format($$select public.create_invite(%L, 'protected', 'Γιώργος')$$, :'new_circle'), 'circle_full');
select tests.expect_error(format($$select public.set_safe_word(%L, 'άλλη λέξη')$$, :'new_circle'), 'reauth_required');
select tests.eq((select count(*) from public.checks), 0::bigint, 'new guardian cannot see the demo circle');
reset role;
select tests.login('00000000-0000-4000-8000-000000000102', false, 60);
set role authenticated;
select public.set_safe_word(:'new_circle', 'άλλη λέξη');
select tests.eq(public.check_safe_word(:'new_circle', 'αλλη λεξη'), true, 'guardian changed word after re-auth');
-- Guardian invite + revoke
select invite_id as g_invite from public.create_invite(:'new_circle', 'guardian') \gset
update public.invites set revoked_at = now() where id = :'g_invite';
reset role;

-- Rate limit on safe word checks
select tests.login('00000000-0000-4000-8000-000000000103', true);
set role authenticated;
do $$
begin
  -- One check was already made in the flow above; 9 more reach the limit of 10.
  for i in 1..9 loop perform public.check_safe_word((select circle_id from public.circle_members where user_id = auth.uid()), 'λάθος'); end loop;
end $$;
select tests.expect_error(format($$select public.check_safe_word(%L, 'λάθος')$$, :'new_circle'), 'rate_limited');
reset role;

-- The audit log never stores the safe word
select tests.eq((select count(*) from public.audit_log where meta::text ilike '%γαιδαρ%' or meta::text ilike '%λεξη%'), 0::bigint, 'no safe word in audit');
-- SQL and TS normalisation agree on the shared cases
select tests.eq(public.normalise_safe_word('  ΛΕΜΟΝΟΠΙΤΑ  '), 'λεμονοπιτα', 'norm 1');
select tests.eq(public.normalise_safe_word('Ταΐζω'), 'ταιζω', 'norm 2');
select tests.eq(public.normalise_safe_word('Κόκκινος   Γάιδαρος'), 'κοκκινοσ γαιδαροσ', 'norm 3');
select tests.eq(public.normalise_safe_word('Crème Brûlée'), 'creme brulee', 'norm 4');
select tests.eq(public.normalise_safe_word('ΰ'), 'υ', 'norm 5');
