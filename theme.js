// ============================================
// MASESites THEME.JS — Übersetzungen (DE/EN)
// Helle Identität: kein Dark-Mode.
// ============================================
(function () {
  'use strict';

  // ==========================================
  // ÜBERSETZUNGEN
  // ==========================================
  var translations = {
    de: {
      // Allgemein
      skip_to_content: 'Zum Inhalt springen',
      nav_toggle:      'Navigation öffnen',
      lang_select_aria: 'Sprache wählen',
      nav_home:        'Home',
      nav_services:    'Leistungen',
      nav_prices:      'Preise',
      nav_ai:          'KI-Assistent',
      nav_about:       'Über uns',
      nav_contact:     'Kontakt',
      nav_cta:         'Erstgespräch vereinbaren',

      // Footer
      footer_desc:     'Professionelle Websites und KI-Integration aus der Schweiz.',
      footer_nav:      'Navigation',
      footer_contact:  'Kontakt',
      footer_legal:    'Rechtliches',
      footer_contact_form: 'Kontaktformular',
      footer_impressum: 'Impressum',
      footer_privacy:  'Datenschutz',
      footer_copy:     'Alle Rechte vorbehalten.',

      // Startseite — Hero
      hero_eyebrow:    'Webdesign & KI-Integration · Schweiz',
      hero_title_html: 'Websites, die <span class="serif-accent">verkaufen</span>.',
      hero_cover_sub:  'Schweizer Webagentur — klar, schnell, auf Anfragen gebaut.',
      hero_scroll_cue: 'Scrollen',
      hero_lead:       'Wir gestalten und entwickeln Websites für Unternehmen, die online ernst genommen werden wollen — klar strukturiert, technisch sauber und auf Anfragen ausgelegt.',
      hero_cta_primary: 'Erstgespräch vereinbaren',
      hero_cta_secondary: 'Leistungen ansehen',
      hero_note:       'Kostenlos und unverbindlich. Sie erhalten innert 24 Stunden eine Antwort.',
      fact_1_label:    'Umgesetzte Websites',
      fact_2_label:    'Garantierte Antwortzeit',
      fact_3_label:    'Projektstart ab Festpreis',

      // Startseite — Arbeitsweise
      trust_kicker:    'Wofür wir stehen',
      trust_title:     'Solide Arbeit statt grosser Worte',
      trust_speed:     'Verbindlichkeit',
      trust_speed_desc: 'Klare Prozesse, fixe Termine, kurze Wege. Sie wissen jederzeit, wo Ihr Projekt steht.',
      trust_code:      'Sauberer Code',
      trust_code_desc: 'Wartbar, schnell und zukunftssicher gebaut — das Fundament jeder guten Website.',
      trust_mobile:    'Mobile zuerst',
      trust_mobile_desc: 'Ihre Website funktioniert auf jedem Bildschirm einwandfrei. Ohne Kompromisse.',
      trust_ki:        'KI-Integration',
      trust_ki_desc:   'Auf Wunsch beantwortet ein Assistent Kundenfragen und qualifiziert Anfragen — rund um die Uhr.',

      // Startseite — Vorgehen
      process_kicker:  'Unser Vorgehen',
      process_title:   'Von der Analyse bis zur Betreuung',
      process_lead:    'Ein bewährter Ablauf in sechs Schritten — nachvollziehbar, planbar und ohne Überraschungen.',
      process_1_title: 'Analyse & Strategie',
      process_1_desc:  'Wir analysieren Ihr Unternehmen, Ihre Zielgruppe und den Wettbewerb. Daraus entstehen klare Ziele und ein klarer Plan.',
      process_2_title: 'Struktur & Konzept',
      process_2_desc:  'Seitenstruktur, Navigation und Benutzerführung werden geplant, bevor der erste Pixel gestaltet wird.',
      process_3_title: 'Gestaltung',
      process_3_desc:  'Ein klares, professionelles Erscheinungsbild, das Vertrauen schafft und Ihre Marke korrekt repräsentiert.',
      process_4_title: 'Entwicklung',
      process_4_desc:  'Schneller, wartbarer Code — mobile-first, suchmaschinenfreundlich und zukunftssicher gebaut.',
      process_5_title: 'Optimierung',
      process_5_desc:  'Nach dem Launch messen und verbessern wir Ladezeiten, Sichtbarkeit und Anfragequalität.',
      process_6_title: 'Betreuung & Support',
      process_6_desc:  'Auch nach dem Launch sind wir für Fragen, Updates und Weiterentwicklung erreichbar.',
      process_cta:     'Projekt besprechen',

      // Startseite — Qualität
      quality_kicker:  'Messbare Qualität',
      quality_title:   'Qualität, die sich messen lässt',
      quality_lead:    'Wir bauen nicht nur saubere Oberflächen — auch unter der Haube stimmt jedes Detail.',
      quality_point_1: 'Semantisches HTML für Struktur und Suchmaschinen',
      quality_point_2: 'Wartbarer, zukunftssicherer Code',
      quality_point_3: 'Optimiert für Geschwindigkeit und Mobilgeräte',
      quality_note:    'Gemessen mit Google Lighthouse an dieser Website.',

      // Startseite — Beispielprojekte
      work_kicker:     'Beispielprojekte',
      work_title:      'So können Kundenwebsites aussehen',
      work_lead:       'Vier Beispielumsetzungen aus unterschiedlichen Branchen — jede live abrufbar.',
      work_1_domain:   'Freizeit & Sport',
      work_1_title:    'Bowling Center',
      work_1_text:     'Klares Layout mit Fokus auf Buchung und Veranstaltungen.',
      work_1_li1:      'Prägnante Startseite mit klarer Botschaft',
      work_1_li2:      'Preisstruktur in wenigen Blöcken',
      work_1_li3:      'Reservation prominent platziert',
      work_2_domain:   'Gesundheit & Medizin',
      work_2_title:    'Praxis-Website',
      work_2_text:     'Seriöses Erscheinungsbild mit ruhiger Typografie und klarer Navigation.',
      work_2_li1:      'Übersichtliche Leistungsdarstellung',
      work_2_li2:      'Kontakt und Öffnungszeiten im Fokus',
      work_2_li3:      'Terminanfrage klar platziert',
      work_3_domain:   'Gastronomie',
      work_3_title:    'Imbiss & Restaurant',
      work_3_text:     'Konzentriert auf Speisekarte, Bestellung und Standortinformationen.',
      work_3_li1:      'Kompakte Menüstruktur',
      work_3_li2:      'Schnelle Lesbarkeit auf dem Smartphone',
      work_3_li3:      'Direkter Bestellweg',
      work_4_domain:   'Beauty & Wellness',
      work_4_title:    'Nagelstudio',
      work_4_text:     'Elegantes Einseiten-Design mit Angebot, Galerie und Terminbuchung.',
      work_4_li1:      'Klare Angebotskategorien',
      work_4_li2:      'Stimmige Preisdarstellung',
      work_4_li3:      'Terminanfrage ohne Ablenkung',
      work_open:       'Live ansehen',

      // Startseite — KI-Teaser
      ai_kicker:       'KI-Integration',
      ai_title:        'Ein Assistent, der für Sie arbeitet',
      ai_desc:         'Auf Wunsch ergänzen wir Ihre Website um einen KI-Assistenten: Er beantwortet Kundenfragen, nimmt Anfragen entgegen und qualifiziert Interessenten — rund um die Uhr.',
      ai_feature_1:    'Automatische Kundenberatung in Echtzeit',
      ai_feature_2:    'Lead-Qualifizierung mit Übergabe an Ihr Team',
      ai_feature_3:    'Trainiert mit Ihren eigenen Inhalten',
      ai_trust_1:      'Für KMU und Dienstleister',
      ai_trust_2:      'Antworten in Sekunden',
      ai_link:         'KI-Assistent kennenlernen',
      ai_chat_1:       'Guten Tag! Wie kann ich Ihnen helfen?',
      ai_chat_2:       'Was kostet eine Website?',
      ai_chat_3:       'Eine neue Website beginnt bei CHF 750. Die definitive Offerte erhalten Sie nach einem kurzen Gespräch.',
      ai_chat_4:       'Können Sie einen Termin einrichten?',
      ai_chat_5:       'Gerne. Hinterlassen Sie Ihre Kontaktdaten — wir melden uns bei Ihnen.',
      ai_chat_placeholder: 'Nachricht schreiben …',
      ai_chat_send:    'Senden',

      // Startseite — Preis-Teaser
      pricing_teaser_kicker: 'Transparente Preise',
      pricing_teaser_html: 'Festpreise statt <span class="accent-gradient">Überraschungen</span>',
      pricing_teaser_lead: 'Von der Überarbeitung bestehender Seiten bis zur kompletten Website — modulare Pakete ab CHF 250, transparent ausgewiesen.',
      pricing_teaser_link: 'Preise ansehen',

      // Leistungen
      services_eyebrow: 'Leistungen',
      services_title_html: 'Alles, was Ihre Website <span class="serif-accent">braucht</span>.',
      services_lead:   'Von der Gestaltung über die Entwicklung bis zur KI-Integration — alles aus einer Hand, sauber umgesetzt.',
      services_webdesign_h: 'Gestaltung, die Vertrauen schafft',
      services_webdesign_p: 'Der erste Eindruck entscheidet. Wir gestalten Websites, die professionell wirken, sofort überzeugen und aus Besuchern Kunden machen.',
      services_webdesign_list_html: '<li><strong>Klares Erscheinungsbild:</strong> professionell, zeitgemäss und unverwechselbar</li><li><strong>Struktur &amp; Hierarchie:</strong> intuitive Navigation und klare Benutzerführung</li><li><strong>Conversion-orientiert:</strong> jedes Element hat einen Zweck</li><li><strong>Responsiv:</strong> einwandfrei auf allen Geräten</li><li><strong>Markenkonsistenz:</strong> Ihr Auftritt, professionell umgesetzt</li>',
      services_webdesign_cta: 'Design anfragen',
      services_webdev_h: 'Code, der zuverlässig arbeitet',
      services_webdev_p: 'Sauberer, wartbarer Code ist kein Detail — er ist das Fundament für Geschwindigkeit, Sicherheit und langfristigen Erfolg Ihrer Website.',
      services_webdev_list_html: '<li><strong>Sauberer Code:</strong> modern, wartbar und zukunftssicher</li><li><strong>Performance:</strong> kurze Ladezeiten auf allen Geräten</li><li><strong>Skalierbar:</strong> wächst mit Ihrem Unternehmen</li><li><strong>SEO-ready:</strong> technisch sauber für Suchmaschinen</li><li><strong>Sicherheit:</strong> aktuelle Standards und bewährte Verfahren</li>',
      services_webdev_cta: 'Entwicklung anfragen',
      services_seo_h:  'Sichtbar bei Google',
      services_seo_p:  'Technische Optimierung für maximale Reichweite. Wir sorgen dafür, dass Ihre Website gefunden wird — und schnell lädt.',
      services_seo_list_html: '<li><strong>Technische Optimierung:</strong> Core Web Vitals erfüllt</li><li><strong>Strukturierte Inhalte:</strong> Schema.org und Meta-Daten</li><li><strong>Kurze Ladezeiten:</strong> messbar schnell auf jedem Gerät</li><li><strong>Mobile-first:</strong> nach Google-Vorgaben optimiert</li><li><strong>Auswertbar:</strong> messbare Resultate statt Bauchgefühl</li>',
      services_seo_cta: 'SEO anfragen',
      services_ki_h:   'Beratung rund um die Uhr',
      services_ki_p:   'Ein digitaler Mitarbeiter, der nie schläft: Der KI-Assistent beantwortet Kundenfragen, qualifiziert Anfragen und entlastet Ihr Team — Tag und Nacht.',
      services_ai_list_html: '<li><strong>24/7 Kundenberatung:</strong> automatische Antworten rund um die Uhr</li><li><strong>Lead-Qualifizierung:</strong> Anfragen werden vorsortiert</li><li><strong>FAQ &amp; Produktwissen:</strong> beantwortet Standardfragen sofort</li><li><strong>Individuell trainierbar:</strong> mit Ihren eigenen Inhalten</li><li><strong>Einfache Integration:</strong> fügt sich nahtlos in Ihre Website ein</li>',
      services_ai_cta: 'Mehr zum KI-Assistenten',
      services_ai_chat_bot: 'Guten Tag! Wie kann ich Ihnen helfen?',
      services_ai_chat_user: 'Was kostet eine Website?',
      services_ai_chat_reply: 'Eine neue Website beginnt bei CHF 750. Soll ich Ihnen die Details zeigen?',
      services_ai_chat_placeholder: 'Nachricht schreiben …',
      services_cta_eyebrow: 'Nächster Schritt',
      services_cta_title: 'Bereit für Ihr Projekt?',
      services_cta_lead: 'In einem kostenlosen Erstgespräch klären wir, welche Lösung zu Ihrem Unternehmen passt.',
      services_cta_primary: 'Erstgespräch vereinbaren',
      services_cta_secondary: 'Preise ansehen',
      services_cta_trust: 'Kostenlos und unverbindlich · Antwort innert 24 Stunden · Schweizer Qualität',

      // Preise
      pricing_eyebrow: 'Transparente Preise',
      pricing_title_html: 'Stellen Sie Ihr Paket <span class="serif-accent">zusammen</span>.',
      pricing_lead:    'Wählen Sie, was Sie brauchen, und kombinieren Sie frei. Sie erhalten von uns eine klare, verbindliche Offerte.',
      pricing_stat_1:  'Neue Website',
      pricing_stat_2:  'Überarbeitung',
      pricing_stat_3:  'KI-Setup',
      pricing_intro:   'Wählen Sie die gewünschten Leistungen per Klick aus. Unten sehen Sie Ihre Auswahl und können die Anfrage direkt absenden.',
      pricing_step_1:  'Leistungen wählen',
      pricing_step_2:  'Paket prüfen',
      pricing_step_3:  'Anfrage senden',
      pricing_note_single: 'Nur eine Option wählbar',
      pricing_tab_new: 'Neue Website',
      pricing_tab_revision: 'Überarbeitung',
      pricing_note_addon: 'Ergänzung — optional',
      pricing_note_bundle: 'Einzeln oder im Paket',
      pricing_faq_kicker: 'Häufige Fragen',
      pricing_faq_title: 'Was Sie zu unseren Preisen wissen sollten',
      pricing_cta_eyebrow: 'Nächster Schritt',
      pricing_cta_title: 'Bereit für Ihr Projekt?',
      pricing_cta_lead: 'Kostenloses Erstgespräch — 15 Minuten, klare Antworten, kein Verkaufsdruck.',
      pricing_cta_trust: 'Schweizer Qualität · Transparente Festpreise · Ehrliche Beratung',

      // Kontakt
      ktk_hero_eyebrow: 'Kontakt',
      ktk_hero_title_html: 'Sprechen wir über <span class="serif-accent">Ihr Projekt</span>.',
      ktk_hero_lead: 'Schildern Sie uns Ihr Vorhaben — wir melden uns innerhalb von 24 Stunden mit einem konkreten Vorschlag.',
      ktk_badge_1: 'Antwort innert 24 Stunden',
      ktk_badge_2: 'Kostenloses Erstgespräch',
      ktk_badge_3: 'Unverbindlich',
      ktk_info_label: 'Direkter Kontakt',
      ktk_info_heading: 'Schreiben Sie uns',
      ktk_trust_1_title: 'Schnelle Antwort',
      ktk_trust_1_desc: 'Wir melden uns innerhalb von 24 Stunden — garantiert.',
      ktk_trust_2_title: 'Kostenlose Erstberatung',
      ktk_trust_2_desc: 'Erstes Gespräch ohne Verpflichtung und ohne versteckte Kosten.',
      ktk_trust_3_title: 'Datenschutz',
      ktk_trust_3_desc: 'Ihre Daten sind sicher. Keine Weitergabe an Dritte.',
      ktk_trust_4_title: 'Aus der Schweiz',
      ktk_trust_4_desc: 'Schweizer Qualität und Zuverlässigkeit — persönlich und direkt.',
      ktk_response_html: 'Antwortzeit: durchschnittlich <strong>unter 4 Stunden</strong>',
      ktk_prefill_banner: 'Paket-Konfiguration übernommen — ergänzen Sie Ihre Kontaktdaten und senden Sie die Anfrage ab.',
      ktk_error_html: 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt an <a href="mailto:info@masesites.ch">info@masesites.ch</a>.',
      ktk_label_name: 'Name *',
      ktk_placeholder_name: 'Max Muster',
      ktk_err_name: 'Bitte geben Sie Ihren Namen ein.',
      ktk_label_email: 'E-Mail *',
      ktk_placeholder_email: 'max@firma.ch',
      ktk_err_email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      ktk_label_company_html: 'Firma <span style="font-weight:400;opacity:0.6">(optional)</span>',
      ktk_placeholder_company: 'Firma',
      ktk_label_project: 'Projektart',
      contact_page_project_select: 'Bitte wählen …',
      contact_page_project_new: 'Neue Website',
      contact_page_project_revision: 'Website-Überarbeitung',
      contact_page_project_ai: 'KI-Assistent Integration',
      contact_page_project_seo: 'SEO & Performance',
      contact_page_project_consulting: 'Beratung',
      contact_page_project_other: 'Sonstiges',
      ktk_label_message: 'Nachricht *',
      ktk_placeholder_message: 'Schildern Sie uns Ihr Projekt — Ziele, Zeitplan, Budget …',
      ktk_err_message: 'Bitte schreiben Sie uns eine kurze Nachricht.',
      ktk_privacy_html: 'Ich habe die <a href="datenschutz.html">Datenschutzerklärung</a> gelesen und akzeptiere sie. *',
      ktk_submit: 'Anfrage senden',
      ktk_mailto_text: 'Oder direkt per E-Mail:',
      ktk_success_title: 'Anfrage gesendet',
      ktk_success_text: 'Vielen Dank für Ihre Nachricht. Wir melden uns innerhalb von 24 Stunden bei Ihnen — meist deutlich früher.',
      ktk_success_fallback_text: 'Keine Bestätigung erhalten? Schreiben Sie direkt an',

      // Über uns
      about_eyebrow: 'Über uns',
      about_page_hero_title_html: 'Die Köpfe hinter <span class="serif-accent">MASESites</span>',
      about_page_hero_lead: 'Zwei Gründer, ein Anspruch: Websites, die handwerklich sauber gebaut sind und für ihre Besitzer arbeiten.',
      about_story_kicker: 'Unsere Geschichte',
      about_page_story_title: 'Ehrliche Arbeit, sauberer Code',
      about_page_story_p1_html: 'MASESites wurde von <strong>Matteo</strong> und <strong>Severin</strong> gegründet. Unser Ziel ist klar: moderne, klar strukturierte und leistungsfähige Websites bauen, die echte Resultate liefern.',
      about_quote: '«Keine falschen Versprechen, keine erfundenen Referenzen — nur solide Handarbeit mit Fokus auf Qualität.»',
      about_page_story_p2: 'Wir glauben an ehrliche Arbeit, sauberen Code und transparente Kommunikation. Sie wissen jederzeit, woran wir arbeiten und was es kostet.',
      about_page_story_p3: 'Mit unserem Hintergrund in Webentwicklung und Gestaltung verbinden wir technisches Können mit einem Gespür für gutes Design. Das Ergebnis: Websites, die nicht nur gut aussehen, sondern auch verkaufen.',
      about_values_kicker: 'Unsere Werte',
      about_page_value_honesty_title: 'Ehrlichkeit',
      about_page_value_honesty_desc: 'Keine erfundenen Fallstudien, keine geschönten Zahlen. Nur ehrliche, transparente Arbeit.',
      about_page_value_quality_title: 'Sorgfalt',
      about_page_value_quality_desc: 'Qualität vor Tempo. Jede Zeile Code wird mit Sorgfalt geschrieben.',
      about_page_value_comms_title: 'Klare Kommunikation',
      about_page_value_comms_desc: 'Sie wissen immer, wo Ihr Projekt steht. Keine Überraschungen.',
      about_page_value_results_title: 'Fokus auf Resultate',
      about_page_value_results_desc: 'Ihre Website soll verkaufen. Anfragen und Conversion stehen im Mittelpunkt.',
      about_cta_eyebrow: 'Nächster Schritt',
      about_page_cta_title: 'Besprechen wir Ihr Projekt',
      about_page_cta_lead: 'Wir freuen uns, von Ihrem Vorhaben zu hören — unverbindlich und auf Augenhöhe.',
      about_page_cta_button: 'Kontakt aufnehmen',

      // KI-Assistent
      ki_hero_eyebrow: 'MASESites KI-Assistent',
      ki_hero_title_html: 'Ihr digitaler Mitarbeiter — <span class="serif-accent">rund um die Uhr</span>',
      ki_hero_lead: 'Automatische Kundenberatung, Lead-Qualifizierung und FAQ-Beantwortung. An 365 Tagen im Jahr — auch ausserhalb Ihrer Geschäftszeiten.',
      ki_stat_1: 'Antwort in unter 1 Sekunde',
      ki_stat_2: '24/7 im Einsatz',
      ki_stat_3: '+40% mehr Anfragen',
      ki_hero_cta_primary: 'KI-Assistent anfragen',
      ki_hero_cta_secondary: 'So funktioniert es',
      ki_chat_name: 'MASESites KI-Assistent',
      ki_chat_status: 'Online — antwortet sofort',
      ki_chat_badge: 'Demo',
      ki_chat_placeholder: 'Nachricht schreiben …',
      ki_impact_lbl_1: 'Antwortzeit',
      ki_impact_lbl_2: 'Verfügbarkeit',
      ki_impact_lbl_3: 'Mehr Anfragen',
      ki_impact_lbl_4: 'Einrichtungszeit',
      ki_steps_eyebrow: 'Der Ablauf',
      ki_steps_title: 'In drei Schritten einsatzbereit',
      ki_steps_lead: 'Vom ersten Gespräch bis zum fertigen Assistenten auf Ihrer Website — in weniger als einer Woche.',
      ki_step_1_title: 'Training',
      ki_step_1_desc: 'Sie senden uns Ihre Inhalte — FAQ, Produkttexte, Dokumente. Wir trainieren den Assistenten auf Ihr Unternehmen.',
      ki_step_2_title: 'Integration',
      ki_step_2_desc: 'Wir binden den Assistenten nahtlos in Ihre Website ein. Technisches Wissen ist auf Ihrer Seite nicht nötig.',
      ki_step_3_title: 'Betrieb',
      ki_step_3_desc: 'Der Assistent beantwortet Anfragen automatisch, qualifiziert Interessenten und übergibt komplexe Fälle an Sie.',
      ki_cap_eyebrow: 'Leistungsumfang',
      ki_cap_title: 'Was der Assistent für Sie übernimmt',
      ki_cap_1_title: 'Kundenberatung rund um die Uhr',
      ki_cap_1_desc: 'Erreichbar zu jeder Zeit — auch nachts, am Wochenende und an Feiertagen.',
      ki_cap_2_title: 'Lead-Qualifizierung',
      ki_cap_2_desc: 'Interessenten werden vorsortiert, Bedarf und Budget geklärt — bevor Sie eingreifen.',
      ki_cap_3_title: 'Automatische FAQ-Antworten',
      ki_cap_3_desc: 'Standardfragen zu Preisen, Lieferzeiten oder Öffnungszeiten werden sofort beantwortet.',
      ki_cap_4_title: 'Terminvorbereitung',
      ki_cap_4_desc: 'Weniger Hin und Her — der Assistent sammelt alle relevanten Angaben vorab.',
      ki_cap_5_title: 'Mehrsprachig',
      ki_cap_5_desc: 'Deutsch, Englisch, Französisch und weitere Sprachen — die Sprache wird automatisch erkannt.',
      ki_cap_6_title: 'Individuell trainierbar',
      ki_cap_6_desc: 'Mit Ihren Dokumenten, Website-Texten und Produktinformationen — der Assistent kennt Ihr Geschäft.',
      ki_audience_eyebrow: 'Einsatzgebiete',
      ki_audience_title: 'Für wen sich der Assistent eignet',
      ki_audience_1_title: 'KMU & Dienstleister',
      ki_audience_1_desc: 'Anfragen werden automatisch beantwortet — auch ausserhalb der Geschäftszeiten. Mehr Anfragen, weniger Aufwand.',
      ki_audience_2_title: 'Online-Shops',
      ki_audience_2_desc: 'Produktberatung, Grössentabellen, Versandinformationen — der Assistent erklärt alles und steigert die Conversion.',
      ki_audience_3_title: 'Coaches & Berater',
      ki_audience_3_desc: 'Interessenten werden vor dem ersten Gespräch qualifiziert. Das spart Zeit für die wirklich passenden Kunden.',
      ki_audience_4_title: 'Start-ups',
      ki_audience_4_desc: 'Professioneller Support ohne grosses Team — skalierbar, kosteneffizient und jederzeit bereit.',
      ki_pricing_eyebrow: 'Preise & Integration',
      ki_pricing_title: 'Einfache, transparente Konditionen',
      ki_pricing_feats_heading: 'Im Preis enthalten:',
      ki_pricing_feat_1: 'Vollständige Einrichtung und Konfiguration',
      ki_pricing_feat_2: 'Training mit Ihren Inhalten',
      ki_pricing_feat_3: 'Integration in Ihre Website',
      ki_pricing_feat_4: 'Mehrsprachiger Betrieb',
      ki_pricing_feat_5: 'Laufende Wartung und Aktualisierung',
      ki_pricing_feat_6: 'Monatlich kündbar — kein Jahresvertrag',
      ki_pricing_feat_7: 'DSGVO-konform — Ihre Daten bleiben geschützt',
      ki_pricing_addon_note: 'Als Ergänzung zu jeder MASESites-Website oder als eigenständige Integration in Ihre bestehende Website.',
      ki_pc_badge: 'KI-Assistent',
      ki_pc_title: 'Integration & Einrichtung',
      ki_pc_amount_sub: 'einmalig',
      ki_pc_monthly: '+ CHF 40 / Monat (Hosting & Support)',
      ki_pc_note: 'Im kostenlosen Erstgespräch zeigen wir Ihnen live, was der Assistent für Ihr Unternehmen leisten kann.',
      ki_pc_cta: 'KI-Assistent anfragen',
      ki_faq_eyebrow: 'Häufige Fragen',
      ki_faq_title: 'Was Kunden uns oft fragen',
      ki_faq_q1: 'Wie wird der KI-Assistent trainiert?',
      ki_faq_a1: 'Wir trainieren ihn mit Ihren Inhalten: FAQ, Produktbeschreibungen, Dokumenten und Website-Texten. So kann er gezielt auf die Fragen Ihrer Kundschaft eingehen.',
      ki_faq_q2: 'Kann er auch komplexe Fragen beantworten?',
      ki_faq_a2: 'Ja. Auf Basis Ihrer Inhalte gibt er detaillierte Antworten. Bei sehr spezifischen oder sensiblen Fragen leitet er nahtlos an Ihr Team weiter.',
      ki_faq_q3: 'Funktioniert er in mehreren Sprachen?',
      ki_faq_a3: 'Ja — Deutsch, Englisch, Französisch und weitere Sprachen sind möglich. Der Assistent erkennt die Sprache automatisch und antwortet entsprechend.',
      ki_faq_q4: 'Können Inhalte später aktualisiert werden?',
      ki_faq_a4: 'Ja. Sie können uns jederzeit neue Inhalte senden — Preisänderungen, neue Produkte, aktualisierte FAQ — und wir trainieren den Assistenten nach. Schnell und unkompliziert.',
      ki_faq_q5: 'Was geschieht mit den Daten meiner Kundschaft?',
      ki_faq_a5: 'Alle Daten werden DSGVO-konform verarbeitet. Es erfolgt keine Weitergabe an Dritte.',
      ki_faq_q6: 'Lässt sich der Assistent in eine bestehende Website integrieren?',
      ki_faq_a6: 'Ja, in jede bestehende Website — ob WordPress, Shopify oder eine individuelle Lösung. Ein kleines Code-Snippet genügt.',
      ki_cta_eyebrow: 'Nächster Schritt',
      ki_cta_title: 'Bereit für Ihren digitalen Mitarbeiter?',
      ki_cta_lead: 'Im kostenlosen Erstgespräch zeigen wir Ihnen live, was der KI-Assistent für Ihr Unternehmen leisten kann.',
      ki_cta_btn: 'Erstgespräch vereinbaren',
      ki_cta_trust: 'Unverbindlich · Kostenlose Demo · Antwort innert 24 Stunden',

      // Danke-Seite
      thanks_title:    'Vielen Dank!',
      thanks_message_html: 'Ihre Nachricht ist bei uns eingegangen.<br>Wir melden uns innerhalb von <strong>24 Stunden</strong> bei Ihnen.',
      thanks_redirect: 'Sie werden in 5 Sekunden automatisch weitergeleitet …',
      thanks_home:     'Zurück zur Startseite',
      thanks_services: 'Unsere Leistungen',

      // Impressum
      impressum_title: 'Impressum',
      impressum_lead:  'Angaben gemäss Art. 5 DSG (Schweiz)',
      impressum_content: `<h2>Betreiber der Website</h2>
    <p><strong>MASESites</strong><br>Schweiz</p>
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
    <p><strong>Design &amp; Entwicklung:</strong> MASESites – <a href="https://www.masesites.ch">www.masesites.ch</a><br>
    <strong>Technologie:</strong> HTML5, CSS3, Vanilla JavaScript</p>
    <p style="color:var(--muted);margin-top:3rem;font-size:0.9rem;">Stand: Juni 2026</p>`,

      // Datenschutz
      privacy_title:   'Datenschutzerklärung',
      privacy_lead:    'Transparenz über die Verarbeitung Ihrer Daten.',
      privacy_content: `<h2>1. Verantwortliche Stelle</h2>
    <p><strong>MASESites</strong><br>
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
    <p>Wir nutzen <strong>Web3Forms</strong> für die Verarbeitung von Kontaktformularen. Dabei werden die von Ihnen eingegebenen Daten an Web3Forms übermittelt. Weitere Informationen: <a href="https://web3forms.com/privacy" target="_blank" rel="noopener">web3forms.com/privacy</a></p>

    <p style="color:var(--muted);margin-top:3rem;font-size:0.9rem;">Stand: Juni 2026</p>`
    },

    en: {
      // General
      skip_to_content: 'Skip to content',
      nav_toggle:      'Open navigation',
      lang_select_aria: 'Choose language',
      nav_home:        'Home',
      nav_services:    'Services',
      nav_prices:      'Pricing',
      nav_ai:          'AI Assistant',
      nav_about:       'About us',
      nav_contact:     'Contact',
      nav_cta:         'Book a consultation',

      // Footer
      footer_desc:     'Professional websites and AI integration from Switzerland.',
      footer_nav:      'Navigation',
      footer_contact:  'Contact',
      footer_legal:    'Legal',
      footer_contact_form: 'Contact form',
      footer_impressum: 'Legal notice',
      footer_privacy:  'Privacy policy',
      footer_copy:     'All rights reserved.',

      // Home — Hero
      hero_eyebrow:    'Web design & AI integration · Switzerland',
      hero_title_html: 'Websites that <span class="serif-accent">sell</span>.',
      hero_cover_sub:  'Swiss web agency — clear, fast, built to convert.',
      hero_scroll_cue: 'Scroll',
      hero_lead:       'We design and build websites for businesses that want to be taken seriously online — clearly structured, technically sound, and built to generate enquiries.',
      hero_cta_primary: 'Book a consultation',
      hero_cta_secondary: 'View services',
      hero_note:       'Free and without obligation. You will receive a reply within 24 hours.',
      fact_1_label:    'Websites delivered',
      fact_2_label:    'Guaranteed response time',
      fact_3_label:    'Fixed-price project start',

      // Home — Principles
      trust_kicker:    'What we stand for',
      trust_title:     'Solid work instead of big words',
      trust_speed:     'Reliability',
      trust_speed_desc: 'Clear processes, fixed deadlines, short paths. You always know where your project stands.',
      trust_code:      'Clean code',
      trust_code_desc: 'Maintainable, fast and future-proof — the foundation of every good website.',
      trust_mobile:    'Mobile first',
      trust_mobile_desc: 'Your website works flawlessly on every screen. No compromises.',
      trust_ki:        'AI integration',
      trust_ki_desc:   'On request, an assistant answers customer questions and qualifies enquiries — around the clock.',

      // Home — Process
      process_kicker:  'Our approach',
      process_title:   'From analysis to ongoing care',
      process_lead:    'A proven six-step process — transparent, plannable and without surprises.',
      process_1_title: 'Analysis & strategy',
      process_1_desc:  'We analyse your business, your audience and your competition. The result: clear goals and a clear plan.',
      process_2_title: 'Structure & concept',
      process_2_desc:  'Page structure, navigation and user flows are planned before the first pixel is designed.',
      process_3_title: 'Design',
      process_3_desc:  'A clear, professional appearance that builds trust and represents your brand correctly.',
      process_4_title: 'Development',
      process_4_desc:  'Fast, maintainable code — mobile-first, search-engine friendly and built to last.',
      process_5_title: 'Optimisation',
      process_5_desc:  'After launch we measure and improve loading times, visibility and enquiry quality.',
      process_6_title: 'Care & support',
      process_6_desc:  'We remain available for questions, updates and further development after launch.',
      process_cta:     'Discuss your project',

      // Home — Quality
      quality_kicker:  'Measurable quality',
      quality_title:   'Quality you can measure',
      quality_lead:    'We don\'t just build clean surfaces — every detail under the hood is right, too.',
      quality_point_1: 'Semantic HTML for structure and search engines',
      quality_point_2: 'Maintainable, future-proof code',
      quality_point_3: 'Optimised for speed and mobile devices',
      quality_note:    'Measured with Google Lighthouse on this website.',

      // Home — Work
      work_kicker:     'Sample projects',
      work_title:      'What client websites can look like',
      work_lead:       'Four sample builds from different industries — each available live.',
      work_1_domain:   'Leisure & sports',
      work_1_title:    'Bowling Center',
      work_1_text:     'Clear layout focused on bookings and events.',
      work_1_li1:      'Concise home page with a clear message',
      work_1_li2:      'Pricing in a few clear blocks',
      work_1_li3:      'Reservation prominently placed',
      work_2_domain:   'Health & medicine',
      work_2_title:    'Medical practice',
      work_2_text:     'A serious appearance with calm typography and clear navigation.',
      work_2_li1:      'Clear presentation of services',
      work_2_li2:      'Contact and opening hours in focus',
      work_2_li3:      'Appointment request clearly placed',
      work_3_domain:   'Gastronomy',
      work_3_title:    'Takeaway & restaurant',
      work_3_text:     'Focused on the menu, ordering and location information.',
      work_3_li1:      'Compact menu structure',
      work_3_li2:      'Fast readability on smartphones',
      work_3_li3:      'Direct ordering path',
      work_4_domain:   'Beauty & wellness',
      work_4_title:    'Nail studio',
      work_4_text:     'Elegant one-page design with services, gallery and booking.',
      work_4_li1:      'Clear service categories',
      work_4_li2:      'Coherent price presentation',
      work_4_li3:      'Appointment request without distraction',
      work_open:       'View live',

      // Home — AI teaser
      ai_kicker:       'AI integration',
      ai_title:        'An assistant that works for you',
      ai_desc:         'On request we add an AI assistant to your website: it answers customer questions, receives enquiries and qualifies prospects — around the clock.',
      ai_feature_1:    'Automatic customer support in real time',
      ai_feature_2:    'Lead qualification with handover to your team',
      ai_feature_3:    'Trained with your own content',
      ai_trust_1:      'For SMEs and service providers',
      ai_trust_2:      'Answers within seconds',
      ai_link:         'Discover the AI assistant',
      ai_chat_1:       'Good day! How may I help you?',
      ai_chat_2:       'How much does a website cost?',
      ai_chat_3:       'A new website starts at CHF 750. You will receive the final quote after a short call.',
      ai_chat_4:       'Can you arrange an appointment?',
      ai_chat_5:       'Certainly. Leave your contact details — we will get back to you.',
      ai_chat_placeholder: 'Write a message …',
      ai_chat_send:    'Send',

      // Home — Pricing teaser
      pricing_teaser_kicker: 'Transparent pricing',
      pricing_teaser_html: 'Fixed prices instead of <span class="accent-gradient">surprises</span>',
      pricing_teaser_lead: 'From reworking existing pages to a complete website — modular packages from CHF 250, transparently listed.',
      pricing_teaser_link: 'View pricing',

      // Services
      services_eyebrow: 'Services',
      services_title_html: 'Everything your website <span class="serif-accent">needs</span>.',
      services_lead:   'From design and development to AI integration — everything from a single source, cleanly executed.',
      services_webdesign_h: 'Design that builds trust',
      services_webdesign_p: 'First impressions decide. We design websites that look professional, convince instantly and turn visitors into customers.',
      services_webdesign_list_html: '<li><strong>Clear appearance:</strong> professional, contemporary and distinctive</li><li><strong>Structure &amp; hierarchy:</strong> intuitive navigation and clear user guidance</li><li><strong>Conversion-oriented:</strong> every element has a purpose</li><li><strong>Responsive:</strong> flawless on all devices</li><li><strong>Brand consistency:</strong> your identity, professionally executed</li>',
      services_webdesign_cta: 'Request design',
      services_webdev_h: 'Code that works reliably',
      services_webdev_p: 'Clean, maintainable code is not a detail — it is the foundation for speed, security and the long-term success of your website.',
      services_webdev_list_html: '<li><strong>Clean code:</strong> modern, maintainable and future-proof</li><li><strong>Performance:</strong> short loading times on all devices</li><li><strong>Scalable:</strong> grows with your business</li><li><strong>SEO-ready:</strong> technically sound for search engines</li><li><strong>Security:</strong> current standards and proven practices</li>',
      services_webdev_cta: 'Request development',
      services_seo_h:  'Visible on Google',
      services_seo_p:  'Technical optimisation for maximum reach. We make sure your website is found — and loads quickly.',
      services_seo_list_html: '<li><strong>Technical optimisation:</strong> Core Web Vitals met</li><li><strong>Structured content:</strong> Schema.org and meta data</li><li><strong>Short loading times:</strong> measurably fast on any device</li><li><strong>Mobile-first:</strong> optimised to Google\'s guidelines</li><li><strong>Measurable:</strong> measurable results instead of gut feeling</li>',
      services_seo_cta: 'Request SEO',
      services_ki_h:   'Advice around the clock',
      services_ki_p:   'A digital employee that never sleeps: the AI assistant answers customer questions, qualifies enquiries and relieves your team — day and night.',
      services_ai_list_html: '<li><strong>24/7 customer support:</strong> automatic answers around the clock</li><li><strong>Lead qualification:</strong> enquiries are pre-sorted</li><li><strong>FAQ &amp; product knowledge:</strong> answers standard questions instantly</li><li><strong>Individually trainable:</strong> with your own content</li><li><strong>Easy integration:</strong> fits seamlessly into your website</li>',
      services_ai_cta: 'More about the AI assistant',
      services_ai_chat_bot: 'Good day! How may I help you?',
      services_ai_chat_user: 'How much does a website cost?',
      services_ai_chat_reply: 'A new website starts at CHF 750. Shall I show you the details?',
      services_ai_chat_placeholder: 'Write a message …',
      services_cta_eyebrow: 'Next step',
      services_cta_title: 'Ready for your project?',
      services_cta_lead: 'In a free initial consultation we determine which solution fits your business.',
      services_cta_primary: 'Book a consultation',
      services_cta_secondary: 'View pricing',
      services_cta_trust: 'Free and without obligation · Reply within 24 hours · Swiss quality',

      // Pricing
      pricing_eyebrow: 'Transparent pricing',
      pricing_title_html: 'Put your package <span class="serif-accent">together</span>.',
      pricing_lead:    'Choose what you need and combine freely. You will receive a clear, binding quote from us.',
      pricing_stat_1:  'New website',
      pricing_stat_2:  'Revision',
      pricing_stat_3:  'AI setup',
      pricing_intro:   'Select the desired services with a click. Below you will see your selection and can send the enquiry directly.',
      pricing_step_1:  'Choose services',
      pricing_step_2:  'Review package',
      pricing_step_3:  'Send enquiry',
      pricing_note_single: 'Only one option selectable',
      pricing_tab_new: 'New website',
      pricing_tab_revision: 'Revision',
      pricing_note_addon: 'Add-on — optional',
      pricing_note_bundle: 'Individually or as a package',
      pricing_faq_kicker: 'Frequently asked questions',
      pricing_faq_title: 'What you should know about our pricing',
      pricing_cta_eyebrow: 'Next step',
      pricing_cta_title: 'Ready for your project?',
      pricing_cta_lead: 'Free initial consultation — 15 minutes, clear answers, no sales pressure.',
      pricing_cta_trust: 'Swiss quality · Transparent fixed prices · Honest advice',

      // Contact
      ktk_hero_eyebrow: 'Contact',
      ktk_hero_title_html: 'Let\'s talk about <span class="serif-accent">your project</span>.',
      ktk_hero_lead: 'Tell us about your plans — we will get back to you within 24 hours with a concrete proposal.',
      ktk_badge_1: 'Reply within 24 hours',
      ktk_badge_2: 'Free initial consultation',
      ktk_badge_3: 'No obligation',
      ktk_info_label: 'Direct contact',
      ktk_info_heading: 'Write to us',
      ktk_trust_1_title: 'Fast reply',
      ktk_trust_1_desc: 'We get back to you within 24 hours — guaranteed.',
      ktk_trust_2_title: 'Free initial consultation',
      ktk_trust_2_desc: 'First conversation with no commitment and no hidden costs.',
      ktk_trust_3_title: 'Data protection',
      ktk_trust_3_desc: 'Your data is secure. No sharing with third parties.',
      ktk_trust_4_title: 'From Switzerland',
      ktk_trust_4_desc: 'Swiss quality and reliability — personal and direct.',
      ktk_response_html: 'Response time: on average <strong>under 4 hours</strong>',
      ktk_prefill_banner: 'Package configuration applied — add your contact details and send the enquiry.',
      ktk_error_html: 'An error occurred. Please try again or write directly to <a href="mailto:info@masesites.ch">info@masesites.ch</a>.',
      ktk_label_name: 'Name *',
      ktk_placeholder_name: 'John Smith',
      ktk_err_name: 'Please enter your name.',
      ktk_label_email: 'E-mail *',
      ktk_placeholder_email: 'john@company.com',
      ktk_err_email: 'Please enter a valid e-mail address.',
      ktk_label_company_html: 'Company <span style="font-weight:400;opacity:0.6">(optional)</span>',
      ktk_placeholder_company: 'Company Ltd',
      ktk_label_project: 'Project type',
      contact_page_project_select: 'Please choose …',
      contact_page_project_new: 'New website',
      contact_page_project_revision: 'Website revision',
      contact_page_project_ai: 'AI assistant integration',
      contact_page_project_seo: 'SEO & performance',
      contact_page_project_consulting: 'Consulting',
      contact_page_project_other: 'Other',
      ktk_label_message: 'Message *',
      ktk_placeholder_message: 'Tell us about your project — goals, timeline, budget …',
      ktk_err_message: 'Please write us a short message.',
      ktk_privacy_html: 'I have read and accept the <a href="datenschutz.html">privacy policy</a>. *',
      ktk_submit: 'Send enquiry',
      ktk_mailto_text: 'Or directly by e-mail:',
      ktk_success_title: 'Enquiry sent',
      ktk_success_text: 'Thank you for your message. We will get back to you within 24 hours — usually much sooner.',
      ktk_success_fallback_text: 'No confirmation received? Write directly to',

      // About
      about_eyebrow: 'About us',
      about_page_hero_title_html: 'The people behind <span class="serif-accent">MASESites</span>',
      about_page_hero_lead: 'Two founders, one standard: websites that are cleanly crafted and work for their owners.',
      about_story_kicker: 'Our story',
      about_page_story_title: 'Honest work, clean code',
      about_page_story_p1_html: 'MASESites was founded by <strong>Matteo</strong> and <strong>Severin</strong>. Our goal is clear: building modern, clearly structured, high-performing websites that deliver real results.',
      about_quote: '"No false promises, no invented references — just solid craftsmanship with a focus on quality."',
      about_page_story_p2: 'We believe in honest work, clean code and transparent communication. You always know what we are working on and what it costs.',
      about_page_story_p3: 'With our background in web development and design, we combine technical skill with a feel for good design. The result: websites that not only look good, but also sell.',
      about_values_kicker: 'Our values',
      about_page_value_honesty_title: 'Honesty',
      about_page_value_honesty_desc: 'No invented case studies, no embellished numbers. Just honest, transparent work.',
      about_page_value_quality_title: 'Care',
      about_page_value_quality_desc: 'Quality before speed. Every line of code is written with care.',
      about_page_value_comms_title: 'Clear communication',
      about_page_value_comms_desc: 'You always know where your project stands. No surprises.',
      about_page_value_results_title: 'Focus on results',
      about_page_value_results_desc: 'Your website should sell. Enquiries and conversion are at the centre.',
      about_cta_eyebrow: 'Next step',
      about_page_cta_title: 'Let\'s discuss your project',
      about_page_cta_lead: 'We look forward to hearing about your plans — without obligation and at eye level.',
      about_page_cta_button: 'Get in touch',

      // AI Assistant page
      ki_hero_eyebrow: 'MASESites AI Assistant',
      ki_hero_title_html: 'Your digital employee — <span class="serif-accent">around the clock</span>',
      ki_hero_lead: 'Automatic customer support, lead qualification and FAQ answering. 365 days a year — including outside your business hours.',
      ki_stat_1: 'Replies in under 1 second',
      ki_stat_2: 'Active 24/7',
      ki_stat_3: '+40% more enquiries',
      ki_hero_cta_primary: 'Request AI assistant',
      ki_hero_cta_secondary: 'How it works',
      ki_chat_name: 'MASESites AI Assistant',
      ki_chat_status: 'Online — replies instantly',
      ki_chat_badge: 'Demo',
      ki_chat_placeholder: 'Write a message …',
      ki_impact_lbl_1: 'Response time',
      ki_impact_lbl_2: 'Availability',
      ki_impact_lbl_3: 'More enquiries',
      ki_impact_lbl_4: 'Setup time',
      ki_steps_eyebrow: 'The process',
      ki_steps_title: 'Ready in three steps',
      ki_steps_lead: 'From the first conversation to the finished assistant on your website — in less than a week.',
      ki_step_1_title: 'Training',
      ki_step_1_desc: 'You send us your content — FAQs, product texts, documents. We train the assistant on your business.',
      ki_step_2_title: 'Integration',
      ki_step_2_desc: 'We integrate the assistant seamlessly into your website. No technical knowledge required on your side.',
      ki_step_3_title: 'Operation',
      ki_step_3_desc: 'The assistant answers enquiries automatically, qualifies prospects and hands complex cases over to you.',
      ki_cap_eyebrow: 'Scope of service',
      ki_cap_title: 'What the assistant takes care of for you',
      ki_cap_1_title: 'Customer support around the clock',
      ki_cap_1_desc: 'Available at any time — at night, on weekends and on public holidays.',
      ki_cap_2_title: 'Lead qualification',
      ki_cap_2_desc: 'Prospects are pre-sorted, needs and budgets clarified — before you step in.',
      ki_cap_3_title: 'Automatic FAQ answers',
      ki_cap_3_desc: 'Standard questions about prices, delivery times or opening hours are answered instantly.',
      ki_cap_4_title: 'Appointment preparation',
      ki_cap_4_desc: 'Less back and forth — the assistant collects all relevant information upfront.',
      ki_cap_5_title: 'Multilingual',
      ki_cap_5_desc: 'German, English, French and more — the language is detected automatically.',
      ki_cap_6_title: 'Individually trainable',
      ki_cap_6_desc: 'With your documents, website texts and product information — the assistant knows your business.',
      ki_audience_eyebrow: 'Use cases',
      ki_audience_title: 'Who the assistant is suited for',
      ki_audience_1_title: 'SMEs & service providers',
      ki_audience_1_desc: 'Enquiries are answered automatically — even outside business hours. More enquiries, less effort.',
      ki_audience_2_title: 'Online shops',
      ki_audience_2_desc: 'Product advice, size charts, shipping information — the assistant explains everything and increases conversion.',
      ki_audience_3_title: 'Coaches & consultants',
      ki_audience_3_desc: 'Prospects are qualified before the first conversation. That saves time for the truly suitable clients.',
      ki_audience_4_title: 'Start-ups',
      ki_audience_4_desc: 'Professional support without a large team — scalable, cost-efficient and always ready.',
      ki_pricing_eyebrow: 'Pricing & integration',
      ki_pricing_title: 'Simple, transparent conditions',
      ki_pricing_feats_heading: 'Included in the price:',
      ki_pricing_feat_1: 'Complete setup and configuration',
      ki_pricing_feat_2: 'Training with your content',
      ki_pricing_feat_3: 'Integration into your website',
      ki_pricing_feat_4: 'Multilingual operation',
      ki_pricing_feat_5: 'Ongoing maintenance and updates',
      ki_pricing_feat_6: 'Cancellable monthly — no annual contract',
      ki_pricing_feat_7: 'GDPR-compliant — your data stays protected',
      ki_pricing_addon_note: 'As an addition to any MASESites website or as a standalone integration into your existing website.',
      ki_pc_badge: 'AI Assistant',
      ki_pc_title: 'Integration & setup',
      ki_pc_amount_sub: 'one-time',
      ki_pc_monthly: '+ CHF 40 / month (hosting & support)',
      ki_pc_note: 'In a free initial consultation we show you live what the assistant can do for your business.',
      ki_pc_cta: 'Request AI assistant',
      ki_faq_eyebrow: 'Frequently asked questions',
      ki_faq_title: 'What clients often ask us',
      ki_faq_q1: 'How is the AI assistant trained?',
      ki_faq_a1: 'We train it with your content: FAQs, product descriptions, documents and website texts. This way it can address your customers\' questions precisely.',
      ki_faq_q2: 'Can it answer complex questions, too?',
      ki_faq_a2: 'Yes. Based on your content, it gives detailed answers. For very specific or sensitive questions, it hands over seamlessly to your team.',
      ki_faq_q3: 'Does it work in multiple languages?',
      ki_faq_a3: 'Yes — German, English, French and other languages are possible. The assistant detects the language automatically and replies accordingly.',
      ki_faq_q4: 'Can content be updated later?',
      ki_faq_a4: 'Yes. You can send us new content at any time — price changes, new products, updated FAQs — and we retrain the assistant. Quick and straightforward.',
      ki_faq_q5: 'What happens to my customers\' data?',
      ki_faq_a5: 'All data is processed in compliance with GDPR. No data is shared with third parties.',
      ki_faq_q6: 'Can the assistant be integrated into an existing website?',
      ki_faq_a6: 'Yes, into any existing website — whether WordPress, Shopify or a custom solution. A small code snippet is all it takes.',
      ki_cta_eyebrow: 'Next step',
      ki_cta_title: 'Ready for your digital employee?',
      ki_cta_lead: 'In a free initial consultation we show you live what the AI assistant can do for your business.',
      ki_cta_btn: 'Book a consultation',
      ki_cta_trust: 'No obligation · Free demo · Reply within 24 hours',

      // Thank-you page
      thanks_title:    'Thank you!',
      thanks_message_html: 'Your message has reached us.<br>We will get back to you within <strong>24 hours</strong>.',
      thanks_redirect: 'You will be redirected automatically in 5 seconds …',
      thanks_home:     'Back to home page',
      thanks_services: 'Our services',

      // Legal notice
      impressum_title: 'Legal Notice',
      impressum_lead:  'Information according to Swiss legal requirements.',
      impressum_content: `<h2>Website operator</h2>
    <p><strong>MASESites</strong><br>Switzerland</p>
    <h2>Contact</h2>
    <p><strong>E-mail:</strong> <a href="mailto:info@masesites.ch">info@masesites.ch</a><br>
    <strong>Phone:</strong> Available on request with appointment</p>
    <h2>Authorised representatives</h2>
    <p>Matteo &amp; Severin (founders)</p>
    <h2>Disclaimer</h2>
    <h3>Liability for content</h3>
    <p>The content of our pages has been created with great care. However, we cannot guarantee the accuracy, completeness, or up-to-dateness of the content.</p>
    <h3>Liability for links</h3>
    <p>Our website contains links to external third-party websites over whose content we have no control.</p>
    <h3>Copyright</h3>
    <p>The content created by the site operators is subject to Swiss copyright law. Reproduction requires written permission.</p>
    <h2>Concept &amp; implementation</h2>
    <p><strong>Design &amp; development:</strong> MASESites – <a href="https://www.masesites.ch">www.masesites.ch</a><br>
    <strong>Technology:</strong> HTML5, CSS3, Vanilla JavaScript</p>
    <p style="color:var(--muted);margin-top:3rem;font-size:0.9rem;">Last updated: June 2026</p>`,

      // Privacy policy
      privacy_title:   'Privacy Policy',
      privacy_lead:    'Transparency about how we process your data.',
      privacy_content: `<h2>1. Data controller</h2>
    <p><strong>MASESites</strong><br>
    E-mail: <a href="mailto:info@masesites.ch">info@masesites.ch</a></p>

    <h2>2. Collection and processing of personal data</h2>
    <h3>2.1 Contact form</h3>
    <p>When you contact us via the contact form, the following data is collected:</p>
    <ul>
      <li>Name</li>
      <li>E-mail address</li>
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
    Google Analytics is used to analyse user behaviour. IP anonymisation is enabled.</p>

    <h2>3. Your rights</h2>
    <p>You have the right to access, rectification, deletion, and restriction of processing of your data. Please contact us at <a href="mailto:info@masesites.ch">info@masesites.ch</a>.</p>

    <h2>4. Data security</h2>
    <p>We use technical and organisational security measures to protect your data against manipulation, loss, and unauthorised access. Our website uses SSL encryption (HTTPS).</p>

    <h2>5. External services</h2>
    <p>We use <strong>Web3Forms</strong> to process contact forms. Data entered by you is transmitted to Web3Forms. More information: <a href="https://web3forms.com/privacy" target="_blank" rel="noopener">web3forms.com/privacy</a></p>

    <p style="color:var(--muted);margin-top:3rem;font-size:0.9rem;">Last updated: June 2026</p>`
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
  // SPRACH-ENGINE
  // ==========================================
  function applyLanguage(lang) {
    var safeLang = isSupportedLang(lang) ? lang : 'de';
    currentLang = safeLang;
    localStorage.setItem('lang', safeLang);
    var t = translations[safeLang] || translations.de;

    // HTML-Übersetzungen zuerst
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) {
        el.innerHTML = t[key];
      }
    });

    // Reine Textübersetzungen
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        el.textContent = t[key];
      }
    });

    // ARIA-Labels
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria-label');
      if (t[key] !== undefined) {
        el.setAttribute('aria-label', t[key]);
      }
    });

    // Platzhalter
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (t[key] !== undefined) {
        el.setAttribute('placeholder', t[key]);
      }
    });

    document.documentElement.lang = safeLang === 'de' ? 'de-CH' : 'en';

    var langCurrent = document.getElementById('lang-current');
    if (langCurrent) langCurrent.textContent = safeLang.toUpperCase();

    document.querySelectorAll('.lang-option').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === safeLang);
    });

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

        var path = url.pathname;
        if (path.indexOf('/') === 0) path = path.slice(1);
        if (!path) path = '/';
        a.setAttribute('href', path + url.search + url.hash);
      } catch (_) {
        // Fehlerhafte href-Werte ignorieren.
      }
    });
  }

  // ==========================================
  // HELLE IDENTITÄT — Dark-Mode dauerhaft aus
  // ==========================================
  function enforceLightTheme() {
    localStorage.setItem('theme', 'light');
    document.documentElement.classList.remove('dark');
  }

  function positionDropdown(langBtn, dropdown) {
    var rect = langBtn.getBoundingClientRect();
    dropdown.style.top  = (rect.bottom + 8) + 'px';
    dropdown.style.right = (window.innerWidth - rect.right) + 'px';
    dropdown.style.left  = 'auto';
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
        var isOpen = dropdown.classList.contains('open');
        if (!isOpen) {
          positionDropdown(langBtn, dropdown);
          dropdown.classList.add('open');
          langBtn.setAttribute('aria-expanded', 'true');
        } else {
          dropdown.classList.remove('open');
          langBtn.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('click', function () {
        if (dropdown.classList.contains('open')) {
          dropdown.classList.remove('open');
          langBtn.setAttribute('aria-expanded', 'false');
        }
      });

      window.addEventListener('resize', function () {
        if (dropdown.classList.contains('open')) {
          positionDropdown(langBtn, dropdown);
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
    enforceLightTheme();
    initLanguage();
  });
})();
