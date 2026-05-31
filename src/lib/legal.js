// Rechtstexte als Vorlagen. WICHTIG: Diese Texte sind Platzhalter/Vorlagen und
// müssen vom Betreiber geprüft und mit echten Angaben vervollständigt werden.
// (Keine Rechtsberatung.)

export function legalPages(settings) {
  const shop = settings.shop_name || 'ABJ Store';
  const email = settings.contact_email || 'kontakt@example.com';

  return {
    impressum: {
      title: 'Impressum',
      intro: 'Angaben gemäß § 5 TMG / DSG. Bitte mit den echten Betreiberdaten ausfüllen.',
      sections: [
        { h: 'Anbieter', body: `${shop}\n[Vor- und Nachname / Firma]\n[Straße und Hausnummer]\n[PLZ und Ort]\n[Land]` },
        { h: 'Kontakt', body: `E-Mail: ${email}\nTelefon: [Telefonnummer]` },
        { h: 'Vertretungsberechtigte Person', body: '[Name der vertretungsberechtigten Person]' },
        { h: 'Umsatzsteuer-ID', body: 'USt-IdNr. gemäß § 27a UStG: [falls vorhanden]' },
        { h: 'Verantwortlich für den Inhalt', body: '[Name, Anschrift]' },
        { h: 'Streitschlichtung', body: 'Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: https://ec.europa.eu/consumers/odr. Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.' },
      ],
    },
    datenschutz: {
      title: 'Datenschutzerklärung',
      intro: 'Der Schutz deiner Daten ist uns wichtig. Diese Vorlage bitte prüfen und anpassen.',
      sections: [
        { h: 'Verantwortlicher', body: `${shop}\n[Anschrift]\nE-Mail: ${email}` },
        { h: 'Welche Daten wir verarbeiten', body: 'Beim Besuch werden technisch notwendige Daten verarbeitet (z. B. ein essenzielles Session-Cookie zur Sitzungssicherheit). Bei einer Bestellung verarbeiten wir Name, E-Mail und Lieferadresse zur Vertragsabwicklung. Es findet kein Tracking und keine Weitergabe zu Werbezwecken statt.' },
        { h: 'Cookies', body: 'Wir verwenden ausschließlich technisch notwendige Cookies (Session). Es werden keine Analyse- oder Marketing-Cookies gesetzt.' },
        { h: 'Newsletter', body: 'Wenn du dich anmeldest, speichern wir deine E-Mail-Adresse, um dir Neuigkeiten zu senden. Du kannst dich jederzeit abmelden.' },
        { h: 'Deine Rechte', body: 'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Wende dich dazu an ' + email + '.' },
        { h: 'Speicherdauer', body: 'Wir speichern personenbezogene Daten nur so lange, wie es für die genannten Zwecke oder gesetzliche Aufbewahrungsfristen erforderlich ist.' },
      ],
    },
    agb: {
      title: 'Allgemeine Geschäftsbedingungen',
      intro: 'Vorlage – bitte rechtlich prüfen lassen und an dein Geschäftsmodell anpassen.',
      sections: [
        { h: '1. Geltungsbereich', body: `Diese AGB gelten für alle Bestellungen über den Shop ${shop}.` },
        { h: '2. Vertragsschluss', body: 'Die Darstellung der Produkte stellt kein bindendes Angebot dar. Mit Absenden der Bestellung gibst du ein verbindliches Angebot ab. Der Vertrag kommt mit unserer Bestätigung zustande.' },
        { h: '3. Preise und Versand', body: 'Alle Preise verstehen sich inkl. gesetzlicher MwSt. Versandkosten werden vor Abschluss der Bestellung angezeigt.' },
        { h: '4. Zahlung', body: 'Die akzeptierten Zahlungsarten werden im Bestellprozess angezeigt.' },
        { h: '5. Lieferung', body: 'Die Lieferung erfolgt innerhalb der angegebenen Fristen an die angegebene Lieferadresse.' },
        { h: '6. Widerrufsrecht', body: 'Verbraucher haben ein gesetzliches Widerrufsrecht (siehe Widerrufsbelehrung).' },
        { h: '7. Gewährleistung', body: 'Es gelten die gesetzlichen Gewährleistungsrechte.' },
      ],
    },
    widerruf: {
      title: 'Widerrufsbelehrung',
      intro: 'Vorlage gemäß gesetzlichem Muster – bitte prüfen und anpassen.',
      sections: [
        { h: 'Widerrufsrecht', body: 'Du hast das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem du oder ein von dir benannter Dritter die Waren in Besitz genommen hast/hat.' },
        { h: 'Ausübung des Widerrufs', body: `Um dein Widerrufsrecht auszuüben, musst du uns (${shop}, [Anschrift], ${email}) mittels einer eindeutigen Erklärung über deinen Entschluss informieren.` },
        { h: 'Folgen des Widerrufs', body: 'Wenn du diesen Vertrag widerrufst, erstatten wir dir alle erhaltenen Zahlungen unverzüglich und spätestens binnen vierzehn Tagen zurück.' },
      ],
    },
  };
}
