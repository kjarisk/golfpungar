-- Phase 23C: RLS policies for play + activity tables.
-- One policy per action; admin folded in with OR. All target authenticated.

-- ── rounds (soft-deleted rounds are hidden from non-admins) ───────────────
create policy rounds_select on public.rounds for select to authenticated
  using (
    (select private.is_admin())
    or (private.is_tournament_member(tournament_id) and deleted = false)
  );
create policy rounds_insert on public.rounds for insert to authenticated
  with check ((select private.is_admin()));
create policy rounds_update on public.rounds for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy rounds_delete on public.rounds for delete to authenticated
  using ((select private.is_admin()));

-- ── groups ────────────────────────────────────────────────────────────────
create policy groups_select on public.groups for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.rounds r
      where r.id = groups.round_id
        and private.is_tournament_member(r.tournament_id) and r.deleted = false
    )
  );
create policy groups_insert on public.groups for insert to authenticated
  with check ((select private.is_admin()));
create policy groups_update on public.groups for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy groups_delete on public.groups for delete to authenticated
  using ((select private.is_admin()));

-- ── group_members ─────────────────────────────────────────────────────────
create policy group_members_select on public.group_members for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.groups g
      join public.rounds r on r.id = g.round_id
      where g.id = group_members.group_id
        and private.is_tournament_member(r.tournament_id) and r.deleted = false
    )
  );
create policy group_members_insert on public.group_members for insert to authenticated
  with check ((select private.is_admin()));
create policy group_members_update on public.group_members for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy group_members_delete on public.group_members for delete to authenticated
  using ((select private.is_admin()));

-- ── teams (team name editable by team members; column guard limits to name) ─
create policy teams_select on public.teams for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.rounds r
      where r.id = teams.round_id
        and private.is_tournament_member(r.tournament_id) and r.deleted = false
    )
  );
create policy teams_insert on public.teams for insert to authenticated
  with check ((select private.is_admin()));
create policy teams_update on public.teams for update to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.team_members tm
      join public.players p on p.id = tm.player_id
      where tm.team_id = teams.id and p.user_id = (select auth.uid())
    )
  )
  with check (
    (select private.is_admin())
    or exists (
      select 1 from public.team_members tm
      join public.players p on p.id = tm.player_id
      where tm.team_id = teams.id and p.user_id = (select auth.uid())
    )
  );
create policy teams_delete on public.teams for delete to authenticated
  using ((select private.is_admin()));

-- ── team_members ──────────────────────────────────────────────────────────
create policy team_members_select on public.team_members for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.teams t
      join public.rounds r on r.id = t.round_id
      where t.id = team_members.team_id
        and private.is_tournament_member(r.tournament_id) and r.deleted = false
    )
  );
create policy team_members_insert on public.team_members for insert to authenticated
  with check ((select private.is_admin()));
create policy team_members_update on public.team_members for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy team_members_delete on public.team_members for delete to authenticated
  using ((select private.is_admin()));

-- ── scorecards (players write within their round group, active rounds only) ─
create policy scorecards_select on public.scorecards for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.rounds r
      where r.id = scorecards.round_id
        and private.is_tournament_member(r.tournament_id) and r.deleted = false
    )
  );
create policy scorecards_insert on public.scorecards for insert to authenticated
  with check (
    (select private.is_admin())
    or (private.is_in_round_group(round_id)
        and private.round_has_status(round_id, 'active'))
  );
create policy scorecards_update on public.scorecards for update to authenticated
  using (
    (select private.is_admin())
    or (private.is_in_round_group(round_id)
        and private.round_has_status(round_id, 'active'))
  )
  with check (
    (select private.is_admin())
    or (private.is_in_round_group(round_id)
        and private.round_has_status(round_id, 'active'))
  );
create policy scorecards_delete on public.scorecards for delete to authenticated
  using ((select private.is_admin()));

-- ── round_approvals (a player signs off their own scores) ─────────────────
create policy round_approvals_select on public.round_approvals for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.rounds r
      where r.id = round_approvals.round_id
        and private.is_tournament_member(r.tournament_id)
    )
  );
create policy round_approvals_insert on public.round_approvals for insert to authenticated
  with check (
    (select private.is_admin())
    or (private.owns_player(player_id)
        and private.round_has_status(round_id, 'pending_approval'))
  );
create policy round_approvals_update on public.round_approvals for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy round_approvals_delete on public.round_approvals for delete to authenticated
  using ((select private.is_admin()));

