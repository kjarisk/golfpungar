-- Phase 23C: RLS policies for identity + setup tables.
-- One policy per action; admin folded in with OR (no overlapping permissives).
-- All policies target the authenticated role; anon is denied everywhere.

-- ── profiles ──────────────────────────────────────────────────────────────
create policy profiles_select on public.profiles for select to authenticated
  using ((select private.is_admin()) or id = (select auth.uid()));
create policy profiles_insert on public.profiles for insert to authenticated
  with check ((select private.is_admin()));
create policy profiles_update on public.profiles for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy profiles_delete on public.profiles for delete to authenticated
  using ((select private.is_admin()));

-- ── countries (global reference data) ─────────────────────────────────────
create policy countries_select on public.countries for select to authenticated
  using (true);
create policy countries_insert on public.countries for insert to authenticated
  with check ((select private.is_admin()));
create policy countries_update on public.countries for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy countries_delete on public.countries for delete to authenticated
  using ((select private.is_admin()));

-- ── tournaments ───────────────────────────────────────────────────────────
create policy tournaments_select on public.tournaments for select to authenticated
  using ((select private.is_admin()) or private.is_tournament_member(id));
create policy tournaments_insert on public.tournaments for insert to authenticated
  with check ((select private.is_admin()));
create policy tournaments_update on public.tournaments for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy tournaments_delete on public.tournaments for delete to authenticated
  using ((select private.is_admin()));

-- ── players ───────────────────────────────────────────────────────────────
create policy players_select on public.players for select to authenticated
  using ((select private.is_admin()) or private.is_tournament_member(tournament_id));
create policy players_insert on public.players for insert to authenticated
  with check ((select private.is_admin()));
-- a player may update their own row; the column guard restricts which columns.
create policy players_update on public.players for update to authenticated
  using ((select private.is_admin()) or user_id = (select auth.uid()))
  with check ((select private.is_admin()) or user_id = (select auth.uid()));
create policy players_delete on public.players for delete to authenticated
  using ((select private.is_admin()));

-- ── invites (admin-only in 23C; signup-side resolution comes in Phase 24) ──
create policy invites_select on public.invites for select to authenticated
  using ((select private.is_admin()));
create policy invites_insert on public.invites for insert to authenticated
  with check ((select private.is_admin()));
create policy invites_update on public.invites for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy invites_delete on public.invites for delete to authenticated
  using ((select private.is_admin()));

-- ── courses ───────────────────────────────────────────────────────────────
create policy courses_select on public.courses for select to authenticated
  using ((select private.is_admin()) or private.is_tournament_member(tournament_id));
create policy courses_insert on public.courses for insert to authenticated
  with check ((select private.is_admin()));
create policy courses_update on public.courses for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy courses_delete on public.courses for delete to authenticated
  using ((select private.is_admin()));

-- ── holes ─────────────────────────────────────────────────────────────────
create policy holes_select on public.holes for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1 from public.courses c
      where c.id = holes.course_id and private.is_tournament_member(c.tournament_id)
    )
  );
create policy holes_insert on public.holes for insert to authenticated
  with check ((select private.is_admin()));
create policy holes_update on public.holes for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy holes_delete on public.holes for delete to authenticated
  using ((select private.is_admin()));
