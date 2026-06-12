# MASE marketing-site UI kit

A click-through React recreation of the MASESites AG marketing site. Components are lifted from production CSS (`styles.css`, `ai-assistant.css`) and re-implemented as small, well-factored JSX modules. Visual parity is the goal — implementations are deliberately simple, not production-ready.

## Run it

Open [`index.html`](./index.html). The kit boots with `Home` and you can click through:

- **Home** → hero, trust grid, 5-step process, AI section (interactive chat), pricing teaser
- **Preise** → modular pricing calculator (Starter / Business / Premium + add-ons, live total)
- **KI Assistent** → AI section in isolation, with the working chat widget
- **Kontakt** → contact form with validation + success state, pre-fills the package picked on Preise
- Other nav items (Leistungen, Über uns) render a placeholder; only the surfaces explicitly listed above are recreated.

The header dark-mode toggle is visual only — the components are themed but the kit does not flip `body` into dark mode (production does this via `document.documentElement.classList.toggle("dark")`).

## Components

| File | Exports | Notes |
|---|---|---|
| `SiteHeader.jsx`     | `SiteHeader`              | Sticky header, blurred. Includes lang switcher + dark toggle + CTA. |
| `Hero.jsx`           | `Hero`, `HeroBenefitCard` | Homepage hero with side-by-side benefit card. |
| `TrustGrid.jsx`      | `TrustGrid`               | “Warum MASE” 4-up cards. |
| `ProcessSteps.jsx`   | `ProcessSteps`            | 5-step gradient cards with inline SVG icons. |
| `ChatWidget.jsx`     | `ChatWidget`              | KI-Assistent demo. Has a working text field + randomized seed replies. |
| `AiSection.jsx`      | `AiSection`               | Split section pairing copy + ChatWidget. |
| `PricingTeaser.jsx`  | `PricingTeaser`           | Centered CTA strip. |
| `PricingSection.jsx` | `PricingSection`          | Modular pricing — radio (base) + checkbox (add-ons) + live total. |
| `ContactSection.jsx` | `ContactSection`          | Page-hero + form with success/error states. |
| `SiteFooter.jsx`     | `SiteFooter`, `StickyCTA` | Dark footer + bottom-right sticky CTA. |
| `styles.css`         | —                         | Local rules; imports `../../colors_and_type.css`. |

All components attach themselves to `window` so the inline-Babel scripts can compose them without a bundler. Style objects are scoped inline or via the local `styles.css` — there is no shared `styles` const at module scope (per the design system rules).

## Lifting components into other projects

1. Copy `colors_and_type.css` from the design system root and `styles.css` from this folder.
2. Copy the component file(s) you need. Each component declares its own helpers — there are no cross-file imports beyond `ChatWidget` → `AiSection`.
3. Keep the React + Babel `<script>` tags from `index.html` (pinned versions with integrity hashes).

## Caveats

- The pricing add-on price points are illustrative — production has a richer modular model on `preise.html`. The structure here matches the visual pattern (panel + sticky summary) but not the exact line items.
- Footer + sticky CTA are positioned for desktop; mobile styles are inherited from the production stylesheet but not stress-tested.
- “Leistungen” and “Über uns” aren’t included as full screens — these pages are highly text-driven and not central to the visual system. Add them on request.
