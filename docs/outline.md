# Golf Trip Tournament App – Outline (Scope Lock v1)

## 1) One-sentence goal

An invite-only golf trip tournament app (email magic link login) for 12–20 players that tracks rounds, points, and side-competitions (birdies, snakes, bunker saves, longest drives, group-longest-drive on par 5s) with live leaderboards, quick in-app event logging, and photo evidence for longest-drive-in-meters — designed to complement GameBook.

---

## 2) Non-goals (explicitly NOT doing)

- No replacement of GameBook’s full scoring experience
- No payments (Vipps etc.) in v1
- No public tournaments or open registration
- No slope/rating/tee management (group handicap only)
- No GPS / shot tracking / automatic distance measurement
- No OS-level push notifications (in-app feed/toast only)
- No advanced analytics (strokes gained etc.)
- No complex moderation/approval workflow for evidence
- No multi-language support in v1

---

## 3) Target user

- Primary: Private golf buddy group (12–16 typical, max ~20 players)
- Context: Yearly golf trips (e.g. Spain 2026, Portugal 2027) where:
  - Everyone plays the same format per round
  - Morning and afternoon rounds can have different formats
  - Group wants live overview of points + side competitions
  - Players log events quickly during play

---

## 4) Core flows

1. Invite & Login (Magic Link)
   - Admin creates tournament
   - Admin invites players via email
   - Players join via email magic link (no password)
   - Roles: admin / player

2. Create Tournament
   - Name, dates, optional location
   - Default points table (editable per round)
   - Enable side competitions
   - Set status (draft → live → done)

3. Import Course (CSV)
   - Upload CSV file
   - Required columns:
     - `holeNumber`
     - `par`
     - `strokeIndex`
   - Creates Course + 9/18 holes

4. Create Rounds
   - Select course
   - Format:
     - Scramble
     - Stableford
     - Best Ball
     - Handicap (individual)
   - Assign players to groups
   - Optional: create teams (scramble / ryder-style)
   - Configure points model for this round:
     - Individual placing (e.g. top 10)
     - Team placing (scramble/ryder)

5. Enter & Update Scores
   - Enter per-hole strokes
   - Or enter whole-round total
   - Support missing holes
   - Allow later edits
   - Auto-recalculate standings and totals

6. Log Side Events (Fast Actions)
   - Birdie
   - Eagle
   - Hole in one
   - Albatross
   - Bunker save
   - Snake (3-putt)
   - Group-longest-drive (Par 5 only)
   - Longest drive (meters + photo)

7. Leaderboards & Live Feed
   - Round leaderboard
   - Total points leaderboard
   - Side competition leaderboards
   - In-app live feed with toast/animation
   - Event format example:
     - "Kjartan – BIRDIE on 7"
     - "Thomas – 312m DRIVE"

---

## 5) Rules & Competition Logic

### Points System
- Default: Top 10 get points
- Editable per round
- Supports:
  - Individual placement
  - Team placement (scramble/ryder-style)
- Recalculated automatically after score updates

### Handicap
- Uses group-defined handicap value per player
- Requires:
  - Par per hole
  - Stroke index per hole
- No slope/rating/tee support

### Snakes
- Trigger: 3 putts on a hole
- Each 3-putt = 1 snake
- “Last snake in group”:
  - Derived automatically from latest snake timestamp within each group

### Group Longest Drive (Par 5 only)
- Per eligible hole
- Log which player won in their group
- Totals accumulated across all rounds

### Longest Drive (Meters)
- Manual input of distance (meters)
- Requires at least 1 image upload
- All images visible in gallery
- Winner = highest recorded meters
- No approval workflow

---

## 6) Data model (minimal)

### User
- id
- email
- displayName
- createdAt

### Invite
- id
- tournamentId
- email
- role (admin/player)
- token
- expiresAt
- acceptedAt

### Tournament
- id
- name
- location (optional)
- startDate
- endDate
- status (draft/live/done)
- createdByUserId

### Player
- id
- tournamentId
- userId
- displayName
- nickname (optional)
- groupHandicap (number)
- active (boolean)

### Course
- id
- tournamentId
- name
- source (csv/manual)
- createdAt

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
- dateTime (optional)
- format (scramble/stableford/bestball/handicap)
- holesPlayed (9/18)
- status

### Group
- id
- roundId
- name
- playerIds[]

### Team (optional per round)
- id
- roundId
- name
- playerIds[]

### Scorecard
- id
- roundId
- playerId OR teamId
- holeStrokes[] (nullable per hole)
- grossTotal
- netTotal (optional)
- stablefordPoints (optional)
- isComplete

### RoundPoints
- id
- roundId
- participantId (playerId/teamId)
- placing
- pointsAwarded

### SideEventLog
- id
- tournamentId
- roundId (optional)
- holeNumber (optional)
- playerId
- type:
  - birdie
  - eagle
  - hio
  - albatross
  - bunker_save
  - snake
  - group_longest_drive
  - longest_drive_meters
- value (number optional)
- createdAt
- createdByPlayerId

### EvidenceImage
- id
- sideEventLogId
- imageUrl
- createdAt

### FeedEvent
- id
- tournamentId
- type
- message
- playerId
- roundId (optional)
- createdAt

---

## 7) UI Notes

- Mobile-first design
- Bottom navigation:
  - Feed
  - Enter
  - Leaderboards
  - Rounds
  - Players
- Large quick-action buttons for side events
- Fast hole selector (1–18 grid)
- Leaderboard optimized for outdoor readability
- Evidence gallery for longest drives
- In-app animated toast (no OS push)

---

## 8) CSV Import Spec

Required headers:

- holeNumber
- par
- strokeIndex

Optional:

- courseName

Example:

holeNumber,par,strokeIndex  
1,4,11  
2,5,3  
3,3,17  

---

## 9) Definition of Done (v1)

- [ ] Invite-only email magic link authentication works
- [ ] Tournament CRUD works
- [ ] Player CRUD works
- [ ] Course import via CSV works
- [ ] Round creation with format + groups works
- [ ] Team support for scramble works
- [ ] Score entry per hole and per round works
- [ ] Missing holes supported
- [ ] Standings recalculate automatically
- [ ] Points awarding supports:
      - individual top 10
      - team placement
- [ ] Side-event logging works for all defined types
- [ ] Snake logic + last-snake derivation works
- [ ] Longest drive meters supports image upload
- [ ] Side competition totals calculated correctly
- [ ] Round leaderboard works
- [ ] Total leaderboard works
- [ ] Live feed/toast works
- [ ] Responsive desktop + mobile
- [ ] Tests for:
      - points calculation
      - side-event aggregation
      - snake last logic
- [ ] README with run instructions + CSV format

---

## 10) Explicit v1 Constraints

- Max 20 players
- Single tournament active at a time
- No external course API
- No GameBook integration
- No push notifications
- No offline mode

Scope locked for v1.