---
name: mase-design
description: Use this skill to generate well-branded interfaces and assets for MASESites AG (MASE) — a Swiss webdesign + AI-integration studio. Contains brand guidelines, color and type tokens, fonts, logo + favicon, iconography rules, and a marketing-site UI kit for production code or throwaway prototypes/mocks/decks.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map

- `README.md` — full brand context, content fundamentals, visual foundations, iconography
- `colors_and_type.css` — semantic + raw tokens for colors, type, radii, shadows, spacing
- `assets/favicon.svg` — official MASE favicon (blue rounded square mark)
- `assets/mase-wordmark.svg` / `mase-wordmark-dark.svg` — wordmark in Inter 700, light + dark
- `ui_kits/marketing-site/` — React components (header, hero, trust grid, process, chat, pricing, contact, footer) + `index.html` click-thru
- `preview/` — small specimen HTML cards for the Design System review tab
- Imported reference files at the project root (`index.html`, `styles.css`, `preise.html` etc.) — source-of-truth for any pattern not yet componentized

## House rules to enforce

- Copy in **German (de-CH)**, informal **“du”**, short declarative sentences. Prices in **CHF** with the word **“ab”** for ranges.
- Type is **Inter only** (Google Fonts, 400–800). No serifs, no display faces, no emoji decoration.
- **Two accents:** teal gradient `#0f766e → #0b5f58` for primary CTAs; blue `#0051ba` for links / badges / focus / dark-mode primary. Don’t introduce new accents.
- **Pills (`999px`)** for buttons and badges; **12 / 18 / 24px** for cards.
- **Outlined + softly shadowed** cards — not floating, not flat.
- Icons are **inline 24×24 stroke SVGs** (`currentColor`, `stroke-width 1.8–2.5`). Match Lucide if you need to extend.
