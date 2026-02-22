# Golf Trip Tournament App – Outline (Scope Lock v1 – Portugal Edition)

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
- No offline-first mode in v1
- No external course API integration in v1

---

## 3) Target user

- Private golf group (12–16 typical, max 20)
- Annual tournament trips (Portugal, Spain, etc.)
- Competitive but fun atmosphere
- Wants live overview + structured bookkeeping

---

## 4) Core flows

1. Invite & Login (Magic Link)
   - Admin invites via email
   - Player joins via secure link
   - Roles: admin / player

2. Create Tournament
   - Name, dates, location (optional)
   - Default points table (editable per round)
   - Enable side competitions
   - Set tournament status

3. Import Course (CSV)
   Required columns:
   - holeNumber
   - par
   - strokeIndex

4. Create Rounds
   - Select course
   - Format:
     - Scramble
     - Stableford
     - Best Ball
     - Handicap (individual)
   - Assign groups
   - Optional team setup
   - Configure round points model

5. Score Entry
   - Per-hole strokes
   - Whole-round totals
   - Edit anytime
   - Auto recalculation

6. Log Side Events (Fast Actions)
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

7. Betting
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

8. Leaderboards & Live Feed
   - Round leaderboard
   - Total points leaderboard
   - Gross leaderboard (without handicap)
   - Net leaderboard (with handicap)
   - Side competition leaderboards
   - Betting overview
   - Trophy overview ("Road to winner")
   - Live in-app animated feed

---

## 5) Rules & Competition Logic

### Points

- Default top 10 points table
- Editable per round
- Supports team placement
- Automatic recalculation

### Handicap

- Group-defined handicap per player
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

- Manual entry
- Accumulated per player
- "Penalty King" = highest total

### Bets

- Created by player
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
- createdAt

### Tournament

- id
- name
- location
- startDate
- endDate
- status
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
- status

### Group

- id
- roundId
- name
- playerIds[]

### Team

- id
- roundId
- name
- playerIds[]

### Scorecard

- id
- roundId
- participantId (player/team)
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

---

## 7) Leaderboards (v1 must support)

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

## 8) Definition of Done (v1)

- [x] Invite-only magic link auth works
- [x] Tournament CRUD works
- [x] Course CSV import works
- [x] Round creation + team support works
- [x] Score entry per hole works
- [x] Points auto recalculation works
- [x] Gross + net totals calculated
- [x] All defined side events loggable
- [x] Distance events support value + image
- [x] Snakes + last snake logic works
- [x] Snöpp logging works
- [x] Penalty ledger works
- [x] Bet creation + acceptance works
- [x] Bet paid confirmation requires both parties
- [x] Leaderboards update live
- [x] In-app feed/toast animations work
- [x] Responsive for mobile + desktop
- [x] Tests for:
  - points logic
  - side-event aggregation
  - bet resolution
  - snake/snöpp counting

---

## 9) v1 Constraints

- Max 20 players
- Single active tournament
- No external course API
- No payment integration
- No offline mode
- No public sharing

Scope locked for v1.
