# Streak for the Bonus — prototype

Mobile-first daily prediction game. React 19 + TypeScript + Vite + Tailwind 4 +
Zustand, with optional Firebase.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173/streak-for-the-bonus/
```

No `.env` needed. Firebase is off by default and the app runs entirely on local
state with live ESPN data.

```bash
npm run build && npm run preview   # production build
```

Note the `/streak-for-the-bonus/` path — `vite.config.ts` sets a `base` for
GitHub Pages, so the bare `localhost:5173` root will 404.

### Optional: Firebase

Copy `.env.example` to `.env`, fill in credentials, set
`VITE_USE_FIREBASE=true`. Without both the flag and a real API key the app
stays in local-state mode.

## Things worth knowing

**Preview the reward moment.** It normally fires when you cross a reward
threshold, which takes 3–7 winning picks. To see it on demand:

| | |
|---|---|
| `?buzz` | loops every tier, one every 8s |
| `?buzz=4` | same, every 4s |
| `?buzz=once` | fire one and stop |

There are also per-tier buttons on the Rewards page. None of it touches your
streak, wins or history.

**The fonts are not in the repo.** Seven `.woff2` files need dropping into
`public/fonts/` — see `public/fonts/README.md`. They live behind SSO on
gitlab.disney.com, and requesting one without a session returns **HTTP 200 with
an HTML sign-in page**, not a 404. `@font-face` can't parse it, fails silently,
and the app renders in Impact/Arial with no error anywhere. If it looks wrong
on someone's machine and right on yours, this is why.

**Rewards are simulated.** Real bonus bets are regulated promotional credits.
Nothing here issues one; the celebration says so on its face. Anything real
needs the compliance path.

**Results are simulated too.** No box score is read. `lib/resolution.ts` rolls
weighted dice — using the price where one exists, and a player's measured
season hit rate where it doesn't.

## Question types

| Kind | Source | Priced? |
|---|---|---|
| `spread` | site.api scoreboard (pre-existing) | yes |
| `moneyline` | core API odds node | yes |
| `total` | core API odds node | yes |
| `milestone` | core API propBets + game log | **no** |

The propBets feed carries **no prices at all** — 2,590 props sampled across
four NFL games returned zero odds fields, and 37% carry no value either
(`current: {}`, which is every multi-candidate scorer market). So milestone
cards show a measured hit rate instead: "cleared this in 4 of 7 games". That
number is both what the card displays and what the resolver rolls against.

`lib/espnCoreOdds.ts` has the full detail, including two API traps: the core
API needs a `/leagues/` path segment the other ESPN APIs don't, and
`?dates=<today>` means "kicks off on this calendar date" — so on a Tuesday it
returns zero NFL games and therefore zero NFL props.

## Game Kit

Tokens and the reveal treatment come from `../../game-kit`, imported at the top
of `src/index.css`. Streak's `--color-theme-*` names are bridged onto the kit's
`--gk-*` values rather than renamed, so the 234 existing call sites keep
working and components can migrate gradually.

The accent (`#05A569`) deliberately diverges from the kit, which is still
yellow. If green becomes the shared direction it belongs in the kit instead.

## Known open items

- **Fonts** — the seven files above.
- **Contrast** — `--color-theme-text-muted` is 3.47:1, below AA for body text,
  used in 29 places. It was 2.90:1 before the kit landed, so this is an
  inherited issue the adoption improves but does not fix. Moving it means
  moving the kit's `--gk-ink-3`.
- **Prop coverage** — NFL, MLB, EPL, UCL, WNBA and MLS confirmed. College
  football has game lines but **no** player props. NBA and NHL are unresolved:
  their current games are preseason and carry no odds at all, and props only
  populate as a game approaches, so retest same-day — NHL ~7 Oct, NBA ~21 Oct.
- **Accent vs success green** — the accent is now hue 157°, the win colour
  133°. Previously accent was yellow, so they were unmistakable. Worth a look
  on a screen whose job is signalling wins.
