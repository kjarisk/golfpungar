# Supabase Setup — Step-by-Step

What you need to do manually in the Supabase dashboard before we wire up the backend in code. Follow this in order. The implementation phases (schema SQL, RLS policies, code changes) are in `docs/plan.md` and will be done in subsequent sessions.

---

## 1. Create the project

1. Go to [supabase.com](https://supabase.com) and sign in (GitHub login is easiest).
2. Click **"New project"**.
3. Fill in:
   - **Name:** `golfpungar` (or whatever you prefer)
   - **Database password:** generate a strong one and **save it in your password manager** — you'll need it for the CLI later.
   - **Region:** pick the closest to where the golf trip happens. For Spain/Portugal trips → **`eu-west-1` (Ireland)** or **`eu-central-1` (Frankfurt)**. For Iceland/Nordics → **`eu-north-1` (Stockholm)**.
   - **Plan:** Free tier is fine (500MB DB, 1GB storage, 50k MAUs — plenty for 20 players).
4. Click **Create new project** and wait ~2 minutes for provisioning.

---

## 2. Get your credentials

Once the project is ready, you need two values: the **Project URL** and the **Publishable key**.

**Quickest way — the `Connect` button:**

1. Click **Connect** in the top bar of the dashboard.
2. Copy the **Project URL** (e.g. `https://abcdefgh.supabase.co`).
3. Copy the **Publishable key** (starts with `sb_publishable_...`).

**Or via Settings:**

1. Go to **Settings → API Keys** in the left sidebar.
2. On the **API Keys** tab, copy the **Publishable key** (`sb_publishable_...`). If you don't have one yet, click **Create new API keys** first.
3. For the Project URL, go to **Settings → API** (or just use the `Connect` button above).

Keep these two values handy — we'll use both in step 5.

> ℹ️ **Supabase changed its API key system.** The old JWT keys were replaced:
>
> - **Publishable key** (`sb_publishable_...`) — low-privilege, safe to ship in the frontend. **This is the one we use.** (Replaces the old `anon` key.)
> - **Secret key** (`sb_secret_...`) — elevated privilege, bypasses RLS, backend-only. **Never put this in the frontend.** (Replaces the old `service_role` key.)
>
> The legacy `anon` / `service_role` JWT keys (starting with `eyJ...`) still live under the **"Legacy anon, service_role API keys"** tab and work until the end of 2026 — but use the new keys.

---

## 3. Configure Auth (magic link)

1. Go to **Authentication → Sign In / Providers** (left sub-menu, under the **CONFIGURATION** heading).
2. Under **Auth Providers**, find **Email** and click it to expand.
3. Verify **"Enable email provider"** is ON (it is by default).
4. Leave the **Email OTP** settings at their defaults — `3600` seconds expiry and `8`-digit OTP are fine. Magic-link login runs through these; there is **no separate "confirm email" toggle** in the current UI.
5. The password settings (secure password change, leaked-password check, minimum length) don't matter — this app uses magic links, not passwords. **"Secure email change"** can stay ON.
6. Click **Save** at the bottom of the panel, then close it.
7. Back on the **Sign In / Providers** page, find the **"Allow new users to sign up"** toggle and turn it **OFF** — this app is invite-only, so users are created via the admin invite flow rather than open signup.

### Set redirect URLs

1. Go to **Authentication → URL Configuration** (left sub-menu, under **CONFIGURATION**).
2. Set **Site URL** to:
   - Dev: `http://localhost:5173`
   - When you deploy: change this to `https://golfpungar.kjarisk.com`.

   (The app serves at the root path, so no `/golfpungar` suffix is needed.)
3. Add **Redirect URLs** (one per line):
   ```
   http://localhost:5173/**
   http://localhost:5174/**
   http://localhost:5175/**
   http://localhost:5176/**
   https://golfpungar.kjarisk.com/**
   ```
   Vite uses port 5173 by default but bumps to 5174/5175/5176 when it's busy —
   whitelisting the range avoids broken magic-link redirects. The Redirect URLs
   list is just an allowlist, so it's safe to add the production URL now, before
   you deploy.

### Customize the magic link email (optional)

1. Go to **Authentication → Emails** (left sub-menu, under the **NOTIFICATIONS** heading), then open the **Templates** tab.
2. Select the **Magic Link** template.
3. Update the subject to something like `Your Golfpungar login link 🏌️`.
4. The default body works fine — `{{ .ConfirmationURL }}` is the magic link.

---

## 4. Storage bucket (for longest-drive photos)

1. Go to **Storage**.
2. Click **New bucket**.
3. Name it: `evidence`
4. **Public bucket:** OFF (we'll use signed URLs).
5. Click **Create bucket**.

We'll set policies on this bucket later in code.

---

## 5. Wire credentials into the project

In the project root, create `.env.local`:

```bash
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...your-publishable-key...
```

> The variable is named `VITE_SUPABASE_ANON_KEY` for continuity with the code — the
> _value_ is your new **publishable key** (`sb_publishable_...`), not a legacy `eyJ...` key.

Verify `.env.local` is in `.gitignore` (it should already match the `*.local` pattern). **Never commit this file.**

---

## 6. Install the Supabase CLI (recommended)

This lets us version-control the schema migrations in `supabase/migrations/` instead of running SQL by hand in the dashboard.

```bash
brew install supabase/tap/supabase
supabase login
```

When ready (next session), we'll run:

```bash
supabase init
supabase link --project-ref YOUR_PROJECT_REF
```

You'll be prompted for the database password from step 1.

---

## ✅ Checklist

Tick these off before starting Phase 23:

- [x] Project created, region chosen — `golfpungar`, West EU (Ireland)
- [x] Database password saved in password manager
- [x] Project URL + publishable key (`sb_publishable_...`) copied
- [x] Email auth enabled, magic link configured
- [x] Open signups disabled (invite-only)
- [x] Site URL + redirect URLs set
- [x] `evidence` storage bucket created (private)
- [x] `.env.local` created with both env vars
- [x] Supabase CLI installed + logged in — also ran `supabase init` + `supabase link`

All boxes ticked — Phase 23 (schema + RLS + auth wiring) is unblocked.
