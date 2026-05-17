-- Phase 23B: pg_cron job that auto-activates scheduled rounds.
create extension if not exists pg_cron;

-- Every 5 minutes, flip upcoming -> active for any non-deleted round whose
-- scheduled start is within the next hour. Admins can still activate manually.
select cron.schedule(
  'auto-activate-rounds',
  '*/5 * * * *',
  $job$
    update public.rounds
      set status = 'active'
      where status = 'upcoming'
        and deleted = false
        and date_time is not null
        and date_time <= now() + interval '1 hour'
  $job$
);
