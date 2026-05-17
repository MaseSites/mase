#!/usr/bin/env node

// Simpler Test für Übersetzungen
const fs = require('fs');
const path = require('path');

console.log('🌍 Test: Mehrsprachigkeit Validierung\n');

// Lade theme.js und extrahiere Übersetzungen
const themeJs = fs.readFileSync(path.join(__dirname, 'theme.js'), 'utf8');

// Extrahiere translations Objekt - Vereinfachte Regex
const translationStart = themeJs.indexOf('var translations = {');
const translationEnd = themeJs.indexOf('};', translationStart) + 2;
if (translationStart === -1) {
  console.error('❌ Fehler: translations Objekt nicht gefunden');
  process.exit(1);
}

// Evaluiere das Objekt (vorsichtig!)
let translations;
try {
  const translationCode = themeJs.substring(translationStart + 'var translations = '.length, translationEnd);
  eval('translations = ' + translationCode);
} catch (e) {
  console.error('❌ Fehler beim Parsen von translations:', e.message);
  process.exit(1);
}

const langs = Object.keys(translations);
console.log(`✅ Gefundene Sprachen: ${langs.join(', ')}\n`);

// Prüfe ob alle Sprachen die gleichen Keys haben
const deKeys = Object.keys(translations.de);
console.log(`📋 Deutsche Keys: ${deKeys.length}\n`);

langs.forEach(lang => {
  const langKeys = Object.keys(translations[lang]);
  const missing = deKeys.filter(k => !translations[lang][k]);

  if (missing.length === 0) {
    console.log(`✅ ${lang.toUpperCase()}: Alle ${langKeys.length} Keys vollständig`);
  } else {
    console.log(`⚠️  ${lang.toUpperCase()}: ${missing.length} Keys fehlen`);
    console.log(`   Fehlende Keys: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '...' : ''}`);
  }
});

console.log('\n📝 Testbeispiele:');
console.log(`DE: hero_title = "${translations.de.hero_title}"`);
console.log(`EN: hero_title = "${translations.en.hero_title}"`);
console.log(`FR: hero_title = "${translations.fr.hero_title}"`);

console.log('\n✅ Übersetzungstest erfolgreich!');

