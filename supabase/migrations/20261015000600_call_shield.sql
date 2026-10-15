-- Milestone 4: Call Shield.

-- Greek grammar for "Αυτός ο αριθμός ΔΕΝ ανήκει στην <Organisation>": the article decides στον/στην/στο/στα.
alter table public.official_numbers
  add column article_el text not null default 'i' check (article_el in ('o', 'i', 'to', 'oi', 'ta'));


-- Screened calls arrive from the phone in batches; the device's local id makes uploads idempotent.
alter table public.call_events add column client_ref text;
alter table public.call_events add constraint call_events_client_ref unique (user_id, client_ref);

-- Reports: at most 20 per reporter per day (abuse protection), recomputed reputation on every change.
create or replace function public.number_reports_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.number_reports r where r.reporter_id = new.reporter_id
        and r.created_at > now() - interval '1 day') >= 20 then
    raise exception 'rate_limited' using errcode = '54000';
  end if;
  return new;
end $$;
create trigger number_reports_guard before insert on public.number_reports
for each row when (new.reporter_id is not null) execute function public.number_reports_guard();

-- Reputation = approved reports; "flagged" = a new number reported (pending) by 2+ different families in 14 days.
create or replace function public.recompute_number_reputation(p_number text) returns void
language sql security definer set search_path = '' as $$
  insert into public.number_reputation (number_key, approved_reports, flagged, updated_at)
  select p_number,
         count(*) filter (where status = 'approved'),
         count(distinct circle_id) filter (where status = 'pending' and created_at > now() - interval '14 days') >= 2,
         now()
  from public.number_reports where number_key = p_number
  on conflict (number_key) do update set
    approved_reports = excluded.approved_reports,
    flagged = excluded.flagged,
    updated_at = now();
$$;

create or replace function public.number_reports_reputation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public.recompute_number_reputation(coalesce(new.number_key, old.number_key));
  return null;
end $$;
create trigger number_reports_reputation after insert or update of status or delete on public.number_reports
for each row execute function public.number_reports_reputation();

-- Official numbers are never reputation-flagged on devices: moderation rejects reports against them.
revoke execute on function public.recompute_number_reputation(text) from public, anon, authenticated;
