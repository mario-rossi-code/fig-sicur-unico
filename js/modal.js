/**
 * @file modal.js
 * @description Gestione della modale di dettaglio persona.
 *
 *              - `openModal()`: apre la modale popolandola con i dati della persona.
 *              - `closeModal()`: chiude la modale con animazione.
 *              - `initModal()`: registra tutti i listener (close button, overlay click, Escape).
 */

"use strict";

// ─── Riferimenti DOM (privati al modulo) ──────────────────────────────────────

/** @type {HTMLElement|null} */
const _modal = document.getElementById("personModal");

/** @type {HTMLElement|null} */
const _modalBody = document.getElementById("modalBody");

/** @type {HTMLButtonElement|null} */
const _modalClose = document.getElementById("modalClose");

// ─── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Apre la modale con i dati completi di una persona.
 *
 * @param {Object}   persona              - Dati sanitizzati della persona.
 * @param {string}   persona.nome
 * @param {string}   persona.cognome
 * @param {string}   persona.grado
 * @param {string}   persona.abilitUniCo  - `"si"` oppure altro.
 * @param {string}   persona.telefono_cell
 * @param {string}   persona.telefono_ufficio
 * @param {string}   incarico             - Incarico principale (usato se `incarichiMultipli` è vuoto).
 * @param {string}   citta                - Città di appartenenza.
 * @param {string}   gruppo               - Gruppo di appartenenza.
 * @param {string[]} [incarichiMultipli]  - Lista completa degli incarichi della persona.
 * @returns {void}
 */
function openModal(persona, incarico, citta, gruppo, incarichiMultipli = null) {
    const isUnico = persona.abilitUniCo.toLowerCase() === "si";
    const initials = getInitials(persona.nome, persona.cognome);

    // [TRACK] Traccia apertura modale
    trackEvent("modal_open", {
        person_name: `${persona.nome} ${persona.cognome}`,
        city: citta,
        group: gruppo,
        is_unico: isUnico,
        has_multiple_roles: !!(
            incarichiMultipli && incarichiMultipli.length > 1
        ),
    });

    _modalBody.innerHTML = `
        <div class="modal-simple">

            <div class="modal-avatar-wrapper">
                <div class="modal-avatar">${initials}</div>
            </div>

            <div class="modal-name">${persona.nome} ${persona.cognome}</div>

            <div class="modal-meta">
                <div class="modal-grado">${persona.grado}</div>
                <div class="modal-unico-badge ${isUnico ? "ok" : "no"}">
                    UniCo <i class="fa-solid ${isUnico ? "fa-check" : "fa-times"}"></i>
                </div>
            </div>

            <div class="modal-city-group">
                <div class="modal-box">
                    <div class="modal-box-label">Città</div>
                    <div class="modal-box-value">${citta}</div>
                </div>
                <div class="modal-box">
                    <div class="modal-box-label">Gruppo</div>
                    <div class="modal-box-value">${gruppo}</div>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">Incarichi</div>
                ${_renderIncarichiList(incarichiMultipli || [incarico])}
            </div>

            <div class="modal-section">
                <div class="modal-section-title">Contatti</div>
                ${_renderContacts(persona)}
            </div>

        </div>
    `;

    _modal.classList.remove("hidden");
    setTimeout(() => _modal.classList.add("show"), 10);
    document.body.style.overflow = "hidden";
}

/**
 * Chiude la modale con animazione di uscita.
 * Ripristina lo scroll del body al termine dell'animazione.
 *
 * @returns {void}
 */
function closeModal() {
    _modal.classList.remove("show");
    setTimeout(() => {
        _modal.classList.add("hidden");
        document.body.style.overflow = "";
    }, CONFIG.ANIMATION.MODAL_DURATION);
}

/**
 * Registra tutti i listener per la chiusura della modale:
 * - Pulsante ✕ interno.
 * - Click sull'overlay esterno.
 * - Tasto `Escape` da tastiera.
 *
 * Da chiamare una sola volta durante `initApp()`.
 *
 * @returns {void}
 */
function initModal() {
    _modalClose?.addEventListener("click", closeModal);

    _modal?.addEventListener("click", (e) => {
        if (e.target === _modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && _modal?.classList.contains("show")) {
            closeModal();
        }
    });
}

// ─── Helper privati ───────────────────────────────────────────────────────────

/**
 * Genera l'HTML per l'elenco degli incarichi nella modale.
 *
 * @private
 * @param {string[]} incarichi - Lista dei nomi degli incarichi.
 * @returns {string} HTML dell'elenco.
 */
function _renderIncarichiList(incarichi) {
    return incarichi
        .map(
            (inc) => `
            <div class="modal-incarico-item">
                <i class="fa-solid fa-briefcase" aria-hidden="true"></i>
                ${inc}
            </div>
        `,
        )
        .join("");
}

/**
 * Genera l'HTML per la sezione contatti della modale.
 * Mostra solo i numeri disponibili; se nessuno è presente, mostra un placeholder.
 *
 * @private
 * @param {Object} persona - Dati sanitizzati della persona.
 * @returns {string} HTML dei contatti.
 */
function _renderContacts(persona) {
    const hasCellulare =
        persona.telefono_cell && persona.telefono_cell.trim() !== "";
    const hasUfficio =
        persona.telefono_ufficio && persona.telefono_ufficio.trim() !== "";

    if (!hasCellulare && !hasUfficio) {
        return `
            <div class="modal-no-contacts">
                <i class="fa-solid fa-phone-slash" aria-hidden="true"></i>
                <span>Nessun contatto disponibile</span>
            </div>
        `;
    }

    let html = "";

    if (hasCellulare) {
        html += _phoneLink(persona.telefono_cell, "fa-mobile-alt", "Cellulare");
    }

    if (hasUfficio) {
        html += _phoneLink(persona.telefono_ufficio, "fa-building", "Ufficio");
    }

    return html;
}

/**
 * Genera l'HTML per un singolo link telefonico.
 *
 * @private
 * @param {string} number    - Numero di telefono.
 * @param {string} icon      - Classe Font Awesome (senza prefisso).
 * @param {string} label     - Etichetta (es. `"Cellulare"`, `"Ufficio"`).
 * @returns {string} HTML del link.
 */
function _phoneLink(number, icon, label) {
    return `
        <a href="tel:${number}" class="modal-phone">
            <div class="modal-phone-left">
                <i class="fa-solid ${icon}" aria-hidden="true"></i>
                <div class="modal-phone-text">
                    <span class="modal-phone-label">${label}</span>
                    <span class="modal-phone-number">${number}</span>
                </div>
            </div>
            <i class="fa-solid fa-phone modal-call-icon" aria-hidden="true"></i>
        </a>
    `;
}
