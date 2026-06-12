/* i18n.jsx — komplettes DE/EN-Wörterbuch + Provider + useT()-Hook
   Sprache wird in localStorage gespeichert und der Header-Lang-Button
   schaltet zwischen DE und EN über setLang(). */

const TRANSLATIONS = {
  de: {
    // Navigation
    nav_home: "Home",
    nav_services: "Leistungen",
    nav_prices: "Preise",
    nav_ai: "KI Assistent",
    nav_about: "Über uns",
    nav_contact: "Kontakt",
    nav_cta_short: "Kostenloses Erstgespräch",
    header_dark_label: "Dark Mode umschalten",

    // Hero
    hero_eyebrow: "Matteo & Severin · MASESites AG",
    hero_title: "Websites, die verkaufen.",
    hero_lead: "Professionelle Weblösungen und KI-Integration für moderne Unternehmen.",
    hero_cta_primary: "Projekt starten",
    hero_cta_secondary: "Preise ansehen",
    badge_mobile: "Mobile-first",
    badge_seo: "SEO-optimiert",
    badge_ai: "KI-Integration",

    // Hero benefit card
    benefit_badge: "Für Unternehmen, die online Kunden gewinnen wollen",
    benefit_title: "Deine Website arbeitet für dich",
    benefit_subtitle: "Klar aufgebaut. Schnell geladen. Auf mehr Anfragen optimiert.",
    benefit_item_1: "Mehr Vertrauen bei neuen Kunden",
    benefit_item_2: "Mehr Anfragen über deine Website",
    benefit_item_3: "Modern auf jedem Gerät",
    benefit_trust_1: "Mobile-first",
    benefit_trust_2: "SEO-optimiert",
    benefit_trust_3: "Schnelle Ladezeit",
    benefit_price: "Ab CHF 750",
    benefit_cta: "Projekt starten",

    // Trust grid
    trust_title: "Warum MASE",
    trust_1_title: "Schnell",
    trust_1_desc: "Klare Prozesse, kurze Wege, schnelle Live-Schaltung.",
    trust_2_title: "Sauberer Code",
    trust_2_desc: "Minimal, wartbar und für Performance optimiert.",
    trust_3_title: "Mobile-first",
    trust_3_desc: "UX, die auf jedem Screen sitzt. Keine Kompromisse.",
    trust_4_title: "KI-Integration",
    trust_4_desc: "Assistenz, die Leads qualifiziert und Fragen klärt.",

    // Process steps
    process_title: "Unser Ansatz",
    process_lead: "5 klare Schritte vom Erstgespräch bis zur messbaren Wirkung.",
    process_1_title: "Analyse & Strategie",
    process_1_desc: "Wir analysieren dein Business, deine Zielgruppe und den Wettbewerb.",
    process_2_title: "Struktur & UX-Planung",
    process_2_desc: "Seitenstruktur, Navigation und UX werden vor dem ersten Pixel geplant.",
    process_3_title: "Modernes Design",
    process_3_desc: "Clean, professionell, verkaufsstark. Design, das Vertrauen weckt.",
    process_4_title: "Saubere Entwicklung",
    process_4_desc: "Schneller, wartbarer Code. Mobile-first, SEO-ready und zukunftssicher.",
    process_5_title: "Optimierung & Skalierung",
    process_5_desc: "Nach dem Launch analysieren, optimieren und skalieren wir deinen Auftritt.",
    process_cta: "Projekt starten",

    // AI section
    ai_title: "KI-Integration · dein digitaler Mitarbeiter",
    ai_lead: "Unser KI-Assistent arbeitet 24/7 für dich: beantwortet Kundenfragen, sammelt Leads und qualifiziert Anfragen.",
    ai_feature_1: "Automatische Kundenberatung in Echtzeit",
    ai_feature_2: "Lead-Qualifizierung mit Übergabe an dein Team",
    ai_feature_3: "Auf deine Leistungen und Tonalität trainiert",
    ai_trust_1: "Für KMU und Dienstleister",
    ai_trust_2: "Antworten in Sekunden",
    ai_trust_3: "Setup ab CHF 200",
    ai_cta_primary: "KI-Assistent entdecken",
    ai_cta_secondary: "Kostenloses Erstgespräch",

    // Chat widget
    chat_header: "MASESites KI-Assistent",
    chat_status: "Online",
    chat_placeholder: "Nachricht schreiben...",
    chat_send: "Senden",
    chat_typing_label: "Tippt",
    chat_script_1: "Hallo! Wie kann ich dir helfen?",
    chat_script_2: "Was kostet eine Website?",
    chat_script_3: "Starter ab CHF 750. Finale Offerte nach kurzem Call.",
    chat_script_4: "Könnt ihr einen Termin einrichten?",
    chat_script_5: "Klar. Hinterlasse kurz deine Kontaktdaten, ich melde mich.",
    chat_seed_1: "Hallo! Wie kann ich dir helfen?",
    chat_seed_2: "Klar. Hinterlasse kurz deine Kontaktdaten, ich melde mich.",
    chat_seed_3: "Starter ab CHF 750. Finale Offerte nach kurzem Call.",
    chat_seed_4: "Der KI-Assistent kostet CHF 200 Setup + CHF 40 / Monat.",
    chat_seed_5: "Wir bauen alles mobile-first und SEO-optimiert.",

    // Pricing teaser
    pricing_teaser_title: "Transparente Preise",
    pricing_teaser_lead: "Von der Überarbeitung bis zur kompletten Website — modulare Pakete ab CHF 250.",
    pricing_teaser_cta: "Alle Preise ansehen",

    // Pricing section
    pricing_section_title: "Modular zusammenstellen",
    pricing_section_lead: "Wähle ein Paket und kombiniere die Bausteine. Preise in CHF, ohne MWST.",
    pricing_group_base: "Basis",
    pricing_group_addons: "Erweiterungen",
    pricing_base_starter: "Starter",
    pricing_base_starter_desc: "1-3 Seiten · 1 CTA",
    pricing_base_business: "Business",
    pricing_base_business_desc: "5-8 Seiten · Kontaktformular",
    pricing_base_premium: "Premium",
    pricing_base_premium_desc: "10+ Seiten · CMS · SEO",
    pricing_addon_ai: "KI-Assistent",
    pricing_addon_ai_desc: "Setup + 1. Monat",
    pricing_addon_seo: "SEO-Optimierung",
    pricing_addon_seo_desc: "On-Page + Audit",
    pricing_addon_copy: "Copywriting",
    pricing_addon_copy_desc: "DE / EN für alle Seiten",
    pricing_summary_eyebrow: "Dein Setup",
    pricing_summary_note: "einmaliger Setup-Preis. KI-Assistent zzgl. CHF 40 / Monat.",
    pricing_cta_send: "Anfrage senden",
    pricing_final_note: "Finale Offerte nach kurzem Call.",

    // Contact
    contact_title: "Lass uns dein Projekt starten",
    contact_lead: "Beschreibe uns kurz dein Ziel. Wir melden uns mit einer klaren Empfehlung und den nächsten Schritten.",
    contact_field_name: "Name *",
    contact_field_email: "E-Mail *",
    contact_field_company: "Firma (optional)",
    contact_field_project: "Projektart",
    contact_field_message: "Nachricht *",
    contact_field_select: "Bitte wählen...",
    contact_field_new: "Neue Website",
    contact_field_revision: "Überarbeitung",
    contact_field_ai_addon: "+ KI-Assistent",
    contact_privacy_prefix: "Ich habe die ",
    contact_privacy_link: "Datenschutzerklärung",
    contact_privacy_suffix: " gelesen und akzeptiere sie. *",
    contact_submit: "Anfrage senden",
    contact_success: "✓ Danke, deine Anfrage ist eingegangen. Wir melden uns innerhalb von 24h.",
    contact_error: "Bitte fülle die mit * markierten Felder aus.",

    // Footer
    footer_desc: "Professionelle Websites & KI-Integration aus der Schweiz.",
    footer_nav: "Navigation",
    footer_contact: "Kontakt",
    footer_legal: "Rechtliches",
    footer_form: "Kontaktformular",
    footer_impressum: "Impressum",
    footer_privacy: "Datenschutz",
    footer_copy: "Alle Rechte vorbehalten.",

    // Sticky CTA + placeholder
    sticky_cta: "Projekt starten",
    placeholder_title: "Diese Seite ist nicht im UI-Kit",
    placeholder_lead: "Es gibt sie im Original-Code, aber sie ist kein Bestandteil des Kits. Wir können sie auf Anfrage ergänzen.",
    placeholder_back: "Zurück zur Startseite",

    // Code-Proof Section
    codeproof_title: "Technische Qualität, die man sieht",
    codeproof_lead: "Wir entwickeln nicht nur schöne Oberflächen, sondern auch saubere Systeme: wartbar, performant und auf Wachstum vorbereitet.",
    codeproof_p1: "Semantisches HTML für Struktur und SEO",
    codeproof_p2: "Klare Komponenten statt chaotischer Einzellösungen",
    codeproof_p3: "Saubere Formvalidierung und verlässliche API-Anbindung",

    // Live-Preview Section
    lp_title: "Beispielprojekte",
    lp_lead: "So könnte deine nächste Website aussehen. Vier Branchen, ein Standard.",
    lp_bowling_domain: "Freizeit & Sport",
    lp_bowling_title: "Bowling Center",
    lp_bowling_desc: "Buchung, Events und klare Preise im Fokus.",
    lp_praxis_domain: "Gesundheit & Medizin",
    lp_praxis_title: "Praxis Website",
    lp_praxis_desc: "Seriöses Design mit ruhiger Typografie und klaren Terminen.",
    lp_gastro_domain: "Gastronomie",
    lp_gastro_title: "Dönerladen",
    lp_gastro_desc: "Konzentriert auf Speisekarte, Bestellung und Standort.",
    lp_beauty_domain: "Beauty & Wellness",
    lp_beauty_title: "Nagelstudio",
    lp_beauty_desc: "Elegantes One-Page-Design mit Services und Buchung.",

    // Marquee
    marquee_1: "Mobile-first",
    marquee_2: "SEO-optimiert",
    marquee_3: "Schweiz",
    marquee_4: "ab CHF 750",
    marquee_5: "Antworten in Sekunden",
    marquee_6: "Sauberer Code",
    marquee_7: "24/7 KI-Assistent",
    marquee_8: "DSGVO-konform",
    marquee_9: "Matteo & Severin",
  },

  en: {
    // Navigation
    nav_home: "Home",
    nav_services: "Services",
    nav_prices: "Pricing",
    nav_ai: "AI Assistant",
    nav_about: "About us",
    nav_contact: "Contact",
    nav_cta_short: "Free consultation",
    header_dark_label: "Toggle dark mode",

    // Hero
    hero_eyebrow: "Matteo & Severin · MASESites AG",
    hero_title: "Websites that sell.",
    hero_lead: "Professional web solutions and AI integration for modern businesses.",
    hero_cta_primary: "Start project",
    hero_cta_secondary: "See pricing",
    badge_mobile: "Mobile-first",
    badge_seo: "SEO-optimised",
    badge_ai: "AI integration",

    // Hero benefit card
    benefit_badge: "For businesses that want to win clients online",
    benefit_title: "Your website works for you",
    benefit_subtitle: "Clean structure. Fast loading. Built to drive enquiries.",
    benefit_item_1: "More trust with new customers",
    benefit_item_2: "More enquiries through your site",
    benefit_item_3: "Modern on every device",
    benefit_trust_1: "Mobile-first",
    benefit_trust_2: "SEO-optimised",
    benefit_trust_3: "Fast loading",
    benefit_price: "From CHF 750",
    benefit_cta: "Start project",

    // Trust grid
    trust_title: "Why MASE",
    trust_1_title: "Fast",
    trust_1_desc: "Clear processes, short paths, quick launch.",
    trust_2_title: "Clean code",
    trust_2_desc: "Minimal, maintainable and optimised for performance.",
    trust_3_title: "Mobile-first",
    trust_3_desc: "UX that works on every screen. No compromises.",
    trust_4_title: "AI integration",
    trust_4_desc: "An assistant that qualifies leads and answers questions.",

    // Process steps
    process_title: "Our approach",
    process_lead: "5 clear steps from first call to measurable impact.",
    process_1_title: "Analysis & strategy",
    process_1_desc: "We analyse your business, your audience and the competition.",
    process_2_title: "Structure & UX planning",
    process_2_desc: "Site structure, navigation and UX are planned before the first pixel.",
    process_3_title: "Modern design",
    process_3_desc: "Clean, professional, sales-driven. Design that builds trust.",
    process_4_title: "Clean development",
    process_4_desc: "Fast, maintainable code. Mobile-first, SEO-ready, future-proof.",
    process_5_title: "Optimisation & scale",
    process_5_desc: "After launch we analyse, optimise and scale your digital presence.",
    process_cta: "Start project",

    // AI section
    ai_title: "AI integration · your digital employee",
    ai_lead: "Our AI assistant works 24/7 for you: answers customer questions, captures leads and qualifies enquiries.",
    ai_feature_1: "Automated customer support in real time",
    ai_feature_2: "Lead qualification with handoff to your team",
    ai_feature_3: "Trained on your services and tone of voice",
    ai_trust_1: "For SMEs and service providers",
    ai_trust_2: "Replies in seconds",
    ai_trust_3: "Setup from CHF 200",
    ai_cta_primary: "Discover the AI assistant",
    ai_cta_secondary: "Free consultation",

    // Chat widget
    chat_header: "MASESites AI assistant",
    chat_status: "Online",
    chat_placeholder: "Type a message...",
    chat_send: "Send",
    chat_typing_label: "Typing",
    chat_script_1: "Hi! How can I help you?",
    chat_script_2: "How much does a website cost?",
    chat_script_3: "Starter from CHF 750. Final quote after a short call.",
    chat_script_4: "Can we book a call?",
    chat_script_5: "Of course. Just leave your contact details and I'll get back to you.",
    chat_seed_1: "Hi! How can I help you?",
    chat_seed_2: "Of course. Just leave your contact details and I'll get back to you.",
    chat_seed_3: "Starter from CHF 750. Final quote after a short call.",
    chat_seed_4: "The AI assistant is CHF 200 setup + CHF 40 / month.",
    chat_seed_5: "Everything we build is mobile-first and SEO-optimised.",

    // Pricing teaser
    pricing_teaser_title: "Transparent pricing",
    pricing_teaser_lead: "From a refresh to a full new build — modular packages from CHF 250.",
    pricing_teaser_cta: "See all pricing",

    // Pricing section
    pricing_section_title: "Build your package",
    pricing_section_lead: "Pick a base and combine add-ons. Prices in CHF, excl. VAT.",
    pricing_group_base: "Base",
    pricing_group_addons: "Add-ons",
    pricing_base_starter: "Starter",
    pricing_base_starter_desc: "1-3 pages · 1 CTA",
    pricing_base_business: "Business",
    pricing_base_business_desc: "5-8 pages · contact form",
    pricing_base_premium: "Premium",
    pricing_base_premium_desc: "10+ pages · CMS · SEO",
    pricing_addon_ai: "AI assistant",
    pricing_addon_ai_desc: "Setup + 1st month",
    pricing_addon_seo: "SEO optimisation",
    pricing_addon_seo_desc: "On-page + audit",
    pricing_addon_copy: "Copywriting",
    pricing_addon_copy_desc: "DE / EN for all pages",
    pricing_summary_eyebrow: "Your setup",
    pricing_summary_note: "One-off setup. AI assistant adds CHF 40 / month.",
    pricing_cta_send: "Send request",
    pricing_final_note: "Final quote after a short call.",

    // Contact
    contact_title: "Let's start your project",
    contact_lead: "Tell us briefly what you want to achieve. We'll come back with a clear recommendation and next steps.",
    contact_field_name: "Name *",
    contact_field_email: "E-mail *",
    contact_field_company: "Company (optional)",
    contact_field_project: "Project type",
    contact_field_message: "Message *",
    contact_field_select: "Please select...",
    contact_field_new: "New website",
    contact_field_revision: "Redesign",
    contact_field_ai_addon: "+ AI assistant",
    contact_privacy_prefix: "I have read the ",
    contact_privacy_link: "privacy policy",
    contact_privacy_suffix: " and accept it. *",
    contact_submit: "Send request",
    contact_success: "✓ Thanks, your request has been received. We'll be in touch within 24h.",
    contact_error: "Please fill in the fields marked with *.",

    // Footer
    footer_desc: "Professional websites & AI integration from Switzerland.",
    footer_nav: "Navigation",
    footer_contact: "Contact",
    footer_legal: "Legal",
    footer_form: "Contact form",
    footer_impressum: "Imprint",
    footer_privacy: "Privacy policy",
    footer_copy: "All rights reserved.",

    // Sticky CTA + placeholder
    sticky_cta: "Start project",
    placeholder_title: "Not part of the UI kit",
    placeholder_lead: "This page exists in the original code but is not part of the kit. Available on request.",
    placeholder_back: "Back to home",

    // Code-Proof Section
    codeproof_title: "Technical quality you can see",
    codeproof_lead: "We don't just build pretty surfaces — we ship clean systems: maintainable, performant, ready to scale.",
    codeproof_p1: "Semantic HTML for structure and SEO",
    codeproof_p2: "Clear components instead of one-off hacks",
    codeproof_p3: "Solid form validation and reliable API wiring",

    // Live-Preview Section
    lp_title: "Example projects",
    lp_lead: "A taste of what your next website could look like. Four industries, one standard.",
    lp_bowling_domain: "Leisure & sport",
    lp_bowling_title: "Bowling center",
    lp_bowling_desc: "Booking, events and clear pricing front and center.",
    lp_praxis_domain: "Health & medical",
    lp_praxis_title: "Medical practice",
    lp_praxis_desc: "Calm typography and clear appointment flows.",
    lp_gastro_domain: "Gastronomy",
    lp_gastro_title: "Takeaway shop",
    lp_gastro_desc: "Menu, ordering and location, no clutter.",
    lp_beauty_domain: "Beauty & wellness",
    lp_beauty_title: "Nail studio",
    lp_beauty_desc: "Elegant one-pager with services and booking.",

    // Marquee
    marquee_1: "Mobile-first",
    marquee_2: "SEO-optimised",
    marquee_3: "Switzerland",
    marquee_4: "from CHF 750",
    marquee_5: "Replies in seconds",
    marquee_6: "Clean code",
    marquee_7: "24/7 AI assistant",
    marquee_8: "GDPR compliant",
    marquee_9: "Matteo & Severin",
  },
};

const I18nContext = React.createContext({
  lang: "de",
  setLang: () => {},
  t: (k) => k,
});

function I18nProvider({ children }) {
  const [lang, setLangState] = React.useState(() => {
    try {
      const stored = localStorage.getItem("mase-lang");
      return stored === "en" ? "en" : "de";
    } catch (e) { return "de"; }
  });

  const setLang = React.useCallback((l) => {
    setLangState(l === "en" ? "en" : "de");
  }, []);

  React.useEffect(() => {
    try { localStorage.setItem("mase-lang", lang); } catch (e) {}
    document.documentElement.lang = lang === "de" ? "de-CH" : "en";
  }, [lang]);

  const t = React.useCallback(
    (key) => {
      const dict = TRANSLATIONS[lang] || TRANSLATIONS.de;
      return dict[key] != null ? dict[key] : (TRANSLATIONS.de[key] != null ? TRANSLATIONS.de[key] : key);
    },
    [lang]
  );

  return React.createElement(I18nContext.Provider, { value: { lang, setLang, t } }, children);
}

function useT() {
  return React.useContext(I18nContext);
}

window.I18nProvider = I18nProvider;
window.useT = useT;
