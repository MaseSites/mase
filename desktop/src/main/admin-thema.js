/* Der eingebettete Adminbereich soll wie die App aussehen, nicht wie eine
   Website in einem Fenster — und er soll Hierarchie haben statt einer
   gleichmässigen Fläche.

   Drei Dinge sind dafür nötig:

   1. Farben. assets/css/style.css arbeitet durchgehend mit CSS-Variablen,
      die überschreiben wir. Achtung: eingefügte Regeln landen in der Kaskade
      VOR denen der Seite — deshalb steht überall !important.

   2. Tiefe. Die Website ist flächig gedacht (Creme auf Creme). Im Programm
      wirkt das monoton, also bekommen Flächen hier gestaffelte Helligkeiten,
      Karten Kante und Schatten, und der Grund eine ruhige Atmosphäre.

   3. Unterscheidbarkeit. Eine einzige Gegenfarbe (Weiss) lässt alles gleich
      aussehen. Jede Kennzahl bekommt deshalb ihren eigenen Ton — Kunden Gold,
      Projekte Grün, Tickets Ton, KI-Chats Violett (die KI-Farbe der Website),
      Mitarbeiter Blaugrün. */

'use strict';

/* Grundriss: Kopfzeile weg, Ränder wie in der App. */
const GRUNDRISS = `
  header.app-top { display: none !important; }
  /* Fusszeile mit Startseite und Impressum: führt aus dem Programm heraus
     und hat hier nichts verloren. Der Schutz in dashboard.js fängt solche
     Verweise ohnehin ab — hier stehen sie gar nicht erst zur Verfügung. */
  footer.app-fuss { display: none !important; }
  .app-main { padding-top: 22px !important; }
  /* Die Seite klebt sonst unter der ausgeblendeten Kopfzeile fest. */
  .dash-side { top: 14px !important; }
  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb {
    background: var(--line-strong); border-radius: 999px;
    border: 3px solid transparent; background-clip: padding-box;
  }
`;

/* Hell: Kartenflächen heller als der Grund, Akzent ist das warme Gold der
   Website (es steckt schon in ihren Verläufen). */
const HELL = `
  :root {
    --bg: #EDE5D7 !important;
    --bg-soft: #F8F3EA !important;
    --bg-warm: #E5DBC8 !important;
    --card: #FFFDF8 !important;
    --ink: #201810 !important;
    --ink-soft: #695949 !important;
    --ink-faint: #998976 !important;
    --line: rgba(72, 52, 30, 0.14) !important;
    --line-strong: rgba(72, 52, 30, 0.26) !important;
    --ms-akzent: #A9762A !important;
    --ms-akzent-weich: rgba(169, 118, 42, 0.13) !important;
    --ms-gold: #A9762A !important;
    --ms-gruen: #3E6B4F !important;
    --ms-ton: #A6482B !important;
    --ms-violett: #7C3AED !important;
    --ms-blaugruen: #2F6E73 !important;
    --ms-glanz: rgba(255, 255, 255, 0.9) !important;
    --ms-schatten: 0 1px 2px rgba(72, 52, 30, 0.05), 0 8px 24px rgba(72, 52, 30, 0.08) !important;
    --ms-schatten-hoch: 0 2px 4px rgba(72, 52, 30, 0.06), 0 20px 44px rgba(72, 52, 30, 0.14) !important;
  }
  html { background: var(--bg) !important; }
  body::before {
    background:
      radial-gradient(60% 45% at 12% 0%, rgba(214, 178, 118, 0.42), transparent 70%),
      radial-gradient(50% 40% at 92% 8%, rgba(124, 58, 237, 0.09), transparent 72%),
      radial-gradient(55% 45% at 70% 100%, rgba(62, 107, 79, 0.10), transparent 70%) !important;
  }
`;

