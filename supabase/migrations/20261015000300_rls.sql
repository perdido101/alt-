-- Row Level Security. Model:
--   guardians read (and mostly manage) their circle's data; protected people read their own;
--   org admins read only their org's aggregates and licence codes; admins run directory/moderation/content.
-- The service role (Edge Functions, Next.js server routes, cron) bypasses RLS.
-- Table privileges are granted explicitly, column by column where updates must be narrow.

grant execute on function public.is_admin() to anon;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- profiles ------------------------------------------------------------------
grant select on public.profiles to authenticated;
grant update (display_name, locale, text_scale, analytics_opt_out) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.shares_circle(id) or public.is_admin());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- circles -------------------------------------------------------------------
grant select on public.circles to authenticated;
grant update (name, protection_level, quiz_interval_days) on public.circles to authenticated;
create policy circles_select on public.circles for select to authenticated
  using (public.is_member(id) or public.is_admin());
create policy circles_update on public.circles for update to authenticated
  using (public.is_guardian(id)) with check (public.is_guardian(id));
-- Inserts go through create_circle(); deletion through account deletion (service role).

-- circle_members --------------------------------------------------------------
grant select, delete on public.circle_members to authenticated;
grant update (display_name) on public.circle_members to authenticated;
create policy members_select on public.circle_members for select to authenticated
  using (public.is_member(circle_id) or public.is_admin());
create policy members_update on public.circle_members for update to authenticated
  using (user_id = auth.uid() or public.is_guardian(circle_id))
  with check (user_id = auth.uid() or public.is_guardian(circle_id));
-- Guardians can remove members; anyone can leave.
create policy members_delete on public.circle_members for delete to authenticated
  using (user_id = auth.uid() or public.is_guardian(circle_id));

-- invites ---------------------------------------------------------------------
grant select on public.invites to authenticated;
grant update (revoked_at) on public.invites to authenticated;
create policy invites_select on public.invites for select to authenticated
  using (public.is_guardian(circle_id));
create policy invites_revoke on public.invites for update to authenticated
  using (public.is_guardian(circle_id) and accepted_at is null)
  with check (public.is_guardian(circle_id));

-- family_contacts ---------------------------------------------------------------
-- Any member can manage them: setup step 3 runs on the parent's phone, signed in as the parent.
grant select, insert, update, delete on public.family_contacts to authenticated;
create policy family_contacts_select on public.family_contacts for select to authenticated
  using (public.is_member(circle_id));
create policy family_contacts_insert on public.family_contacts for insert to authenticated
  with check (public.is_member(circle_id) and created_by = auth.uid());
create policy family_contacts_update on public.family_contacts for update to authenticated
  using (public.is_member(circle_id)) with check (public.is_member(circle_id));
create policy family_contacts_delete on public.family_contacts for delete to authenticated
  using (public.is_member(circle_id));

-- devices -----------------------------------------------------------------------
grant select, insert, update, delete on public.devices to authenticated;
create policy devices_own on public.devices for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Guardians see the parent's device health (setup-health warnings).
create policy devices_guardian_read on public.devices for select to authenticated
  using (public.is_guardian_of(user_id));

-- safe_words: no client access at all (RPCs only). RLS on, zero policies, zero grants.

-- safe_word_quizzes -------------------------------------------------------------
grant select on public.safe_word_quizzes to authenticated;
create policy quizzes_select on public.safe_word_quizzes for select to authenticated
  using (user_id = auth.uid() or public.is_guardian(circle_id));

-- checks ------------------------------------------------------------------------
-- Written by the analysis endpoint (service role) only.
grant select on public.checks to authenticated;
create policy checks_select on public.checks for select to authenticated
  using (user_id = auth.uid() or public.is_guardian(circle_id));

-- alerts / deliveries -------------------------------------------------------------
grant select on public.alerts to authenticated;
create policy alerts_select on public.alerts for select to authenticated
  using (protected_user_id = auth.uid() or public.is_guardian(circle_id));

grant select on public.alert_deliveries to authenticated;
create policy deliveries_select on public.alert_deliveries for select to authenticated
  using (exists (select 1 from public.alerts a where a.id = alert_id
                 and (a.protected_user_id = auth.uid() or public.is_guardian(a.circle_id))));

-- call_events -------------------------------------------------------------------
grant select, insert on public.call_events to authenticated;
grant update (ended_at, checkin_answer, claimed_category, claimed_relative, official_match) on public.call_events to authenticated;
create policy call_events_select on public.call_events for select to authenticated
  using (user_id = auth.uid() or public.is_guardian(circle_id));
create policy call_events_insert on public.call_events for insert to authenticated
  with check (user_id = auth.uid() and public.is_member(circle_id));
create policy call_events_update on public.call_events for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- number reports / reputation ---------------------------------------------------
grant select, insert on public.number_reports to authenticated;
grant update (status, moderated_by, moderated_at) on public.number_reports to authenticated;
create policy reports_insert on public.number_reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'pending'
              and (circle_id is null or public.is_member(circle_id)));
create policy reports_select on public.number_reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
create policy reports_moderate on public.number_reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.number_reputation to authenticated;
create policy reputation_select on public.number_reputation for select to authenticated using (true);

-- official_numbers: public directory of active rows; admins manage everything ---------
grant select on public.official_numbers to anon, authenticated;
grant insert, update, delete on public.official_numbers to authenticated;
create policy official_select on public.official_numbers for select to anon, authenticated
  using (active or public.is_admin());
create policy official_admin_write on public.official_numbers for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- scam_radar_items: published items are public --------------------------------------
grant select on public.scam_radar_items to anon, authenticated;
grant insert, update, delete on public.scam_radar_items to authenticated;
create policy radar_select on public.scam_radar_items for select to anon, authenticated
  using (published or public.is_admin());
create policy radar_admin_write on public.scam_radar_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- subscriptions: guardians read; written by the Stripe webhook (service role) ---------
grant select on public.subscriptions to authenticated;
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (public.is_guardian(circle_id) or public.is_admin());

-- gift_codes: service role only (redeemed through an RPC in milestone 5).

-- organisations -------------------------------------------------------------------
grant select on public.organisations to authenticated;
grant insert, update, delete on public.organisations to authenticated;
create policy orgs_select on public.organisations for select to authenticated
  using (public.is_org_admin(id) or public.is_admin());
create policy orgs_admin_write on public.organisations for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.org_members to authenticated;
grant insert, delete on public.org_members to authenticated;
create policy org_members_select on public.org_members for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy org_members_admin on public.org_members for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select on public.org_licence_codes to authenticated;
create policy licence_select on public.org_licence_codes for select to authenticated
  using (public.is_org_admin(org_id) or public.is_admin());
-- Codes are generated by an RPC in milestone 6 (seat accounting).

grant select on public.org_stats_weekly to authenticated;
create policy org_stats_select on public.org_stats_weekly for select to authenticated
  using (public.is_org_admin(org_id) or public.is_admin());

-- audit_log -----------------------------------------------------------------------
grant select on public.audit_log to authenticated;
create policy audit_admin_select on public.audit_log for select to authenticated using (public.is_admin());
