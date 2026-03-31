// ============================================
// MASE THEME ENGINE – Dark Mode + Language
// ============================================
(function () {
  'use strict';

  // ==========================================
  // TRANSLATIONS
  // ==========================================
  var translations = {
    de: {
      nav_toggle:      'Navigation öffnen',
      lang_select_aria: 'Sprache wählen',
      theme_toggle_aria: 'Dark Mode umschalten',
      skip_to_content: 'Zum Inhalt springen',
      nav_home:        'Home',
      nav_services:    'Leistungen',
      nav_prices:      'Preise',
      nav_ai:          'KI Assistent',
      nav_about:       'Über uns',
      nav_contact:     'Kontakt',
      nav_cta:         'Kostenloses Erstgespräch',
      hero_eyebrow:    'Matteo & Severin. MASESites AG.',
      hero_title:      'Websites, die verkaufen.',
      hero_lead:       'Professionelle Weblösungen und KI-Integration für moderne Unternehmen.',
      hero_cta_primary:   'Projekt starten',
      hero_cta_secondary: 'Preise ansehen',
      badge_mobile:    'Mobile-first',
      badge_seo:       'SEO-optimiert',
      badge_ai:        'KI-Integration',
      cookie_title:    'Cookie-Hinweis',
      cookie_desc:     'Wir verwenden Cookies für eine optimale Nutzererfahrung.',
      cookie_link:     'Mehr erfahren',
      cookie_settings: 'Einstellungen',
      cookie_accept:   'Akzeptieren',
      // Footer
      footer_nav:      'Navigation',
      footer_contact:  'Kontakt',
      footer_legal:    'Rechtliches',
      footer_copy:     'Alle Rechte vorbehalten.',
      // Contact page
      form_name:       'Name *',
      form_email:      'E-Mail *',
      form_company:    'Firma (optional)',
      form_project:    'Projektart',
      form_message:    'Nachricht *',
      form_submit:     'Anfrage senden',
      form_privacy:    'Ich habe die Datenschutzerklärung gelesen und akzeptiere sie.',
      // Preise
      pricing_headline:   'Hole das Maximum aus deiner Website',
      pricing_subline:    'Wähle dein Paket. Kombiniere flexibel.',
      // Leistungen / Über uns (generic)
      cta_talk:        'Kostenloses Erstgespräch starten',
      // Footer
      footer_desc:     'Professionelle Websites & KI-Integration aus der Schweiz.',
      footer_contact_form: 'Kontaktformular',
      footer_impressum: 'Impressum',
      footer_privacy:  'Datenschutz',
      // Leistungen (Services)
      services_title:  'Unsere Leistungen',
      services_lead:   'Von Design über Entwicklung bis zur KI-Integration – alles aus einer Hand.',
      services_webdesign_h: 'Webdesign',
      services_webdesign_p: 'UX/UI mit Fokus auf Conversion und Nutzerfreundlichkeit.',
      services_webdesign_list_html: '<li><strong>Modernes Design:</strong> Clean, professionell und zeitgemäß</li><li><strong>Struktur & Klarheit:</strong> Intuitive Navigation und klare Hierarchie</li><li><strong>Conversion-Optimierung:</strong> Jedes Element zielt auf Handlung ab</li><li><strong>Responsiv:</strong> Perfekt auf allen Geräten</li><li><strong>Brand-Konsistenz:</strong> Deine Marke, professionell präsentiert</li>',
      services_webdesign_cta: 'Design anfragen',
      services_webdesign_preview_label: 'Design Preview',
      services_webdev_h: 'Webentwicklung',
      services_webdev_p: 'Sauberer Code, der Performance und Skalierbarkeit garantiert.',
      services_webdev_list_html: '<li><strong>Sauberer Code:</strong> Modern, wartbar und zukunftssicher</li><li><strong>Performance-Optimiert:</strong> Schnelle Ladezeiten garantiert</li><li><strong>Skalierbar:</strong> Wächst mit deinem Business</li><li><strong>SEO-Ready:</strong> Technisch optimiert für Suchmaschinen</li><li><strong>Sicherheit:</strong> Moderne Standards und Best Practices</li>',
      services_webdev_cta: 'Entwicklung anfragen',
      services_seo_h:  'SEO & Performance',
      services_seo_p:  'Technische Optimierung für maximale Sichtbarkeit und Speed.',
      services_seo_list_html: '<li><strong>Technische Optimierung:</strong> Core Web Vitals erfüllt</li><li><strong>Strukturierte Inhalte:</strong> Schema.org und Meta-Tags</li><li><strong>Schnelle Ladezeiten:</strong> Unter 3 Sekunden garantiert</li><li><strong>Mobile-First:</strong> Google-konform optimiert</li><li><strong>Analytics-Integration:</strong> Messbare Erfolge</li>',
      services_seo_cta: 'SEO anfragen',
      services_metric_loadtime: 'Ladezeit',
      services_ki_h:   'KI-Assistent Integration',
      services_ki_p:   'Intelligente Automatisierung für 24/7 Kundenservice.',
      services_ai_list_html: '<li><strong>24/7 Kundenberatung:</strong> Automatische Antworten rund um die Uhr</li><li><strong>Lead-Qualifizierung:</strong> Vorqualifizierung von Anfragen</li><li><strong>Automatische Antworten:</strong> FAQ und Produkterklärungen</li><li><strong>Individuell trainierbar:</strong> Mit deinen Inhalten gefüttert</li><li><strong>Einfache Integration:</strong> Nahtlos in deine Website</li>',
      services_ai_cta: 'Mehr über KI-Assistent',
      services_ai_chat_bot: 'Wie kann ich helfen?',
      services_ai_chat_user: 'Was sind die Preise?',
      services_ai_chat_reply: 'Ab CHF 750. Soll ich Details zeigen?',
      services_ai_chat_placeholder: 'Nachricht...',
      services_cta_title: 'Bereit für dein Projekt?',
      services_cta_lead: 'Lass uns gemeinsam deine perfekte Website-Lösung finden.',
      services_cta_primary: 'Projekt starten',
      services_cta_secondary: 'Preise ansehen',
      // Trust Section (Index)
      trust_title:     'Warum MASE',
      trust_speed:     'Schnell',
      trust_speed_desc: 'Klare Prozesse, kurze Wege, schnelle Live-Schaltung.',
      trust_code:      'Sauberer Code',
      trust_code_desc: 'Minimal, wartbar und für Performance optimiert.',
      trust_mobile:    'Mobile-first',
      trust_mobile_desc: 'UX die auf jedem Screen sitzt. Keine Kompromisse.',
      trust_ki:        'KI-Integration',
      trust_ki_desc:   'Assistenz, die Leads qualifiziert und Fragen klärt.',
      // Process (Unser Ansatz - Index)
      process_title:   'Unser Ansatz',
      process_lead:    '5 Schritte zum professionellen Ergebnis.',
      process_1_title: 'Analyse & Strategie',
      process_1_desc:  'Wir analysieren dein Business, deine Zielgruppe und den Wettbewerb. Klare Ziele, klarer Plan.',
      process_2_title: 'Struktur & UX-Planung',
      process_2_desc:  'Seitenstruktur, Navigation und User Experience werden vor dem ersten Pixel geplant.',
      process_3_title: 'Modernes Design',
      process_3_desc:  'Clean, professionell, verkaufsstark. Design das Vertrauen weckt und zum Handeln motiviert.',
      process_4_title: 'Saubere Entwicklung',
      process_4_desc:  'Schneller, wartbarer Code. Mobile-first, SEO-ready und zukunftssicher gebaut.',
      process_5_title: 'Optimierung & Skalierung',
      process_5_desc:  'Nach dem Launch analysieren, optimieren und skalieren wir deinen digitalen Auftritt.',
      // Live Preview
      livepreview_title: 'Live-Vorschau – Beispielprojekte',
      livepreview_lead: 'So könnten Websites unserer Kunden aussehen.',
      live_preview_title: 'Live-Vorschau – Beispielprojekte',
      live_preview_subtitle: 'So könnten Websites unserer Kunden aussehen.',
      // AI Teaser
      ai_title:        'KI-Integration – Dein digitaler Mitarbeiter',
      ai_desc:         'Unser KI-Assistent arbeitet 24/7 für dich: beantwortet Kundenfragen, sammelt Leads, qualifiziert Anfragen und erklärt deine Produkte oder Services.',
      ai_feature_1:    'Automatische Kundenberatung',
      ai_feature_2:    'Lead-Qualifizierung in Echtzeit',
      ai_feature_3:    'Individuell mit deinen Inhalten trainierbar',
      ai_link:         'KI-Assistent entdecken',
      // AI Assistant Page
      ai_page_hero_title: 'Dein digitaler Mitarbeiter - 24/7',
      ai_page_hero_lead: 'Automatische Kundenberatung, Lead-Qualifizierung und FAQ-Support - rund um die Uhr verfuegbar.',
      ai_page_capabilities_title: 'Was der KI-Assistent kann',
      ai_page_capabilities_list_html: '<li><strong>24/7 Kundenberatung</strong> - rund um die Uhr verfuegbar</li><li><strong>Lead-Qualifizierung</strong> - Interessenten vorsortieren</li><li><strong>Automatische Antworten</strong> - auf FAQ und Standardfragen</li><li><strong>Terminbuchung vorbereiten</strong> - weniger Hin und Her</li><li><strong>Mehrsprachig einsetzbar</strong> - fuer internationale Zielgruppen</li>',
      ai_page_trainable_html: '<strong>Individuell trainierbar:</strong> Wir fuettern den Assistenten mit deinen Inhalten - PDFs, FAQs, Produktbeschreibungen, Website-Texten.',
      ai_page_demo_header: 'MASESites KI-Assistent',
      ai_page_demo_bot_1: 'Hallo! Wie kann ich dir helfen?',
      ai_page_demo_user_1: 'Was kostet eine Website?',
      ai_page_demo_bot_2: 'Ab CHF 750 fuer eine Landingpage. Business-Websites ab CHF 1\'300. Soll ich dir mehr erklaeren?',
      ai_page_demo_user_2: 'Ja, was ist im Preis enthalten?',
      ai_page_demo_bot_3: 'Design, Entwicklung, Performance-Optimierung, SEO-Basis und Kontaktformular. Finale Offerte nach kurzem Call.',
      ai_page_demo_input: 'Nachricht schreiben...',
      ai_page_demo_send: 'Senden',
      ai_page_demo_note_html: '<strong>Hinweis:</strong> Dies ist eine Demo. Teste den echten KI-Assistenten unten rechts!',
      ai_page_audience_title: 'Fuer wen ist der KI-Assistent geeignet?',
      ai_page_audience_kmu_title: 'KMU & Dienstleister',
      ai_page_audience_kmu_desc: 'Beantworte Anfragen automatisch, auch ausserhalb der Geschaeftszeiten. Mehr Leads, weniger Aufwand.',
      ai_page_audience_shop_title: 'Online Shops',
      ai_page_audience_shop_desc: 'Produktberatung, Groessentabellen, Versandinfos - der Assistent erklaert alles und steigert die Conversion.',
      ai_page_audience_coach_title: 'Coaches & Berater',
      ai_page_audience_coach_desc: 'Qualifiziere Interessenten vor dem ersten Call. Spare Zeit und fokussiere dich auf qualifizierte Leads.',
      ai_page_audience_startup_title: 'Startups',
      ai_page_audience_startup_desc: 'Professioneller Support ohne grosses Team. Skalierbar und kosteneffizient.',
      ai_page_benefits_title: 'Warum ein KI-Assistent?',
      ai_page_benefits_subtitle: 'Mehr Leads, weniger Aufwand',
      ai_page_benefits_list_html: '<li><strong>Nie wieder verpasste Anfragen</strong></li><li><strong>Sofortige Antworten statt Wartezeiten</strong></li><li><strong>Hoehere Conversion durch direkte Beratung</strong></li><li><strong>Entlastung fuer dein Team</strong></li>',
      ai_page_metric_response: 'Antwortzeit',
      ai_page_metric_uptime: 'Verfuegbarkeit',
      ai_page_metric_lead: 'Lead-Rate',
      ai_page_pricing_title: 'Preise & Integration',
      ai_page_pricing_widget_title: 'KI-Assistent',
      ai_page_pricing_chat_bot: 'Hallo! 👋',
      ai_page_pricing_chat_user: 'Wie kann ich helfen?',
      ai_page_pricing_chat_reply: 'Gerne! Was moechtest du wissen?',
      ai_page_pricing_card_title: 'KI-Assistent Integration',
      ai_page_pricing_card_desc: 'Komplett Setup, Training mit deinen Inhalten und Integration in deine Website.',
      ai_page_pricing_note: 'Als Add-on zu jeder Website oder als separate Integration in bestehende Seiten.',
      ai_page_pricing_cta: 'KI-Assistent anfragen',
      ai_page_faq_title: 'Haeufige Fragen',
      ai_page_faq_q1: 'Wie wird der KI-Assistent trainiert?',
      ai_page_faq_a1: 'Wir fuettern ihn mit deinen Inhalten: FAQs, Produktbeschreibungen, PDFs, Website-Texten. Er lernt dein Business kennen.',
      ai_page_faq_q2: 'Kann er auch komplexe Fragen beantworten?',
      ai_page_faq_a2: 'Ja! Er kann auf Basis deiner Inhalte detaillierte Antworten geben. Bei sehr spezifischen Fragen leitet er an dein Team weiter.',
      ai_page_faq_q3: 'Funktioniert er in mehreren Sprachen?',
      ai_page_faq_a3: 'Ja, Deutsch, Englisch, Franzoesisch und weitere Sprachen sind moeglich.',
      ai_page_faq_q4: 'Kann ich spaeter Inhalte aktualisieren?',
      ai_page_faq_a4: 'Ja! Du kannst uns jederzeit neue Inhalte schicken, und wir trainieren den Assistenten nach.',
      ai_page_faq_q5: 'Was passiert mit den Daten?',
      ai_page_faq_a5: 'Alle Daten werden DSGVO-konform verarbeitet. Keine Weitergabe an Dritte.',
      ai_page_live_title: 'Teste den KI-Assistenten jetzt live!',
      ai_page_live_lead: 'Klicke unten rechts auf den Chat-Button und stelle dem KI-Assistenten deine Fragen.',
      ai_page_live_desc: 'Du siehst sofort, wie er funktioniert und wie er dein Business unterstuetzen kann.',
      // About Page
      about_page_hero_title: 'Wer steckt hinter MASESites?',
      about_page_hero_lead: 'Zwei Koepfe, ein Ziel: Moderne Websites, die wirklich funktionieren.',
      about_page_story_title: 'Unsere Geschichte',
      about_page_story_p1_html: 'MASESites AG wurde von <strong>Matteo</strong> und <strong>Severin</strong> gegruendet. Unser Ziel ist klar: Moderne, klare und leistungsstarke Websites bauen, die echte Resultate liefern.',
      about_page_story_p2: 'Wir glauben an ehrliche Arbeit, sauberen Code und transparente Kommunikation. Keine falschen Versprechen, keine Fake-Referenzen - nur solide Handarbeit mit Fokus auf Qualitaet.',
      about_page_story_p3: 'Mit unserem Hintergrund in Webentwicklung und Design verbinden wir technisches Know-how mit einem Gespuer fuer gutes Design. Das Ergebnis: Websites, die nicht nur gut aussehen, sondern auch verkaufen.',
      about_page_values_title: 'Unsere Werte',
      about_page_value_honesty_title: 'Ehrlichkeit',
      about_page_value_honesty_desc: 'Keine Fake-Cases, keine erfundenen Zahlen. Nur ehrliche, transparente Arbeit.',
      about_page_value_quality_title: 'Saubere Arbeit',
      about_page_value_quality_desc: 'Qualitaet vor Schnelligkeit. Jede Zeile Code wird mit Sorgfalt geschrieben.',
      about_page_value_comms_title: 'Klare Kommunikation',
      about_page_value_comms_desc: 'Du weisst immer, wo dein Projekt steht. Keine Ueberraschungen.',
      about_page_value_results_title: 'Fokus auf Resultate',
      about_page_value_results_desc: 'Deine Website muss verkaufen. Conversion steht im Mittelpunkt.',
      about_page_cta_title: 'Lass uns dein Projekt besprechen',
      about_page_cta_lead: 'Wir freuen uns, von deinem Projekt zu hoeren.',
      about_page_cta_button: 'Kontakt aufnehmen',
      // Pricing Teaser
      pricing_teaser:  'Transparente Preise',
      pricing_teaser_lead: 'Von der Überarbeitung bis zur kompletten Website – modulare Pakete ab CHF 250.',
      pricing_teaser_link: 'Alle Preise ansehen',
      // Pricing Page
      pricing_headline: 'Hole das Maximum aus deiner Website',
      pricing_subline: 'Wähle dein Paket. Kombiniere flexibel.',
      pricing_domain_heading: 'Domain & Hosting Bundle',
      pricing_starter: 'Starter',
      pricing_plus: 'Plus',
      pricing_pro: 'Pro',
      pricing_business: 'Business',
      pricing_premium: 'Premium',
      pricing_revision_title: 'Website Überarbeitung',
      pricing_revision_desc: 'Bestehende Website verbessern',
      pricing_revision_starter_list_html: '<li>Kleine Design-Anpassungen</li><li>Textkorrekturen</li><li>Kleine Performance-Optimierung</li>',
      pricing_revision_plus_list_html: '<li>Design-Verbesserung</li><li>Mobile-Optimierung</li><li>SEO-Basis Check</li>',
      pricing_revision_pro_list_html: '<li>Komplettes Redesign einzelner Seiten</li><li>Struktur-Optimierung</li><li>Performance + SEO Optimierung</li><li>Conversion-Verbesserung</li>',
      pricing_newsite_title: 'Neue Website erstellen',
      pricing_newsite_desc: 'Komplett neu aufbauen',
      pricing_new_starter_list_html: '<li>1 Landingpage</li><li>Kontaktformular</li><li>Basis SEO</li>',
      pricing_new_business_list_html: '<li>Mehrere Seiten</li><li>SEO-Optimierung</li><li>Struktur + UX Fokus</li>',
      pricing_new_premium_list_html: '<li>Individuelles Design</li><li>Performance-Optimierung</li><li>Erweiterte SEO</li><li>Conversion-Fokus</li><li>Sauberer Code</li>',
      pricing_ai_chat_bot: 'Hallo! Wie kann ich helfen?',
      pricing_ai_chat_user: 'Was kostet eine Website?',
      pricing_ai_chat_reply: 'Ab CHF 750. Soll ich mehr erklären?',
      pricing_ai_title: 'KI-Assistent',
      pricing_ai_desc: '24/7 Antworten. Lead-Qualifizierung. Automatische Kundenberatung.',
      pricing_ai_monthly: '+ CHF 40 / Monat',
      pricing_ai_add: 'KI-Assistent hinzufügen',
      pricing_domain_desc: 'Wir kümmern uns um alles – du musst nichts selbst aufsetzen',
      pricing_domain: 'Domain',
      pricing_hosting: 'Hosting',
      pricing_bundle: 'Bundle',
      pricing_domain_list_html: '<li>Wunschdomain registrieren</li><li>.ch / .com / .net</li><li>DNS-Konfiguration</li>',
      pricing_hosting_list_html: '<li>Schneller Schweizer Server</li><li>SSL-Zertifikat (HTTPS)</li><li>Tägliche Backups</li><li>99.9% Uptime Garantie</li>',
      pricing_bundle_list_html: '<li>Domain + 12 Mt. Hosting</li><li>2 Monate gratis</li><li>SSL + Backups inklusive</li><li>Einrichtung inklusive</li>',
      pricing_summary_hint: 'Wähle ein Paket um den Preis zu sehen',
      pricing_total_label: 'Gesamtpreis',
      pricing_cta_start: 'Projekt starten',
      pricing_note: 'Finale Offerte nach kurzem Call.',
      pricing_faq_title: 'Häufige Fragen zu Preisen',
      pricing_faq_q1: 'Was ist im Preis enthalten?',
      pricing_faq_a1: 'Design, Entwicklung, Performance-Optimierung, SEO-Basis, Kontaktformular, DSGVO-Setup und 2-3 Feedback-Runden.',
      pricing_faq_q2: 'Gibt es versteckte Kosten?',
      pricing_faq_a2: 'Nein. Die Preise sind transparent. Hosting und Domain musst du separat organisieren (ca. CHF 10-30/Monat).',
      pricing_faq_q3: 'Wie läuft die Zahlung ab?',
      pricing_faq_a3: '50% Anzahlung bei Projektstart, 50% bei Fertigstellung. Rechnung per E-Mail.',
      pricing_faq_q4: 'Kann ich später upgraden?',
      pricing_faq_a4: 'Ja! Du kannst jederzeit Funktionen wie KI-Assistent, zusätzliche Seiten oder Features hinzufügen.',
      pricing_final_cta_title: 'Bereit für dein Projekt?',
      pricing_final_cta_lead: 'Lass uns gemeinsam die beste Lösung für dein Business finden.',
      // Contact Page
      contact_title:   'Dein Projekt startet hier',
      contact_lead:    'Lass uns gemeinsam deine perfekte Website-Lösung finden.',
      contact_submit:  'Anfrage senden',
      contact_error:   'Fehler beim Senden. Bitte versuche es später erneut.',
      contact_success: 'Anfrage gesendet! Wir melden uns innerhalb von 24 Stunden.',
      contact_page_intro_title: 'Erzaehl uns von deinem Projekt',
      contact_page_intro_text: 'Egal ob neue Website, Ueberarbeitung oder KI-Integration - wir finden die passende Loesung fuer dein Business.',
      contact_page_direct_title: 'Direkter Kontakt',
      contact_page_email_html: '<strong>E-Mail:</strong> <a href="mailto:info@masesites.ch">info@masesites.ch</a>',
      contact_page_phone: 'Telefon: Auf Anfrage mit Termin',
      contact_page_faq_title: 'Haeufige Fragen',
      contact_page_faq_q1: 'Wie schnell koennen wir loslegen?',
      contact_page_faq_a1: 'Nach einem ersten Gespraech koennen wir meist innerhalb einer Woche starten.',
      contact_page_faq_q2: 'Wie lange dauert ein Projekt?',
      contact_page_faq_a2: 'Landingpages 2-4 Wochen, groessere Websites 4-8 Wochen - je nach Umfang.',
      contact_page_faq_q3: 'Was kostet eine Website?',
      contact_page_faq_a3: 'Ab CHF 750 fuer eine Landingpage bis CHF 2\'500 fuer Premium-Websites. Finale Offerte nach kurzem Call.',
      contact_page_faq_q4: 'Koennen wir spaeter erweitern?',
      contact_page_faq_a4: 'Ja! Wir bauen skalierbar - Features wie KI-Assistent lassen sich jederzeit ergaenzen.',
      contact_page_project_select: 'Bitte waehlen...',
      contact_page_project_new: 'Neue Website',
      contact_page_project_revision: 'Website Ueberarbeitung',
      contact_page_project_ai: 'KI-Assistent Integration',
      contact_page_project_seo: 'SEO & Performance',
      contact_page_project_consulting: 'Beratung',
      contact_page_project_other: 'Sonstiges',
      contact_page_form_privacy_html: 'Ich habe die <a href="datenschutz.html">Datenschutzerklaerung</a> gelesen und akzeptiere sie. *',
      contact_page_form_success: '✓ Danke! Deine Anfrage wurde erfolgreich gesendet.',
      contact_page_form_error_required: 'Bitte fuelle alle Pflichtfelder aus.',
      thanks_title:    'Vielen Dank!',
      thanks_message_html: 'Deine Nachricht ist bei uns angekommen.<br>Wir melden uns innerhalb von <strong>24 Stunden</strong> bei dir.',
      thanks_redirect: 'Du wirst in 5 Sekunden automatisch weitergeleitet...',
      thanks_home:     'Zurück zur Startseite',
      thanks_services: 'Unsere Leistungen',
      impressum_title: 'Impressum',
      impressum_lead:  'Angaben gemäss Art. 5 DSG (Schweiz)',
      impressum_content: `<h2>Betreiber der Website</h2>
    <p><strong>MASESites AG</strong><br>Schweiz</p>
    <h2>Kontakt</h2>
    <p><strong>E-Mail:</strong> <a href="mailto:info@masesites.ch">info@masesites.ch</a><br>
    <strong>Telefon:</strong> Auf Anfrage mit Termin</p>
    <h2>Vertretungsberechtigte Personen</h2>
    <p>Matteo &amp; Severin (Gründer)</p>
    <h2>Haftungsausschluss</h2>
    <h3>Haftung für Inhalte</h3>
    <p>Die Inhalte unserer Seiten wurden mit grösster Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>
    <h3>Haftung für Links</h3>
    <p>Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.</p>
    <h3>Urheberrecht</h3>
    <p>Die durch die Seitenbetreiber erstellten Inhalte unterliegen dem schweizerischen Urheberrecht. Die Vervielfältigung bedarf der schriftlichen Zustimmung.</p>
    <h2>Konzept &amp; Realisierung</h2>
    <p><strong>Design &amp; Entwicklung:</strong> MASESites AG – <a href="https://www.masesites.ch">www.masesites.ch</a><br>
    <strong>Technologie:</strong> HTML5, CSS3, Vanilla JavaScript</p>
    <p style="color:var(--muted);margin-top:3rem;font-size:0.9rem;">Stand: Februar 2026</p>`,
      privacy_title:   'Datenschutzerklärung',
      privacy_lead:    'Transparenz über die Verarbeitung Ihrer Daten.',
      privacy_content: `<h2>1. Verantwortliche Stelle</h2>
    <p><strong>MASESites AG</strong><br>
    E-Mail: <a href="mailto:info@masesites.ch">info@masesites.ch</a></p>

    <h2>2. Erfassung und Verarbeitung personenbezogener Daten</h2>
    <h3>2.1 Kontaktformular</h3>
    <p>Wenn Sie uns über das Kontaktformular kontaktieren, werden folgende Daten erfasst:</p>
    <ul>
      <li>Name</li>
      <li>E-Mail-Adresse</li>
      <li>Firma (optional)</li>
      <li>Nachrichtentext</li>
    </ul>
    <p><strong>Zweck:</strong> Bearbeitung Ihrer Anfrage<br>
    <strong>Rechtsgrundlage:</strong> Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)<br>
    <strong>Speicherdauer:</strong> Bis zur vollständigen Bearbeitung, danach Löschung</p>

    <h3>2.2 Cookies</h3>
    <p>Wir verwenden Cookies zur Verbesserung der Nutzererfahrung.</p>
    <p><strong>Technisch notwendige Cookies:</strong><br>
    <code>cookie-consent</code>: Speichert Ihre Cookie-Einstellung (365 Tage)</p>
    <p><strong>Analytics-Cookies (nur mit Einwilligung):</strong><br>
    Google Analytics zur Analyse des Nutzerverhaltens. IP-Anonymisierung ist aktiviert.</p>

    <h2>3. Ihre Rechte</h2>
    <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten. Bitte kontaktieren Sie uns unter <a href="mailto:info@masesites.ch">info@masesites.ch</a>.</p>

    <h2>4. Datensicherheit</h2>
    <p>Wir setzen technische und organisatorische Sicherheitsmassnahmen ein, um Ihre Daten gegen Manipulation, Verlust und unberechtigten Zugriff zu schützen. Unsere Website nutzt SSL-Verschlüsselung (HTTPS).</p>

    <h2>5. Externe Dienste</h2>
    <p>Wir nutzen <strong>Formspree</strong> für die Verarbeitung von Kontaktformularen. Dabei werden die von Ihnen eingegebenen Daten an Formspree Inc. übermittelt. Weitere Informationen: <a href="https://formspree.io/legal/privacy-policy" target="_blank" rel="noopener">formspree.io/legal/privacy-policy</a></p>

    <p style="color:var(--muted);margin-top:3rem;font-size:0.9rem;">Stand: Februar 2026</p>`,
    },
    en: {
      nav_toggle:      'Open navigation',
      lang_select_aria: 'Choose language',
      theme_toggle_aria: 'Toggle dark mode',
      skip_to_content: 'Skip to content',
      nav_home:        'Home',
      nav_services:    'Services',
      nav_prices:      'Pricing',
      nav_ai:          'AI Assistant',
      nav_about:       'About us',
      nav_contact:     'Contact',
      nav_cta:         'Free Consultation',
      hero_eyebrow:    'Matteo & Severin. MASESites AG.',
      hero_title:      'Websites that sell.',
      hero_lead:       'Professional web solutions and AI integration for modern businesses.',
      hero_cta_primary:   'Start project',
      hero_cta_secondary: 'See pricing',
      badge_mobile:    'Mobile-first',
      badge_seo:       'SEO-optimised',
      badge_ai:        'AI integration',
      cookie_title:    'Cookie Notice',
      cookie_desc:     'We use cookies to provide the best experience on our website.',
      cookie_link:     'Learn more',
      cookie_settings: 'Settings',
      cookie_accept:   'Accept',
      footer_nav:      'Navigation',
      footer_contact:  'Contact',
      footer_legal:    'Legal',
      footer_copy:     'All rights reserved.',
      form_name:       'Name *',
      form_email:      'E-Mail *',
      form_company:    'Company (optional)',
      form_project:    'Project type',
      form_message:    'Message *',
      form_submit:     'Send request',
      form_privacy:    'I have read and accept the privacy policy.',
      pricing_headline:   'Get the most out of your website',
      pricing_subline:    'Choose your package. Combine flexibly.',
      cta_talk:        'Start a free consultation',
      // Footer
      footer_desc:     'Professional websites & AI integration from Switzerland.',
      footer_contact_form: 'Contact form',
      footer_impressum: 'Legal notice',
      footer_privacy:  'Privacy policy',
      // Leistungen (Services)
      services_title:  'Our Services',
      services_lead:   'From design to development to AI integration – everything from one source.',
      services_webdesign_h: 'Web Design',
      services_webdesign_p: 'UX/UI focused on conversion and user experience.',
      services_webdesign_list_html: '<li><strong>Modern Design:</strong> Clean, professional, and up-to-date</li><li><strong>Structure & Clarity:</strong> Intuitive navigation and clear hierarchy</li><li><strong>Conversion Optimization:</strong> Every element is built to drive action</li><li><strong>Responsive:</strong> Perfect on all devices</li><li><strong>Brand Consistency:</strong> Your brand presented professionally</li>',
      services_webdesign_cta: 'Request design',
      services_webdesign_preview_label: 'Design Preview',
      services_webdev_h: 'Web Development',
      services_webdev_p: 'Clean code that guarantees performance and scalability.',
      services_webdev_list_html: '<li><strong>Clean Code:</strong> Modern, maintainable, and future-proof</li><li><strong>Performance Optimized:</strong> Fast loading times guaranteed</li><li><strong>Scalable:</strong> Grows with your business</li><li><strong>SEO Ready:</strong> Technically optimized for search engines</li><li><strong>Security:</strong> Modern standards and best practices</li>',
      services_webdev_cta: 'Request development',
      services_seo_h:  'SEO & Performance',
      services_seo_p:  'Technical optimization for maximum visibility and speed.',
      services_seo_list_html: '<li><strong>Technical Optimization:</strong> Core Web Vitals compliant</li><li><strong>Structured Content:</strong> Schema.org and meta tags</li><li><strong>Fast Loading:</strong> Under 3 seconds guaranteed</li><li><strong>Mobile-First:</strong> Optimized for Google standards</li><li><strong>Analytics Integration:</strong> Measurable outcomes</li>',
      services_seo_cta: 'Request SEO',
      services_metric_loadtime: 'Load time',
      services_ki_h:   'AI Assistant Integration',
      services_ki_p:   'Intelligent automation for 24/7 customer service.',
      services_ai_list_html: '<li><strong>24/7 Customer Support:</strong> Automated answers around the clock</li><li><strong>Lead Qualification:</strong> Pre-qualifies incoming requests</li><li><strong>Automated Replies:</strong> FAQ and product explanations</li><li><strong>Trainable to Your Needs:</strong> Powered by your own content</li><li><strong>Easy Integration:</strong> Seamlessly integrated into your website</li>',
      services_ai_cta: 'More about AI Assistant',
      services_ai_chat_bot: 'How can I help?',
      services_ai_chat_user: 'What are the prices?',
      services_ai_chat_reply: 'Starting from CHF 750. Should I show details?',
      services_ai_chat_placeholder: 'Message...',
      services_cta_title: 'Ready for your project?',
      services_cta_lead: 'Let\'s find the perfect website solution together.',
      services_cta_primary: 'Start project',
      services_cta_secondary: 'See pricing',
      // Trust Section (Index)
      trust_title:     'Why MASE',
      trust_speed:     'Fast',
      trust_speed_desc: 'Clear processes, short communication channels, quick launch.',
      trust_code:      'Clean Code',
      trust_code_desc: 'Minimal, maintainable, and optimized for performance.',
      trust_mobile:    'Mobile-first',
      trust_mobile_desc: 'UX that works on every screen. No compromises.',
      trust_ki:        'AI Integration',
      trust_ki_desc:   'Assistant that qualifies leads and answers questions.',
      // Process (Unser Ansatz - Index)
      process_title:   'Our Approach',
      process_lead:    '5 steps to professional results.',
      process_1_title: 'Analysis & Strategy',
      process_1_desc:  'We analyze your business, target audience, and competition. Clear goals, clear plan.',
      process_2_title: 'Structure & UX Planning',
      process_2_desc:  'Page structure, navigation, and user experience planned before the first pixel.',
      process_3_title: 'Modern Design',
      process_3_desc:  'Clean, professional, sales-driven. Design that builds trust and drives action.',
      process_4_title: 'Clean Development',
      process_4_desc:  'Fast, maintainable code. Mobile-first, SEO-ready, and built to scale.',
      process_5_title: 'Optimization & Scaling',
      process_5_desc:  'After launch, we analyze, optimize, and scale your digital presence.',
      // Live Preview
      livepreview_title: 'Live Preview – Sample Projects',
      livepreview_lead: 'Here\'s how your website could look.',
      live_preview_title: 'Live Preview – Sample Projects',
      live_preview_subtitle: 'Here\'s how your website could look.',
      // AI Teaser
      ai_title:        'AI Integration – Your Digital Employee',
      ai_desc:         'Our AI Assistant works 24/7 for you: answers customer questions, captures leads, qualifies inquiries, and explains your products and services.',
      ai_feature_1:    'Automatic customer support',
      ai_feature_2:    'Lead qualification in real-time',
      ai_feature_3:    'Trainable with your content',
      ai_link:         'Discover AI Assistant',
      // AI Assistant Page
      ai_page_hero_title: 'Your digital employee - 24/7',
      ai_page_hero_lead: 'Automatic customer support, lead qualification, and FAQ help - available around the clock.',
      ai_page_capabilities_title: 'What the AI assistant can do',
      ai_page_capabilities_list_html: '<li><strong>24/7 customer support</strong> - always available</li><li><strong>Lead qualification</strong> - pre-sorts interested prospects</li><li><strong>Automated answers</strong> - for FAQs and common questions</li><li><strong>Prepares appointment booking</strong> - less back and forth</li><li><strong>Multilingual support</strong> - for international audiences</li>',
      ai_page_trainable_html: '<strong>Individually trainable:</strong> We train the assistant with your content - PDFs, FAQs, product descriptions, and website text.',
      ai_page_demo_header: 'MASESites AI Assistant',
      ai_page_demo_bot_1: 'Hi! How can I help you?',
      ai_page_demo_user_1: 'How much does a website cost?',
      ai_page_demo_bot_2: 'From CHF 750 for a landing page. Business websites start at CHF 1\'300. Want more details?',
      ai_page_demo_user_2: 'Yes, what is included in the price?',
      ai_page_demo_bot_3: 'Design, development, performance optimization, basic SEO, and contact form. Final quote after a short call.',
      ai_page_demo_input: 'Write a message...',
      ai_page_demo_send: 'Send',
      ai_page_demo_note_html: '<strong>Note:</strong> This is a demo. Test the real AI assistant in the bottom-right corner!',
      ai_page_audience_title: 'Who is the AI assistant for?',
      ai_page_audience_kmu_title: 'SMEs & service providers',
      ai_page_audience_kmu_desc: 'Answer inquiries automatically, even outside business hours. More leads, less manual work.',
      ai_page_audience_shop_title: 'Online shops',
      ai_page_audience_shop_desc: 'Product advice, size guides, and shipping info - the assistant explains everything and improves conversion.',
      ai_page_audience_coach_title: 'Coaches & consultants',
      ai_page_audience_coach_desc: 'Qualify prospects before the first call. Save time and focus on high-quality leads.',
      ai_page_audience_startup_title: 'Startups',
      ai_page_audience_startup_desc: 'Professional support without a large team. Scalable and cost-efficient.',
      ai_page_benefits_title: 'Why use an AI assistant?',
      ai_page_benefits_subtitle: 'More leads, less effort',
      ai_page_benefits_list_html: '<li><strong>No more missed inquiries</strong></li><li><strong>Instant answers instead of waiting times</strong></li><li><strong>Higher conversion through direct guidance</strong></li><li><strong>Less workload for your team</strong></li>',
      ai_page_metric_response: 'Response time',
      ai_page_metric_uptime: 'Availability',
      ai_page_metric_lead: 'Lead rate',
      ai_page_pricing_title: 'Pricing & integration',
      ai_page_pricing_widget_title: 'AI Assistant',
      ai_page_pricing_chat_bot: 'Hi! 👋',
      ai_page_pricing_chat_user: 'How can I help?',
      ai_page_pricing_chat_reply: 'Sure! What would you like to know?',
      ai_page_pricing_card_title: 'AI assistant integration',
      ai_page_pricing_card_desc: 'Complete setup, training with your content, and integration into your website.',
      ai_page_pricing_note: 'As an add-on to any website or as a standalone integration into an existing site.',
      ai_page_pricing_cta: 'Request AI assistant',
      ai_page_faq_title: 'Frequently asked questions',
      ai_page_faq_q1: 'How is the AI assistant trained?',
      ai_page_faq_a1: 'We train it with your content: FAQs, product descriptions, PDFs, and website copy. It learns your business.',
      ai_page_faq_q2: 'Can it answer complex questions?',
      ai_page_faq_a2: 'Yes. It can give detailed answers based on your content. For very specific questions, it forwards to your team.',
      ai_page_faq_q3: 'Does it work in multiple languages?',
      ai_page_faq_a3: 'Yes, German, English, French, and additional languages are possible.',
      ai_page_faq_q4: 'Can I update content later?',
      ai_page_faq_a4: 'Yes. You can send us new content any time, and we retrain the assistant.',
      ai_page_faq_q5: 'What happens to the data?',
      ai_page_faq_a5: 'All data is processed in a GDPR-compliant way. No sharing with third parties.',
      ai_page_live_title: 'Test the AI assistant live now!',
      ai_page_live_lead: 'Click the chat button at the bottom-right and ask the AI assistant your questions.',
      ai_page_live_desc: 'You will instantly see how it works and how it can support your business.',
      // About Page
      about_page_hero_title: 'Who is behind MASESites?',
      about_page_hero_lead: 'Two minds, one goal: modern websites that truly perform.',
      about_page_story_title: 'Our story',
      about_page_story_p1_html: 'MASESites AG was founded by <strong>Matteo</strong> and <strong>Severin</strong>. Our goal is clear: build modern, clean, high-performance websites that deliver real results.',
      about_page_story_p2: 'We believe in honest work, clean code, and transparent communication. No false promises, no fake references - just solid craftsmanship with a focus on quality.',
      about_page_story_p3: 'With our background in web development and design, we combine technical know-how with a strong sense of aesthetics. The result: websites that not only look good, but also sell.',
      about_page_values_title: 'Our values',
      about_page_value_honesty_title: 'Honesty',
      about_page_value_honesty_desc: 'No fake case studies, no made-up numbers. Just honest, transparent work.',
      about_page_value_quality_title: 'Clean work',
      about_page_value_quality_desc: 'Quality before speed. Every line of code is written with care.',
      about_page_value_comms_title: 'Clear communication',
      about_page_value_comms_desc: 'You always know where your project stands. No surprises.',
      about_page_value_results_title: 'Results focus',
      about_page_value_results_desc: 'Your website must convert. Conversion is at the center.',
      about_page_cta_title: 'Let\'s discuss your project',
      about_page_cta_lead: 'We look forward to hearing about your project.',
      about_page_cta_button: 'Get in touch',
      // Pricing Teaser
      pricing_teaser:  'Transparent Pricing',
      pricing_teaser_lead: 'From website redesign to full development – modular packages from CHF 250.',
      pricing_teaser_link: 'View all prices',
      // Pricing Page
      pricing_domain_heading: 'Domain & Hosting Bundle',
      pricing_starter: 'Starter',
      pricing_plus: 'Plus',
      pricing_pro: 'Pro',
      pricing_business: 'Business',
      pricing_premium: 'Premium',
      pricing_revision_title: 'Website Revision',
      pricing_revision_desc: 'Improve your existing website',
      pricing_revision_starter_list_html: '<li>Minor design adjustments</li><li>Text corrections</li><li>Basic performance optimization</li>',
      pricing_revision_plus_list_html: '<li>Design improvements</li><li>Mobile optimization</li><li>Basic SEO check</li>',
      pricing_revision_pro_list_html: '<li>Complete redesign of selected pages</li><li>Structure optimization</li><li>Performance + SEO optimization</li><li>Conversion improvements</li>',
      pricing_newsite_title: 'Build a new website',
      pricing_newsite_desc: 'Start from scratch',
      pricing_new_starter_list_html: '<li>1 landing page</li><li>Contact form</li><li>Basic SEO</li>',
      pricing_new_business_list_html: '<li>Multiple pages</li><li>SEO optimization</li><li>Structure + UX focus</li>',
      pricing_new_premium_list_html: '<li>Custom design</li><li>Performance optimization</li><li>Advanced SEO</li><li>Conversion focus</li><li>Clean code</li>',
      pricing_ai_chat_bot: 'Hi! How can I help?',
      pricing_ai_chat_user: 'How much does a website cost?',
      pricing_ai_chat_reply: 'Starting from CHF 750. Want more details?',
      pricing_ai_title: 'AI Assistant',
      pricing_ai_desc: '24/7 replies. Lead qualification. Automated customer support.',
      pricing_ai_monthly: '+ CHF 40 / month',
      pricing_ai_add: 'Add AI Assistant',
      pricing_domain_desc: 'We handle everything – no setup work for you',
      pricing_domain: 'Domain',
      pricing_hosting: 'Hosting',
      pricing_bundle: 'Bundle',
      pricing_domain_list_html: '<li>Register your preferred domain</li><li>.ch / .com / .net</li><li>DNS configuration</li>',
      pricing_hosting_list_html: '<li>Fast Swiss server</li><li>SSL certificate (HTTPS)</li><li>Daily backups</li><li>99.9% uptime guarantee</li>',
      pricing_bundle_list_html: '<li>Domain + 12 months hosting</li><li>2 months free</li><li>SSL + backups included</li><li>Setup included</li>',
      pricing_summary_hint: 'Choose a package to see the price',
      pricing_total_label: 'Total price',
      pricing_cta_start: 'Start project',
      pricing_note: 'Final quote after a short call.',
      pricing_faq_title: 'Frequently asked pricing questions',
      pricing_faq_q1: 'What is included in the price?',
      pricing_faq_a1: 'Design, development, performance optimization, basic SEO, contact form, privacy setup, and 2-3 feedback rounds.',
      pricing_faq_q2: 'Are there hidden costs?',
      pricing_faq_a2: 'No. Pricing is transparent. Hosting and domain are organized separately (about CHF 10-30/month).',
      pricing_faq_q3: 'How does payment work?',
      pricing_faq_a3: '50% deposit at project start, 50% on completion. Invoice by email.',
      pricing_faq_q4: 'Can I upgrade later?',
      pricing_faq_a4: 'Yes. You can add features like AI Assistant, additional pages, or custom functionality anytime.',
      pricing_final_cta_title: 'Ready for your project?',
      pricing_final_cta_lead: 'Let us find the best solution for your business together.',
      // Contact Page
      contact_title:   'Your project starts here',
      contact_lead:    'Let\'s find the perfect website solution together.',
      contact_submit:  'Send request',
      contact_error:   'Error sending. Please try again later.',
      contact_success: 'Request sent! We\'ll get back to you within 24 hours.',
      contact_page_intro_title: 'Tell us about your project',
      contact_page_intro_text: 'Whether you need a new website, a redesign, or AI integration - we will find the right solution for your business.',
      contact_page_direct_title: 'Direct contact',
      contact_page_email_html: '<strong>Email:</strong> <a href="mailto:info@masesites.ch">info@masesites.ch</a>',
      contact_page_phone: 'Phone: Available on request with appointment',
      contact_page_faq_title: 'Frequently asked questions',
      contact_page_faq_q1: 'How quickly can we start?',
      contact_page_faq_a1: 'After an initial call, we can usually start within one week.',
      contact_page_faq_q2: 'How long does a project take?',
      contact_page_faq_a2: 'Landing pages take 2-4 weeks, larger websites 4-8 weeks - depending on scope.',
      contact_page_faq_q3: 'How much does a website cost?',
      contact_page_faq_a3: 'From CHF 750 for a landing page up to CHF 2\'500 for premium websites. Final quote after a short call.',
      contact_page_faq_q4: 'Can we expand later?',
      contact_page_faq_a4: 'Yes. We build scalable setups - features like an AI assistant can be added at any time.',
      contact_page_project_select: 'Please choose...',
      contact_page_project_new: 'New website',
      contact_page_project_revision: 'Website revision',
      contact_page_project_ai: 'AI assistant integration',
      contact_page_project_seo: 'SEO & performance',
      contact_page_project_consulting: 'Consulting',
      contact_page_project_other: 'Other',
      contact_page_form_privacy_html: 'I have read and accept the <a href="datenschutz.html">privacy policy</a>. *',
      contact_page_form_success: '✓ Thanks! Your request was sent successfully.',
      contact_page_form_error_required: 'Please fill in all required fields.',
      thanks_title:    'Thank you!',
      thanks_message_html: 'Your message has reached us.<br>We will get back to you within <strong>24 hours</strong>.',
      thanks_redirect: 'You will be redirected automatically in 5 seconds...',
      thanks_home:     'Back to home page',
      thanks_services: 'Our services',
      impressum_title: 'Legal Notice',
      impressum_lead:  'Information according to Swiss legal requirements.',
      impressum_content: `<h2>Website operator</h2>
    <p><strong>MASESites AG</strong><br>Switzerland</p>
    <h2>Contact</h2>
    <p><strong>Email:</strong> <a href="mailto:info@masesites.ch">info@masesites.ch</a><br>
    <strong>Phone:</strong> Available on request with appointment</p>
    <h2>Authorized representatives</h2>
    <p>Matteo &amp; Severin (Founders)</p>
    <h2>Disclaimer</h2>
    <h3>Liability for content</h3>
    <p>The content of our pages has been created with great care. However, we cannot guarantee the accuracy, completeness, or up-to-dateness of the content.</p>
    <h3>Liability for links</h3>
    <p>Our website contains links to external third-party websites over whose content we have no control.</p>
    <h3>Copyright</h3>
    <p>The content created by the site operators is subject to Swiss copyright law. Reproduction requires written permission.</p>
    <h2>Concept &amp; implementation</h2>
    <p><strong>Design &amp; Development:</strong> MASESites AG – <a href="https://www.masesites.ch">www.masesites.ch</a><br>
    <strong>Technology:</strong> HTML5, CSS3, Vanilla JavaScript</p>
    <p style="color:var(--muted);margin-top:3rem;font-size:0.9rem;">Last updated: February 2026</p>`,
      privacy_title:   'Privacy Policy',
      privacy_lead:    'Transparency about how we process your data.',
      privacy_content: `<h2>1. Data controller</h2>
    <p><strong>MASESites AG</strong><br>
    Email: <a href="mailto:info@masesites.ch">info@masesites.ch</a></p>

    <h2>2. Collection and processing of personal data</h2>
    <h3>2.1 Contact form</h3>
    <p>When you contact us via the contact form, the following data is collected:</p>
    <ul>
      <li>Name</li>
      <li>Email address</li>
      <li>Company (optional)</li>
      <li>Message text</li>
    </ul>
    <p><strong>Purpose:</strong> Processing your request<br>
    <strong>Legal basis:</strong> Consent (Art. 6 para. 1 lit. a GDPR)<br>
    <strong>Storage period:</strong> Until your request has been fully processed, then deletion</p>

    <h3>2.2 Cookies</h3>
    <p>We use cookies to improve user experience.</p>
    <p><strong>Technically necessary cookies:</strong><br>
    <code>cookie-consent</code>: Stores your cookie setting (365 days)</p>
    <p><strong>Analytics cookies (with consent only):</strong><br>
    Google Analytics is used to analyze user behavior. IP anonymization is enabled.</p>

    <h2>3. Your rights</h2>
    <p>You have the right to access, rectification, deletion, and restriction of processing of your data. Please contact us at <a href="mailto:info@masesites.ch">info@masesites.ch</a>.</p>

    <h2>4. Data security</h2>
    <p>We use technical and organizational security measures to protect your data against manipulation, loss, and unauthorized access. Our website uses SSL encryption (HTTPS).</p>

    <h2>5. External services</h2>
    <p>We use <strong>Formspree</strong> to process contact forms. Data entered by you is transmitted to Formspree Inc. More information: <a href="https://formspree.io/legal/privacy-policy" target="_blank" rel="noopener">formspree.io/legal/privacy-policy</a></p>

    <p style="color:var(--muted);margin-top:3rem;font-size:0.9rem;">Last updated: February 2026</p>`,
    },
    fr: {
      nav_toggle:      'Ouvrir la navigation',
      lang_select_aria: 'Choisir la langue',
      theme_toggle_aria: 'Activer le mode sombre',
      skip_to_content: 'Aller au contenu',
      nav_home:        'Accueil',
      nav_services:    'Services',
      nav_prices:      'Tarifs',
      nav_ai:          'Assistant IA',
      nav_about:       'À propos',
      nav_contact:     'Contact',
      nav_cta:         'Premier entretien gratuit',
      hero_eyebrow:    'Matteo & Severin. MASESites AG.',
      hero_title:      'Des sites web qui vendent.',
      hero_lead:       'Solutions web professionnelles et intégration IA pour les entreprises modernes.',
      hero_cta_primary:   'Démarrer le projet',
      hero_cta_secondary: 'Voir les tarifs',
      badge_mobile:    'Mobile-first',
      badge_seo:       'Optimisé SEO',
      badge_ai:        'Intégration IA',
      cookie_title:    'Avis sur les cookies',
      cookie_desc:     'Nous utilisons des cookies pour vous offrir la meilleure expérience.',
      cookie_link:     'En savoir plus',
      cookie_settings: 'Paramètres',
      cookie_accept:   'Accepter',
      footer_nav:      'Navigation',
      footer_contact:  'Contact',
      footer_legal:    'Juridique',
      footer_copy:     'Tous les droits réservés.',
      form_name:       'Nom *',
      form_email:      'E-mail *',
      form_company:    'Entreprise (optionnel)',
      form_project:    'Type de projet',
      form_message:    'Message *',
      form_submit:     'Envoyer la demande',
      form_privacy:    'J\'ai lu et j\'accepte la politique de confidentialité.',
      pricing_headline:   'Tirez le meilleur parti de votre site web',
      pricing_subline:    'Choisissez votre forfait. Combinez facilement.',
      cta_talk:        'Démarrer une consultation gratuite',
      // Footer
      footer_desc:     'Sites web professionnels & intégration IA de Suisse.',
      footer_contact_form: 'Formulaire de contact',
      footer_impressum: 'Mentions légales',
      footer_privacy:  'Politique de confidentialité',
      // Leistungen (Services)
      services_title:  'Nos Services',
      services_lead:   'Du design au développement à l\'intégration IA – tout d\'une seule source.',
      services_webdesign_h: 'Web Design',
      services_webdesign_p: 'UX/UI axée sur la conversion et l\'expérience utilisateur.',
      services_webdesign_list_html: '<li><strong>Design moderne :</strong> Propre, professionnel et actuel</li><li><strong>Structure & clarté :</strong> Navigation intuitive et hiérarchie claire</li><li><strong>Optimisation conversion :</strong> Chaque élément vise l\'action</li><li><strong>Responsive :</strong> Parfait sur tous les appareils</li><li><strong>Cohérence de marque :</strong> Votre marque présentée professionnellement</li>',
      services_webdesign_cta: 'Demander design',
      services_webdesign_preview_label: 'Aperçu design',
      services_webdev_h: 'Développement Web',
      services_webdev_p: 'Code propre qui garantit performance et scalabilité.',
      services_webdev_list_html: '<li><strong>Code propre :</strong> Moderne, maintenable et pérenne</li><li><strong>Optimisé performance :</strong> Temps de chargement rapides garantis</li><li><strong>Scalable :</strong> Évolue avec votre activité</li><li><strong>SEO ready :</strong> Optimisé techniquement pour les moteurs</li><li><strong>Sécurité :</strong> Standards modernes et bonnes pratiques</li>',
      services_webdev_cta: 'Demander développement',
      services_seo_h:  'SEO & Performance',
      services_seo_p:  'Optimisation technique pour visibilité et rapidité maximales.',
      services_seo_list_html: '<li><strong>Optimisation technique :</strong> Core Web Vitals respectés</li><li><strong>Contenus structurés :</strong> Schema.org et balises meta</li><li><strong>Chargement rapide :</strong> Moins de 3 secondes garanties</li><li><strong>Mobile-first :</strong> Optimisé selon Google</li><li><strong>Intégration analytics :</strong> Résultats mesurables</li>',
      services_seo_cta: 'Demander SEO',
      services_metric_loadtime: 'Temps de chargement',
      services_ki_h:   'Intégration Assistant IA',
      services_ki_p:   'Automatisation intelligente pour service client 24/7.',
      services_ai_list_html: '<li><strong>Support client 24/7 :</strong> Réponses automatiques en continu</li><li><strong>Qualification des leads :</strong> Préqualification des demandes</li><li><strong>Réponses automatiques :</strong> FAQ et explications produits</li><li><strong>Entraînable sur mesure :</strong> Avec vos contenus</li><li><strong>Intégration simple :</strong> Sans rupture dans votre site</li>',
      services_ai_cta: 'Plus sur l\'assistant IA',
      services_ai_chat_bot: 'Comment puis-je aider ?',
      services_ai_chat_user: 'Quels sont les prix ?',
      services_ai_chat_reply: 'À partir de CHF 750. Je vous montre les détails ?',
      services_ai_chat_placeholder: 'Message...',
      services_cta_title: 'Prêt pour votre projet?',
      services_cta_lead: 'Trouvons ensemble la solution web parfaite.',
      services_cta_primary: 'Démarrer projet',
      services_cta_secondary: 'Voir tarifs',
      // Trust Section (Index)
      trust_title:     'Pourquoi MASE',
      trust_speed:     'Rapide',
      trust_speed_desc: 'Processus clairs, courts délais, mise en ligne rapide.',
      trust_code:      'Code Propre',
      trust_code_desc: 'Minimal, maintenable et optimisé pour la performance.',
      trust_mobile:    'Mobile-first',
      trust_mobile_desc: 'UX qui fonctionne sur tous les écrans. Pas de compromis.',
      trust_ki:        'Intégration IA',
      trust_ki_desc:   'Assistant qui qualifie les leads et répond aux questions.',
      // Process (Unser Ansatz - Index)
      process_title:   'Notre Approche',
      process_lead:    '5 étapes pour des résultats professionnels.',
      process_1_title: 'Analyse & Stratégie',
      process_1_desc:  'Nous analysons votre activité, votre audience et la concurrence. Objectifs clairs, plan clair.',
      process_2_title: 'Structure & Planification UX',
      process_2_desc:  'Structure de pages, navigation et UX planifiées avant le premier pixel.',
      process_3_title: 'Design Moderne',
      process_3_desc:  'Propre, professionnel, axé sur les ventes. Design qui inspire confiance et action.',
      process_4_title: 'Développement Propre',
      process_4_desc:  'Code rapide et maintenable. Mobile-first, prêt SEO, construit pour scalabilité.',
      process_5_title: 'Optimisation & Scalabilité',
      process_5_desc:  'Après lancement, nous analysons, optimisons et développons votre présence digitale.',
      // Live Preview
      livepreview_title: 'Aperçu Live – Projets Exemples',
      livepreview_lead: 'Voici à quoi pourrait ressembler votre site.',
      live_preview_title: 'Aperçu Live – Projets Exemples',
      live_preview_subtitle: 'Voici à quoi pourrait ressembler votre site.',
      // AI Teaser
      ai_title:        'Intégration IA – Votre Employé Digital',
      ai_desc:         'Notre Assistant IA travaille 24/7 pour vous: répond aux questions clients, capture des leads, qualifie les demandes et explique vos produits/services.',
      ai_feature_1:    'Support client automatique',
      ai_feature_2:    'Qualification de leads en temps réel',
      ai_feature_3:    'Formable avec vos contenus',
      ai_link:         'Découvrir l\'Assistant IA',
      // AI Assistant Page
      ai_page_hero_title: 'Votre employe digital - 24/7',
      ai_page_hero_lead: 'Support client automatique, qualification des leads et aide FAQ - disponibles 24h/24.',
      ai_page_capabilities_title: 'Ce que l\'assistant IA peut faire',
      ai_page_capabilities_list_html: '<li><strong>Support client 24/7</strong> - toujours disponible</li><li><strong>Qualification des leads</strong> - pre-qualification des prospects</li><li><strong>Reponses automatiques</strong> - pour FAQ et questions courantes</li><li><strong>Preparation de prise de rendez-vous</strong> - moins d\'allers-retours</li><li><strong>Support multilingue</strong> - pour des audiences internationales</li>',
      ai_page_trainable_html: '<strong>Trainable sur mesure :</strong> Nous entrainons l\'assistant avec vos contenus - PDFs, FAQs, descriptions produits et textes du site.',
      ai_page_demo_header: 'Assistant IA MASESites',
      ai_page_demo_bot_1: 'Bonjour ! Comment puis-je vous aider ?',
      ai_page_demo_user_1: 'Quel est le prix d\'un site web ?',
      ai_page_demo_bot_2: 'A partir de CHF 750 pour une landing page. Les sites business commencent a CHF 1\'300. Voulez-vous plus de details ?',
      ai_page_demo_user_2: 'Oui, qu\'est-ce qui est inclus ?',
      ai_page_demo_bot_3: 'Design, developpement, optimisation des performances, SEO de base et formulaire de contact. Offre finale apres un court appel.',
      ai_page_demo_input: 'Ecrire un message...',
      ai_page_demo_send: 'Envoyer',
      ai_page_demo_note_html: '<strong>Note :</strong> Ceci est une demo. Testez le vrai assistant IA en bas a droite !',
      ai_page_audience_title: 'A qui s\'adresse l\'assistant IA ?',
      ai_page_audience_kmu_title: 'PME & prestataires',
      ai_page_audience_kmu_desc: 'Repondez automatiquement aux demandes, meme hors horaires de bureau. Plus de leads, moins d\'effort.',
      ai_page_audience_shop_title: 'Boutiques en ligne',
      ai_page_audience_shop_desc: 'Conseils produits, guides de tailles, infos livraison - l\'assistant explique tout et augmente la conversion.',
      ai_page_audience_coach_title: 'Coachs & consultants',
      ai_page_audience_coach_desc: 'Qualifiez les prospects avant le premier appel. Gagnez du temps et concentrez-vous sur des leads qualifies.',
      ai_page_audience_startup_title: 'Startups',
      ai_page_audience_startup_desc: 'Support professionnel sans grande equipe. Evolutif et rentable.',
      ai_page_benefits_title: 'Pourquoi un assistant IA ?',
      ai_page_benefits_subtitle: 'Plus de leads, moins d\'effort',
      ai_page_benefits_list_html: '<li><strong>Plus de demandes manquees</strong></li><li><strong>Reponses immediates sans attente</strong></li><li><strong>Meilleure conversion grace au conseil direct</strong></li><li><strong>Moins de charge pour votre equipe</strong></li>',
      ai_page_metric_response: 'Temps de reponse',
      ai_page_metric_uptime: 'Disponibilite',
      ai_page_metric_lead: 'Taux de leads',
      ai_page_pricing_title: 'Tarifs & integration',
      ai_page_pricing_widget_title: 'Assistant IA',
      ai_page_pricing_chat_bot: 'Bonjour ! 👋',
      ai_page_pricing_chat_user: 'Comment puis-je aider ?',
      ai_page_pricing_chat_reply: 'Avec plaisir ! Que souhaitez-vous savoir ?',
      ai_page_pricing_card_title: 'Integration assistant IA',
      ai_page_pricing_card_desc: 'Configuration complete, entrainement avec vos contenus et integration dans votre site.',
      ai_page_pricing_note: 'En add-on pour tout site ou en integration separee sur un site existant.',
      ai_page_pricing_cta: 'Demander un assistant IA',
      ai_page_faq_title: 'Questions frequentes',
      ai_page_faq_q1: 'Comment l\'assistant IA est-il entraine ?',
      ai_page_faq_a1: 'Nous l\'entrainons avec vos contenus : FAQ, descriptions produits, PDFs et textes du site. Il apprend votre activite.',
      ai_page_faq_q2: 'Peut-il repondre a des questions complexes ?',
      ai_page_faq_a2: 'Oui. Il peut fournir des reponses detaillees selon vos contenus. Pour les cas tres specifiques, il transfere a votre equipe.',
      ai_page_faq_q3: 'Fonctionne-t-il en plusieurs langues ?',
      ai_page_faq_a3: 'Oui, allemand, anglais, francais et d\'autres langues sont possibles.',
      ai_page_faq_q4: 'Puis-je mettre a jour le contenu plus tard ?',
      ai_page_faq_a4: 'Oui. Vous pouvez nous envoyer de nouveaux contenus a tout moment, et nous re-entrainons l\'assistant.',
      ai_page_faq_q5: 'Que deviennent les donnees ?',
      ai_page_faq_a5: 'Toutes les donnees sont traitees de maniere conforme au RGPD. Aucun partage avec des tiers.',
      ai_page_live_title: 'Testez l\'assistant IA en direct maintenant !',
      ai_page_live_lead: 'Cliquez sur le bouton chat en bas a droite et posez vos questions a l\'assistant IA.',
      ai_page_live_desc: 'Vous verrez immediatement comment il fonctionne et comment il peut soutenir votre entreprise.',
      // About Page
      about_page_hero_title: 'Qui se cache derriere MASESites ?',
      about_page_hero_lead: 'Deux esprits, un objectif : des sites modernes qui performent vraiment.',
      about_page_story_title: 'Notre histoire',
      about_page_story_p1_html: 'MASESites AG a ete fondee par <strong>Matteo</strong> et <strong>Severin</strong>. Notre objectif est clair : creer des sites modernes, clairs et performants qui apportent de vrais resultats.',
      about_page_story_p2: 'Nous croyons au travail honnete, au code propre et a une communication transparente. Pas de promesses vides, pas de references fictives - seulement un vrai savoir-faire axe sur la qualite.',
      about_page_story_p3: 'Avec notre experience en developpement web et en design, nous combinons competence technique et sens esthetique. Resultat : des sites qui ne sont pas seulement beaux, mais qui vendent.',
      about_page_values_title: 'Nos valeurs',
      about_page_value_honesty_title: 'Honnetete',
      about_page_value_honesty_desc: 'Pas de faux cas, pas de chiffres inventes. Un travail honnete et transparent.',
      about_page_value_quality_title: 'Travail propre',
      about_page_value_quality_desc: 'La qualite avant la vitesse. Chaque ligne de code est ecrite avec soin.',
      about_page_value_comms_title: 'Communication claire',
      about_page_value_comms_desc: 'Vous savez toujours ou en est votre projet. Aucune surprise.',
      about_page_value_results_title: 'Focus resultats',
      about_page_value_results_desc: 'Votre site doit convertir. La conversion est au centre.',
      about_page_cta_title: 'Parlons de votre projet',
      about_page_cta_lead: 'Nous nous rejouissons de decouvrir votre projet.',
      about_page_cta_button: 'Prendre contact',
      // Pricing Teaser
      pricing_teaser:  'Tarification Transparente',
      pricing_teaser_lead: 'De la refonte à développement complet – forfaits modulaires dès CHF 250.',
      pricing_teaser_link: 'Voir tous les tarifs',
      // Pricing Page
      pricing_domain_heading: 'Forfait Domaine & Hosting',
      pricing_starter: 'Starter',
      pricing_plus: 'Plus',
      pricing_pro: 'Pro',
      pricing_business: 'Business',
      pricing_premium: 'Premium',
      pricing_revision_title: 'Refonte de site web',
      pricing_revision_desc: 'Améliorer un site existant',
      pricing_revision_starter_list_html: '<li>Petits ajustements de design</li><li>Corrections de texte</li><li>Optimisation performance légère</li>',
      pricing_revision_plus_list_html: '<li>Amélioration du design</li><li>Optimisation mobile</li><li>Contrôle SEO de base</li>',
      pricing_revision_pro_list_html: '<li>Refonte complète de pages sélectionnées</li><li>Optimisation de structure</li><li>Optimisation performance + SEO</li><li>Amélioration conversion</li>',
      pricing_newsite_title: 'Créer un nouveau site',
      pricing_newsite_desc: 'Construction complète',
      pricing_new_starter_list_html: '<li>1 landing page</li><li>Formulaire de contact</li><li>SEO de base</li>',
      pricing_new_business_list_html: '<li>Plusieurs pages</li><li>Optimisation SEO</li><li>Structure + focus UX</li>',
      pricing_new_premium_list_html: '<li>Design personnalisé</li><li>Optimisation performance</li><li>SEO avancé</li><li>Focus conversion</li><li>Code propre</li>',
      pricing_ai_chat_bot: 'Bonjour ! Comment puis-je aider ?',
      pricing_ai_chat_user: 'Quel est le prix d\'un site web ?',
      pricing_ai_chat_reply: 'À partir de CHF 750. Je vous explique en détail ?',
      pricing_ai_title: 'Assistant IA',
      pricing_ai_desc: 'Réponses 24/7. Qualification des leads. Support client automatisé.',
      pricing_ai_monthly: '+ CHF 40 / mois',
      pricing_ai_add: 'Ajouter l\'assistant IA',
      pricing_domain_desc: 'On s\'occupe de tout – aucun setup de votre côté',
      pricing_domain: 'Domaine',
      pricing_hosting: 'Hébergement',
      pricing_bundle: 'Pack',
      pricing_domain_list_html: '<li>Enregistrement du domaine souhaité</li><li>.ch / .com / .net</li><li>Configuration DNS</li>',
      pricing_hosting_list_html: '<li>Serveur suisse rapide</li><li>Certificat SSL (HTTPS)</li><li>Sauvegardes quotidiennes</li><li>Garantie 99.9% uptime</li>',
      pricing_bundle_list_html: '<li>Domaine + 12 mois d\'hébergement</li><li>2 mois gratuits</li><li>SSL + sauvegardes inclus</li><li>Mise en place incluse</li>',
      pricing_summary_hint: 'Choisissez un forfait pour voir le prix',
      pricing_total_label: 'Prix total',
      pricing_cta_start: 'Démarrer le projet',
      pricing_note: 'Offre finale après un court appel.',
      pricing_faq_title: 'Questions fréquentes sur les tarifs',
      pricing_faq_q1: 'Qu\'est-ce qui est inclus dans le prix ?',
      pricing_faq_a1: 'Design, développement, optimisation performance, SEO de base, formulaire de contact, configuration RGPD et 2-3 cycles de feedback.',
      pricing_faq_q2: 'Y a-t-il des coûts cachés ?',
      pricing_faq_a2: 'Non. Les prix sont transparents. Hébergement et domaine sont gérés séparément (env. CHF 10-30/mois).',
      pricing_faq_q3: 'Comment se déroule le paiement ?',
      pricing_faq_a3: '50% d\'acompte au démarrage, 50% à la livraison. Facture par e-mail.',
      pricing_faq_q4: 'Puis-je évoluer plus tard ?',
      pricing_faq_a4: 'Oui. Vous pouvez ajouter des fonctions comme l\'assistant IA, des pages supplémentaires ou des features à tout moment.',
      pricing_final_cta_title: 'Prêt pour votre projet ?',
      pricing_final_cta_lead: 'Trouvons ensemble la meilleure solution pour votre entreprise.',
      // Contact Page
      contact_title:   'Votre projet commence ici',
      contact_lead:    'Trouvons ensemble la solution web parfaite.',
      contact_submit:  'Envoyer demande',
      contact_error:   'Erreur lors de l\'envoi. Veuillez réessayer plus tard.',
      contact_success: 'Demande envoyée! Nous vous répondrons dans 24 heures.',
      contact_page_intro_title: 'Parlez-nous de votre projet',
      contact_page_intro_text: 'Que ce soit un nouveau site, une refonte ou une integration IA - nous trouvons la bonne solution pour votre entreprise.',
      contact_page_direct_title: 'Contact direct',
      contact_page_email_html: '<strong>E-mail :</strong> <a href="mailto:info@masesites.ch">info@masesites.ch</a>',
      contact_page_phone: 'Telephone : Sur demande avec rendez-vous',
      contact_page_faq_title: 'Questions frequentes',
      contact_page_faq_q1: 'A quelle vitesse pouvons-nous demarrer ?',
      contact_page_faq_a1: 'Apres un premier entretien, nous pouvons generalement commencer sous une semaine.',
      contact_page_faq_q2: 'Combien de temps dure un projet ?',
      contact_page_faq_a2: 'Landing pages : 2-4 semaines, sites plus grands : 4-8 semaines - selon le perimetre.',
      contact_page_faq_q3: 'Quel est le prix d\'un site web ?',
      contact_page_faq_a3: 'A partir de CHF 750 pour une landing page jusqu\'a CHF 2\'500 pour les sites premium. Offre finale apres un court appel.',
      contact_page_faq_q4: 'Peut-on evoluer plus tard ?',
      contact_page_faq_a4: 'Oui. Nous construisons de facon evolutive - des fonctions comme l\'assistant IA peuvent etre ajoutees a tout moment.',
      contact_page_project_select: 'Veuillez choisir...',
      contact_page_project_new: 'Nouveau site web',
      contact_page_project_revision: 'Refonte du site web',
      contact_page_project_ai: 'Integration assistant IA',
      contact_page_project_seo: 'SEO & performance',
      contact_page_project_consulting: 'Conseil',
      contact_page_project_other: 'Autre',
      contact_page_form_privacy_html: 'J\'ai lu et j\'accepte la <a href="datenschutz.html">politique de confidentialite</a>. *',
      contact_page_form_success: '✓ Merci ! Votre demande a ete envoyee avec succes.',
      contact_page_form_error_required: 'Veuillez remplir tous les champs obligatoires.',
      thanks_title:    'Merci beaucoup!',
      thanks_message_html: 'Votre message nous est bien parvenu.<br>Nous vous répondrons dans les <strong>24 heures</strong>.',
      thanks_redirect: 'Redirection automatique dans 5 secondes...',
      thanks_home:     'Retour à l\'accueil',
      thanks_services: 'Nos services',
      impressum_title: 'Mentions légales',
      impressum_lead:  'Informations conformément aux exigences légales suisses.',
      impressum_content: `<h2>Exploitant du site</h2>
    <p><strong>MASESites AG</strong><br>Suisse</p>
    <h2>Contact</h2>
    <p><strong>E-mail :</strong> <a href="mailto:info@masesites.ch">info@masesites.ch</a><br>
    <strong>Téléphone :</strong> Sur demande avec rendez-vous</p>
    <h2>Personnes autorisées à représenter</h2>
    <p>Matteo &amp; Severin (fondateurs)</p>
    <h2>Clause de non-responsabilité</h2>
    <h3>Responsabilité du contenu</h3>
    <p>Le contenu de nos pages est créé avec le plus grand soin. Nous ne pouvons toutefois garantir l'exactitude, l'exhaustivité et l'actualité.</p>
    <h3>Responsabilité des liens</h3>
    <p>Notre offre contient des liens vers des sites tiers externes sur le contenu desquels nous n'avons aucune influence.</p>
    <h3>Droit d'auteur</h3>
    <p>Le contenu créé par les exploitants du site est soumis au droit d'auteur suisse. Toute reproduction nécessite une autorisation écrite.</p>
    <h2>Concept &amp; réalisation</h2>
    <p><strong>Design &amp; développement :</strong> MASESites AG – <a href="https://www.masesites.ch">www.masesites.ch</a><br>
    <strong>Technologie :</strong> HTML5, CSS3, Vanilla JavaScript</p>
    <p style="color:var(--muted);margin-top:3rem;font-size:0.9rem;">Dernière mise à jour : février 2026</p>`,
      privacy_title:   'Politique de confidentialité',
      privacy_lead:    'Transparence sur le traitement de vos données.',
      privacy_content: `<h2>1. Responsable du traitement</h2>
    <p><strong>MASESites AG</strong><br>
    E-mail : <a href="mailto:info@masesites.ch">info@masesites.ch</a></p>

    <h2>2. Collecte et traitement des données personnelles</h2>
    <h3>2.1 Formulaire de contact</h3>
    <p>Lorsque vous nous contactez via le formulaire, les données suivantes sont collectées :</p>
    <ul>
      <li>Nom</li>
      <li>Adresse e-mail</li>
      <li>Entreprise (optionnel)</li>
      <li>Texte du message</li>
    </ul>
    <p><strong>Finalité :</strong> Traitement de votre demande<br>
    <strong>Base légale :</strong> Consentement (art. 6, par. 1, let. a RGPD)<br>
    <strong>Durée de conservation :</strong> Jusqu'au traitement complet de la demande, puis suppression</p>

    <h3>2.2 Cookies</h3>
    <p>Nous utilisons des cookies pour améliorer l'expérience utilisateur.</p>
    <p><strong>Cookies techniquement nécessaires :</strong><br>
    <code>cookie-consent</code> : enregistre votre choix de cookies (365 jours)</p>
    <p><strong>Cookies analytiques (avec consentement uniquement) :</strong><br>
    Google Analytics est utilisé pour analyser le comportement utilisateur. L'anonymisation IP est activée.</p>

    <h2>3. Vos droits</h2>
    <p>Vous avez le droit d'accès, de rectification, de suppression et de limitation du traitement de vos données. Contactez-nous à <a href="mailto:info@masesites.ch">info@masesites.ch</a>.</p>

    <h2>4. Sécurité des données</h2>
    <p>Nous mettons en place des mesures techniques et organisationnelles pour protéger vos données contre la manipulation, la perte et l'accès non autorisé. Notre site utilise le chiffrement SSL (HTTPS).</p>

    <h2>5. Services externes</h2>
    <p>Nous utilisons <strong>Formspree</strong> pour traiter les formulaires de contact. Les données saisies sont transmises à Formspree Inc. Plus d'informations : <a href="https://formspree.io/legal/privacy-policy" target="_blank" rel="noopener">formspree.io/legal/privacy-policy</a></p>

    <p style="color:var(--muted);margin-top:3rem;font-size:0.9rem;">Dernière mise à jour : février 2026</p>`,
    }
  };

  var supportedLangs = ['de', 'en'];

  function isSupportedLang(lang) {
    return supportedLangs.indexOf(lang) !== -1;
  }

  function getLangFromUrl() {
    try {
      var urlLang = new URLSearchParams(window.location.search).get('lang');
      return isSupportedLang(urlLang) ? urlLang : null;
    } catch (_) {
      return null;
    }
  }

  var urlLang = getLangFromUrl();
  var storedLang = localStorage.getItem('lang');
  var currentLang = isSupportedLang(urlLang) ? urlLang : (isSupportedLang(storedLang) ? storedLang : 'de');
  if (storedLang !== currentLang) localStorage.setItem('lang', currentLang);

  // ==========================================
  // LANGUAGE ENGINE
  // ==========================================
  function applyLanguage(lang) {
    var safeLang = supportedLangs.indexOf(lang) !== -1 ? lang : 'de';
    currentLang = safeLang;
    localStorage.setItem('lang', safeLang);
    var t = translations[safeLang] || translations.de;

    // HTML (rich) translations first
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) {
        el.innerHTML = t[key];
      }
    });

    // Plain text translations
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        el.textContent = t[key];
      }
    });

    // ARIA label translations
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria-label');
      if (t[key] !== undefined) {
        el.setAttribute('aria-label', t[key]);
      }
    });

    // Update HTML lang attr
    document.documentElement.lang = safeLang === 'de' ? 'de-CH' : 'en';

    var langCurrent = document.getElementById('lang-current');
    if (langCurrent) langCurrent.textContent = safeLang.toUpperCase();

    document.querySelectorAll('.lang-option').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === safeLang);
    });

    // Keep language in current URL and propagate to internal links.
    syncCurrentUrlLanguage(safeLang);
    updateInternalLanguageLinks(safeLang);
  }

  function syncCurrentUrlLanguage(lang) {
    if (!window.history || typeof window.history.replaceState !== 'function') return;
    try {
      var url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      var next = url.pathname + url.search + url.hash;
      window.history.replaceState(null, '', next);
    } catch (_) {
      // no-op
    }
  }

  function updateInternalLanguageLinks(lang) {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var rawHref = (a.getAttribute('href') || '').trim();
      if (!rawHref) return;
      if (rawHref.indexOf('#') === 0) return;
      if (rawHref.indexOf('mailto:') === 0 || rawHref.indexOf('tel:') === 0 || rawHref.indexOf('javascript:') === 0) return;

      try {
        var url = new URL(rawHref, window.location.href);
        if (url.origin !== window.location.origin) return;

        url.searchParams.set('lang', lang);

        // Preserve style of relative links used across the project.
        var path = url.pathname;
        if (path.indexOf('/') === 0) path = path.slice(1);
        a.setAttribute('href', path + url.search + url.hash);
      } catch (_) {
        // Ignore malformed href values.
      }
    });
  }

  // ==========================================
  // DARK MODE PAINT SPLASH ANIMATION
  // ==========================================
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var themeTransitionRunning = false;

  function playPaintSplash(toDark, onComplete) {
    if (themeTransitionRunning) return;
    themeTransitionRunning = true;

    if (prefersReducedMotion) {
      if (onComplete) onComplete();
      themeTransitionRunning = false;
      return;
    }

    var overlay = document.getElementById('dark-wave');
    var canvas  = document.getElementById('dark-wave-canvas');
    if (!overlay || !canvas) {
      if (onComplete) onComplete();
      themeTransitionRunning = false;
      return;
    }

    var W = window.innerWidth;
    var H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    var ctx = canvas.getContext('2d');

    overlay.classList.add('active');

    // Origin near top-right (toggle area) with slight random offset
    var ox = W - 80 + (Math.random() * 40 - 20);
    var oy = 46 + (Math.random() * 30 - 15);

    var startTime = null;
    var duration = 980; // ms

    // Colors for dark / light splashes
    var baseColor = toDark ? 'rgba(9,14,22,0.96)' : 'rgba(245,248,255,0.96)';
    var accentColor = toDark ? 'rgba(23,35,55,0.92)' : 'rgba(220,232,255,0.92)';
    var edgeColor = toDark ? 'rgba(45,65,95,0.55)' : 'rgba(160,190,230,0.45)';

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    // Pre-generate splats (organic shapes) with fixed noise (no frame jitter)
    var splats = [];
    var count = 8;
    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2) * (i / count) + (Math.random() * 0.6 - 0.3);
      var dist = 40 + Math.random() * 220;
      var x = ox + Math.cos(angle) * dist;
      var y = oy + Math.sin(angle) * dist;
      var r = 120 + Math.random() * 260;
      var points = 12 + Math.floor(Math.random() * 8);
      var wobble = 0.22 + Math.random() * 0.26;
      var rot = Math.random() * Math.PI;
      var noise = [];
      for (var j = 0; j <= points; j++) {
        noise.push(0.92 + Math.random() * 0.16);
      }
      splats.push({ x: x, y: y, r: r, points: points, wobble: wobble, rot: rot, noise: noise });
    }

    function drawSplat(splat, scale, alpha, fill) {
      ctx.save();
      ctx.translate(splat.x, splat.y);
      ctx.rotate(splat.rot);
      ctx.beginPath();
      for (var i = 0; i <= splat.points; i++) {
        var t = (i / splat.points) * Math.PI * 2;
        var noise = splat.noise[i] * (1 + Math.sin(t * 3) * splat.wobble);
        var rr = splat.r * scale * noise;
        var px = Math.cos(t) * rr;
        var py = Math.sin(t) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.restore();
    }

    var themeApplied = false;

    function draw(ts) {
      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;
      var p = Math.min(elapsed / duration, 1);
      var eased = easeOutCubic(p);

      ctx.clearRect(0, 0, W, H);

      // Soft wash background (helps blend)
      ctx.globalAlpha = Math.min(0.85, eased);
      ctx.fillStyle = baseColor;
      ctx.fillRect(0, 0, W, H);

      // Core splash
      for (var i = 0; i < splats.length; i++) {
        var s = splats[i];
        var scale = eased * (0.55 + (i / splats.length) * 0.8);
        var alpha = Math.min(1, 0.18 + eased * 0.9);
        drawSplat(s, scale, alpha, i % 2 === 0 ? baseColor : accentColor);
      }

      // Edge tint for depth
      ctx.globalAlpha = 0.4 * eased;
      ctx.fillStyle = edgeColor;
      ctx.beginPath();
      ctx.ellipse(ox, oy, 420 * eased, 280 * eased, 0, 0, Math.PI * 2);
      ctx.fill();

      // Apply theme around mid point
      if (!themeApplied && p >= 0.45) {
        themeApplied = true;
        document.documentElement.classList.toggle('dark', toDark);
      }

      if (p < 1) {
        requestAnimationFrame(draw);
      } else {
        if (!themeApplied) {
          document.documentElement.classList.toggle('dark', toDark);
        }
        overlay.style.transition = 'opacity 0.35s ease';
        overlay.style.opacity = '0';
        setTimeout(function () {
          overlay.classList.remove('active');
          overlay.style.opacity = '';
          overlay.style.transition = '';
          ctx.clearRect(0, 0, W, H);
          if (onComplete) onComplete();
        }, 360);
      }
    }

    requestAnimationFrame(draw);
  }

  // ==========================================
  // DARK MODE ENGINE
  // ==========================================
  var storedTheme = localStorage.getItem('theme');
  var isDark = storedTheme === 'dark';
  if (!storedTheme) {
    isDark = false;
    localStorage.setItem('theme', 'light');
  }

  function applyThemeInstant(dark) {
    document.documentElement.classList.toggle('dark', !!dark);
    updateToggleUI(!!dark);
  }

  function setThemeTransitionState(active) {
    document.documentElement.classList.toggle('theme-switching', !!active);
  }

  function updateToggleUI(dark) {
    var icon = document.getElementById('dark-toggle-icon');
    if (icon) icon.textContent = dark ? '☀️' : '🌙';
    var btn = document.getElementById('dark-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(!!dark));
      btn.setAttribute('aria-label', dark ? 'Zum Light Mode wechseln' : 'Zum Dark Mode wechseln');
    }
  }

  function setTheme(dark, animated) {
    if (themeTransitionRunning) return;
    isDark = !!dark;
    localStorage.setItem('theme', isDark ? 'dark' : 'light');

    if (!animated || prefersReducedMotion) {
      setThemeTransitionState(true);
      applyThemeInstant(isDark);
      setTimeout(function () {
        setThemeTransitionState(false);
      }, 480);
      return;
    }

    setThemeTransitionState(true);
    playPaintSplash(isDark, function () {
      updateToggleUI(isDark);
      setThemeTransitionState(false);
      themeTransitionRunning = false;
    });
  }

  function initTheme() {
    applyThemeInstant(isDark);
    var btn = document.getElementById('dark-toggle');
    if (!btn || btn.dataset.bound === 'true') return;

    btn.dataset.bound = 'true';
    btn.addEventListener('click', function () {
      setTheme(!isDark, true);
    });
  }

  function initLanguage() {
    var langBtn = document.getElementById('lang-btn');
    var dropdown = document.getElementById('lang-dropdown');
    if (!langBtn || !dropdown) {
      applyLanguage(currentLang);
      return;
    }

    if (langBtn.dataset.bound !== 'true') {
      langBtn.dataset.bound = 'true';
      langBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = dropdown.classList.toggle('open');
        langBtn.setAttribute('aria-expanded', String(open));
      });

      document.addEventListener('click', function () {
        if (dropdown.classList.contains('open')) {
          dropdown.classList.remove('open');
          langBtn.setAttribute('aria-expanded', 'false');
        }
      });

      document.querySelectorAll('.lang-option').forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();
          applyLanguage(btn.getAttribute('data-lang'));
          dropdown.classList.remove('open');
          langBtn.setAttribute('aria-expanded', 'false');
        });
      });
    }

    applyLanguage(currentLang);
  }

  document.addEventListener('DOMContentLoaded', function () {
    initTheme();
    initLanguage();
  });
})();
