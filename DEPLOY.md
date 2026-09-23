# Deploying Streak for multiplayer

Getting from "runs on my laptop" to "my team can play against each other."

Everything in the app is already written. What follows is configuration plus
one paid-tier decision and one sign-off.

---

## Before you start: two things that are not code

### 1. Cloud Functions need the Blaze plan

`resolveGames` fetches ESPN to grade picks. **Firebase's free Spark plan blocks
all outbound network calls from Functions**, so on Spark the function deploys,
runs, reaches nothing, and grades nothing — with no error that points at the
cause. You need Blaze (pay-as-you-go) with a billing account attached.

At this scale the cost is effectively zero — a scheduled function running every
10 minutes plus a few thousand Firestore reads sits inside the free allowance
that Blaze keeps. But it requires a card on file, which usually needs someone's
approval. Start that early; it is the most common thing that stalls this.

### 2. GitHub Pages is public

`deploy.yml` publishes to GitHub Pages, which serves to the open internet by
default. This build carries ESPN branding, the DraftKings wordmark, and a
bonus-bet reward flow. Sharing it with colleagues is an internal audience on a
public URL — those are different things, and the URL is the part that matters.

**External brand content needs brand/legal sign-off before going live.** Worth
starting in parallel rather than after someone finds it.

If your org has GitHub Enterprise, a private repo with Pages visibility
restricted to organisation members avoids most of this. Check before assuming.

---

## Steps

### 1. Firebase project

```
Firebase console -> Add project
  Authentication -> Sign-in method -> enable "Anonymous"
  Firestore Database -> Create database -> production mode
  Upgrade to Blaze
```

Anonymous is the only provider the app needs. Email/password and Google are
still in `auth.ts` but nothing in the UI calls them.

### 2. Rules, indexes, function

```bash
npm i -g firebase-tools
firebase login
firebase use --add                 # select the project
firebase deploy --only firestore:rules,firestore:indexes
cd functions && npm install && cd ..
firebase deploy --only functions
```

Verify the resolver without waiting for the 10-minute schedule:

```bash
curl https://<region>-<project>.cloudfunctions.net/resolveGamesHttp
# -> {"ok":true,"resolved":N,"voided":N,"skipped":N}
```

### 3. GitHub Secrets

Repo -> Settings -> Secrets and variables -> Actions. All seven are already
wired into `deploy.yml`:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_USE_FIREBASE          <- "true"
```

`VITE_USE_FIREBASE` is the master switch. Without it the deployed build runs
in local-prototype mode: no accounts, no shared state, and the seeded demo
history switched on.

### 4. Pages, then push

```
Repo -> Settings -> Pages -> Source: GitHub Actions
git push origin main
```

`vite.config.ts` sets `base: '/streak-for-the-bonus/'`, so the site lives at
`https://<org>.github.io/streak-for-the-bonus/`. If the repo name differs,
change `base` to match or every asset 404s.

---

## Two bugs that only appear with Firebase on

Both are fixed. Recorded because they are invisible locally and would have
shipped.

**Picks were resolved twice.** `HomePage` polls ESPN and calls `resolvePick`,
which increments the local counters *and* wrote to Firestore — while the Cloud
Function incremented the same counters server-side. Every win counted twice and
streaks ran at double speed. The server now owns resolution whenever Firebase
is on, and the client polling is gated off.

**The demo seed leaked into real accounts.** Five fabricated results are seeded
into the store so past days have something to show. With a backend, every new
player would have loaded someone else's invented history — and because
`syncFromFirebase` overwrites the stats but not `pickHistory`, the counters
would have corrected to zero while five phantom picks stayed on the board. The
seed is now off whenever Firebase is on.

---

## Still outstanding

**Fonts — present locally, not committed.** All six are in `public/fonts/`:
Playoff Pro Cond (Bold, Regular, BoldItalic) for display and title, Benton
Sans (Regular, Medium, Bold) for body. Verified rendering at 320/390/430px
with no clipping or overflow.

They are **gitignored** pending the licence question below, so `npm run dev`
looks right locally but a CI build will not have them and falls back to system
fonts. Delete the `public/fonts/*` lines from `.gitignore` once cleared — no
code change needed.

**Font licensing — the open question.** Both families are Monotype-licensed.
Desktop licences generally do not cover webfont self-hosting, and a repo
publishing to GitHub Pages serves these files to anyone loading the page. That
is redistribution, and a private repo does not fix it if Pages is public.
Confirm a webfont licence with adequate pageviews, or use Monotype's hosted
delivery.

**Contrast.** `--color-theme-text-muted` is 3.47:1, below AA for body text, in
29 places. Inherited, not introduced — it was 2.90:1 before.

**Prop coverage.** NFL, MLB, EPL, UCL, WNBA and MLS confirmed. College football
has game lines but no player props. NBA and NHL unverified — retest same-day,
NHL from ~7 Oct, NBA from ~21 Oct.

**Rewards are simulated.** Nothing issues a real credit and the card says so.
Anything real needs the compliance path first.
