# MASESites Official — Projektregeln

## 🎨 shadcn/ui MCP: SEARCH FIRST (PFLICHT bei jeder UI-/Design-Aufgabe)

Der offizielle shadcn/ui MCP ist in `.mcp.json` eingerichtet (Server `shadcn`,
Registries in `components.json`: `@shadcn`, `@magicui`, `@aceternity`, `@kokonutui`).

**Ablauf bei jeder UI-, Design- oder Frontend-Aufgabe:**

```
SEARCH FIRST → COMPARE → SELECT → ADAPT → IMPLEMENT
```

1. **Analysieren:** Welche Komponente wird gebraucht?
2. **Suchen:** `search_items_in_registries` über *alle* Registries — nie nur eine.
3. **Vergleichen:** Mehrere Treffer mit `view_items_in_registries` und
   `get_item_examples_from_registries` anschauen. Niemals blind den ersten Treffer nehmen.
4. **Auswählen:** Die Variante, die optisch und funktional am besten passt.
5. **Anpassen:** An die bestehende Designsprache angleichen (siehe unten).
6. **Selbst bauen** nur, wenn der MCP nichts Passendes liefert.

Gilt u. a. für: Hero-Sections, Navigation, Buttons, Cards, Formulare, Pricing,
Testimonials, Footer, Dialoge, Modals, Dropdowns, Tabellen, Dashboards,
Login/Signup, Contact-Sections, FAQ, Bento-Grids, Animationen, Mobile-Navigation,
komplette Seitenlayouts.

Bei grösseren Aufgaben mehrere Einzelkomponenten suchen und daraus ein
konsistentes Gesamtbild bauen.

### Wichtig: Stack-Übersetzung
Diese Website ist **statisches HTML + eigenes CSS** (`assets/css/style.css`),
**kein React und kein Tailwind**. shadcn-Komponenten werden deshalb nicht per
`npx shadcn add` installiert, sondern als **Struktur- und Design-Referenz**
gelesen (Markup-Aufbau, States, A11y, Motion) und in das bestehende CSS
übersetzt. `components.json` existiert nur, damit der MCP die Registries
durchsuchen kann — die `aliases` zeigen bewusst nach `tmp/shadcn/`.

### Bestehendes Design hat Vorrang
Farben, Schriften (Outfit), Abstände, Radien und Komponenten aus
`assets/css/style.css` gelten. shadcn-Defaults werden daran angepasst,
nicht umgekehrt.

## Technik-Rahmen
- Server ohne npm-Runtime-Abhängigkeiten (`server/server.js`, Node 22.5+).
  `shadcn` ist reine devDependency und darf den Serverbetrieb nicht berühren.
- `api.php` (Plesk/PHP) und `server/` sind Backend — bei Design-Arbeiten nicht anfassen.
- Bildrechte immer in einer `CREDITS.txt` neben den Bildern dokumentieren.