-- ── side_event_logs (logged within the player's round group) ──────────────
create policy side_event_logs_select on public.side_event_logs for select to authenticated
  using (
    (select private.is_admin())
    or private.is_tournament_member(tournament_id)
  );
create policy side_event_logs_insert on public.side_event_logs for insert to authenticated
  with check (
    (select private.is_admin())
    or (
      private.is_tournament_member(tournament_id)
      and (round_id is null or private.is_in_round_group(round_id))
      and (created_by_player_id is null or private.owns_player(created_by_player_id))
    )
  );
create policy side_event_logs_update on public.side_event_logs for update to authenticated
  using (
    (select private.is_admin())
    or (round_id is not null and private.is_in_round_group(round_id))
  )
  with check (
    (select private.is_admin())
    or (round_id is not null and private.is_in_round_group(round_id))
  );
create policy side_event_logs_delete on public.side_event_logs for delete to authenticated
  using (
    (select private.is_admin())
    or (round_id is not null and private.is_in_round_group(round_id))
  );

-- ── evidence_images ───────────────────────────────────────────────────────
create policy evidence_images_select on public.evidence_images for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.side_event_logs sel
      where sel.id = evidence_images.side_event_log_id
        and private.is_tournament_member(sel.tournament_id)
    )
  );
create policy evidence_images_insert on public.evidence_images for insert to authenticated
  with check (
    (select private.is_admin())
    or exists (
      select 1 from public.side_event_logs sel
      where sel.id = evidence_images.side_event_log_id
        and sel.round_id is not null
        and private.is_in_round_group(sel.round_id)
    )
  );
create policy evidence_images_update on public.evidence_images for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy evidence_images_delete on public.evidence_images for delete to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.side_event_logs sel
      where sel.id = evidence_images.side_event_log_id
        and sel.round_id is not null
        and private.is_in_round_group(sel.round_id)
    )
  );

-- ── ledger_entries (penalties — admin-managed) ────────────────────────────
create policy ledger_entries_select on public.ledger_entries for select to authenticated
  using (
    (select private.is_admin())
    or private.is_tournament_member(tournament_id)
  );
create policy ledger_entries_insert on public.ledger_entries for insert to authenticated
  with check ((select private.is_admin()));
create policy ledger_entries_update on public.ledger_entries for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy ledger_entries_delete on public.ledger_entries for delete to authenticated
  using ((select private.is_admin()));

-- ── bets (a player manages bets they created) ─────────────────────────────
create policy bets_select on public.bets for select to authenticated
  using (
    (select private.is_admin())
    or private.is_tournament_member(tournament_id)
  );
create policy bets_insert on public.bets for insert to authenticated
  with check (
    (select private.is_admin())
    or (private.is_tournament_member(tournament_id)
        and private.owns_player(created_by_player_id))
  );
create policy bets_update on public.bets for update to authenticated
  using (
    (select private.is_admin())
    or private.owns_player(created_by_player_id)
  )
  with check (
    (select private.is_admin())
    or private.owns_player(created_by_player_id)
  );
create policy bets_delete on public.bets for delete to authenticated
  using (
    (select private.is_admin())
    or (private.owns_player(created_by_player_id)
        and status in ('pending', 'rejected'))
  );

-- ── bet_participants ──────────────────────────────────────────────────────
create policy bet_participants_select on public.bet_participants for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.bets b
      where b.id = bet_participants.bet_id
        and private.is_tournament_member(b.tournament_id)
    )
  );
-- the bet creator adds participants when creating the bet
create policy bet_participants_insert on public.bet_participants for insert to authenticated
  with check (
    (select private.is_admin())
    or exists (
      select 1 from public.bets b
      where b.id = bet_participants.bet_id
        and private.owns_player(b.created_by_player_id)
    )
  );
-- a participant accepts/rejects/confirms payment on their own row
create policy bet_participants_update on public.bet_participants for update to authenticated
  using (
    (select private.is_admin())
    or private.owns_player(player_id)
  )
  with check (
    (select private.is_admin())
    or private.owns_player(player_id)
  );
create policy bet_participants_delete on public.bet_participants for delete to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.bets b
      where b.id = bet_participants.bet_id
        and private.owns_player(b.created_by_player_id)
    )
  );

-- ── announcements (admin-posted) ──────────────────────────────────────────
create policy announcements_select on public.announcements for select to authenticated
  using (
    (select private.is_admin())
    or private.is_tournament_member(tournament_id)
  );
create policy announcements_insert on public.announcements for insert to authenticated
  with check ((select private.is_admin()));
create policy announcements_update on public.announcements for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy announcements_delete on public.announcements for delete to authenticated
  using ((select private.is_admin()));

-- ── feed_events (append-only activity log) ────────────────────────────────
create policy feed_events_select on public.feed_events for select to authenticated
  using (
    (select private.is_admin())
    or private.is_tournament_member(tournament_id)
  );
create policy feed_events_insert on public.feed_events for insert to authenticated
  with check (
    (select private.is_admin())
    or private.is_tournament_member(tournament_id)
  );
create policy feed_events_update on public.feed_events for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy feed_events_delete on public.feed_events for delete to authenticated
  using ((select private.is_admin()));
