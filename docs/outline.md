# Golf Trip Tournament App – Outline (Scope Lock v2)

## 1) One-sentence goal

An invite-only golf trip tournament app (email magic link login) for 12–20 players that manages rounds, points, side-competitions, penalties, and peer-to-peer bets with live leaderboards and simple event logging — designed to complement GameBook.

---

## 2) Non-goals (explicitly NOT doing)

- No replacement of GameBook scoring engine
- No official slope/rating/tee calculations
- No public tournaments or open registration
- No OS push notifications (in-app only)
- No GPS shot tracking
- No payment processing (bets are tracked, not transferred)
- No offline-first mode
- No external course API integration
- No Supabase/backend integration yet (mock data in Zustand; Supabase deferred)

---

## 3) Target user

- Private golf group (12–16 typical, max 20)
- Annual tournament trips (Portugal, Spain, etc.)
- Competitive but fun atmosphere
- Wants live overview + structured bookkeeping

---

## 4) Core flows

### 4.1 Invite & Login (Magic Link)

- Admin invites via email
- Player joins via secure link
- Roles: admin / player
- Create player + invite with same email → linked on acceptance

### 4.2 Create Tournament (admin only)

- Name, dates, location (optional)
- Default points table (editable per round)
- Enable side competitions
- Set tournament status (draft / live / done)
- Admin can create multiple tournaments
- Admin sets one tournament as "active" — this is what players see
- Players see only the active tournament
- Past tournaments browsable with read-only leaderboards

### 4.3 Import Course (CSV)

Required columns:

- holeNumber
- par
- strokeIndex

### 4.4 Create & Manage Rounds (admin only)

- Select course
- Format:
  - Scramble (team)
  - Stableford
  - Best Ball (team)
  - Handicap (individual)
- Assign groups (4 players per group)
- Optional team setup (2 players per team within a group)
  - Team name defaults to "Player A & Player B"
  - Custom team name allowed (editable by team members or admin)
  - Team name changes during active round appear in feed
- Configure round points model (default top-10, customizable)
- Round status: upcoming → active → completed
  - Only one round can be active at a time
  - Admin controls status transitions
  - Active round is the default across the app (Enter, Leaderboards)
- Edit round after creation (name, format, groups, teams, status)
- Completed rounds sort to bottom of round list

### 4.5 Score Entry

- Group-based entry: grid with hole rows × player/team columns
  - Tap a cell, enter strokes via number pad
  - See all group members at once
  - Side events integrated in the same view (inline per hole)
  - Side events scoped to your group only
- For team formats (Scramble/Best Ball): single column per team
- Default to current active round
- Select your group → persisted as default for next app open
- Per-hole strokes only (no whole-round total entry)
- Edit anytime
- Auto-recalculation (net, stableford, points)
- Side event icons visible on score cells (birdie, eagle, snake, etc.)

### 4.6 Log Side Events (Fast Actions)

- Integrated into score entry view
- Scoped to your group only
- Event types:
  - Birdie
  - Eagle
  - Hole in one
  - Albatross
  - Bunker save
  - Snake (3-putt)
  - Snöpp (anger event; unlimited per hole)
  - Group longest drive (Par 5)
  - Longest drive (meters + photo)
  - Longest putt (meters)
  - Nearest to pin (meters)
  - Green in regulation (manual toggle per hole)

### 4.7 Betting

- Create bet:
  - Round bet
  - Tournament bet
- Bet target:
  - Most points
  - Most birdies
  - Head-to-head
  - Custom metric
- Bet amount
- Invite one or multiple players
- Mark bet as paid:
  - Both parties must confirm payment
- Bet list organized by:
  - Round bets (current round)
  - Tournament bets
  - Settled/completed bets (separate section)

### 4.8 Feed Page

- Tournament hero (name, dates, location, greeting)
- Active round leaders card (top 3–5 from current active round)
- Points summary (your tournament points)
- Announcement cards for notable events:
  - Eagle, birdie, hole-in-one, albatross, closest to pin
  - Large colorful card with slide-in animation
  - Auto-dismisses after a few seconds
- Live chronological feed (side events, penalties, bets, admin announcements)
- Admin can post announcements to the feed

### 4.9 Leaderboards

- Default to Round tab when an active round exists; otherwise Total tab
- Round leaderboard (standings for a single round)
- Total points leaderboard (overall tournament)
- Gross leaderboard (without handicap)
- Net leaderboard (with handicap)
- Side competition leaderboards
- Betting overview
- Trophy overview ("Road to Winner")
- Player scorecard detail view:
  - Tap a player on any leaderboard to expand
  - Shows full 18-hole scorecard with scores + side event icons per hole
  - Visible for any round

---

## 5) Rules & Competition Logic

### Points

- Default top 10 points table
- Editable per round
- Supports team placement
- Automatic recalculation

### Handicap

- Group-defined handicap per player (admin can update; changes appear in feed)
- Uses par + stroke index
- Produces:
  - Gross total
  - Net total

### Snakes

- 3 putts = 1 snake
- Last snake in group derived by timestamp

### Snöpp

- Manual anger event
- Can happen multiple times per hole
- Counted as total per tournament

### Distance Events

