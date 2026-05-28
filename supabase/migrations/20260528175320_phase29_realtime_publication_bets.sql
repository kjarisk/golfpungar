-- Phase 29 (realtime): add bets + bet_participants to the supabase_realtime
-- publication so bet lifecycle changes stream to subscribed clients (filtered
-- by RLS). The pending-bet notification badge derives from these queries, so
-- invalidating them on a realtime event keeps the badge live.

ALTER PUBLICATION supabase_realtime ADD TABLE public.bets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bet_participants;