/* Dunkel: gibt es auf der Website nicht, deshalb der ganze Satz. */
const DUNKEL = `
  :root {
    --bg: #0F0C08 !important;
    --bg-soft: #1A150F !important;
    --bg-warm: #241D15 !important;
    --card: #1A150F !important;
    --ink: #F4ECDF !important;
    --ink-soft: #AE9F8C !important;
    --ink-faint: #7C7061 !important;
    --line: rgba(255, 236, 209, 0.10) !important;
    --line-strong: rgba(255, 236, 209, 0.18) !important;
    --accent: #F6EFE3 !important;
    --accent-dark: #FFFFFF !important;
    --accent-soft: #2A231B !important;
    --green: #7FBF95 !important;
    --ki: #A277F7 !important;
    --ki-dark: #8B5CF6 !important;
    --ki-soft: rgba(162, 119, 247, 0.16) !important;
    --ms-akzent: #E0A94A !important;
    --ms-akzent-weich: rgba(224, 169, 74, 0.15) !important;
    --ms-gold: #E0A94A !important;
    --ms-gruen: #7FBF95 !important;
    --ms-ton: #E08159 !important;
    --ms-violett: #A277F7 !important;
    --ms-blaugruen: #6FB3B8 !important;
    --ms-glanz: rgba(255, 236, 209, 0.10) !important;
    --ms-schatten: 0 1px 2px rgba(0, 0, 0, 0.5), 0 10px 26px rgba(0, 0, 0, 0.45) !important;
    --ms-schatten-hoch: 0 2px 6px rgba(0, 0, 0, 0.55), 0 24px 52px rgba(0, 0, 0, 0.6) !important;
    --shadow-s: var(--ms-schatten) !important;
    --shadow-m: var(--ms-schatten) !important;
    --shadow-l: var(--ms-schatten-hoch) !important;
    --shadow-hover: var(--ms-schatten-hoch) !important;
  }
  html { background: var(--bg) !important; }
  body { color: var(--ink) !important; }
  body::before {
    background:
      radial-gradient(58% 44% at 10% 0%, rgba(224, 169, 74, 0.13), transparent 70%),
      radial-gradient(52% 40% at 94% 6%, rgba(162, 119, 247, 0.10), transparent 72%),
      radial-gradient(55% 45% at 72% 100%, rgba(127, 191, 149, 0.07), transparent 70%) !important;
  }

  /* Weiss auf Tinte kippt im Dunkeln — Schrift muss dunkel werden. */
  .btn-primary,
  .chat-avatar,
  .chat-mini-avatar,
  .chat-zeile.von-ich .chat-bubble,
  .dash-step.done .dot,
  .pill.fertig,
  .preis-tab.active { color: #17120D !important; }
  .btn-primary:hover { background: var(--ink) !important; color: #17120D !important; }

  /* Fest verdrahtete weisse Flächen auf die Kartenfarbe holen. */
  .chat-zeile.von-masesites .chat-bubble,
  .ticket-block,
  .dash-step .dot,
  .preview-box,
  .btn-light,
  .btn-google { background: var(--bg-warm) !important; color: var(--ink) !important; }

  input, select, textarea {
    background: #14100B !important;
    color: var(--ink) !important;
    border-color: var(--line-strong) !important;
  }
  input::placeholder, textarea::placeholder { color: var(--ink-faint) !important; }
  option { background: var(--bg-soft); color: var(--ink); }
  .preview-box, .demo-vollbild iframe, .pd-medien iframe { border-color: var(--line-strong) !important; }
`;

/* Struktur, Tiefe und Farbe — gilt in beiden Erscheinungen und arbeitet nur
   mit den oben gesetzten Variablen. */
