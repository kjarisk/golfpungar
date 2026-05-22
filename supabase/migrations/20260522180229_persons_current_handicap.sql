-- Persons get a "current handicap" — the player's reference handicap that
-- evolves over time (future handicap-progression rules can update it).
-- Tournament participation (players.group_handicap) is still per-tournament
-- and may differ; current_handicap is the default that pre-fills new joins.
alter table public.persons
  add column current_handicap numeric not null default 18;
