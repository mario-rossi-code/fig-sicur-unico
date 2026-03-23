/**
 * @file swipe.js
 * @description Gestione degli swipe touch per navigazione gerarchica
 */

"use strict";

// Configurazione swipe
const SWIPE_CONFIG = {
    MIN_DISTANCE: 50, // Distanza minima in px per considerare uno swipe
    MAX_TIME: 300, // Tempo massimo in ms per lo swipe
    MAX_VERTICAL: 100, // Massimo movimento verticale consentito (evita falsi positivi)
};

let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let isSwiping = false;

/**
 * Inizializza il rilevamento degli swipe sul view-container
 */
function initSwipeDetection() {
    const viewContainer = document.getElementById("content");

    if (!viewContainer) {
        console.warn("[Swipe] View container non trovato");
        return;
    }

    // Rimuovi eventuali listener precedenti per evitare duplicati
    viewContainer.removeEventListener("touchstart", onTouchStart);
    viewContainer.removeEventListener("touchmove", onTouchMove);
    viewContainer.removeEventListener("touchend", onTouchEnd);

    // Aggiungi listener touch
    viewContainer.addEventListener("touchstart", onTouchStart, {
        passive: false,
    });
    viewContainer.addEventListener("touchmove", onTouchMove, {
        passive: false,
    });
    viewContainer.addEventListener("touchend", onTouchEnd);

    console.log("[Swipe] Rilevamento swipe inizializzato");
}

/**
 * Gestisce l'inizio del touch
 * @param {TouchEvent} e - Evento touch
 */
function onTouchStart(e) {
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartTime = Date.now();
    isSwiping = false;
}

/**
 * Gestisce il movimento touch
 * @param {TouchEvent} e - Evento touch
 */
function onTouchMove(e) {
    if (!touchStartX) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // Se lo swipe è principalmente orizzontale, previeni lo scroll verticale
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
        e.preventDefault();
        isSwiping = true;

        // Opzionale: aggiungi feedback visivo durante lo swipe
        if (deltaX < 0) {
            // Stai swipando verso sinistra
            document.body.style.cursor = "ew-resize";
        }
    }
}

/**
 * Gestisce la fine del touch
 * @param {TouchEvent} e - Evento touch
 */
function onTouchEnd(e) {
    if (!touchStartX || !touchStartY || !touchStartTime) return;

    const touchEnd = e.changedTouches[0];
    const deltaX = touchEnd.clientX - touchStartX;
    const deltaY = touchEnd.clientY - touchStartY;
    const deltaTime = Date.now() - touchStartTime;

    // Reset cursore
    document.body.style.cursor = "";

    // Verifica se è uno swipe valido
    const isValidSwipe =
        Math.abs(deltaX) >= SWIPE_CONFIG.MIN_DISTANCE && // Distanza sufficiente
        deltaTime <= SWIPE_CONFIG.MAX_TIME && // Velocità sufficiente
        Math.abs(deltaY) <= SWIPE_CONFIG.MAX_VERTICAL; // Movimento principalmente orizzontale

    if (isValidSwipe) {
        // Swipe sinistro (deltaX negativo)
        if (deltaX < 0) {
            handleLeftSwipe();
        }
    }

    // Reset valori
    touchStartX = 0;
    touchStartY = 0;
    touchStartTime = 0;
    isSwiping = false;
}

/**
 * Gestisce lo swipe verso sinistra
 * Esegue la navigazione all'indietro nella gerarchia
 */
function handleLeftSwipe() {
    console.log("[Swipe] Swipe sinistro rilevato");

    // Determina il contesto corrente e naviga all'indietro
    if (state.selectedGroup && state.selectedCity) {
        // Livello 3 (militari) → Livello 2 (gruppi)
        console.log("[Swipe] Navigazione da militari a gruppi");
        state.selectedGroup = null;
        render();

        // Traccia evento analytics (opzionale)
        if (typeof trackEvent === "function") {
            trackEvent("swipe_navigation", {
                from: "people",
                to: "groups",
                city: state.selectedCity?.nome,
            });
        }
    } else if (state.selectedCity && !state.selectedGroup) {
        // Livello 2 (gruppi) → Livello 1 (città)
        console.log("[Swipe] Navigazione da gruppi a città");
        state.selectedCity = null;
        resetSearch();
        render();

        // Traccia evento analytics (opzionale)
        if (typeof trackEvent === "function") {
            trackEvent("swipe_navigation", {
                from: "groups",
                to: "cities",
            });
        }
    } else {
        console.log("[Swipe] Nessuna navigazione possibile");

        // Feedback visivo opzionale quando non si può navigare
        const content = document.getElementById("content");
        if (content) {
            content.style.transform = "translateX(-10px)";
            setTimeout(() => {
                content.style.transform = "";
            }, 150);
        }
    }
}

/**
 * Re-inizializza il rilevamento swipe dopo il render
 * (da chiamare dopo ogni render che cambia la vista)
 */
function refreshSwipeDetection() {
    // Piccolo delay per assicurarsi che il DOM sia aggiornato
    setTimeout(() => {
        initSwipeDetection();
    }, 100);
}