const AUFBAU = `
  /* --- Ruhige Atmosphäre statt einer flachen Fläche --- */
  body { background: transparent !important; position: relative !important; }
  body::before {
    content: "" !important;
    position: fixed !important;
    inset: 0 !important;
    z-index: -1 !important;
    pointer-events: none !important;
  }

  /* --- Karten: Kante, Schatten und ein feiner Lichtsaum oben --- */
  .dash-card, .dash-side {
    position: relative !important;
    background: var(--card) !important;
    border: 1px solid var(--line) !important;
    border-radius: 20px !important;
    box-shadow: var(--ms-schatten) !important;
    overflow: hidden !important;
    transition: box-shadow 260ms ease, border-color 260ms ease !important;
  }
  .dash-card::after, .dash-side::after {
    content: "" !important;
    position: absolute !important;
    inset: 0 0 auto 0 !important;
    height: 1px !important;
    background: linear-gradient(90deg, transparent, var(--ms-glanz), transparent) !important;
    pointer-events: none !important;
  }
  .dash-card:hover { box-shadow: var(--ms-schatten-hoch) !important; }

  .card-head {
    padding-bottom: 12px !important;
    border-bottom: 1px solid var(--line) !important;
    margin-bottom: 16px !important;
  }
  .dash-card h3 { font-size: 1.02rem !important; font-weight: 700 !important; letter-spacing: -0.01em !important; }
  .card-link, .card-head a {
    font-size: 0.82rem !important;
    font-weight: 650 !important;
    color: var(--ms-akzent) !important;
    text-decoration: none !important;
    border-bottom: 1px solid transparent !important;
    transition: border-color 200ms ease !important;
  }
  .card-link:hover, .card-head a:hover { border-bottom-color: var(--ms-akzent) !important; }

  /* --- Kennzahlen: eigene Karten, jede mit eigenem Ton --- */
  .dash-card.kennzahlen {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
    overflow: visible !important;
    padding: 0 !important;
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(148px, 1fr)) !important;
    gap: 12px !important;
  }
  .dash-card.kennzahlen::after { display: none !important; }
  .kennzahl {
    --ton: var(--ms-gold);
    position: relative !important;
    border: 1px solid var(--line) !important;
    border-radius: 16px !important;
    background:
      radial-gradient(120% 90% at 0% 0%, color-mix(in srgb, var(--ton) 13%, transparent), transparent 62%),
      var(--card) !important;
    box-shadow: var(--ms-schatten) !important;
    padding: 16px 18px 14px !important;
    overflow: hidden !important;
    transition: transform 280ms cubic-bezier(0.16,1,0.3,1), box-shadow 260ms ease !important;
  }
  .kennzahl::before {
    content: "" !important;
    position: absolute !important;
    left: 0; top: 0; bottom: 0;
    width: 3px !important;
    background: var(--ton) !important;
    opacity: 0.75 !important;
    transition: opacity 260ms ease, width 260ms ease !important;
  }
  .kennzahl:hover { transform: translateY(-3px) !important; box-shadow: var(--ms-schatten-hoch) !important; }
  .kennzahl:hover::before { opacity: 1 !important; width: 4px !important; }
  .kennzahl b {
    font-size: 2.1rem !important;
    line-height: 1.02 !important;
    letter-spacing: -0.035em !important;
    color: var(--ink) !important;
  }
  .kennzahl small {
    font-size: 0.68rem !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    color: var(--ink-faint) !important;
    margin-top: 5px !important;
  }
  .kennzahl:hover small { color: var(--ton) !important; }
  .kennzahl[data-route="kunden"]     { --ton: var(--ms-gold); }
  .kennzahl[data-route="projekte"]   { --ton: var(--ms-gruen); }
  .kennzahl[data-route="tickets"]    { --ton: var(--ms-ton); }
  .kennzahl[data-route="nachrichten"],
  .kennzahl[data-route="ki"]         { --ton: var(--ms-violett); }
  .kennzahl[data-route="mitarbeiter"]{ --ton: var(--ms-blaugruen); }

  /* --- Profil: der Avatar war Weiss auf Tinte und damit unsichtbar --- */
  .side-profil { padding-bottom: 14px !important; }
  .side-avatar {
    background: linear-gradient(140deg, var(--ms-akzent), color-mix(in srgb, var(--ms-akzent) 62%, var(--ms-ton))) !important;
    color: #17120D !important;
    box-shadow: 0 4px 14px color-mix(in srgb, var(--ms-akzent) 34%, transparent) !important;
    border: 1px solid color-mix(in srgb, var(--ms-akzent) 55%, transparent) !important;
    font-weight: 750 !important;
  }
  .side-wer b { letter-spacing: -0.01em !important; }

  /* --- Seitenleiste: Aktives am Akzent erkennbar, nicht als weisser Klotz --- */
  .side-item { border-radius: 10px !important; position: relative !important; }
  .side-item:hover { background: var(--bg-warm) !important; }
  .side-item:hover svg { color: var(--ms-akzent) !important; }
  .side-item.active {
    background: var(--ms-akzent-weich) !important;
    color: var(--ink) !important;
    font-weight: 650 !important;
  }
  .side-item.active::before {
    content: "" !important;
    position: absolute !important;
    left: 0; top: 8px; bottom: 8px;
    width: 3px !important;
    border-radius: 999px !important;
    background: var(--ms-akzent) !important;
  }
  .side-item.active svg { color: var(--ms-akzent) !important; }
  .side-item.active .side-badge { background: var(--ms-akzent) !important; color: #17120D !important; }
  .side-badge { background: var(--bg-warm) !important; color: var(--ink-soft) !important; }
  .side-label {
    font-size: 0.62rem !important;
    letter-spacing: 0.14em !important;
    color: var(--ink-faint) !important;
    padding-top: 14px !important;
  }

  /* --- Aktivität: Punkte als Ringe, der jüngste Eintrag betont --- */
  .akt-punkt {
    background: none !important;
    border: 2px solid var(--line-strong) !important;
    width: 10px !important; height: 10px !important;
  }
  .akt-item:first-child .akt-punkt {
    border-color: var(--ms-akzent) !important;
    background: var(--ms-akzent) !important;
    box-shadow: 0 0 0 4px var(--ms-akzent-weich) !important;
  }

  /* --- Listen und Tabellen: Zeilen sollen anfassbar wirken --- */
  .zeile { border-radius: 10px !important; padding-left: 12px !important; padding-right: 12px !important; }
  .zeile:hover { background: var(--bg-warm) !important; }
  .dash-tabelle th {
    font-size: 0.7rem !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    color: var(--ink-faint) !important;
  }
  .dash-tabelle tbody tr.klickbar:hover td { background: var(--bg-warm) !important; }

  /* --- Fortschritt bekommt den Akzentverlauf --- */
  .fortschritt-bar { background: var(--bg-warm) !important; }
  .fortschritt-bar span {
    background: linear-gradient(90deg, var(--ms-akzent), color-mix(in srgb, var(--ms-akzent) 55%, var(--ms-violett))) !important;
  }

  /* --- Überschrift der Seite bekommt Gewicht --- */
  .panel-kopf h1 { font-size: 1.8rem !important; font-weight: 750 !important; letter-spacing: -0.032em !important; }
  .panel-kopf p { color: var(--ink-soft) !important; }

  .dash-hinweis, .inbox-leer { color: var(--ink-faint) !important; font-size: 0.9rem !important; }
`;

function css(dunkel) {
  return GRUNDRISS + (dunkel ? DUNKEL : HELL) + AUFBAU;
}

module.exports = { css };
