-- Phase 23B: auth + round-lifecycle triggers.
-- All functions live in `private`, run as SECURITY DEFINER (bypass RLS to read
-- across groups/scorecards), and pin search_path = '' with fully-qualified names.

-- ── handle_new_user: mirror auth.users into public.profiles ───────────────
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(coalesce(new.email, 'player'), '@', 1)
    ),
    'player'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ── round_all_scorecards_complete: are all expected scorecards complete? ──
-- Team formats expect one complete scorecard per team; individual formats
-- expect one per distinct player across the round's groups.
create or replace function private.round_all_scorecards_complete(p_round_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_format   public.round_format;
  v_expected integer;
  v_complete integer;
begin
  select format into v_format from public.rounds where id = p_round_id;
  if v_format is null then
    return false;
  end if;

  if v_format in ('scramble', 'bestball') then
    select count(*) into v_expected
      from public.teams where round_id = p_round_id;
    select count(distinct s.team_id) into v_complete
      from public.scorecards s
      where s.round_id = p_round_id and s.team_id is not null and s.is_complete;
  else
    select count(distinct gm.player_id) into v_expected
      from public.groups g
      join public.group_members gm on gm.group_id = g.id
      where g.round_id = p_round_id;
    select count(distinct s.player_id) into v_complete
      from public.scorecards s
      where s.round_id = p_round_id and s.player_id is not null and s.is_complete;
  end if;

  return v_expected > 0 and v_complete >= v_expected;
end;
$$;

-- ── round_all_players_approved: have all players in the round signed off? ─
create or replace function private.round_all_players_approved(p_round_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expected integer;
  v_approved integer;
begin
  select count(distinct gm.player_id) into v_expected
    from public.groups g
    join public.group_members gm on gm.group_id = g.id
    where g.round_id = p_round_id;

  select count(distinct ra.player_id) into v_approved
    from public.round_approvals ra
    where ra.round_id = p_round_id;

  return v_expected > 0 and v_approved >= v_expected;
end;
$$;

-- ── Trigger: active -> pending_approval once every scorecard is complete ──
create or replace function private.tg_scorecard_round_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_round_id uuid := coalesce(new.round_id, old.round_id);
begin
  update public.rounds r
    set status = 'pending_approval'
    where r.id = v_round_id
      and r.status = 'active'
      and private.round_all_scorecards_complete(v_round_id);
  return null;
end;
$$;

create trigger scorecard_round_status
  after insert or update or delete on public.scorecards
  for each row execute function private.tg_scorecard_round_status();

-- ── Trigger: pending_approval -> completed once every player approves ────
create or replace function private.tg_approval_round_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.rounds r
    set status = 'completed'
    where r.id = new.round_id
      and r.status = 'pending_approval'
      and private.round_all_players_approved(new.round_id);
  return null;
end;
$$;

create trigger approval_round_status
  after insert on public.round_approvals
  for each row execute function private.tg_approval_round_status();
