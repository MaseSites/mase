/* Kennzeichnet eigenständige Branchen-Demos auch ausserhalb des MASESites-Viewers.
   Der Hinweis bleibt bewusst sichtbar: Musterfirmen, Personen, Zahlen und Inhalte
   dürfen nie wie echte Kundenreferenzen oder belegte Resultate wirken. */
(function () {
  "use strict";

  function anzeigen() {
    if (document.querySelector(".ms-demo-notice")) return;

    var stil = document.createElement("style");
    stil.textContent =
      ".ms-demo-notice{position:fixed;left:12px;bottom:12px;z-index:2147483000;" +
      "max-width:min(520px,calc(100vw - 24px));padding:10px 13px;border:1px solid rgba(255,255,255,.2);" +
      "border-radius:12px;background:rgba(20,17,14,.94);color:#fff;box-shadow:0 10px 30px rgba(0,0,0,.28);" +
      "font:500 12px/1.45 system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;" +
      "letter-spacing:0;text-transform:none;backdrop-filter:blur(12px)}" +
      ".ms-demo-notice strong{display:block;margin-bottom:2px;color:#fff;font-size:11px;letter-spacing:.1em;text-transform:uppercase}" +
      ".ms-demo-notice span{color:rgba(255,255,255,.78)}" +
      "@media(max-width:560px){.ms-demo-notice{right:12px;max-width:none;font-size:11px}}";
    document.head.appendChild(stil);

    var hinweis = document.createElement("aside");
    hinweis.className = "ms-demo-notice";
    hinweis.setAttribute("role", "note");
    hinweis.setAttribute("aria-label", "Hinweis zur Konzept-Demo");
    hinweis.innerHTML = "<strong>Konzept-Demo</strong><span>Fiktiver Musterbetrieb – keine Kundenreferenz. Namen, Zahlen, Projekte und Rückmeldungen sind Platzhalter.</span>";
    document.body.appendChild(hinweis);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", anzeigen);
  else anzeigen();
})();
