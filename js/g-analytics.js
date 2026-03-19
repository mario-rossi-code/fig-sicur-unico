/**
 * @file analytics.js
 * @description Gestione Google Analytics per la PWA FIG. SICUR. UNICO.
 *              Gestisce il tracciamento eventi, page view e supporto offline.
 */

"use strict";

// Buffer per eventi offline
let _offlineEvents = [];

/**
 * Inizializza Google Analytics
 * @param {string} measurementId - Il tuo ID di misurazione GA4
 * @returns {void}
 */
function initAnalytics(measurementId) {
    // Carica lo script GA
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    // Inizializza gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
        dataLayer.push(arguments);
    };
    gtag("js", new Date());
    gtag("config", measurementId, {
        send_page_view: true,
        transport_type: "beacon",
        anonymize_ip: true,
    });

    // Rileva se l'app è installata come PWA
    const isPWA =
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.navigator.standalone === true; // iOS

    gtag("set", "user_properties", {
        pwa_installed: isPWA,
        app_version: CONFIG.APP_VERSION,
    });

    // Carica eventi offline salvati
    _loadOfflineEvents();

    // Setup listener per connettività
    window.addEventListener("online", _syncOfflineEvents);

    if (CONFIG.GOOGLE_ANALYTICS.TRACK_PHONE_CLICKS) {
        initPhoneClickTracking();
    }

    console.log("[Analytics] Inizializzato con ID:", measurementId);
}

/**
 * Traccia un page view
 * @param {string} pagePath - Percorso della pagina
 * @param {string} pageTitle - Titolo della pagina
 */
function trackPageView(
    pagePath = window.location.pathname,
    pageTitle = document.title,
) {
    if (typeof gtag === "undefined") return;

    gtag("event", "page_view", {
        page_title: pageTitle,
        page_location: window.location.href,
        page_path: pagePath,
    });
}

/**
 * Traccia un evento personalizzato
 * @param {string} eventName - Nome dell'evento
 * @param {Object} params - Parametri aggiuntivi
 */
function trackEvent(eventName, params = {}) {
    // Arricchisci i parametri con metadati utili
    const enhancedParams = {
        ...params,
        app_version: CONFIG.APP_VERSION,
        view: state?.view || "unknown",
        online: navigator.onLine,
        timestamp: new Date().toISOString(),
    };

    if (navigator.onLine) {
        _sendToGA(eventName, enhancedParams);
    } else {
        _queueEvent(eventName, enhancedParams);
    }
}

// ─── Helper privati ───────────────────────────────────────────────────────────

/**
 * Invia evento a GA
 * @private
 */
function _sendToGA(eventName, params) {
    if (typeof gtag !== "undefined") {
        gtag("event", eventName, params);
    }
}

/**
 * Accoda evento per quando si torna online
 * @private
 */
function _queueEvent(eventName, params) {
    _offlineEvents.push({
        eventName,
        params,
        queuedAt: Date.now(),
    });

    localStorage.setItem("gaOfflineEvents", JSON.stringify(_offlineEvents));

    // Richiedi sync se disponibile
    if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((registration) => {
            registration.sync.register("ga-sync");
        });
    }
}

/**
 * Carica eventi offline salvati
 * @private
 */
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

/**
 * Sincronizza eventi offline
 * @private
 */
async function _syncOfflineEvents() {
    if (!navigator.onLine || _offlineEvents.length === 0) return;

    const events = [..._offlineEvents];
    _offlineEvents = [];
    localStorage.removeItem("gaOfflineEvents");

    events.forEach((event) => {
        _sendToGA(event.eventName, {
            ...event.params,
            recovered_from_offline: true,
            original_timestamp: event.queuedAt,
        });
    });

    console.log("[Analytics] Sincronizzati", events.length, "eventi offline");
}

/**
 * Traccia click su numeri di telefono
 */
function initPhoneClickTracking() {
    document.addEventListener("click", (e) => {
        const phoneLink = e.target.closest('a[href^="tel:"]');
        if (phoneLink) {
            trackEvent("phone_click", {
                phone_number: phoneLink
                    .getAttribute("href")
                    .replace("tel:", ""),
                page: window.location.pathname,
                view: state?.view || "unknown",
            });
        }
    });
}

// Rendi disponibili le funzioni globalmente
window.trackEvent = trackEvent;
window.trackPageView = trackPageView;
