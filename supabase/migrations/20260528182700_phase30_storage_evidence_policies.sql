-- Phase 30 (storage): RLS policies for the private `evidence` bucket.
-- Object path convention: {tournamentId}/{sideEventLogId}/{filename}
-- so the first path segment identifies the tournament. Reuse the existing
-- private.is_tournament_member helper: any tournament member may read/write
-- evidence for that tournament; admins may do anything. (Group-level write
-- scoping is already enforced when the side_event_logs row is created.)

create policy "evidence_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'evidence'
    and (
      private.is_admin()
      or private.is_tournament_member((storage.foldername(name))[1]::uuid)
    )
  );

create policy "evidence_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and (
      private.is_admin()
      or private.is_tournament_member((storage.foldername(name))[1]::uuid)
    )
  );

create policy "evidence_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidence'
    and (
      private.is_admin()
      or private.is_tournament_member((storage.foldername(name))[1]::uuid)
    )
  );
