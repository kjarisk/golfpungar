-- Phase 23C: RLS helper functions + column-guard triggers.
-- Helpers are SECURITY DEFINER so they can read across tables inside RLS
-- policies without recursing into RLS. STABLE + pinned search_path.

create or replace function private.is_admin()
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function private.is_tournament_member(p_tournament_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.players
    where tournament_id = p_tournament_id and user_id = auth.uid()
  );
$$;

create or replace function private.is_in_round_group(p_round_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1
    from public.group_members gm
    join public.groups g  on g.id = gm.group_id
    join public.players p on p.id = gm.player_id
    where g.round_id = p_round_id and p.user_id = auth.uid()
  );
$$;

create or replace function private.owns_player(p_player_id uuid)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.players
    where id = p_player_id and user_id = auth.uid()
  );
$$;

create or replace function private.round_has_status(p_round_id uuid, p_status public.round_status)
returns boolean language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.rounds where id = p_round_id and status = p_status
  );
$$;

-- The authenticated role must be able to call the helpers during policy
-- evaluation. SECURITY DEFINER means they only ever get the boolean result.
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_tournament_member(uuid) to authenticated;
grant execute on function private.is_in_round_group(uuid) to authenticated;
grant execute on function private.owns_player(uuid) to authenticated;
grant execute on function private.round_has_status(uuid, public.round_status) to authenticated;

-- Column guards: RLS gates whole rows, not columns. These BEFORE UPDATE
-- triggers restrict non-admins to a whitelist of editable columns.

create or replace function private.tg_players_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- a non-admin may edit only their own display_name + nickname
  if not private.is_admin() then
    new.tournament_id  := old.tournament_id;
    new.user_id        := old.user_id;
    new.email          := old.email;
    new.group_handicap := old.group_handicap;
    new.active         := old.active;
    new.created_at     := old.created_at;
  end if;
  return new;
end;
$$;

create trigger players_guard_columns
  before update on public.players
  for each row execute function private.tg_players_guard();

create or replace function private.tg_teams_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- a non-admin team member may edit only the team name
  if not private.is_admin() then
    new.round_id   := old.round_id;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

create trigger teams_guard_columns
  before update on public.teams
  for each row execute function private.tg_teams_guard();
