# MASE Design System

A design system distilled from the production website of **MASESites AG** — a Swiss webdesign and AI-integration studio founded by Matteo & Severin. The product is a multi-page marketing site (`masesites.ch`) selling website builds + an embedded AI assistant to SMBs, plus four hand-built demo sites used as live previews.

This skill gives a design agent everything it needs to mock up new pages, slides, decks and prototypes that look and read like the real MASE brand.

---

## Sources

The system was built by reading the production codebase directly:

- **GitHub repo (private):** [`MaseSites/mase`](https://github.com/MaseSites/mase) — full marketing site (HTML/CSS/vanilla JS) including four demo sites under `demo/`. Explore it for additional pages, copy patterns and component variants beyond what is captured here.
- **Live product:** [`masesites.ch`](https://www.masesites.ch)

> If you have access to the repo, drill into `styles.css` (≈4200 lines, full token + component definitions), `index.html` (homepage), `preise.html` (modular pricing), `ki-assistent.html` (AI product page) and the four `demo/*.html` sites for richer reference.

---

## Brand at a glance

- **Name:** MASESites AG · short form **MASE**
- **Founders:** Matteo & Severin
- **Country:** Switzerland (CHF pricing, German-Swiss `de-CH` default, EN/FR toggle)
- **Tagline (DE):** *Websites, die verkaufen.* (“Websites that sell.”)
- **Positioning:** Clean, fast, mobile-first websites for KMU (SMBs) with optional **KI-Assistent** (AI chat) add-on.
- **Price anchors:** Sites from **CHF 750**; AI add-on **CHF 200 setup + CHF 40/month**.

## Products represented

1. **Marketing website (`masesites.ch`)** — the agency’s own site. Multi-page: Home, Leistungen, Preise (interactive modular calculator), KI-Assistent, Über uns, Kontakt, Datenschutz, Impressum.
2. **KI-Assistent (chat widget)** — an embeddable chat surface (`ai-assistant.css` / `ai-assistant.js`) demoed inline on the marketing site.
3. **Demo sites** — four full one-pagers shipped at `/demo/{bowling,doener,nagelstudio,praxis}-site/` to show what a finished MASE-built site looks like across verticals (sport, gastro, beauty, medical).

---

## CONTENT FUNDAMENTALS

**Language.** Primary copy is **German (de-CH)** with English and French toggles wired through `data-i18n`. When designing, write in German unless told otherwise; switch register, not just vocabulary.

**Tone.**
- **Direct, confident, lightly punchy.** Short declarative sentences. Headlines feel like promises, not slogans.
- **“Du”, not “Sie”.** The site addresses the visitor informally — *“Deine Website arbeitet für dich.”* / *“Was kostet eine Website?”* / *“Projekt starten.”*
- **Promise → proof → CTA** rhythm. Every block names a benefit (Mehr Anfragen, Mehr Vertrauen), proves it briefly, then asks for action.
- **Technical but not nerdy.** Mentions semantic HTML, mobile-first, SEO-ready as trust signals — but never explains them.
- **Swiss commercial.** Prices in CHF, founders named, no fake-testimonial sprawl. *“Keine Fake-Referenzen”* is literally in the team README.

**Casing.**
- **Title case for headings** in German sentence style: *“Unser Ansatz”*, *“Transparente Preise”*, *“KI-Integration - dein digitaler Mitarbeiter”*.
- **Wordmark is ALL CAPS**: `MASE` (uppercase, letter-spacing 0.1em).
- **Buttons are sentence case**: *“Projekt starten”*, *“Preise ansehen”*, *“Kostenloses Erstgespräch”*.
- **Eyebrows are uppercase** with wide tracking (0.18em).

**Voice cues (lift these patterns).**
- Two-word value propositions as section H2s: *“Sauberer Code”*, *“Mobile-first”*, *“KI-Integration”*.
- Numbered process steps: *“01 Analyse & Strategie · 02 Struktur & UX-Planung …”*.
- Three-bullet trust rows after every CTA: *“Mobile-first · SEO-optimiert · Schnelle Ladezeit”*.
- Pricing always anchored with **“ab CHF …”** (“starting at”).

**Emoji.** Sparing and functional only. The only emoji in production are 🍪 on the cookie banner, ✅/✓ on feature checklists, and 🌙 on the dark-mode toggle. **Do not** decorate headings, buttons or marketing copy with emoji — keep the surface clean.

**Do / don’t examples.**
- ✅ *Websites, die verkaufen.*
- ✅ *Klare Prozesse, kurze Wege, schnelle Live-Schaltung.*
- ✅ *5 klare Schritte vom Erstgespräch bis zur messbaren Wirkung.*
- ❌ *Unleash the power of next-gen AI-driven web experiences!* — too marketing-American, wrong register.
- ❌ *🚀 Boost your conversions today! 🔥* — wrong emoji density.

---

## VISUAL FOUNDATIONS

### Colors — dual accent system

MASE’s palette is intentionally restrained: **white + near-black + one deep teal + one blue tint**. The teal does the heavy lifting on CTAs; blue handles links, badges, accents and dark-mode primary.

| Token | Hex | Used for |
|---|---|---|
| `--mase-teal-600` → `--mase-teal-700` | `#0f766e` → `#0b5f58` | Primary CTA gradient (buttons, pills, hero CTA) |
| `--mase-blue-400` | `#3a9bff` | Favicon mark, CTA shadow tint |
| `--mase-blue-600` / `--mase-blue-700` | `#0066cc` / `#0051ba` | Links, badges, focus rings, accent text, dark-mode primary |
| `--mase-ink-800` | `#0a0e27` | Footer / very dark surfaces |
| `--mase-line` | `#d4d4d4` | Borders, dividers, input outlines |
| `--mase-surface` | `#f6f9ff` | Section banding (soft blue-tinted off-white) |
| `--mase-surface-2` | `#f8fafc` | Chat-body / inner card background |

Dark theme swaps backgrounds to `#0d1117` / surface `#1a1f2e` and shifts primary accent from deep blue to **`#60a5fa`** (`--mase-blue-light-on-dark`). The full token list is in [`colors_and_type.css`](./colors_and_type.css).

### Typography

- **Single font family: Inter** (Google Fonts, weights 400/500/600/700/800). Fallback stack: `"Segoe UI", system-ui, -apple-system, sans-serif`.
- **No serif. No display face. No mono in production copy** — only inside code-proof snippets (system mono).
- **Scale:** fluid for h1/h2, fixed for h3 down. `clamp(2.4rem, 5vw, 3.6rem)` for h1; `clamp(1.9rem, 4vw, 2.6rem)` for h2; `1.2rem` for h3; `1.1rem` for `.lead`; `1rem` body; `0.75rem` for `.eyebrow`.
- **Eyebrow** label above titles: uppercase, letter-spacing `0.18em`, color `--accent-strong`.
- **Wordmark “MASE”** is text in Inter 700, uppercase, letter-spacing `0.1em`, font-size `1.4rem`.
- **Line-height** 1.15 for headings, 1.6 for body, 1.35 for snug supporting text.

### Spacing & layout

- **Container:** `min(100%, 1240px)` with `24px` inline padding.
- **Section vertical rhythm:** `5rem` top/bottom (`80px`) on desktop.
- **Grid gaps:** `1.4–2.5rem` for card grids; `1rem` for inline button rows.
- **Card padding:** `1.5–1.6rem` standard; hero benefit card uses `~24px`.

### Backgrounds

- **Predominantly white** with **soft blue/cool off-white section bands** (`#f6f9ff`, `#f8fafc`, `#f8fbff`). No photography in the marketing chrome. No repeating textures, no hand-drawn illustrations, no busy gradients.
- **Footer is the only dark band** (`#0a0e27`) with white text.
- **Subtle linear gradient** on `.process-step` cards: `linear-gradient(180deg, #fbfdff 0%, #f4f8ff 100%)` with a pale blue border (`#d5e3f8`) — the only place gradients appear on neutral surfaces.
- **Strong gradients only on CTAs:** the teal `135deg` gradient on primary buttons and a matching one on the “preview-toggle.active” chip.

### Corners & radii

- **Pills (`999px`)** for buttons, badges, the cookie banner buttons, chat bubbles’ outer corners.
- **`12px` (`--radius-sm`)** for trust cards, process steps, secondary panels, input fields (`10px` on inputs).
- **`18px` (`--radius`)** for preview cards, chat widgets, large cards.
- **`24px` (`--radius-lg`)** for hero compact preview, big feature cards.

### Borders

- Hairline `1px solid #d4d4d4` is the default. Borders are almost always visible, not invisible — MASE’s cards lean **outlined + lightly shadowed** rather than floating-only.
- Process-step cards add a tinted border (`#d5e3f8`) over the gradient fill.

### Shadows

A three-tier shadow system, low-contrast and warm-neutral (not pure black):

| Token | Value | Where |
|---|---|---|
| `--shadow-sm` | `0 8px 25px rgba(0,0,0,.06)` | Trust / service / process cards (rest) |
| `--shadow-card` | `0 14px 30px rgba(15, 23, 42, 0.05)` | Trust cards, preview cards |
| `--shadow-hover` | `0 12px 28px rgba(15, 23, 42, 0.08)` | Cards on hover (paired with `translateY(-3px)`) |
| `--shadow` | `0 18px 40px rgba(0, 0, 0, 0.12)` | Hero preview, chat widget, header overlay |
| `--shadow-cta` | `0 14px 26px rgba(15, 118, 110, 0.22)` | Teal CTA (tinted teal, not gray) |

No inner shadows. No glow effects.

### Hover & press states

- **Buttons:** `translateY(-1px)` lift + deeper teal/blue shadow. No color shift on primary; ghost/secondary get an accent border on hover. Inline transition: `180ms cubic-bezier(0.22, 1, 0.36, 1)`.
- **Cards:** `translateY(-3px)` lift + shadow swap from `--shadow-sm` → `--shadow-hover`. `220ms ease`.
- **Nav links:** color shift to `--accent-strong` + a 2px underline bar grows from 0 → 100% width (250ms ease) and persists when `.nav-active`.
- **Footer links:** color shift + `padding-left: 4px` (subtle indent).
- **Hero benefit CTA:** `transform: scale(1.03)` instead of translate — the only place scale is used.
- **No opacity-fade hovers.** Hovers always change color/border/shadow/position, never just dim.

### Animation

- **Theme transitions:** when the user toggles dark mode, a fullscreen `<canvas id="dark-wave-canvas">` overlay sweeps a wave animation (`#dark-wave`) — the signature MASE micro-moment. See `script.js` (`darkWave` logic).
- **Reveal on scroll:** elements tagged `data-reveal` fade-in + translateY using IntersectionObserver. Default duration ~600ms, ease-out.
- **Chat demo:** static markup, no typing animation in production.
- **Bouncy easings** mostly avoided; the library uses `cubic-bezier(0.22, 1, 0.36, 1)` (smooth ease-out) on buttons, and plain `ease`/`ease-out` elsewhere. **No bounces, no springs, no parallax.**

### Transparency & blur

- **Sticky header** uses `backdrop-filter: blur(12px)` over `rgba(255,255,255,0.96)` background — the only blur in the system. Fallback to opaque white if unsupported.
- Otherwise the design is opaque. Translucent overlays are reserved for dark-mode header (`linear-gradient(rgba(23,37,61,.95) → rgba(13,17,23,.97))`).

### Cards — anatomy

A typical MASE card has:
1. White background (or `--surface` in dark).
2. `1px` solid `--line` border.
3. `--radius-sm` (12px) or `--radius` (18px) rounding.
4. `--shadow-sm` shadow at rest.
5. `1.5–1.6rem` inner padding.
6. Optional eyebrow / counter at top (`01`, `02`…) in `--accent-strong`.
7. Heading (h3) + 2-line description in `--text-muted`.
8. Hover: lift 3px + swap to `--shadow-hover`.

The **hero benefit card** is a denser variant: stacked sections (badge → title → subtitle → checklist → trust pills → price + CTA footer) inside a single rounded panel.

### Fixed elements

- **Sticky header** (top, blurred, with logo + nav + lang + dark-toggle).
- **Sticky CTA** (bottom-right pill, `📝 Projekt starten`) — appears after scroll.
- **Back-to-top button** (bottom-right, above sticky CTA).
- **Cookie banner** (bottom, full-width on mobile, inline card on desktop).

---

## ICONOGRAPHY

MASE’s icon language is **inline, line-style SVGs hand-rolled in each page** — not an icon font, not a sprite, not a CDN library. They’re consistent in look:

- **Stroke-based** (`stroke="currentColor"`, no fill).
- **Stroke width 1.8–2.5** (most are `2`).
- **24×24 viewBox** standard.
- **`stroke-linejoin: round`** on the favicon shape.
- **Color follows `currentColor`** so they recolor automatically with text.

Examples from the codebase:
- Magnifying glass / search (analysis step), document with lines (UX-planning), pencil-on-canvas (design step), gear/sun (development step), leaf/spark (optimization step).
- A compass/globe icon in the language switcher.
- A simple pencil in the “Projekt starten” sticky CTA.
- Chevrons for back-to-top and sliders.

**Stylistic match: [Lucide](https://lucide.dev/)** is the closest CDN equivalent — same outline geometry, same 24×24 grid, same 2-unit stroke. If you need an icon that isn’t already inline in the source, **substitute the Lucide SVG of the same name** (e.g. `search`, `file-text`, `edit-3`, `settings`, `sparkles`). Flag the substitution to the user if it’s prominent.

**No icon font, no emoji as icons** (except 🍪 / 🌙 noted above). Unicode glyphs are used sparingly (`✓` for checklist marks inside `.hero-benefit-check`).

**Logo / favicon.** A 32×32 rounded-square favicon (`assets/favicon.svg`) — blue `#3a9bff` background, white outlined hexagon-ish shape with a center dot. The wordmark on the site is **plain text “MASE”** — no logotype file in the source. We ship `assets/mase-wordmark.svg` as a clean SVG-text version.

---

## Index — what’s in this design system

```
README.md                  ← you are here
SKILL.md                   ← cross-compatible Agent Skill manifest
colors_and_type.css        ← all tokens (colors, type, radii, shadows, spacing)
assets/
  favicon.svg              ← official MASE favicon (blue rounded square)
  mase-wordmark.svg        ← MASE wordmark (Inter 700, uppercase, black)
  mase-wordmark-dark.svg   ← same, white on dark
preview/                   ← cards that populate the Design System review tab
ui_kits/
  marketing-site/          ← MASE marketing site UI kit (header, hero, cards,
                             pricing, chat widget, footer, etc.)
    README.md
    index.html             ← interactive click-thru of the marketing site
    *.jsx                  ← component files
fonts/                     ← (none — Inter is pulled from Google Fonts CDN)
```

### Source files retained for reference

We imported a handful of original pages directly so an agent can see how the components compose in the wild:

```
index.html         ki-assistent.html      404_styled.html
leistungen.html    kontakt.html           danke.html
preise.html        styles.css             ai-assistant.css
                   script.js              ai-assistant.js
                   manifest.json          favicon.svg
```

> These are reference, **not** the design system. Prefer the tokens in `colors_and_type.css` and the components in `ui_kits/marketing-site/` for new work.

---

## How to use this system

1. **For mocks and prototypes:** copy `colors_and_type.css` and the assets you need into your new HTML file, import Inter from Google Fonts, and lift components from `ui_kits/marketing-site/`.
2. **For production code:** the tokens map 1-to-1 to what’s already in `styles.css`. Use the semantic vars (`--fg`, `--accent`, `--action`) so dark mode keeps working.
3. **Tone-check every piece of copy** against the “CONTENT FUNDAMENTALS” section above before shipping. German `du`, short sentences, no emoji, prices in CHF with `ab`.

---

## Caveats

- The original site has **two competing primary colors** (blue from CSS vars, teal from a late override on `.button-primary`). We documented both. If you need to pick one, the **teal CTA is what users actually see**; blue is the secondary accent / link color. Confirm with the user which to lead with for new surfaces.
- The site does not ship a real logotype — only the wordmark in plain text. The SVG wordmark in `assets/` is our reconstruction.
- No webfonts are bundled — Inter loads from Google Fonts. If you need fully offline output, self-host the woff2 files for weights 400/500/600/700/800.
