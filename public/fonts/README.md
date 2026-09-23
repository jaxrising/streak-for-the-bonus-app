# Fonts

Drop `.woff2` files here. Nothing needs changing in code — `src/index.css`
already declares all of these and picks up whatever is present.

## What to get

Streak uses **Playoff Pro Cond** for display and title, because Ignite is only
licensable here through Monotype. This substitution is local to this prototype;
the shared game-kit still treats Ignite as its default.

### Needed

```
PlayoffProCond-Bold.woff2          <- does most of the work
PlayoffProCond-Regular.woff2       <- lighter title text
PlayoffProCond-BoldItalic.woff2    <- see note below
```

Bold alone gets you most of the way. Regular and BoldItalic are worth asking
for in the same request rather than a second round trip.

**The italic matters more than it looks.** It appears in three places — the How
To Play heading, the `$10` on the reward card, and achievement titles. With no
italic face the browser synthesises one by slanting the roman, which next to a
proper condensed display face reads as a rendering fault rather than a style.

### Optional

```
BentonSans-Regular.woff2
BentonSans-Medium.woff2
```

Body text: 56 usages, all 10–12px — stat lines, lock times, the day nav, legal
links. Without these it falls back to the system UI face (SF / Segoe / Roboto),
which is purpose-built for exactly this and looks deliberate rather than
broken. Lowest priority of anything here.

### If Ignite ever gets licensed

```
IgniteDisplay-CondensedHeavy.woff2
IgniteTextNarrow-Regular.woff2
IgniteTextNarrow-Bold.woff2
```

Already declared and already second in every stack, behind Playoff. Dropping
them in changes nothing on its own — reorder the two names in the `@theme`
block in `src/index.css` to switch.

## Licensing — check before committing these

Monotype desktop licences generally do **not** cover webfont self-hosting, and
committing `.woff2` files to a repo that publishes to GitHub Pages serves them
to anyone who loads the page. That is redistribution, and a private repo does
not fix it if Pages is public.

Confirm you have a webfont licence with enough pageview allowance, or use
Monotype's hosted delivery, before these go anywhere near `git push`.

## Why they are not fetched from gitlab

`game-kit/tokens.css` points `@font-face` at raw gitlab.disney.com URLs. Those
are SSO-gated, and requesting one without a session returns **HTTP 200 with a
~17KB HTML sign-in page** — not a 404, and not a font.

That failure shape is the problem. `@font-face` cannot parse the HTML, fails
silently, and the browser falls through to the next family in the stack. No
console error, no build warning. It looks like a styling bug, not a missing
asset — and if it looks right on your machine and wrong on a colleague's, this
is why.

Verified, not assumed:

```
$ curl -sL -o /tmp/f.woff2 -w '%{http_code} %{content_type} %{size_download}' \
    https://gitlab.disney.com/.../BentonSans-Regular.woff2
200 text/html; charset=utf-8 17566

$ file /tmp/f.woff2
/tmp/f.woff2: HTML document, Unicode text, UTF-8 text
```

## Checking they loaded

```bash
npm run build && npm run preview
```

DevTools → Network → filter `font`. You want 200s with
`content-type: font/woff2`. Anything coming back `text/html` is a file that
isn't there.

Faster, in the console:

```js
document.fonts.check('900 16px "Playoff Pro Cond"')   // true once loaded
```
