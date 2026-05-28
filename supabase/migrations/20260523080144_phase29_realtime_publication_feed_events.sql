-- Phase 29 (realtime): add feed_events to the supabase_realtime publication so
-- INSERT events are streamed to subscribed clients (filtered by RLS).
-- Other tables (scorecards, bets, bet_participants) will be added in
-- subsequent slices of Phase 29.

ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_events;
