/**
 * @file g-analytics.js
 * @description Google Analytics per Figure di Sicurezza
 *              Traccia: PWA installata, eventi, filtri, ricerche, click telefonici
 */

"use strict";

// Buffer per eventi offline
let _offlineEvents = [];

/**
 * Inizializza Google Analytics
 * @param {string} measurementId - Il tuo ID GA4 (es. G-3MCJ10R94P)
 */
function initAnalytics(measurementId) {
    // Configurazione aggiuntiva (gtag è già caricato nell'index.html)
    gtag("config", measurementId, {
        send_page_view: true,
        transport_type: "beacon",
        anonymize_ip: true,
    });

    // Rileva la modalità di visualizzazione (browser vs PWA installata)
    const displayMode = getDisplayMode();
    const isPWA = displayMode !== "browser";

    gtag("set", "user_properties", {
        pwa_installed: isPWA,
        display_mode: displayMode,
        app_version: CONFIG.APP_VERSION,
    });

    // Traccia l'avvio dell'app con il contesto
    trackEvent("app_start", {
        display_mode: displayMode,
        is_pwa: isPWA,
        first_visit: !localStorage.getItem("returning_user"),
    });

    // Segna che l'utente è tornato
    localStorage.setItem("returning_user", "true");

    // Carica eventi offline salvati
    _loadOfflineEvents();

    // Inizializza tracking click telefonici
    initPhoneClickTracking();

    // Setup listener per connettività
    window.addEventListener("online", _syncOfflineEvents);

    // Traccia quando l'app torna in primo piano
    document.addEventListener("visibilitychange", () => {
        if (!document.hidden) {
            trackEvent("app_foreground", {
                display_mode: getDisplayMode(),
            });
        }
    });

    console.log("[Analytics] Inizializzato - Modalità:", displayMode);
}

/**
 * Determina la modalità di visualizzazione corrente
 * @returns {string} - 'browser', 'standalone', 'ios-standalone', 'fullscreen', 'minimal-ui'
 */
function getDisplayMode() {
    if (window.matchMedia("(display-mode: standalone)").matches) {
        return "standalone"; // Android/Desktop PWA
    } else if (window.matchMedia("(display-mode: fullscreen)").matches) {
        return "fullscreen"; // Fullscreen mode
    } else if (window.matchMedia("(display-mode: minimal-ui)").matches) {
        return "minimal-ui"; // Minimal UI
    } else if (window.navigator.standalone === true) {
        return "ios-standalone"; // iOS PWA
    }
    return "browser"; // Normale browser
}

/**
 * Traccia un evento personalizzato
 * @param {string} eventName - Nome dell'evento
 * @param {Object} params - Parametri aggiuntivi
 */
function trackEvent(eventName, params = {}) {
    // Parametri base a tutti gli eventi
    const enhancedParams = {
        ...params,
        app_version: CONFIG.APP_VERSION,
        view: window.currentView || state?.view || "unknown",
        display_mode: getDisplayMode(),
        online: navigator.onLine,
        timestamp: new Date().toISOString(),
    };

    if (navigator.onLine) {
        gtag("event", eventName, enhancedParams);
    } else {
        _queueEvent(eventName, enhancedParams);
    }
}

/**
 * Traccia click sui numeri di telefono
 */
function initPhoneClickTracking() {
    document.addEventListener("click", (e) => {
        const phoneLink = e.target.closest('a[href^="tel:"]');
        if (phoneLink) {
            const phoneNumber = phoneLink
                .getAttribute("href")
                .replace("tel:", "");
            trackEvent("phone_click", {
                phone_number: phoneNumber,
                page: window.location.pathname,
            });
        }
    });
}

/**
 * Traccia installazione PWA
 * Da chiamare quando l'utente installa l'app
 */
function trackPWAInstall(outcome = "accepted") {
    trackEvent("pwa_installed", {
        outcome: outcome,
        platform: navigator.platform,
        user_agent: navigator.userAgent,
    });
}

/**
 * Traccia quando viene mostrato il prompt di installazione
 */
function trackInstallPromptShown(platforms) {
    trackEvent("pwa_install_prompt_shown", {
        platforms: platforms ? platforms.join(",") : "unknown",
    });
}

// ─── Helper privati per gestione offline ─────────────────────────────────────

function _queueEvent(eventName, params) {
    _offlineEvents.push({
        eventName,
        params,
        queuedAt: Date.now(),
    });

    localStorage.setItem("gaOfflineEvents", JSON.stringify(_offlineEvents));

    // Prova a richiedere una sincronizzazione in background se supportata
    if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.sync.register("ga-sync").catch(() => {
                // Fallback: sync al prossimo online
            });
        });
    }
}

function _loadOfflineEvents() {
    try {
        const saved = localStorage.getItem("gaOfflineEvents");
        if (saved) {
            _offlineEvents = JSON.parse(saved);
        }
    } catch (err) {
        console.warn("[Analytics] Errore nel caricamento eventi offline:", err);
    }
}

async function _syncOfflineEvents() {
    if (!navigator.onLine || _offlineEvents.length === 0) return;

    const events = [..._offlineEvents];
    _offlineEvents = [];
    localStorage.removeItem("gaOfflineEvents");

    events.forEach((event) => {
        gtag("event", event.eventName, {
            ...event.params,
            recovered_from_offline: true,
            original_timestamp: event.queuedAt,
        });
    });

    console.log("[Analytics] Sincronizzati", events.length, "eventi offline");
}

// ─── Funzioni di utilità per tracciare eventi specifici dell'app ────────────

/**
 * Traccia cambio vista (chiamata da navigation.js)
 */
function trackViewChange(fromView, toView) {
    trackEvent("view_change", { from_view: fromView, to_view: toView });
}

/**
 * Traccia cambio filtro (chiamata da filters.js)
 */
function trackFilterChange(filterType, oldValue, newValue) {
    trackEvent("filter_change", {
        filter_type: filterType,
        old_value: oldValue,
        new_value: newValue,
    });
}

/**
 * Traccia reset filtri
 */
function trackFilterReset() {
    trackEvent("filter_reset");
}

/**
 * Traccia ricerca (chiamata da search.js)
 */
function trackSearch(searchTerm, view) {
    trackEvent("search", {
        search_term: searchTerm || "(empty)",
        view: view,
    });
}

/**
 * Traccia cancellazione ricerca
 */
function trackSearchCleared(view) {
    trackEvent("search_cleared", { view: view });
}

/**
 * Traccia apertura modale militare
 */
function trackModalOpen(personName, city, group, isUnico) {
    trackEvent("modal_open", {
        person_name: personName,
        city: city,
        group: group,
        is_unico: isUnico,
    });
}

/**
 * Traccia aggiornamento disponibile
 */
function trackUpdateAvailable() {
    trackEvent("update_available");
}

/**
 * Traccia aggiornamento accettato
 */
function trackUpdateAccepted() {
    trackEvent("update_accepted");
}

// Rendi disponibili le funzioni globalmente
window.trackEvent = trackEvent;
window.trackViewChange = trackViewChange;
window.trackFilterChange = trackFilterChange;
window.trackFilterReset = trackFilterReset;
window.trackSearch = trackSearch;
window.trackSearchCleared = trackSearchCleared;
window.trackModalOpen = trackModalOpen;
window.trackUpdateAvailable = trackUpdateAvailable;
window.trackUpdateAccepted = trackUpdateAccepted;
window.trackPWAInstall = trackPWAInstall;
window.trackInstallPromptShown = trackInstallPromptShown;
window.getDisplayMode = getDisplayMode;
