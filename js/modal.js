/**
 * @file modal.js
 * @description Gestione della modale di dettaglio militare.
 *
 *              - `openModal()`: apre la modale popolandola con i dati del militare.
 *              - `closeModal()`: chiude la modale con animazione.
 *              - `initModal()`: registra tutti i listener (close button, overlay click, Escape).
 *
 *              La firma di openModal supporta due modalità di chiamata:
 *
 *              A) Vista Città / Comandi / Incarichi (contesto singolo):
 *                 openModal(militare, incarico, citta, comando)
 *                 → incarico è una stringa, citta e comando sono stringhe.
 *
 *              B) Vista Militari (contesti multipli):
 *                 openModal(militare, incarichi)
 *                 → incarichi è un array di oggetti { nome, city, group }.
 *
 *              La funzione rileva automaticamente la modalità in base al tipo
 *              del secondo argomento (stringa vs array).
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
 * Apre la modale con i dati completi di un militare.
 *
 * Firma A – contesto singolo (viste Città / Comandi / Incarichi):
 *   openModal(militare, incarico, citta, comando)
 *
 * Firma B – contesti multipli (vista Militari):
 *   openModal(militare, incarichi)
 *   dove incarichi = Array<{ nome: string, city: string, group: string }>
 *
 * @param {Object} militare
 * @param {string|Array<{nome:string,city:string,group:string}>} incaricoOrIncarichi
 * @param {string}  [citta]   - Solo firma A.
 * @param {string}  [comando] - Solo firma A.
 * @returns {void}
 */
function openModal(militare, incaricoOrIncarichi, citta, comando) {
    // ── Normalizza gli argomenti in un array di oggetti { nome, city, group } ──
    let incarichi;
    if (Array.isArray(incaricoOrIncarichi)) {
        // Firma B: già nel formato corretto
        incarichi = incaricoOrIncarichi;
    } else {
        // Firma A: singola stringa + citta + comando
        incarichi = [
            {
                nome: incaricoOrIncarichi,
                city: citta || "",
                group: comando || "",
            },
        ];
    }

    // Analytics: usa il primo incarico come riferimento
    trackModalOpen(
        `${militare.nome} ${militare.cognome}`,
        incarichi[0]?.city || "",
        incarichi[0]?.group || "",
        militare.abilitUniCo?.toLowerCase() === "si",
    );

    const isUnico = militare.abilitUniCo.toLowerCase() === "si";
    const initials = getInitials(militare.nome, militare.cognome);

    // Tutti gli incarichi condividono lo stesso contesto?
    const allSameContext =
        incarichi.length > 0 &&
        incarichi.every(
            (i) =>
                i.city === incarichi[0].city && i.group === incarichi[0].group,
        );

    _modalBody.innerHTML = `
        <div class="modal-simple">

            <div class="modal-avatar-wrapper">
                <div class="modal-avatar">${initials}</div>
            </div>

            <div class="modal-name">${militare.nome} ${militare.cognome}</div>

            <div class="modal-meta">
                <div class="modal-grado">${militare.grado}</div>
                <div class="modal-unico-badge ${isUnico ? "ok" : "no"}">
                    UniCo <i class="fa-solid ${isUnico ? "fa-check" : "fa-times"}"></i>
                </div>
            </div>

            ${
                allSameContext
                    ? `
            <div class="modal-city-group">
                <div class="modal-box">
                    <div class="modal-box-label">Città</div>
                    <div class="modal-box-value">${incarichi[0].city}</div>
                </div>
                <div class="modal-box">
                    <div class="modal-box-label">Comando</div>
                    <div class="modal-box-value">${incarichi[0].group}</div>
                </div>
            </div>`
                    : ""
            }

            <div class="modal-section">
                <div class="modal-section-title">Incarichi</div>
                ${_renderIncarichiList(incarichi, allSameContext)}
            </div>

            <div class="modal-section">
                <div class="modal-section-title">Contatti</div>
                ${_renderContacts(militare)}
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
 * Genera l'HTML per l'elenco degli incarichi.
 *
 * - Contesto unico (allSameContext = true):
 *   Lista semplice con sola icona + nome. Città e comando sono già mostrati
 *   nei box sopra, non serve ripeterli.
 *
 * - Contesti multipli (allSameContext = false):
 *   Ogni incarico è una card con nome in evidenza e una riga secondaria
 *   "Città › Comando" che ne specifica il contesto.
 *
 * @private
 * @param {Array<{nome:string,city:string,group:string}>} incarichi
 * @param {boolean} allSameContext
 * @returns {string}
 */
function _renderIncarichiList(incarichi, allSameContext) {
    if (allSameContext) {
        return incarichi
            .map(
                (inc) => `
                <div class="modal-incarico-item">
                    <i class="fa-solid fa-briefcase" aria-hidden="true"></i>
                    ${inc.nome}
                </div>`,
            )
            .join("");
    }

    // Contesti multipli: raggruppa per città › gruppo per leggibilità
    // Ordina per città poi gruppo così incarichi dello stesso comando stanno insieme
    const sorted = [...incarichi].sort((a, b) => {
        const cityComp = a.city.localeCompare(b.city);
        return cityComp !== 0 ? cityComp : a.group.localeCompare(b.group);
    });

    return sorted
        .map(
            (inc) => `
            <div class="modal-incarico-item modal-incarico-item--ctx">
                <div class="modal-incarico-nome">
                    <i class="fa-solid fa-briefcase" aria-hidden="true"></i>
                    <span>${inc.nome}</span>
                </div>
                <div class="modal-incarico-ctx">
                    <i class="fa-solid fa-location-dot" aria-hidden="true"></i>
                    <span>${inc.city}</span>
                    <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
                    <span>${inc.group}</span>
                </div>
            </div>`,
        )
        .join("");
}

/**
 * Genera l'HTML per la sezione contatti della modale.
 * Mostra solo i numeri disponibili; se nessuno è presente, mostra un placeholder.
 *
 * @private
 * @param {Object} militare - Dati sanitizzati del militare.
 * @returns {string} HTML dei contatti.
 */
function _renderContacts(militare) {
    const hasCellulare =
        militare.telefono_cell && militare.telefono_cell.trim() !== "";
    const hasUfficio =
        militare.telefono_ufficio && militare.telefono_ufficio.trim() !== "";

    if (!hasCellulare && !hasUfficio) {
        return `
            <div class="modal-no-contacts">
                <i class="fa-solid fa-phone-slash" aria-hidden="true"></i>
                <span>Nessun contatto disponibile</span>
            </div>
        `;
    }

    let html = "";
    if (hasCellulare)
        html += _phoneLink(
            militare.telefono_cell,
            "fa-mobile-alt",
            "Cellulare",
        );
    if (hasUfficio)
        html += _phoneLink(militare.telefono_ufficio, "fa-building", "Ufficio");
    return html;
}

/**
 * Genera l'HTML per un singolo link telefonico.
 *
 * @private
 * @param {string} number - Numero di telefono.
 * @param {string} icon   - Classe Font Awesome (senza prefisso fa-).
 * @param {string} label  - Etichetta (es. "Cellulare", "Ufficio").
 * @returns {string}
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
