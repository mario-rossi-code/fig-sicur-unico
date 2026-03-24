/**
 * @file app.js
 * @description Entry point dell'applicazione Figure di Sicurezza.
 *
 *              Responsabilità:
 *              - Verificare l'autenticazione prima di avviare l'app.
 *              - Avviare tutti i sotto-sistemi nell'ordine corretto.
 *              - Caricare i dati dal database JSON.
 *              - Mostrare la versione nell'header.
 *              - Rilevare quando la pagina torna in primo piano per
 *                controllare eventuali aggiornamenti del Service Worker.
 */

"use strict";

// Variabile globale per il prompt di installazione PWA
let deferredPrompt = null;

// ─── Bootstrap ────────────────────────────────────────────────────────────────

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", _bootstrap);
} else {
    _bootstrap();
}

/**
 * Punto di ingresso reale: applica il tema subito (evita flash),
 * poi richiede autenticazione e solo dopo avvia l'app.
 * @private
 */
function _bootstrap() {
    // Il tema va applicato prima di tutto per evitare il flash bianco
    const savedTheme =
        localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Richiede autenticazione; initApp viene chiamato solo se la password è corretta
    requireAuth(initApp);
}

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Inizializza l'intera applicazione.
 * Viene chiamata da requireAuth() dopo l'autenticazione riuscita.
 *
 * Ordine di inizializzazione:
 * 1. Fix altezza layout (prima del paint per evitare layout shift).
 * 2. Tema (applica subito il colore per evitare flash).
 * 3. Ricerca, modale, navigazione, connettività.
 * 4. Google Analytics
 * 5. Service Worker (asincrono, non blocca il render).
 * 6. Allineamento navbar allo stato salvato.
 * 7. Caricamento dati → render iniziale.
 * 8. Gestione deep link dal protocollo custom.
 * 9. Listener per il controllo aggiornamenti al ritorno in primo piano.
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

    // ✨ Inizializza Google Analytics (se abilitato in config)
    if (CONFIG.GOOGLE_ANALYTICS?.ENABLED) {
        initAnalytics(CONFIG.GOOGLE_ANALYTICS.MEASUREMENT_ID);
    } else {
        // Versione fallback se non configurato
        initAnalytics("G-3MCJ10R94P");
    }

    // Service Worker e update checker (asincroni)
    initServiceWorker();
    startUpdateChecker();

    // Sincronizza la navbar con la vista ripristinata dal localStorage
    syncNavigationWithState();

    // Carica i dati e avvia il render
    _loadData();

    // Inizializza tracking PWA
    initPWATracking();

    // Controlla aggiornamenti SW quando la tab torna attiva
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            // Traccia quando l'app torna in primo piano
            if (typeof trackEvent === "function") {
                trackEvent("app_foreground");
            }

            // Controlla aggiornamenti SW
            if ("serviceWorker" in navigator) {
                navigator.serviceWorker.ready.then((reg) => reg.update());
            }
        }
    });
}

/**
 * Sincronizza la navbar con lo stato corrente
 * @private
 */
function syncNavigationWithState() {
    // Si assicura che state.view sia disponibile
    if (typeof state !== "undefined" && state.view) {
        const navItems = document.querySelectorAll(".nav-item");
        navItems.forEach((item) => {
            item.classList.remove("active");
            if (item.getAttribute("data-view") === state.view) {
                item.classList.add("active");
            }
        });
        window.currentView = state.view;
        // console.log(`[App] Navbar sincronizzata con vista: ${state.view}`);
    }
}

/**
 * Inizializza il tracking per le funzionalità PWA (installazione, prompt, ecc.)
 * @private
 */
function initPWATracking() {
    // Traccia quando l'app viene installata
    window.addEventListener("appinstalled", () => {
        console.log("[App] PWA installata");
        if (typeof trackPWAInstall === "function") {
            trackPWAInstall("accepted");
        }
    });

    // Traccia quando viene mostrato il prompt di installazione
    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredPrompt = e;

        console.log("[App] Prompt installazione mostrato");
        if (typeof trackInstallPromptShown === "function") {
            trackInstallPromptShown(e.platforms);
        }

        // Mostra un bottone personalizzato per installare
        const installBtn = document.getElementById("installButton");
        if (installBtn) {
            installBtn.style.display = "block";
            installBtn.addEventListener("click", handleInstallClick);
        }
    });

    // Traccia se l'utente ha già l'app installata all'avvio
    if (typeof getDisplayMode === "function") {
        const mode = getDisplayMode();
        console.log("[App] Modalità visualizzazione:", mode);
    }
}

/**
 * Gestisce il click sul bottone di installazione personalizzato
 * @private
 */
async function handleInstallClick() {
    if (!deferredPrompt) return;

    // Traccia click sul bottone
    if (typeof trackEvent === "function") {
        trackEvent("install_button_click");
    }

    // Mostra il prompt nativo del browser
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    // Traccia il risultato
    console.log("[App] Risultato installazione:", outcome);
    if (typeof trackPWAInstall === "function") {
        trackPWAInstall(outcome);
    }

    // Nascondi il bottone e resetta il prompt
    const installBtn = document.getElementById("installButton");
    if (installBtn) {
        installBtn.style.display = "none";
    }
    deferredPrompt = null;
}

/**
 * Gestisce i parametri URL e pulisce l'URL se necessario
 * @private
 */
function handleUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const view = urlParams.get("view");
    const source = urlParams.get("source");

    // Se c'è un parametro view valido, si assicura che la vista sia impostata
    if (view && ["cities", "groups", "roles", "people"].includes(view)) {
        console.log(
            `[App] Navigazione da ${source || "URL"} alla vista: ${view}`,
        );

        // Aggiorna la navbar per riflettere la vista corrente
        const navItems = document.querySelectorAll(".nav-item");
        navItems.forEach((item) => {
            item.classList.remove("active");
            if (item.getAttribute("data-view") === view) {
                item.classList.add("active");
            }
        });

        // Aggiorna window.currentView
        window.currentView = view;

        // Se è stato aperto tramite shortcut, pulisce l'URL dopo un breve ritardo
        if (source === "pwa-shortcut") {
            setTimeout(() => {
                if (typeof cleanUrlParams === "function") {
                    cleanUrlParams();
                }
            }, 100);
        }
    }
}

// Variabile per tenere traccia della vista corrente
window.currentView = "cities";

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
        // Traccia inizio caricamento dati
        if (typeof trackEvent === "function") {
            trackEvent("data_load_start");
        }

        const res = await fetch(CONFIG.PATHS.DB_JSON);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        dbData = json.citta;

        // Traccia successo caricamento
        if (typeof trackEvent === "function") {
            trackEvent("data_load_complete", {
                cities_count: dbData.length,
                total_groups: dbData.reduce(
                    (acc, city) => acc + city.comandi.length,
                    0,
                ),
            });
        }

        render();
        handleProtocolUrl();
        
        // Gestisce i parametri URL dopo il render
        handleUrlParams();
    } catch (err) {
        console.error("[App] Errore nel caricamento dei dati:", err);

        // Traccia errore caricamento
        if (typeof trackEvent === "function") {
            trackEvent("data_load_error", { error: err.message });
        }

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
// setTimeout(() => {
//     const versionEl = document.querySelector(".version");
//     if (versionEl) versionEl.textContent = `v${CONFIG.APP_VERSION}`;
// }, 0);
