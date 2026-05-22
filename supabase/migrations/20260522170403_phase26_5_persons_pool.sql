-- Introduce a `persons` table (the people pool) and reshape `players` to be a
-- per-tournament participation row. The same human in two tournaments is one
-- person, two player rows. Identity lives on persons; per-tournament data
-- (handicap, active) stays on players.

-- 1. Persons table
create table public.persons (
  id           uuid primary key default gen_random_uuid(),
  display_name text not null,
  nickname     text,
  email        text,
  user_id      uuid references public.profiles (id) on delete set null,
  created_at   timestamptz not null default now()
);

alter table public.persons enable row level security;

create unique index persons_email_lower_idx
  on public.persons (lower(email)) where email is not null;
create index persons_user_id_idx on public.persons (user_id);

-- 2. Restructure players — add person_id, backfill, then drop identity cols
alter table public.players
  add column person_id uuid references public.persons (id) on delete cascade;

do $$
declare
  p record;
  new_person_id uuid;
begin
  for p in select * from public.players where person_id is null loop
    insert into public.persons (display_name, nickname, email, user_id, created_at)
    values (p.display_name, p.nickname, p.email, p.user_id, p.created_at)
    returning id into new_person_id;
    update public.players set person_id = new_person_id where id = p.id;
  end loop;
end $$;

alter table public.players alter column person_id set not null;
alter table public.players
  add constraint players_tournament_person_unique unique (tournament_id, person_id);
create index players_person_id_idx on public.players (person_id);

-- Drop the old players column-guard trigger (its columns are about to go)
drop trigger if exists players_guard_columns on public.players;
drop function if exists private.tg_players_guard();

-- Drop the policies that reference the columns we're about to drop
drop policy if exists players_select on public.players;
drop policy if exists players_insert on public.players;
drop policy if exists players_update on public.players;
drop policy if exists players_delete on public.players;
drop policy if exists teams_update    on public.teams;

drop index if exists players_user_id_idx;

alter table public.players drop column if exists user_id;
alter table public.players drop column if exists display_name;
alter table public.players drop column if exists nickname;
alter table public.players drop column if exists email;

-- 3. Invites: linked_player_id → linked_person_id
drop index if exists invites_linked_player_id_idx;
alter table public.invites drop column if exists linked_player_id;
alter table public.invites
  add column linked_person_id uuid references public.persons (id) on delete set null;
create index invites_linked_person_id_idx on public.invites (linked_person_id);

-- 4. Helpers — join through persons.user_id now
create or replace function private.is_tournament_member(p_tournament_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1
    from public.players pl
    join public.persons p on p.id = pl.person_id
    where pl.tournament_id = p_tournament_id
      and p.user_id = auth.uid()
  );
$$;

create or replace function private.owns_player(p_player_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1
    from public.players pl
    join public.persons p on p.id = pl.person_id
    where pl.id = p_player_id
      and p.user_id = auth.uid()
  );
$$;

create or replace function private.is_in_round_group(p_round_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1
    from public.group_members gm
    join public.groups g   on g.id  = gm.group_id
    join public.players pl on pl.id = gm.player_id
    join public.persons p  on p.id  = pl.person_id
    where g.round_id = p_round_id
      and p.user_id = auth.uid()
  );
$$;

-- 5. handle_new_user — claim PERSON rows by email on signup
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role        public.user_role;
  v_invite_role public.user_role;
begin
  if not exists (select 1 from public.profiles) then
    v_role := 'admin';
  else
    select i.role into v_invite_role
      from public.invites i
      where lower(i.email) = lower(new.email)
        and i.status = 'pending'
      order by i.created_at desc
      limit 1;
    v_role := coalesce(v_invite_role, 'player');
  end if;

  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'player'), '@', 1)
    ),
    v_role
  )
  on conflict (id) do nothing;

  update public.persons
    set user_id = new.id
    where user_id is null
      and lower(email) = lower(new.email);

  update public.invites
    set status = 'accepted', accepted_at = now()
    where status = 'pending'
      and lower(email) = lower(new.email);

  return new;
end;
$$;

-- 6. Rebuild players policies (admin-only writes; identity edits happen on persons)
create policy players_select on public.players for select to authenticated
  using ((select private.is_admin()) or private.is_tournament_member(tournament_id));
create policy players_insert on public.players for insert to authenticated
  with check ((select private.is_admin()));
create policy players_update on public.players for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy players_delete on public.players for delete to authenticated
  using ((select private.is_admin()));

-- 7. Recreate teams_update — joins through persons now
create policy teams_update on public.teams for update to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.team_members tm
      join public.players pl on pl.id = tm.player_id
      join public.persons p  on p.id = pl.person_id
      where tm.team_id = teams.id and p.user_id = (select auth.uid())
    )
  )
  with check (
    (select private.is_admin())
    or exists (
      select 1 from public.team_members tm
      join public.players pl on pl.id = tm.player_id
      join public.persons p  on p.id = pl.person_id
      where tm.team_id = teams.id and p.user_id = (select auth.uid())
    )
  );

-- 8. Persons policies — readable by everyone authenticated; writable by admin
--    or by the owning user (column-guarded to name/nickname).
create policy persons_select on public.persons for select to authenticated
  using (true);
create policy persons_insert on public.persons for insert to authenticated
  with check ((select private.is_admin()));
create policy persons_update on public.persons for update to authenticated
  using ((select private.is_admin()) or user_id = (select auth.uid()))
  with check ((select private.is_admin()) or user_id = (select auth.uid()));
create policy persons_delete on public.persons for delete to authenticated
  using ((select private.is_admin()));

-- 9. Persons column guard — non-admin owners can only change display_name/nickname
create or replace function private.tg_persons_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then
    new.user_id    := old.user_id;
    new.email      := old.email;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create trigger persons_guard_columns
  before update on public.persons
  for each row execute function private.tg_persons_guard();
