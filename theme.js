// ============================================
// MASE THEME.JS — Dark mode + i18n
// ============================================
(function () {
  'use strict';

  // ============================================
  // TRANSLATIONS
  // ============================================
  var T = {
    de: {
      skip_to_content: 'Zum Inhalt springen',
      nav_toggle: 'Navigation öffnen',
      nav_home: 'Home', nav_services: 'Leistungen', nav_prices: 'Preise',
      nav_ai: 'KI Assistent', nav_about: 'Über uns', nav_contact: 'Kontakt',
      nav_cta: 'Kostenloses Erstgespräch',
      lang_select_aria: 'Sprache wählen', theme_toggle_aria: 'Dark Mode umschalten',
      back_to_top_aria: 'Zurück nach oben',
      hero_eyebrow: 'Matteo & Severin. MASESites AG.',
      hero_title: 'Websites, die verkaufen.',
      hero_lead: 'Professionelle Weblösungen und KI-Integration für moderne Unternehmen.',
      hero_cta_primary: 'Projekt starten', hero_cta_secondary: 'Preise ansehen',
      badge_mobile: 'Mobile-first', badge_seo: 'SEO-optimiert', badge_ai: 'KI-Integration',
      trust_title: 'Warum MASE',
      trust_speed: 'Schnell', trust_speed_desc: 'Klare Prozesse, kurze Wege, schnelle Live-Schaltung.',
      trust_code: 'Sauberer Code', trust_code_desc: 'Minimal, wartbar und für Performance optimiert.',
      trust_mobile: 'Mobile-first', trust_mobile_desc: 'UX die auf jedem Screen sitzt. Keine Kompromisse.',
      trust_ki: 'KI-Integration', trust_ki_desc: 'Assistenz, die Leads qualifiziert und Fragen klärt.',
      process_title: 'Unser Ansatz',
      process_lead: '5 klare Schritte vom Erstgespräch bis zur messbaren Wirkung.',
      process_1_title: 'Analyse & Strategie',
      process_1_desc: 'Wir analysieren dein Business, deine Zielgruppe und den Wettbewerb. Klare Ziele, klarer Plan.',
      process_2_title: 'Struktur & UX-Planung',
      process_2_desc: 'Seitenstruktur, Navigation und User Experience werden vor dem ersten Pixel geplant.',
      process_3_title: 'Modernes Design',
      process_3_desc: 'Clean, professionell, verkaufsstark. Design das Vertrauen weckt und zum Handeln motiviert.',
      process_4_title: 'Saubere Entwicklung',
      process_4_desc: 'Schneller, wartbarer Code. Mobile-first, SEO-ready und zukunftssicher gebaut.',
      process_5_title: 'Optimierung & Skalierung',
      process_5_desc: 'Nach dem Launch analysieren, optimieren und skalieren wir deinen digitalen Auftritt.',
      services_cta_primary: 'Projekt starten',
      ai_title: 'KI-Integration - dein digitaler Mitarbeiter',
      ai_desc: 'Unser KI-Assistent arbeitet 24/7 für dich: beantwortet Kundenfragen, sammelt Leads, qualifiziert Anfragen und erklärt deine Produkte oder Services.',
      ai_feature_1: 'Automatische Kundenberatung in Echtzeit',
      ai_feature_2: 'Lead-Qualifizierung mit Übergabe an dein Team',
      ai_feature_3: 'Auf deine Leistungen und Tonalität trainiert',
      ai_link: 'KI-Assistent entdecken',
      pricing_teaser: 'Transparente Preise',
      pricing_teaser_lead: 'Von der Überarbeitung bis zur kompletten Website - modulare Pakete ab CHF 250.',
      pricing_teaser_link: 'Alle Preise ansehen',
      footer_desc: 'Professionelle Websites & KI-Integration aus der Schweiz.',
      footer_nav: 'Navigation', footer_contact: 'Kontakt', footer_legal: 'Rechtliches',
      footer_contact_form: 'Kontaktformular', footer_impressum: 'Impressum',
      footer_privacy: 'Datenschutz', footer_copy: 'Alle Rechte vorbehalten.',
      contact_title: 'Lass uns dein Projekt starten',
      contact_lead: 'Beschreibe uns kurz dein Ziel. Wir melden uns mit einer klaren Empfehlung und den nächsten Schritten.',
      contact_page_intro_title: 'Erzähl uns von deinem Projekt',
      contact_page_intro_text: 'Egal ob neue Website, Überarbeitung oder KI-Integration – wir finden die passende Lösung für dein Business.',
      contact_page_direct_title: 'Direkter Kontakt',
      contact_page_phone: 'Telefon: Auf Anfrage mit Termin',
      contact_page_faq_title: 'Häufige Fragen',
      contact_page_faq_q1: 'Wie schnell können wir loslegen?',
      contact_page_faq_a1: 'Nach einem ersten Gespräch können wir meist innerhalb einer Woche starten.',
      contact_page_faq_q2: 'Wie lange dauert ein Projekt?',
      contact_page_faq_a2: 'Landingpages 2-4 Wochen, größere Websites 4-8 Wochen – je nach Umfang.',
      contact_page_faq_q3: 'Was kostet eine Website?',
      contact_page_faq_a3: "Ab CHF 750 für eine Landingpage bis CHF 2'500 für Premium-Websites. Finale Offerte nach kurzem Call.",
      contact_page_faq_q4: 'Können wir später erweitern?',
      contact_page_faq_a4: 'Ja! Wir bauen skalierbar – Features wie KI-Assistent lassen sich jederzeit ergänzen.',
      contact_page_project_select: 'Bitte wählen...', contact_page_project_new: 'Neue Website',
      contact_page_project_revision: 'Website Überarbeitung', contact_page_project_ai: 'KI-Assistent Integration',
      contact_page_project_seo: 'SEO & Performance', contact_page_project_consulting: 'Beratung',
      contact_page_project_other: 'Sonstiges',
      form_name: 'Name *', form_email: 'E-Mail *', form_company: 'Firma (optional)',
      form_project: 'Projektart', form_message: 'Nachricht *', form_submit: 'Anfrage senden',
      contact_page_form_success: '✓ Danke! Deine Anfrage wurde erfolgreich gesendet.',
      contact_page_form_error_required: 'Bitte fülle alle Pflichtfelder aus.',
      services_title: 'Unsere Leistungen',
      services_lead: 'Von Design über Entwicklung bis zur KI-Integration – alles aus einer Hand.',
      services_webdesign_h: 'Webdesign', services_webdesign_p: 'UX/UI mit Fokus auf Conversion und Nutzerfreundlichkeit.',
      services_webdesign_cta: 'Design anfragen', services_webdesign_preview_label: 'Design Preview',
      services_webdev_h: 'Webentwicklung', services_webdev_p: 'Sauberer Code, der Performance und Skalierbarkeit garantiert.',
      services_webdev_cta: 'Entwicklung anfragen',
      services_seo_h: 'SEO & Performance', services_seo_p: 'Technische Optimierung für maximale Sichtbarkeit und Speed.',
      services_seo_cta: 'SEO anfragen',
      services_ki_h: 'KI-Assistent Integration', services_ki_p: 'Intelligente Automatisierung für 24/7 Kundenservice.',
      services_ai_cta: 'Mehr über KI-Assistent',
      services_ai_chat_bot: 'Wie kann ich helfen?', services_ai_chat_user: 'Was sind die Preise?',
      services_ai_chat_reply: 'Ab CHF 750. Soll ich Details zeigen?', services_ai_chat_placeholder: 'Nachricht...',
      services_metric_loadtime: 'Ladezeit',
      services_cta_title: 'Bereit für dein Projekt?', services_cta_lead: 'Lass uns gemeinsam deine perfekte Website-Lösung finden.',
      services_cta_secondary: 'Preise ansehen',
      pricing_headline: 'Hole das Maximum aus deiner Website',
      pricing_subline: 'Wähle dein Paket, kombiniere flexibel und erhalte eine klare, nachvollziehbare Preisstruktur.',
      pricing_revision_title: 'Website Überarbeitung', pricing_revision_desc: 'Bestehende Website verbessern',
      pricing_starter: 'Starter', pricing_plus: 'Plus', pricing_pro: 'Pro',
      pricing_business: 'Business', pricing_premium: 'Premium',
      pricing_newsite_title: 'Neue Website erstellen', pricing_newsite_desc: 'Komplett neu aufbauen',
      pricing_ai_title: 'KI-Assistent', pricing_ai_desc: '24/7 Antworten. Lead-Qualifizierung. Automatische Kundenberatung.',
      pricing_ai_monthly: '+ CHF 40 / Monat', pricing_ai_add: 'KI-Assistent hinzufügen',
      pricing_ai_chat_bot: 'Hallo! Wie kann ich helfen?', pricing_ai_chat_user: 'Was kostet eine Website?',
      pricing_ai_chat_reply: 'Ab CHF 750. Soll ich mehr erklären?',
      pricing_domain_heading: 'Domain & Hosting', pricing_domain_desc: 'Wir kümmern uns um alles – du musst nichts selbst aufsetzen',
      pricing_domain: 'Domain', pricing_hosting: 'Hosting', pricing_bundle: 'Bundle',
      pricing_summary_hint: 'Wähle ein Paket um den Preis zu sehen',
      pricing_total_label: 'Gesamtpreis', pricing_cta_start: 'Projekt starten',
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
      pricing_final_cta_title: 'Bereit für dein Projekt?', pricing_final_cta_lead: 'Lass uns gemeinsam die beste Lösung für dein Business finden.',
      ai_page_hero_title: 'Dein digitaler Mitarbeiter – 24/7',
      ai_page_hero_lead: 'Automatische Kundenberatung, Lead-Qualifizierung und FAQ-Support – rund um die Uhr verfügbar.',
      ai_page_capabilities_title: 'Was der KI-Assistent kann',
      ai_page_demo_header: 'MASESites KI-Assistent',
      ai_page_demo_bot_1: 'Hallo! Wie kann ich dir helfen?', ai_page_demo_user_1: 'Was kostet eine Website?',
      ai_page_demo_bot_2: "Ab CHF 750 für eine Landingpage. Business-Websites ab CHF 1'300. Soll ich dir mehr erklären?",
      ai_page_demo_user_2: 'Ja, was ist im Preis enthalten?',
      ai_page_demo_bot_3: 'Design, Entwicklung, Performance-Optimierung, SEO-Basis und Kontaktformular. Finale Offerte nach kurzem Call.',
      ai_page_demo_input: 'Nachricht schreiben...', ai_page_demo_send: 'Senden',
      ai_page_audience_title: 'Für wen ist der KI-Assistent geeignet?',
      ai_page_audience_kmu_title: 'KMU & Dienstleister',
      ai_page_audience_kmu_desc: 'Beantworte Anfragen automatisch, auch außerhalb der Geschäftszeiten. Mehr Leads, weniger Aufwand.',
      ai_page_audience_shop_title: 'Online Shops',
      ai_page_audience_shop_desc: 'Produktberatung, Größentabellen, Versandinfos – der Assistent erklärt alles und steigert die Conversion.',
      ai_page_audience_coach_title: 'Coaches & Berater',
      ai_page_audience_coach_desc: 'Qualifiziere Interessenten vor dem ersten Call. Spare Zeit und fokussiere dich auf qualifizierte Leads.',
      ai_page_audience_startup_title: 'Startups',
      ai_page_audience_startup_desc: 'Professioneller Support ohne großes Team. Skalierbar und kosteneffizient.',
      ai_page_benefits_title: 'Warum ein KI-Assistent?', ai_page_benefits_subtitle: 'Mehr Leads, weniger Aufwand',
      ai_page_metric_response: 'Antwortzeit', ai_page_metric_uptime: 'Verfügbarkeit', ai_page_metric_lead: 'Lead-Rate',
      ai_page_pricing_title: 'Preise & Integration', ai_page_pricing_widget_title: 'KI-Assistent',
      ai_page_pricing_chat_bot: 'Hallo! Wie kann ich helfen?', ai_page_pricing_chat_user: 'Wie kann ich helfen?',
      ai_page_pricing_chat_reply: 'Gerne! Was möchtest du wissen?',
      ai_page_pricing_card_title: 'KI-Assistent Integration',
      ai_page_pricing_card_desc: 'Komplett Setup, Training mit deinen Inhalten und Integration in deine Website.',
      ai_page_pricing_note: 'Als Add-on zu jeder Website oder als separate Integration in bestehende Seiten.',
      ai_page_pricing_cta: 'KI-Assistent anfragen',
      ai_page_faq_title: 'Häufige Fragen',
      ai_page_faq_q1: 'Wie wird der KI-Assistent trainiert?',
      ai_page_faq_a1: 'Wir füttern ihn mit deinen Inhalten: FAQs, Produktbeschreibungen, PDFs, Website-Texten. Er lernt dein Business kennen.',
      ai_page_faq_q2: 'Kann er auch komplexe Fragen beantworten?',
      ai_page_faq_a2: 'Ja! Er kann auf Basis deiner Inhalte detaillierte Antworten geben. Bei sehr spezifischen Fragen leitet er an dein Team weiter.',
      ai_page_faq_q3: 'Funktioniert er in mehreren Sprachen?', ai_page_faq_a3: 'Ja, Deutsch, Englisch, Französisch und weitere Sprachen sind möglich.',
      ai_page_faq_q4: 'Kann ich später Inhalte aktualisieren?', ai_page_faq_a4: 'Ja! Du kannst uns jederzeit neue Inhalte schicken, und wir trainieren den Assistenten nach.',
      ai_page_faq_q5: 'Was passiert mit den Daten?', ai_page_faq_a5: 'Alle Daten werden DSGVO-konform verarbeitet. Keine Weitergabe an Dritte.',
      ai_page_live_title: 'Teste den KI-Assistenten jetzt live!',
      ai_page_live_lead: 'Klicke unten rechts auf den Chat-Button und stelle dem KI-Assistenten deine Fragen.',
      ai_page_live_desc: 'Du siehst sofort, wie er funktioniert und wie er dein Business unterstützen kann.',
      thanks_title: 'Vielen Dank!', thanks_redirect: 'Du wirst in 5 Sekunden automatisch weitergeleitet...',
      thanks_home: 'Zurück zur Startseite', thanks_services: 'Unsere Leistungen',
      cookie_title: 'Cookie-Hinweis', cookie_desc: 'Wir verwenden Cookies für eine optimale Nutzererfahrung.',
      cookie_link: 'Mehr erfahren', cookie_settings: 'Einstellungen', cookie_accept: 'Akzeptieren',
    },
    en: {
      skip_to_content: 'Skip to content', nav_toggle: 'Open navigation',
      nav_home: 'Home', nav_services: 'Services', nav_prices: 'Pricing',
      nav_ai: 'AI Assistant', nav_about: 'About us', nav_contact: 'Contact',
      nav_cta: 'Free consultation',
      lang_select_aria: 'Select language', theme_toggle_aria: 'Toggle dark mode',
      back_to_top_aria: 'Back to top',
      hero_eyebrow: 'Matteo & Severin. MASESites AG.',
      hero_title: 'Websites that sell.',
      hero_lead: 'Professional web solutions and AI integration for modern businesses.',
      hero_cta_primary: 'Start project', hero_cta_secondary: 'View pricing',
      badge_mobile: 'Mobile-first', badge_seo: 'SEO-optimised', badge_ai: 'AI integration',
      trust_title: 'Why MASE',
      trust_speed: 'Fast', trust_speed_desc: 'Clear processes, short paths, quick go-live.',
      trust_code: 'Clean code', trust_code_desc: 'Minimal, maintainable and optimised for performance.',
      trust_mobile: 'Mobile-first', trust_mobile_desc: 'UX that works on every screen. No compromises.',
      trust_ki: 'AI integration', trust_ki_desc: 'Assistance that qualifies leads and answers questions.',
      process_title: 'Our approach',
      process_lead: '5 clear steps from the first call to measurable results.',
      process_1_title: 'Analysis & Strategy', process_1_desc: 'We analyse your business, target audience and competition. Clear goals, clear plan.',
      process_2_title: 'Structure & UX planning', process_2_desc: 'Page structure, navigation and user experience are planned before the first pixel.',
      process_3_title: 'Modern design', process_3_desc: 'Clean, professional, sales-driven. Design that builds trust and motivates action.',
      process_4_title: 'Clean development', process_4_desc: 'Fast, maintainable code. Mobile-first, SEO-ready and built for the future.',
      process_5_title: 'Optimisation & scaling', process_5_desc: 'After launch we analyse, optimise and scale your digital presence.',
      services_cta_primary: 'Start project',
      ai_title: 'AI integration – your digital employee',
      ai_desc: 'Our AI assistant works 24/7 for you: answers customer questions, collects leads, qualifies requests and explains your products or services.',
      ai_feature_1: 'Automatic customer consultation in real time',
      ai_feature_2: 'Lead qualification with handover to your team',
      ai_feature_3: 'Trained on your services and tone of voice',
      ai_link: 'Discover AI assistant',
      pricing_teaser: 'Transparent pricing',
      pricing_teaser_lead: 'From revision to a complete website – modular packages from CHF 250.',
      pricing_teaser_link: 'View all prices',
      footer_desc: 'Professional websites & AI integration from Switzerland.',
      footer_nav: 'Navigation', footer_contact: 'Contact', footer_legal: 'Legal',
      footer_contact_form: 'Contact form', footer_impressum: 'Imprint',
      footer_privacy: 'Privacy policy', footer_copy: 'All rights reserved.',
      contact_title: "Let's start your project",
      contact_lead: "Briefly describe your goal. We'll get back to you with a clear recommendation and next steps.",
      contact_page_intro_title: 'Tell us about your project',
      contact_page_intro_text: "Whether it's a new website, a revision or AI integration – we'll find the right solution for your business.",
      contact_page_direct_title: 'Direct contact', contact_page_phone: 'Phone: By appointment on request',
      contact_page_faq_title: 'Frequently asked questions',
      contact_page_faq_q1: 'How quickly can we get started?', contact_page_faq_a1: 'After an initial call we can usually start within a week.',
      contact_page_faq_q2: 'How long does a project take?', contact_page_faq_a2: 'Landing pages 2-4 weeks, larger websites 4-8 weeks – depending on scope.',
      contact_page_faq_q3: 'What does a website cost?', contact_page_faq_a3: "From CHF 750 for a landing page to CHF 2'500 for premium websites. Final quote after a short call.",
      contact_page_faq_q4: 'Can we expand later?', contact_page_faq_a4: 'Yes! We build scalably – features like AI assistant can be added at any time.',
      contact_page_project_select: 'Please select...', contact_page_project_new: 'New website',
      contact_page_project_revision: 'Website revision', contact_page_project_ai: 'AI assistant integration',
      contact_page_project_seo: 'SEO & Performance', contact_page_project_consulting: 'Consulting',
      contact_page_project_other: 'Other',
      form_name: 'Name *', form_email: 'E-mail *', form_company: 'Company (optional)',
      form_project: 'Project type', form_message: 'Message *', form_submit: 'Send request',
      contact_page_form_success: '✓ Thank you! Your request was sent successfully.',
      contact_page_form_error_required: 'Please fill in all required fields.',
      services_title: 'Our services', services_lead: 'From design to development to AI integration – everything from one source.',
      services_webdesign_h: 'Web design', services_webdesign_p: 'UX/UI focused on conversion and usability.',
      services_webdesign_cta: 'Request design', services_webdesign_preview_label: 'Design Preview',
      services_webdev_h: 'Web development', services_webdev_p: 'Clean code that guarantees performance and scalability.',
      services_webdev_cta: 'Request development',
      services_seo_h: 'SEO & Performance', services_seo_p: 'Technical optimisation for maximum visibility and speed.',
      services_seo_cta: 'Request SEO',
      services_ki_h: 'AI assistant integration', services_ki_p: 'Intelligent automation for 24/7 customer service.',
      services_ai_cta: 'More about AI assistant',
      services_ai_chat_bot: 'How can I help?', services_ai_chat_user: 'What are the prices?',
      services_ai_chat_reply: 'From CHF 750. Want to see details?', services_ai_chat_placeholder: 'Message...',
      services_metric_loadtime: 'Load time',
      services_cta_title: 'Ready for your project?', services_cta_lead: "Let's find your perfect website solution together.",
      services_cta_secondary: 'View pricing',
      pricing_headline: 'Get the most out of your website',
      pricing_subline: 'Choose your package, combine flexibly and get a clear, transparent price structure.',
      pricing_revision_title: 'Website revision', pricing_revision_desc: 'Improve an existing website',
      pricing_starter: 'Starter', pricing_plus: 'Plus', pricing_pro: 'Pro',
      pricing_business: 'Business', pricing_premium: 'Premium',
      pricing_newsite_title: 'Create new website', pricing_newsite_desc: 'Build from scratch',
      pricing_ai_title: 'AI assistant', pricing_ai_desc: '24/7 answers. Lead qualification. Automatic customer consultation.',
      pricing_ai_monthly: '+ CHF 40 / month', pricing_ai_add: 'Add AI assistant',
      pricing_ai_chat_bot: 'Hello! How can I help?', pricing_ai_chat_user: 'What does a website cost?',
      pricing_ai_chat_reply: 'From CHF 750. Shall I explain more?',
      pricing_domain_heading: 'Domain & Hosting', pricing_domain_desc: "We take care of everything – you don't have to set anything up yourself",
      pricing_domain: 'Domain', pricing_hosting: 'Hosting', pricing_bundle: 'Bundle',
      pricing_summary_hint: 'Choose a package to see the price',
      pricing_total_label: 'Total price', pricing_cta_start: 'Start project',
      pricing_note: 'Final quote after a short call.',
      pricing_faq_title: 'Frequently asked questions about pricing',
      pricing_faq_q1: 'What is included in the price?', pricing_faq_a1: 'Design, development, performance optimisation, SEO basics, contact form, GDPR setup and 2-3 feedback rounds.',
      pricing_faq_q2: 'Are there any hidden costs?', pricing_faq_a2: 'No. Prices are transparent. Hosting and domain are separate (approx. CHF 10-30/month).',
      pricing_faq_q3: 'How does payment work?', pricing_faq_a3: '50% deposit at project start, 50% on completion. Invoice by e-mail.',
      pricing_faq_q4: 'Can I upgrade later?', pricing_faq_a4: 'Yes! You can add features like AI assistant, additional pages or other features at any time.',
      pricing_final_cta_title: 'Ready for your project?', pricing_final_cta_lead: "Let's find the best solution for your business together.",
      ai_page_hero_title: 'Your digital employee – 24/7',
      ai_page_hero_lead: 'Automatic customer consultation, lead qualification and FAQ support – available around the clock.',
      ai_page_capabilities_title: 'What the AI assistant can do',
      ai_page_demo_header: 'MASESites AI assistant',
      ai_page_demo_bot_1: 'Hello! How can I help you?', ai_page_demo_user_1: 'What does a website cost?',
      ai_page_demo_bot_2: "From CHF 750 for a landing page. Business websites from CHF 1'300. Want me to explain more?",
      ai_page_demo_user_2: "Yes, what's included in the price?",
      ai_page_demo_bot_3: 'Design, development, performance optimisation, SEO basics and contact form. Final quote after a short call.',
      ai_page_demo_input: 'Type a message...', ai_page_demo_send: 'Send',
      ai_page_audience_title: 'Who is the AI assistant suitable for?',
      ai_page_audience_kmu_title: 'SMBs & service providers', ai_page_audience_kmu_desc: 'Answer enquiries automatically, even outside business hours. More leads, less effort.',
      ai_page_audience_shop_title: 'Online shops', ai_page_audience_shop_desc: 'Product advice, size charts, shipping info – the assistant explains everything and increases conversion.',
      ai_page_audience_coach_title: 'Coaches & consultants', ai_page_audience_coach_desc: 'Qualify prospects before the first call. Save time and focus on qualified leads.',
      ai_page_audience_startup_title: 'Startups', ai_page_audience_startup_desc: 'Professional support without a large team. Scalable and cost-efficient.',
      ai_page_benefits_title: 'Why an AI assistant?', ai_page_benefits_subtitle: 'More leads, less effort',
      ai_page_metric_response: 'Response time', ai_page_metric_uptime: 'Availability', ai_page_metric_lead: 'Lead rate',
      ai_page_pricing_title: 'Pricing & integration', ai_page_pricing_widget_title: 'AI assistant',
      ai_page_pricing_chat_bot: 'Hello! How can I help?', ai_page_pricing_chat_user: 'How can I help?',
      ai_page_pricing_chat_reply: 'Sure! What would you like to know?',
      ai_page_pricing_card_title: 'AI assistant integration',
      ai_page_pricing_card_desc: 'Complete setup, training with your content and integration into your website.',
      ai_page_pricing_note: 'As an add-on to any website or as a standalone integration into existing pages.',
      ai_page_pricing_cta: 'Request AI assistant',
      ai_page_faq_title: 'Frequently asked questions',
      ai_page_faq_q1: 'How is the AI assistant trained?', ai_page_faq_a1: 'We feed it with your content: FAQs, product descriptions, PDFs, website texts. It gets to know your business.',
      ai_page_faq_q2: 'Can it also answer complex questions?', ai_page_faq_a2: 'Yes! It can give detailed answers based on your content. For very specific questions it refers to your team.',
      ai_page_faq_q3: 'Does it work in multiple languages?', ai_page_faq_a3: 'Yes, German, English, French and other languages are possible.',
      ai_page_faq_q4: 'Can I update content later?', ai_page_faq_a4: "Yes! You can send us new content at any time and we'll retrain the assistant.",
      ai_page_faq_q5: 'What happens to the data?', ai_page_faq_a5: 'All data is processed in compliance with GDPR. No sharing with third parties.',
      ai_page_live_title: 'Test the AI assistant live now!',
      ai_page_live_lead: 'Click the chat button in the bottom right and ask the AI assistant your questions.',
      ai_page_live_desc: "You'll immediately see how it works and how it can support your business.",
      thanks_title: 'Thank you!', thanks_redirect: 'You will be redirected automatically in 5 seconds...',
      thanks_home: 'Back to home', thanks_services: 'Our services',
      cookie_title: 'Cookie notice', cookie_desc: 'We use cookies for an optimal user experience.',
      cookie_link: 'Learn more', cookie_settings: 'Settings', cookie_accept: 'Accept',
    }
  };

  // Keys whose elements use innerHTML (data-i18n-html attribute)
  var HTML_ATTR = 'data-i18n-html';
  var EN_HTML = {
    contact_page_email_html: '<strong>E-mail:</strong> <a href="mailto:info@masesites.ch">info@masesites.ch</a>',
    contact_page_form_privacy_html: 'I have read the <a href="datenschutz.html">privacy policy</a> and accept it. *',
    thanks_message_html: "Your message has been received.<br>We will get back to you within <strong>24 hours</strong>.",
    ai_page_demo_note_html: '<strong>Note:</strong> This is a demo preview of typical conversations.',
    ai_page_trainable_html: '<strong>Individually trainable:</strong> We feed the assistant with your content – PDFs, FAQs, product descriptions, website texts.',
  };

  // ============================================
  // APPLY TRANSLATIONS
  // ============================================
  function applyLang(lang) {
    var t = T[lang] || T.de;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });

    if (lang === 'en') {
      document.querySelectorAll('[' + HTML_ATTR + ']').forEach(function (el) {
        var key = el.getAttribute(HTML_ATTR);
        if (EN_HTML[key] !== undefined) el.innerHTML = EN_HTML[key];
      });
    }

    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-aria-label');
      if (t[key] !== undefined) el.setAttribute('aria-label', t[key]);
    });

    var lc = document.getElementById('lang-current');
    if (lc) lc.textContent = lang.toUpperCase();

    document.querySelectorAll('.lang-option').forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    document.documentElement.lang = lang === 'de' ? 'de-CH' : 'en';
    localStorage.setItem('lang', lang);
  }

  // ============================================
  // LANGUAGE SWITCHER
  // ============================================
  function initLang() {
    var btn = document.getElementById('lang-btn');
    var dd = document.getElementById('lang-dropdown');
    if (!btn || !dd) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = dd.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });

    dd.querySelectorAll('.lang-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        dd.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        applyLang(opt.getAttribute('data-lang'));
      });
    });

    document.addEventListener('click', function (e) {
      if (!btn.contains(e.target) && !dd.contains(e.target)) {
        dd.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ============================================
  // DARK MODE WAVE ANIMATION
  // ============================================
  function sweepWave(toDark, onMid) {
    var overlay = document.getElementById('dark-wave');
    var canvas = document.getElementById('dark-wave-canvas');
    if (!overlay || !canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onMid && onMid();
      return;
    }

    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');

    // Origin: top-right corner where the toggle lives
    var ox = W - 64, oy = 48;
    var maxR = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy)) * 1.1;
    var color = toDark ? '#0d1117' : '#ffffff';
    var midFired = false, t0 = null, DUR = 680;

    overlay.classList.add('active');

    function frame(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / DUR, 1);
      var e = 1 - Math.pow(1 - p, 3);

      ctx.clearRect(0, 0, W, H);
      ctx.beginPath();
      ctx.arc(ox, oy, e * maxR, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();

      if (!midFired && p >= 0.45) { midFired = true; onMid && onMid(); }

      if (p < 1) { requestAnimationFrame(frame); return; }

      overlay.style.transition = 'opacity 0.28s ease';
      overlay.style.opacity = '0';
      setTimeout(function () {
        overlay.classList.remove('active');
        overlay.style.opacity = '';
        overlay.style.transition = '';
        ctx.clearRect(0, 0, W, H);
      }, 320);
    }

    requestAnimationFrame(frame);
  }

  // ============================================
  // DARK MODE TOGGLE
  // ============================================
  function initDark() {
    var btn = document.getElementById('dark-toggle');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var isDark = document.documentElement.classList.contains('dark');
      var goingDark = !isDark;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.classList.toggle('dark', goingDark);
        localStorage.setItem('theme', goingDark ? 'dark' : 'light');
        return;
      }

      sweepWave(goingDark, function () {
        document.documentElement.classList.add('theme-switching');
        document.documentElement.classList.toggle('dark', goingDark);
        localStorage.setItem('theme', goingDark ? 'dark' : 'light');
        setTimeout(function () {
          document.documentElement.classList.remove('theme-switching');
        }, 500);
      });
    });
  }

  // ============================================
  // INIT
  // ============================================
  function init() {
    var lang = localStorage.getItem('lang') || 'de';
    if (lang !== 'de' && lang !== 'en') lang = 'de';

    // Always sync the switcher UI; only overwrite text when EN
    if (lang === 'en') {
      applyLang('en');
    } else {
      var lc = document.getElementById('lang-current');
      if (lc) lc.textContent = 'DE';
      document.querySelectorAll('.lang-option').forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-lang') === 'de');
      });
    }

    initLang();
    initDark();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