- Longest drive (meters, requires image)
- Group longest drive (Par 5 only)
- Longest putt (meters)
- Nearest to pin (meters)

Winner logic:

- max(value) for distance competitions
- sum(count) for count competitions

### Penalties

- Manual entry (admin or self)
- Accumulated per player
- "Penalty King" = highest total

### Bets

- Created by any player
- Type:
  - Round-specific
  - Tournament-wide
- Metric-based or head-to-head
- States:
  - pending
  - accepted
  - rejected
  - won/lost
  - paid (requires confirmation from both sides)

---

## 6) Data Model (minimal but extensible)

### User

- id
- email
- displayName
- role (admin | player)
- createdAt

### Tournament

- id
- name
- location
- startDate
- endDate
- status (draft | live | done)
- createdByUserId

### Player

- id
- tournamentId
- userId
- displayName
- groupHandicap
- active

### Course

- id
- tournamentId
- name
- source

### Hole

- id
- courseId
- holeNumber
- par
- strokeIndex

### Round

- id
- tournamentId
- courseId
- name
- format
- holesPlayed
- status (upcoming | active | completed)

### Group

- id
- roundId
- name
- playerIds[]

### Team

- id
- roundId
- name (default "Player A & Player B", customizable)
- playerIds[]

### Scorecard

- id
- roundId
- participantId (player or team)
- holeStrokes[]
- grossTotal
- netTotal
- stablefordPoints
- isComplete

### RoundPoints

- id
- roundId
- participantId
- placing
- pointsAwarded

### SideEventDefinition

- id
- tournamentId
- key
- displayName
- mode (count | max | min | sum)
- requiresValue (bool)
- requiresEvidence (bool)

### SideEventLog

- id
- tournamentId
- roundId
- holeNumber
- playerId
- definitionKey
- value (optional number)
- createdAt

### EvidenceImage

- id
- sideEventLogId
- imageUrl
- createdAt

### LedgerEntry

- id
- tournamentId
- playerId
- kind (penalty)
- amount
- note
- roundId
- createdAt

### Bet

- id
- tournamentId
- createdByPlayerId
- scope (round | tournament)
- metricKey
- roundId (optional)
- amount
- status
- creatorPaidConfirmed (bool)
- createdAt

### BetParticipant

- id
- betId
- playerId
- accepted (bool)
- paidConfirmed (bool)

### Trophy

- id
- tournamentId
- name
- sourceType (points | sideEvent | ledger | bet)
- sourceKey

### Announcement

- id
- tournamentId
- createdByUserId
- message
- createdAt

---

## 7) Leaderboards (must support)

- Round placing
- Total tournament points
- Gross total winner
- Net total winner
- Most birdies
- Most snakes
- Most snöpp
- Longest drive (meters)
- Longest putt
- Nearest to pin
- Most GIR
- Penalty king
- Biggest bettor (total bet volume)
- Custom trophy standings

---

## 8) Roles & Permissions

### Admin

- Create and manage tournaments (set active)
- Create and manage rounds (set status: upcoming/active/completed)
- Add, edit, remove players
- Update player handicaps (changes appear in feed)
- Invite players via email
- Post announcements to feed
- Edit all scorecards and data
- Configure teams and points models

### Player

- View active tournament only (plus past tournaments read-only)
- Enter scores for their group
- Log side events for their group
- Create and manage their own bets
- Edit their own profile data
- Update their team name (team formats)

---

## 9) Definition of Done (v2)

### v1 (completed)

- [x] Tournament CRUD works
- [x] Course CSV import works
- [x] Round creation + group assignment works
- [x] Score entry per hole works
- [x] Points auto-recalculation works
- [x] Gross + net totals calculated
- [x] All defined side events loggable
- [x] Distance events support value + image
- [x] Snakes + last snake logic works
- [x] Snöpp logging works
- [x] Penalty ledger works
- [x] Bet creation + acceptance works
- [x] Bet paid confirmation requires both parties
- [x] Leaderboards update reactively
- [x] In-app feed/toast animations work
- [x] Responsive for mobile + desktop
- [x] Tests for points, side-events, bets, snakes

### v2 (in progress)

- [ ] Admin/player role enforcement in UI
- [ ] Multi-tournament with active selection
- [ ] Past tournament browser (read-only leaderboards)
- [ ] Round status management (upcoming/active/completed)
- [ ] Active round as default across app
- [ ] Group-based score entry grid (hole rows × player columns)
- [ ] Team score entry (single column per team)
- [ ] Team configuration after round creation
- [ ] Team naming (default + custom, editable, feed event on change)
- [ ] Edit round after creation
- [ ] Side events integrated in score entry view
- [ ] Side event icons on scorecard cells
- [ ] Player scorecard detail view (tap-to-expand)
- [ ] Feed: announcement cards with animation for notable events
- [ ] Feed: active round leaders card
- [ ] Feed: admin announcement posting
- [ ] Betting: round vs tournament vs settled sections
- [ ] Course view layout polish
- [ ] Handicap change feed events
- [ ] Completed rounds sort to bottom
- [ ] Updated demo data for full v2 demo

---

## 10) Constraints

- Max 20 players per tournament
- No external course API
- No payment integration
- No offline mode
- No public sharing
- No Supabase yet (Zustand mock data; backend deferred)
