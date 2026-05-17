-- Phase 23B: 21 core tables. RLS is enabled on every table here so the
-- anon/authenticated roles have zero access until 23C adds policies.

-- ── Identity ──────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  display_name text not null,
  role         public.user_role not null default 'player',
  created_at   timestamptz not null default now()
);

create table public.countries (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);
create unique index countries_name_lower_idx on public.countries (lower(name));

-- ── Setup ─────────────────────────────────────────────────────────────────
create table public.tournaments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  location   text,
  country_id uuid references public.countries (id) on delete set null,
  start_date date not null,
  end_date   date not null,
  status     public.tournament_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.players (
  id              uuid primary key default gen_random_uuid(),
  tournament_id   uuid not null references public.tournaments (id) on delete cascade,
  user_id         uuid references public.profiles (id) on delete set null,
  display_name    text not null,
  nickname        text,
  email           text,
  group_handicap  numeric not null default 0,
  active          boolean not null default true,
  created_at      timestamptz not null default now()
);

create table public.invites (
  id               uuid primary key default gen_random_uuid(),
  tournament_id    uuid not null references public.tournaments (id) on delete cascade,
  email            text not null,
  role             public.user_role not null default 'player',
  token            text not null unique,
  expires_at       timestamptz not null,
  accepted_at      timestamptz,
  status           public.invite_status not null default 'pending',
  linked_player_id uuid references public.players (id) on delete set null,
  created_at       timestamptz not null default now()
);

create table public.courses (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  name          text not null,
  country_id    uuid references public.countries (id) on delete set null,
  source        public.course_source not null default 'manual',
  created_at    timestamptz not null default now()
);

create table public.holes (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  hole_number  smallint not null check (hole_number between 1 and 18),
  par          smallint not null check (par between 3 and 7),
  stroke_index smallint not null check (stroke_index between 1 and 18),
  unique (course_id, hole_number)
);

-- ── Play ──────────────────────────────────────────────────────────────────
create table public.rounds (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  course_id     uuid not null references public.courses (id) on delete restrict,
  name          text not null,
  date_time     timestamptz,
  format        public.round_format not null,
  holes_played  smallint not null check (holes_played in (9, 18)),
  status        public.round_status not null default 'upcoming',
  points_table  integer[],
  deleted       boolean not null default false,
  created_at    timestamptz not null default now()
);

