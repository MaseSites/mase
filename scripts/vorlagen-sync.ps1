# ============================================================
#  vorlagen-sync.ps1
#  Spiegelt die Branchen-Vorlagen aus "..\Webseiten Vorlagen\<Ordner>\"
#  in dieses Repo unter  beispiel-demos\<slug>\ , committet und pusht.
#
#  Danach in Plesk einmal  Git -> "Pull"/"Bereitstellen"  klicken,
#  dann sind die Aenderungen live unter /beispiele.
#
#  Bedienung: Doppelklick auf  vorlagen-sync.bat
# ============================================================

$ErrorActionPreference = "Stop"
# git schreibt normalen Fortschritt nach stderr -> nicht als Fehler werten,
# wir pruefen stattdessen $LASTEXITCODE selbst.
$PSNativeCommandUseErrorActionPreference = $false

$repo     = Split-Path -Parent $PSScriptRoot            # ...\Masesites Official
$vorlagen = Join-Path (Split-Path -Parent $repo) "Webseiten Vorlagen"
$ziel     = Join-Path $repo "beispiel-demos"

# Quellordner (in "Webseiten Vorlagen")  ->  Slug (in beispiel-demos)
# Neue Vorlage? Hier eine Zeile ergaenzen (Ordnername = Slug) und im Admin
# unter Inhalte als Beispiel mit URL /beispiel-demos/<slug>/ anlegen.
$map = [ordered]@{
  "Restaurant Vorlage"                                   = "restaurant"
  "Reinigungsfirmen Vorlage"                             = "reinigung"
  "BELLA LOCA - Friseursalon in Zürich"                  = "coiffeur"
  "Buildings – Handwerker und Bauunternehmen Vorlage"    = "bauunternehmen"
  "Gartenbau und Landschaftspflege Vorlage"              = "gartenbau"
  "Maler, Gipser und kleinere Handwerksbetriebe Vorlage" = "maler-gipser"
  "Autogaragen und Reifenservices Vorlage"               = "autogarage"
  "Kosmetikstudios und Beauty-Salons Vorlage"            = "kosmetik"
  "Bäckereien und Konditoreien Vorlage"                  = "baeckerei"
  "Fahrschulen Vorlage"                                  = "fahrschule"
  "Optiker und Brillengeschäfte Vorlage"                 = "optik"
  "Metzgereien und Feinkostläden Vorlage"                = "metzgerei"
  "Arztpraxen und Hausarztpraxen Vorlage"                = "praxis"
  "Hotel Vorlage"                                        = "hotel"
  "Fachgeschäft Vorlage"                                 = "fachgeschaeft"
  "Freizeit Vorlage"                                     = "freizeit"
}

if (-not (Test-Path $vorlagen)) { throw "Ordner nicht gefunden: $vorlagen" }

Write-Host "== Vorlagen spiegeln ==" -ForegroundColor Cyan
foreach ($ordner in $map.Keys) {
  $slug = $map[$ordner]
  $src  = Join-Path $vorlagen $ordner
  $dst  = Join-Path $ziel $slug
  if (-not (Test-Path (Join-Path $src "index.html"))) {
    Write-Host ("  uebersprungen (keine index.html): {0}" -f $ordner) -ForegroundColor Yellow
    continue
  }
  # /MIR = exakte Spiegelung (auch geloeschte Dateien).
  # WICHTIG: nur statische Web-Dateien ausliefern. Backend/Datendateien
  # (z. B. BELLA LOCA: server.py, bookings.json, config.json, dashboard.admin)
  # NIEMALS oeffentlich - deshalb hart ausschliessen.
  robocopy $src $dst /MIR `
    /XF *.bak "original-backup.*" .DS_Store Thumbs.db desktop.ini `
        *.py *.pyc *.admin *.bat *.sh *.env config.json bookings.json `
        *.db *.sqlite *.sqlite3 .htaccess `
    /XD .git node_modules __pycache__ .swarm .claude-flow | Out-Null
  if ($LASTEXITCODE -ge 8) { throw ("robocopy-Fehler bei {0} (Code {1})" -f $ordner, $LASTEXITCODE) }

  # Demo-Hinweis ("Konzept-Demo - fiktiver Musterbetrieb") in jede gespiegelte
  # index.html injizieren. Der Sync ueberschreibt die Dateien 1:1 aus den
  # Vorlagen - ohne diesen Schritt waere der Hinweis nach jedem Sync wieder weg.
  $indexDatei = Join-Path $dst "index.html"
  if (Test-Path $indexDatei) {
    $html = [System.IO.File]::ReadAllText($indexDatei)
    if ($html -notmatch 'assets/js/demo-notice\.js') {
      $tag = '<script src="/assets/js/demo-notice.js?v=1"></script>'
      if ($html -match '</body>') {
        $html = $html -replace '</body>', "$tag`n</body>"
      } else {
        $html += "`n$tag`n"
      }
      [System.IO.File]::WriteAllText($indexDatei, $html, (New-Object System.Text.UTF8Encoding $false))
    }
  }
  Write-Host ("  ok  {0,-52} -> beispiel-demos\{1}\" -f $ordner, $slug)
}

# --- Git: NUR die gespiegelten Slug-Ordner committen. Bewusst nicht
#     "git add beispiel-demos", weil dort auch tavolo.html (Hand-gepflegt)
#     und evtl. Admin-Uploads liegen, die hier nicht mit sollen. ---
Set-Location $repo
$slugPfade = @($map.Values | ForEach-Object { "beispiel-demos/$_" })
git add -- $slugPfade
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "`nKeine Aenderungen an den Vorlagen - nichts zu pushen." -ForegroundColor Green
  return
}

$stamp = Get-Date -Format "yyyy-MM-dd HH:mm"
git commit -m "Vorlagen-Sync: Demos aktualisiert ($stamp)" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "git commit fehlgeschlagen." }

git pull --rebase --autostash origin main
if ($LASTEXITCODE -ne 0) { throw "git pull --rebase fehlgeschlagen (evtl. Konflikt). Bitte manuell klaeren oder Claude fragen." }

git push origin main
if ($LASTEXITCODE -ne 0) { throw "git push fehlgeschlagen - Internet/Remote pruefen." }

Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "  Auf GitHub gepusht." -ForegroundColor Green
Write-Host "  JETZT in Plesk einmal  Git -> 'Pull'/'Bereitstellen'  klicken." -ForegroundColor Green
Write-Host "  Danach sind die Vorlagen live unter /beispiele." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
