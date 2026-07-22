/* masesites – Website-Wissen für den KI-Chat.
   Liest alle öffentlichen HTML-Seiten des Projekts, entfernt Markup und
   schreibt den reinen Text nach data/website.txt. Diese Datei ist das
   gesamte «Wissen» des Chat-Assistenten: kein RAG, keine Vektoren –
   der Text wandert bei jeder Frage vollständig in den Prompt.

   Aufruf:  node scripts/wissen.js
   Läuft automatisch beim Start des Docker-Containers. */

"use strict";

const fs = require("fs");
const path = require("path");

const WURZEL = path.join(__dirname, "..");
const ZIEL = path.join(WURZEL, "data", "website.txt");

/* Nur öffentliche Inhaltsseiten – App-Oberflächen (Dashboard, Admin, MCS,
   Login) enthalten kein Kundenwissen und würden den Prompt nur aufblähen. */
const SEITEN = [
  ["index.html", "Startseite"],
  ["leistungen.html", "Leistungen (Website, Überarbeitung, Webapp, KI-Assistent)"],
  ["preise.html", "Preisliste"],
  ["beispiele.html", "Beispiele"],
  ["projekte.html", "Projekte"],
  ["ueber-uns.html", "Über uns"],
  ["kontakt.html", "Kontakt"],
  ["impressum.html", "Impressum"],
  ["datenschutz.html", "Datenschutz"]
];

/* Obergrenze fürs gesamte Wissen: ein 3B-Modell auf CPU wird mit sehr
   langen Prompts spürbar langsam. 28'000 Zeichen ≈ 8–9k Tokens reichen
   für alle Inhalte dieser Website. */
const MAX_ZEICHEN = 28000;

function textAus(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    /* Überschriften und Listenpunkte als eigene Zeilen erhalten */
    .replace(/<\/(h1|h2|h3|h4|p|li|div|section|article|tr)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    /* Whitespace aufräumen: nie mehr als eine Leerzeile */
    .split("\n")
    .map(z => z.replace(/\s+/g, " ").trim())
    .filter((z, i, a) => z !== "" || (a[i - 1] || "") !== "")
    .join("\n")
    .trim();
}

function main() {
  const teile = [];
  for (const [datei, titel] of SEITEN) {
    const voll = path.join(WURZEL, datei);
    if (!fs.existsSync(voll)) continue;
    const roh = fs.readFileSync(voll, "utf8");
    /* Nur der Inhalt zwischen <main>…</main>: Kopfzeile, Menü und Footer
       wiederholen sich auf jeder Seite und wären neunfach im Prompt. */
    const m = roh.match(/<main[\s\S]*?<\/main>/i);
    const text = textAus(m ? m[0] : roh);
    if (text) teile.push("### Seite: " + titel + " (/" + datei.replace(".html", "") + ")\n" + text);
  }

  let wissen = teile.join("\n\n");
  if (wissen.length > MAX_ZEICHEN) {
    wissen = wissen.slice(0, MAX_ZEICHEN) + "\n[… gekürzt]";
  }

  fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
  fs.writeFileSync(ZIEL, wissen, "utf8");
  console.log("Website-Wissen geschrieben: " + ZIEL + " (" + wissen.length + " Zeichen, " + teile.length + " Seiten)");
}

main();
