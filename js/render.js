/**
 * @file render.js
 * @description Orchestratore principale del rendering e builder di card condivisi.
 *
 *              `render()` è il punto di ingresso unico: legge `state.view` e
 *              delega la costruzione del DOM alla funzione di vista corrispondente
 *              (definita in `js/views/`).
 *
 *              Contiene anche i builder di card riutilizzati in più viste:
 *              - `createPersonCard()`       → card militare (vista Città/Comandi)
 *              - `createLetterHeader()`     → intestazione alfabetica
 *              - `updateBreadcrumb()`       → breadcrumb di navigazione gerarchica
 */

"use strict";

// ─── Riferimenti DOM ──────────────────────────────────────────────────────────

/**
 * Oggetto con i riferimenti ai nodi DOM usati durante il rendering.
 * Viene letto da tutte le funzioni di vista.
 * @type {{
 *   content:             HTMLElement,
 *   breadcrumbContainer: HTMLElement,
 *   searchWrapper:       HTMLElement,
 *   cityFilterContainer: HTMLElement,
 *   searchInput:         HTMLInputElement,
 *   clearBtn:            HTMLButtonElement,
 *   noResults:           HTMLElement
 * }}
 */
const DOM = {
    content: document.getElementById("content"),
    breadcrumbContainer: document.getElementById("breadcrumbContainer"),
    searchWrapper: document.getElementById("searchWrapper"),
    cityFilterContainer: document.getElementById("cityFilterContainer"),
    searchInput: document.getElementById("searchInput"),
    clearBtn: document.getElementById("clearBtn"),
    noResults: document.getElementById("noResults"),
};

// ─── Render principale ────────────────────────────────────────────────────────

/**
 * Renderizza l'interfaccia in base alla vista corrente (`state.view`).
 *
 * Operazioni eseguite ad ogni chiamata:
 * 1. Pulisce il contenuto precedente.
 * 2. Nasconde i widget contestuali (breadcrumb, filtri, no-results).
 * 3. Gestisce la visibilità della barra di ricerca.
 * 4. Delega il rendering alla funzione di vista appropriata.
 * 5. Mostra il messaggio "nessun risultato" se la vista non produce elementi.
 * 6. Persiste lo stato.
 *
 * @returns {void}
 */
function render() {
    // Reset contenuto e widget contestuali
    DOM.content.innerHTML = "";
    DOM.breadcrumbContainer.innerHTML = "";
    DOM.cityFilterContainer.classList.add("hidden");
    DOM.noResults.classList.add("hidden");

    // La barra di ricerca è nascosta solo sulla home delle città
    const hideSearch = state.view === "cities" && !state.selectedCity;
    DOM.searchWrapper.classList.toggle("hidden", hideSearch);

    // Delega il rendering alla vista
    const renderers = {
        cities: renderCitiesHierarchy,
        groups: renderGroupsList,
        roles: renderRolesList,
        people: renderPeopleList,
    };

    const hasResults = renderers[state.view]?.() ?? false;

    if (!hasResults && dbData.length > 0) {
        DOM.noResults.classList.remove("hidden");
    }

    DOM.content.scrollTop = 0;
    saveState();
}

// ─── Builder condivisi ────────────────────────────────────────────────────────

/**
 * Crea una card militare per la navigazione gerarchica (vista Città → Comandi → Militari).
 *
 * Se il militare non ha dati validi (slot vacante), la card viene resa
 * non interattiva e mostra "In attesa di nomina".
 *
 * @param {{ nome: string, militare: Object }} inc  - Oggetto incarico.
 * @param {string}                            cityName  - Nome della città.
 * @param {string}                            groupName - Nome del comando.
 * @returns {HTMLElement} Card pronta per il DOM.
 */
function createPersonCard(inc, cityName, groupName) {
    const card = document.createElement("div");
    card.className = "person-compact-card";

    const hasValidPerson = hasValidPersonData(inc.militare);

    if (!hasValidPerson) {
        card.innerHTML = `
            <div class="avatar-small" style="background: var(--text-light);">
                <i class="fa-solid fa-hourglass-half" aria-hidden="true"></i>
            </div>
            <div class="person-compact-info">
                <div class="person-compact-role" style="font-weight:600; color:var(--text-light);">
                    ${inc.nome}
                </div>
                <div class="person-compact-name" style="color:var(--text-light); font-style:italic;">
                    In attesa di nomina
                </div>
            </div>
        `;
        card.style.cursor = "default";
        card.style.opacity = "0.8";
    } else {
        const militare = sanitizeSoldier(inc.militare);
        const isUnico = militare.abilitUniCo.toLowerCase() === "si";
        const initials = getInitials(militare.nome, militare.cognome);

        card.innerHTML = `
            <div class="avatar-small" style="position: relative;">
                ${initials}
                <div class="avatar-status ${isUnico ? "status-ok" : "status-no"}"></div>
            </div>
            <div class="person-compact-info">
                <div class="person-compact-role" style="font-weight:600; color:var(--primary);">
                    ${inc.nome}
                </div>
                <div class="person-compact-name">
                    ${militare.grado} ${militare.nome} ${militare.cognome}
                </div>
            </div>
        `;

        card.onclick = () => openModal(militare, inc.nome, cityName, groupName);
    }

    return card;
}

/**
 * Crea un'intestazione alfabetica usata come separatore visivo
 * nelle viste Incarichi e Militari.
 *
 * @param {string} letter - Lettera dell'intestazione (es. `"A"`).
 * @returns {HTMLElement} Elemento `<div class="letter-header">`.
 */
function createLetterHeader(letter) {
    const header = document.createElement("div");
    header.className = "letter-header";
    header.setAttribute("data-letter", letter);
    header.textContent = letter;
    return header;
}

/**
 * Aggiorna il breadcrumb di navigazione gerarchica con la lista di step fornita.
 * Ogni step può essere cliccabile (se ha `action`) o readonly (se `active: true`).
 *
 * @param {Array<{text: string, action?: Function, active?: boolean}>} items
 *   Lista degli step del breadcrumb, dal primo (root) all'ultimo (corrente).
 * @returns {void}
 */
function updateBreadcrumb(items) {
    DOM.breadcrumbContainer.innerHTML = `
        <div class="breadcrumb">
            ${items
                .map(
                    (item, index) => `
                ${index > 0 ? '<i class="fa-solid fa-chevron-right" aria-hidden="true"></i>' : ""}
                <span class="${item.active ? "active" : ""}"
                        ${item.action ? 'style="cursor:pointer;" role="button" tabindex="0"' : ""}>
                    ${item.text}
                </span>
            `,
                )
                .join("")}
        </div>
    `;

    // Collega i listener agli step cliccabili
    const spans = DOM.breadcrumbContainer.querySelectorAll("span");
    items.forEach((item, index) => {
        if (item.action) {
            spans[index]?.addEventListener("click", item.action);
        }
    });
}
