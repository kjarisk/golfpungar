-- Phase 23B: private schema for SECURITY DEFINER helpers + enum types.
-- A new schema has no PUBLIC usage grant by default, so `private` is locked down.
create schema if not exists private;

create type public.user_role         as enum ('admin', 'player');
create type public.tournament_status as enum ('draft', 'live', 'done');
create type public.invite_status     as enum ('pending', 'accepted', 'expired');
create type public.course_source     as enum ('csv', 'manual');
create type public.round_format      as enum ('scramble', 'stableford', 'bestball', 'handicap');
create type public.round_status      as enum ('upcoming', 'active', 'pending_approval', 'completed');
create type public.side_event_type   as enum (
  'birdie', 'eagle', 'hio', 'albatross', 'bunker_save', 'snake', 'snopp',
  'group_longest_drive', 'longest_drive_meters', 'longest_putt', 'nearest_to_pin', 'gir'
);
create type public.ledger_kind       as enum ('penalty');
create type public.bet_scope         as enum ('round', 'tournament');
create type public.bet_metric        as enum ('most_points', 'most_birdies', 'head_to_head', 'custom');
create type public.bet_status        as enum ('pending', 'accepted', 'rejected', 'won', 'lost', 'paid');
create type public.feed_event_type   as enum (
  'score_entered', 'points_calculated', 'side_event', 'round_started', 'round_completed',
  'tournament_update', 'team_name_changed', 'announcement', 'handicap_changed', 'bet'
);
