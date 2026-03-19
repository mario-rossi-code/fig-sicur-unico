/**
 * @file service-worker-manager.js
 * @description Gestione del Service Worker: registrazione, rilevamento aggiornamenti
 *              e notifica modale all'utente.
 *
 *              Espone:
 *              - `initServiceWorker()` → registra il SW e attiva i listener di update.
 *              - `startUpdateChecker()` → polling orario per nuove versioni.
 */

"use strict";

// ─── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Registra il Service Worker e attiva il rilevamento degli aggiornamenti.
 * Gestisce anche il reload automatico quando un nuovo SW prende il controllo.
 *
 * @async
 * @returns {Promise<void>}
 */
async function initServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    try {
        const reg =
            await navigator.serviceWorker.register("/service-worker.js");
        console.log("[SW] Registrato con successo.");

        // Nuovo SW trovato durante la registrazione
        reg.onupdatefound = () => {
            const worker = reg.installing;
            if (!worker) return;

            worker.onstatechange = () => {
                if (worker.state === "installed") {
                    if (navigator.serviceWorker.controller) {
                        // Aggiornamento disponibile
                        console.log("[SW] Nuova versione trovata.");
                        _showUpdateModal(reg);
                    } else {
                        // Prima installazione: cache creata
                        console.log("[SW] Cache iniziale creata.");
                    }
                }
            };
        };

        // SW già in attesa all'avvio (aggiornamento non ancora applicato)
        if (reg.waiting) _showUpdateModal(reg);

        // Reload automatico quando il nuovo SW diventa controller
        let refreshing = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (!refreshing) {
                refreshing = true;
                window.location.reload();
            }
        });
    } catch (err) {
        console.error("[SW] Errore nella registrazione:", err);
    }
}

/**
 * Avvia il controllo periodico di aggiornamenti ogni ora
 * (`CONFIG.UPDATE_CHECK_INTERVAL`).
 *
 * @returns {void}
 */
function startUpdateChecker() {
    setInterval(async () => {
        if (!("serviceWorker" in navigator)) return;
        try {
            const reg = await navigator.serviceWorker.ready;
            await reg.update();
            console.log("[SW] Controllo aggiornamenti completato.");
        } catch (err) {
            console.warn("[SW] Errore nel controllo aggiornamenti:", err);
        }
    }, CONFIG.UPDATE_CHECK_INTERVAL);
}

// ─── Modale aggiornamento ─────────────────────────────────────────────────────

/**
 * Mostra la modale di notifica aggiornamento all'utente.
 * Se la modale esiste già (chiamata doppia), non viene duplicata.
 *
 * La modale blocca l'interazione con il contenuto sottostante e si
 * auto-chiude dopo 30 secondi se l'utente non risponde.
 *
 * @private
 * @param {ServiceWorkerRegistration} reg - La registrazione del Service Worker.
 * @returns {void}
 */
function _showUpdateModal(reg) {
    trackUpdateAvailable();
    if (document.getElementById("updateNotification")) return;

    const modal = document.createElement("div");
    modal.id = "updateNotification";
    modal.className = "update-notification";

    modal.innerHTML = `
        <div class="update-overlay"></div>
        <div class="update-content">
            <div class="update-icon">
                <i class="fa-solid fa-download" aria-hidden="true"></i>
            </div>
            <div class="update-title">Nuova versione disponibile</div>
            <div class="update-message">Aggiorna per le ultime funzionalità.</div>
            <div class="update-actions">
                <button class="update-btn update-now" id="updateNowBtn">
                    <i class="fa-solid fa-sync-alt" aria-hidden="true"></i>
                    Aggiorna ora
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = "hidden";
    document.body.style.pointerEvents = "none";
    modal.style.pointerEvents = "auto";

    // Previeni click su overlay
    modal.querySelector(".update-overlay").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    // Previeni propagazione dai click sul contenuto
    modal
        .querySelector(".update-content")
        .addEventListener("click", (e) => e.stopPropagation());

    setTimeout(() => modal.classList.add("show"), 100);

    // Listener pulsanti
    document.getElementById("updateNowBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        trackUpdateAccepted();
        _applyUpdate(modal, reg);
    });

    document.getElementById("updateLaterBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        _dismissModal(modal);
    });

    document.getElementById("updateCloseBtn").addEventListener("click", (e) => {
        e.stopPropagation();
        _dismissModal(modal);
    });

    // Auto-dismiss dopo 30 secondi
    setTimeout(() => {
        if (modal.classList.contains("show")) _dismissModal(modal);
    }, 30_000);
}

/**
 * Applica l'aggiornamento attivando immediatamente il nuovo Service Worker.
 * Mostra un loader nella modale durante il processo, poi ricarica la pagina.
 *
 * @private
 * @param {HTMLElement}                modal - Elemento DOM della modale.
 * @param {ServiceWorkerRegistration}  reg   - La registrazione del Service Worker.
 * @returns {void}
 */
function _applyUpdate(modal, reg) {
    document.body.style.pointerEvents = "none";

    const content = modal.querySelector(".update-content");
    content.innerHTML = `
        <div class="update-icon updating">
            <i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i>
        </div>
        <div class="update-title">Aggiornamento in corso…</div>
        <div class="update-message">Attendere prego.</div>
    `;
    content.style.justifyContent = "center";

    reg.waiting?.postMessage({ type: "SKIP_WAITING" });

    setTimeout(() => window.location.reload(), 1500);
}

/**
 * Chiude e rimuove la modale di aggiornamento ripristinando l'interattività
 * della pagina.
 *
 * @private
 * @param {HTMLElement} modal - Elemento DOM della modale.
 * @returns {void}
 */
function _dismissModal(modal) {
    modal.classList.remove("show");
    document.body.style.overflow = "";
    document.body.style.pointerEvents = "";

    setTimeout(() => modal.remove(), 300);
}

// FOR TESTING: Mostra il modale di aggiornamento all'avvio
// setTimeout(() => {
//     console.log("[TEST] Forzatura modale aggiornamento");
//     // Crea una registrazione fittizia
//     const fakeReg = {
//         waiting: { postMessage: (msg) => console.log("[TEST] SKIP_WAITING inviato", msg) }
//     };
//     _showUpdateModal(fakeReg);
// }, 1000); // Mostra dopo 1 secondi
