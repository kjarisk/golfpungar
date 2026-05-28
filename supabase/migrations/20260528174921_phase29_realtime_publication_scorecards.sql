-- Phase 29 (realtime): add scorecards to the supabase_realtime publication so
-- score changes stream to subscribed clients (filtered by RLS). Leaderboards,
-- feed and enter views all derive from the scorecards query, so invalidating
-- it on a realtime event refreshes them live.

ALTER PUBLICATION supabase_realtime ADD TABLE public.scorecards;
