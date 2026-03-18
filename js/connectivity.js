/**
 * @file connectivity.js
 * @description Monitoraggio della connettività di rete.
 *
 *              Mostra un banner rosso quando l'app va offline e un banner
 *              verde temporaneo quando torna online.
 *              Da chiamare una sola volta durante `initApp()`.
 */

"use strict";

// ─── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Inizializza il monitoraggio online/offline.
 * Registra i listener `online` e `offline` sulla finestra e controlla
 * lo stato iniziale al momento del caricamento.
 *
 * @returns {void}
 */
function initConnectivityCheck() {
    window.addEventListener("online", _updateBanner);
    window.addEventListener("offline", _updateBanner);

    // Controllo immediato all'avvio
    if (!navigator.onLine) _updateBanner();
}

// ─── Helper privati ───────────────────────────────────────────────────────────

/** @type {HTMLElement|null} */
const _banner = document.getElementById("offlineBanner");

/**
 * Aggiorna il banner in base allo stato della connessione corrente.
 *
 * - **Online** dopo essere stati offline: mostra un banner verde per 3 s.
 * - **Online** senza essere stati offline prima: nasconde il banner.
 * - **Offline**: mostra il banner rosso.
 *
 * @private
 * @returns {void}
 */
function _updateBanner() {
    if (!_banner) return;

    const span = _banner.querySelector("span");
    const icon = _banner.querySelector("i");

    if (navigator.onLine) {
        if (
            _banner.classList.contains("show") &&
            !_banner.classList.contains("success")
        ) {
            // Tornati online: feedback positivo temporaneo
            _banner.classList.add("success");
            if (icon) icon.className = "fa-solid fa-check-circle";
            if (span)
                span.textContent = "Connessione stabilita, dati aggiornati.";

            setTimeout(() => {
                _banner.classList.remove("show");
                setTimeout(() => {
                    _banner.classList.remove("success");
                    _banner.classList.add("hidden");
                }, 400);
            }, 3000);
        } else {
            _banner.classList.add("hidden");
            _banner.classList.remove("show");
        }
    } else {
        // Offline
        _banner.classList.remove("success", "hidden");
        if (icon) icon.className = "fa-solid fa-plug-circle-xmark";
        if (span)
            span.textContent =
                "Connessione non disponibile. I dati potrebbero non essere aggiornati.";
        setTimeout(() => _banner.classList.add("show"), 10);
    }
}
