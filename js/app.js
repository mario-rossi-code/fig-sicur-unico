/**
 * @file app.js
 * @description Entry point dell'applicazione FIG. SICUR. UNICO.
 *
 *              Responsabilità:
 *              - Avviare tutti i sotto-sistemi nell'ordine corretto.
 *              - Caricare i dati dal database JSON.
 *              - Mostrare la versione nell'header.
 *              - Rilevare quando la pagina torna in primo piano per
 *                controllare eventuali aggiornamenti del Service Worker.
 */

"use strict";

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Inizializza l'intera applicazione.
 * Viene chiamata automaticamente al termine del caricamento del DOM.
 *
 * Ordine di inizializzazione:
 * 1. Fix altezza layout (prima del paint per evitare layout shift).
 * 2. Tema (applica subito il colore per evitare flash).
 * 3. Ricerca, modale, navigazione, connettività.
 * 4. Service Worker (asincrono, non blocca il render).
 * 5. Allineamento navbar allo stato salvato.
 * 6. Caricamento dati → render iniziale.
 * 7. Gestione deep link dal protocollo custom.
 * 8. Listener per il controllo aggiornamenti al ritorno in primo piano.
 *
 * @returns {void}
 */
function initApp() {
    console.log(`[App] Avvio ${CONFIG.APP_NAME} v${CONFIG.APP_VERSION}`);

    initLayoutFix();
    initTheme();
    initSearch();
    initModal();
    initNavigation();
    initConnectivityCheck();

    // Service Worker e update checker (asincroni)
    initServiceWorker();
    startUpdateChecker();

    // Sincronizza la navbar con la vista ripristinata dal localStorage
    syncNavigationWithState();

    // Carica i dati e avvia il render
    _loadData();

    // Controlla aggiornamenti SW quando la tab torna attiva
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden && "serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then((reg) => reg.update());
        }
    });
}

// ─── Caricamento dati ─────────────────────────────────────────────────────────

/**
 * Effettua il fetch del database JSON e avvia il render dell'applicazione.
 * In caso di errore mostra un messaggio nel contenuto principale.
 *
 * @private
 * @async
 * @returns {Promise<void>}
 */
async function _loadData() {
    try {
        const res = await fetch(CONFIG.PATHS.DB_JSON);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        dbData = json.citta;

        render();
        handleProtocolUrl();

    } catch (err) {
        console.error("[App] Errore nel caricamento dei dati:", err);

        const content = document.getElementById("content");
        if (content) {
            content.innerHTML = `
                <div class="error-message">
                    <i class="fa-solid fa-exclamation-triangle" aria-hidden="true"></i>
                    <p>Errore nel caricamento dei dati</p>
                    <small>${err.message}</small>
                </div>
            `;
        }
    }
}

// ─── Versione header ──────────────────────────────────────────────────────────

/**
 * Scrive la versione dell'app nell'elemento `.version` dell'header.
 * Viene eseguito fuori dal ciclo di init per non bloccare il render iniziale.
 */
setTimeout(() => {
    const versionEl = document.querySelector(".version");
    if (versionEl) versionEl.textContent = `v${CONFIG.APP_VERSION}`;
}, 0);

// ─── Bootstrap ────────────────────────────────────────────────────────────────

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
} else {
    initApp();
}
