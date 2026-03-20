#!/bin/sh
# build.sh
# 1. Genera service-worker.js da service-worker.template.js
# 2. Concatena tutti i moduli CSS in style.css (un solo file per il browser)
#
# Uso: ./build.sh
# Output:
#   - service-worker.js   (versione con CACHE_VERSION iniettato)
#   - style.css           (tutti i moduli CSS concatenati in ordine)

set -e

VERSION="v$(date +%Y%m%d-%H%M%S)"

# ─── 1. Service Worker ────────────────────────────────────────────────────────

sed "s/__CACHE_VERSION__/${VERSION}/g" service-worker.template.js > service-worker.js
echo "[Build] Service Worker generato con versione: ${VERSION}"

# ─── 2. CSS bundle ───────────────────────────────────────────────────────────
#
# Ordine identico agli @import in style.css:
#   variabili → base → layout → componenti → viste → animazioni → responsive
#
# Se aggiungi un nuovo modulo CSS, inseriscilo qui nella posizione corretta.

CSS_MODULES="
  css/variables.css
  css/base.css
  css/layout.css
  css/components/breadcrumb.css
  css/components/search.css
  css/components/cards.css
  css/components/modal.css
  css/components/navbar.css
  css/components/banner.css
  css/views/cities.css
  css/views/groups.css
  css/animations.css
  css/responsive.css
"

# Header del bundle (utile per debugging in DevTools)
cat > style.css << HEADER
/*!
 * FIG. SICUR. UNICO — CSS Bundle
 * Build: ${VERSION}
 * Generato automaticamente da build.sh — non modificare direttamente.
 * Modifica i file sorgente in css/ e riesegui build.sh.
 */
HEADER

# Concatena ogni modulo con un separatore leggibile
for MODULE in $CSS_MODULES; do
  if [ -f "$MODULE" ]; then
    printf "\n/* ─── %s ─────────────────────────────────── */\n" "$MODULE" >> style.css
    cat "$MODULE" >> style.css
    echo "[Build] CSS: $MODULE ✓"
  else
    echo "[Build] ATTENZIONE: modulo non trovato → $MODULE"
  fi
done

# Conta le righe del bundle finale
LINES=$(wc -l < style.css)
echo "[Build] style.css generato — ${LINES} righe totali"