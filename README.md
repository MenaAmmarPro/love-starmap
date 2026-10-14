# Star Map — for Mena

The real night sky above us, drawn honestly for any date and place — plus a
little sky to hang your wishes in. Part of the **Love for Mena** collection.

**Live:** https://ammar49-cyber.github.io/love-starmap/

## What it does

- Computes Local Sidereal Time and converts each star's right ascension and
  declination into altitude/azimuth for the chosen date, time (UTC), and
  observing location
- Draws an all-sky map (zenith in the middle, horizon at the edge) with the
  brightest stars and a few recognisable constellations — Orion, the Big
  Dipper, Cassiopeia, Cygnus, Scorpius
- Hover/tap a star to see its altitude, azimuth, and magnitude
- One star is **ours** (highlighted, with a note)
- Write a wish and it becomes a new twinkling star, saved in the browser
- Offline-capable PWA

## Make it ours

At the top of `js/app.js`:

- `DEFAULT_LOCATION` — the lat/lon the map opens at (e.g. our city)
- `OUR_STAR_ID` — which star is "ours" (an `id` from `js/stars-data.js`;
  try `vega`)
- `OUR_STAR_MESSAGE` — the line shown when you find it

Extend `js/stars-data.js` (add stars) and `js/stars-data.js`'s
`window.MENA_CONSTELLATIONS` (add line segments) if you want more of the sky.

## A note on honesty

This is real astronomy, just a small catalog: the positions are computed from
standard formulas and the brightest stars are accurate. It is not a
planetarium — no planets or deep-sky objects, and constellation lines are
approximate. Enough to genuinely recognise the sky we share.

## Files

- `index.html` — the page
- `css/theme.css` — shared love-theme (copied from `_love-theme/`)
- `css/app.css` — page-specific styles
- `js/theme-main.js`, `js/effects.js` — shared behaviour/effects
- `js/stars-data.js` — the star catalog + constellation lines
- `js/app.js` — astronomy, projection, rendering, wishes
- `manifest.webmanifest`, `sw.js` — PWA
- `assets/` — favicon and icons

## Run locally

```powershell
py -m http.server 8000
```

Then visit http://localhost:8000.

## Deploy

Static site, deployed with GitHub Pages from `main`.

## License

Creative Commons BY-NC-ND 4.0 — see [`LICENSE`](LICENSE).
© 2026 Ammar (ammar49-cyber). Made with care for Mena.
