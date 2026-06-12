# MASE — Animations (Vanilla, drop-in)

Zwei Dateien für euer echtes Repo `MaseSites/mase`. Kein Build, kein React, keine Dependencies.

## Files

- `mase-animations.css` + `mase-animations.js` — Basis-Bundle (Hero-Mesh, Smoke-Dark-Mode, Reveals, Sticky-CTA)
- `mase-scroll-animations.css` + `mase-scroll-animations.js` — **Scroll-Pack** (Parallax, Partikel, Process-Linie, Counter, Konfetti, Velocity-Marquee)
- `README.md` — diese Datei

## Installation (2 Minuten)

1. Beide Dateien ins Repo-Root kopieren (neben `styles.css` / `script.js`).
2. In **jeder** HTML-Seite (`index.html`, `leistungen.html`, `preise.html`, …) im `<head>` direkt **nach** `styles.css`:

```html
<link rel="stylesheet" href="/mase-animations.css?v=20260516">
```

3. Im `<head>` direkt **nach** `script.js` / `theme.js`:

```html
<script defer src="/mase-animations.js?v=20260516"></script>
<script defer src="/mase-scroll-animations.js?v=20260517"></script>
```

Und das passende CSS gleich nach dem ersten Animations-CSS:

```html
<link rel="stylesheet" href="/mase-animations.css?v=20260516">
<link rel="stylesheet" href="/mase-scroll-animations.css?v=20260517">
```

Reihenfolge ist wichtig — `mase-animations.js` muss **nach** `theme.js` laden, damit der Smoke-Override für `#dark-toggle` greift.

3a. _(optional)_ Marquee einbauen: irgendwo im Markup ein leeres Anker-Element platzieren, z.B. direkt unter dem `<section class="hero">`:

```html
<div data-mase-marquee></div>
```

Das Script füllt es automatisch.

## Was wird animiert?

Alles auf Basis **eurer existierenden Klassen** — kein HTML muss umstrukturiert werden:

| Effekt | Greift auf |
|---|---|
| Scroll-Progress-Bar (Teal→Blau Gradient, ganz oben) | Wird selbst ins `<body>` injiziert |
| Hero-Gradient-Mesh (3 floatende Blobs) | `.hero` (wird automatisch eingehängt) |
| Word-by-Word-Reveal der Headline | `#hero-title` |
| Hero-Badges popen einzeln rein | `.hero-badges .badge` |
| 3D-Tilt + Glanz auf Benefit-Card | `.hero-benefit-card` |
| Stagger-Reveal auf Karten | `.trust-grid .trust-card`, `.process-grid .process-step` |
| Process-Icons drehen + füllen sich teal beim Hover | `.process-step .process-step-icon` |
| Section-Title Underline zeichnet sich rein | Alle `section h2` |
| Shimmer-Sweep auf Primary-Buttons | `.button-primary` |
| Sticky-CTA-Entrance + Pulse-Ring | `#sticky-cta` / `.sticky-cta` |
| Chat-Message-Pop-In + pulsierender Online-Ring | `.chat-message`, `.chat-dot` |
| **Smoke-Transition Light ↔ Dark** | hijackt Click auf `#dark-toggle` |

## Smoke-Transition — Details

- Click auf `#dark-toggle` triggert ~1.6s Canvas-Animation
- Bei 50% (volle Deckung) flipt das Script `<html>.classList.toggle('dark')` und schreibt `localStorage.setItem('theme', …)` — das ist exakt was eure `theme.js` macht, also läuft alles weiter
- Auf dem Weg ins Dark: dunkler Rauch mit Teal-Akzenten
- Zurück ins Light: weißer Rauch mit Hellblau/Teal-Touches
- Das alte `#dark-wave`-Overlay wird per CSS auf `display:none` gestellt (nicht entfernt)

## Reduced-Motion

`prefers-reduced-motion: reduce` wird respektiert:
- Alle CSS-Animationen werden auf 0.001ms gestaucht
- Smoke wird übersprungen — der Click triggert dann das normale `theme.js`-Verhalten

## Konflikte mit `theme.js`?

Nein. `mase-animations.js` lauscht in der **Capture-Phase** auf den Click und ruft `stopImmediatePropagation()` — `theme.js` läuft also nicht doppelt. Wenn ihr `mase-animations.js` mal rauswerft, übernimmt automatisch wieder die alte Logik.

## Performance

- Smoke-Canvas: 60 Puffs, ~16ms pro Frame auf mittlerer Hardware, läuft 1.6s. Auf low-end Mobile evtl. spürbar — testet's mal.
- Mesh-Blobs: 3 absolut positionierte Divs mit `filter: blur(60px)`, CSS-animiert (GPU). Sehr leichtgewichtig.
- Alle Reveals via IntersectionObserver, unobserve nach erstem Trigger.

## Scroll-Pack (v2) — was zusätzlich passiert

Das zweite Bundle macht die Seite **fröhlicher und lebendiger** ohne ein einziges HTML-File anzufassen:

| Effekt | Auf welcher Sektion / Klasse |
|---|---|
| Parallax auf Hero-Blobs | `.mase-hero-mesh .mase-blob` (drei Tiefen-Ebenen) |
| Schwebende Partikel-Punkte | `.hero`, `.ai`, `.pricing-teaser` — teal/blau/mint, driften langsam nach oben |
| Process-Linie zeichnet sich | `.process-grid` — SVG-Linie verbindet alle Steps, baut sich beim Scroll auf |
| Process-Step Bounce-In | `.process-step` — landet jetzt mit kleinem Spring statt nur fade |
| Counter-Rollups | Findet automatisch alle Zahlen ≥ 5 in `.hero-benefit-price`, `.metric-value`, `.demo-price-value` etc. und rollt sie hoch |
| Idle-Bob | Hero-Badges + Benefit-Trust-Pills schweben dezent auf-und-ab (`mase-bob`) |
| Check-Häkchen Pop | Häkchen in der Benefit-Card poppen einzeln beim Reveal |
| Trust-Card Wiggle | Beim Hover leichter Kipp-Effekt links/rechts alternierend |
| Velocity-Marquee | Marquee beschleunigt wenn ihr schnell scrollt, kehrt nach 600ms zur Normalgeschwindigkeit zurück |
| Konfetti-Burst | Klick auf Hero-CTA, Sticky-CTA, Pricing-Teaser-CTA, Benefit-CTA → 36 Schnipsel in Teal/Blau/Mint/Weiß |
| Mask-Sweep-Reveal | Opt-in über `data-reveal="sweep"` — Bild oder Card wird von links nach rechts „aufgeschoben" |
| Auto-Wave-Divider | Opt-in über `<html data-mase-auto-waves>` — fügt SVG-Wellen-Dividers zwischen Sektionen |

### Opt-in-Markup (alles optional)

- `<element data-parallax="0.3">` → bewegt sich mit Parallax-Faktor (0–1, negative Werte = gegen Scroll)
- `<button data-mase-confetti>` → triggert Konfetti zusätzlich zu den Standard-CTAs
- `<img data-reveal="sweep">` → wird mit Mask-Sweep statt Fade rein-revealt
- `<element data-mase-counter>` → erzwingt Counter-Rollup (sonst Auto-Erkennung)
- `<html data-mase-auto-waves>` → fügt automatisch Wellen-Dividers zwischen Sektionen ein