create table public.groups (
  id         uuid primary key default gen_random_uuid(),
  round_id   uuid not null references public.rounds (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  primary key (group_id, player_id)
);

create table public.teams (
  id         uuid primary key default gen_random_uuid(),
  round_id   uuid not null references public.rounds (id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

create table public.team_members (
  team_id   uuid not null references public.teams (id) on delete cascade,
  player_id uuid not null references public.players (id) on delete cascade,
  primary key (team_id, player_id)
);

-- A scorecard belongs to exactly one of a player (individual) or team (scramble/bestball).
create table public.scorecards (
  id           uuid primary key default gen_random_uuid(),
  round_id     uuid not null references public.rounds (id) on delete cascade,
  player_id    uuid references public.players (id) on delete cascade,
  team_id      uuid references public.teams (id) on delete cascade,
  hole_strokes jsonb not null default '[]'::jsonb,
  is_complete  boolean not null default false,
  created_at   timestamptz not null default now(),
  constraint scorecards_one_participant
    check ((player_id is not null) <> (team_id is not null))
);
create unique index scorecards_round_player_idx
  on public.scorecards (round_id, player_id) where player_id is not null;
create unique index scorecards_round_team_idx
  on public.scorecards (round_id, team_id) where team_id is not null;

create table public.round_approvals (
  id          uuid primary key default gen_random_uuid(),
  round_id    uuid not null references public.rounds (id) on delete cascade,
  player_id   uuid not null references public.players (id) on delete cascade,
  approved_at timestamptz not null default now(),
  approved_by uuid references public.players (id) on delete set null,
  unique (round_id, player_id)
);

-- ── Activity ──────────────────────────────────────────────────────────────
create table public.side_event_logs (
  id                   uuid primary key default gen_random_uuid(),
  tournament_id        uuid not null references public.tournaments (id) on delete cascade,
  round_id             uuid references public.rounds (id) on delete cascade,
  hole_number          smallint check (hole_number between 1 and 18),
  player_id            uuid not null references public.players (id) on delete cascade,
  type                 public.side_event_type not null,
  value                numeric,
  created_by_player_id uuid references public.players (id) on delete set null,
  created_at           timestamptz not null default now()
);

create table public.evidence_images (
  id                 uuid primary key default gen_random_uuid(),
  side_event_log_id  uuid not null references public.side_event_logs (id) on delete cascade,
  image_url          text not null,
  created_at         timestamptz not null default now()
);

create table public.ledger_entries (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  player_id     uuid not null references public.players (id) on delete cascade,
  kind          public.ledger_kind not null default 'penalty',
  amount        numeric not null,
  note          text not null default '',
  round_id      uuid references public.rounds (id) on delete set null,
  created_at    timestamptz not null default now()
);

create table public.bets (
  id                     uuid primary key default gen_random_uuid(),
  tournament_id          uuid not null references public.tournaments (id) on delete cascade,
  created_by_player_id   uuid references public.players (id) on delete set null,
  scope                  public.bet_scope not null,
  metric_key             public.bet_metric not null,
  custom_description     text,
  round_id               uuid references public.rounds (id) on delete cascade,
  amount                 numeric not null,
  status                 public.bet_status not null default 'pending',
  winner_id              uuid references public.players (id) on delete set null,
  creator_paid_confirmed boolean not null default false,
  created_at             timestamptz not null default now()
);

create table public.bet_participants (
  id             uuid primary key default gen_random_uuid(),
  bet_id         uuid not null references public.bets (id) on delete cascade,
  player_id      uuid not null references public.players (id) on delete cascade,
  accepted       boolean,
  paid_confirmed boolean not null default false,
  unique (bet_id, player_id)
);

create table public.announcements (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  created_by    uuid references public.profiles (id) on delete set null,
  message       text not null,
  created_at    timestamptz not null default now()
);

create table public.feed_events (
  id            uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  type          public.feed_event_type not null,
  message       text not null,
  player_id     uuid references public.players (id) on delete set null,
  round_id      uuid references public.rounds (id) on delete set null,
  team_id       uuid references public.teams (id) on delete set null,
  created_at    timestamptz not null default now()
);

-- ── Row Level Security: deny-all until 23C adds policies ──────────────────
alter table public.profiles         enable row level security;
alter table public.countries        enable row level security;
alter table public.tournaments      enable row level security;
alter table public.players          enable row level security;
alter table public.invites          enable row level security;
alter table public.courses          enable row level security;
alter table public.holes            enable row level security;
alter table public.rounds           enable row level security;
alter table public.groups           enable row level security;
alter table public.group_members    enable row level security;
alter table public.teams            enable row level security;
alter table public.team_members     enable row level security;
alter table public.scorecards       enable row level security;
alter table public.round_approvals  enable row level security;
alter table public.side_event_logs  enable row level security;
alter table public.evidence_images  enable row level security;
alter table public.ledger_entries   enable row level security;
alter table public.bets             enable row level security;
alter table public.bet_participants enable row level security;
alter table public.announcements    enable row level security;
alter table public.feed_events      enable row level security;

-- ── Indexes on foreign-key columns not already covered by a PK / unique idx ─
create index players_tournament_id_idx          on public.players (tournament_id);
create index players_user_id_idx                on public.players (user_id);
create index invites_tournament_id_idx          on public.invites (tournament_id);
create index invites_linked_player_id_idx       on public.invites (linked_player_id);
create index tournaments_country_id_idx         on public.tournaments (country_id);
create index tournaments_created_by_idx         on public.tournaments (created_by);
create index courses_tournament_id_idx          on public.courses (tournament_id);
create index courses_country_id_idx             on public.courses (country_id);
create index rounds_tournament_id_idx           on public.rounds (tournament_id);
create index rounds_course_id_idx               on public.rounds (course_id);
create index groups_round_id_idx                on public.groups (round_id);
create index group_members_player_id_idx        on public.group_members (player_id);
create index teams_round_id_idx                 on public.teams (round_id);
create index team_members_player_id_idx         on public.team_members (player_id);
create index scorecards_round_id_idx            on public.scorecards (round_id);
create index scorecards_player_id_idx           on public.scorecards (player_id);
create index scorecards_team_id_idx             on public.scorecards (team_id);
create index round_approvals_player_id_idx      on public.round_approvals (player_id);
create index round_approvals_approved_by_idx    on public.round_approvals (approved_by);
create index side_event_logs_tournament_id_idx  on public.side_event_logs (tournament_id);
create index side_event_logs_round_id_idx       on public.side_event_logs (round_id);
create index side_event_logs_player_id_idx      on public.side_event_logs (player_id);
create index side_event_logs_created_by_idx     on public.side_event_logs (created_by_player_id);
create index evidence_images_log_id_idx         on public.evidence_images (side_event_log_id);
create index ledger_entries_tournament_id_idx   on public.ledger_entries (tournament_id);
create index ledger_entries_player_id_idx       on public.ledger_entries (player_id);
create index ledger_entries_round_id_idx        on public.ledger_entries (round_id);
create index bets_tournament_id_idx             on public.bets (tournament_id);
create index bets_created_by_player_id_idx      on public.bets (created_by_player_id);
create index bets_round_id_idx                  on public.bets (round_id);
create index bets_winner_id_idx                 on public.bets (winner_id);
create index bet_participants_player_id_idx     on public.bet_participants (player_id);
create index announcements_tournament_id_idx    on public.announcements (tournament_id);
create index announcements_created_by_idx       on public.announcements (created_by);
create index feed_events_tournament_id_idx      on public.feed_events (tournament_id);
create index feed_events_player_id_idx          on public.feed_events (player_id);
create index feed_events_round_id_idx           on public.feed_events (round_id);
create index feed_events_team_id_idx            on public.feed_events (team_id);
