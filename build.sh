#!/bin/sh
# build.sh
# Genera service-worker.js da service-worker.template.js
# iniettando un CACHE_VERSION univoco basato sul timestamp del deploy.

VERSION="v$(date +%Y%m%d-%H%M%S)"

sed "s/__CACHE_VERSION__/${VERSION}/g" service-worker.template.js > service-worker.js

echo "[Build] Service Worker generato con versione: ${VERSION}"