-- Milestone 2: chat channels (Viber / WhatsApp). A parent links their chat account by sending a
-- short code shown in the app; after that, messages they forward to ΑΛΤ! are checked like in-app checks.

create table public.channel_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  circle_id uuid not null references public.circles (id) on delete cascade,
  channel public.check_channel not null check (channel <> 'in_app'),
  external_id text not null,
  created_at timestamptz not null default now(),
  unique (channel, external_id)
);
create index channel_links_user on public.channel_links (user_id);

create table public.channel_link_codes (
  code text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  circle_id uuid not null references public.circles (id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  used_at timestamptz
);

alter table public.channel_links enable row level security;
alter table public.channel_link_codes enable row level security;

grant select, delete on public.channel_links to authenticated;
create policy channel_links_select on public.channel_links for select to authenticated
  using (user_id = auth.uid() or public.is_guardian(circle_id));
create policy channel_links_delete on public.channel_links for delete to authenticated
  using (user_id = auth.uid() or public.is_guardian(circle_id));

-- "ALT-123456", valid 30 minutes, one active code per user.
create or replace function public.create_channel_link_code() returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_circle uuid;
  v_code text;
begin
  select circle_id into v_circle from public.circle_members where user_id = auth.uid()
  order by (role = 'protected') desc limit 1;
  if v_circle is null then raise exception 'forbidden' using errcode = '42501'; end if;
  delete from public.channel_link_codes where user_id = auth.uid();
  loop
    v_code := 'ALT-' || lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from public.channel_link_codes where code = v_code);
  end loop;
  insert into public.channel_link_codes (code, user_id, circle_id) values (v_code, auth.uid(), v_circle);
  return v_code;
end $$;
revoke execute on function public.create_channel_link_code() from public, anon;
grant execute on function public.create_channel_link_code() to authenticated;
