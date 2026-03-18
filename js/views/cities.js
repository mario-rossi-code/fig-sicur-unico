/**
 * @file views/cities.js
 * @description Vista gerarchica Città → Gruppi → Persone.
 *
 *              Livello 1 – Griglia di tutte le città.
 *              Livello 2 – Lista gruppi della città selezionata.
 *              Livello 3 – Lista persone del gruppo selezionato.
 *
 *              Espone:
 *              - `renderCitiesHierarchy()` → entry point chiamato da `render()`
 */

"use strict";

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Renderizza la navigazione gerarchica in base allo stato corrente:
 * - Se nessuna città è selezionata: griglia delle città (livello 1).
 * - Se è selezionata una città ma non un gruppo: lista gruppi (livello 2).
 * - Se è selezionato anche un gruppo: lista persone (livello 3).
 *
 * @returns {boolean} `true` se almeno un elemento è stato renderizzato.
 */
function renderCitiesHierarchy() {
    if (!state.selectedCity) return _renderCitiesGrid();
    if (!state.selectedGroup) return _renderCityGroups();
    return _renderGroupPeople();
}

// ─── Livello 1: griglia città ─────────────────────────────────────────────────

/**
 * Renderizza la griglia di tutte le città ordinate alfabeticamente.
 *
 * @private
 * @returns {boolean} `true` se almeno una città è visibile.
 */
function _renderCitiesGrid() {
    DOM.content.className = "view-container cities-grid";

    const sorted = [...dbData].sort((a, b) => a.nome.localeCompare(b.nome));
    let index = 0;
    let hasResults = false;

    sorted.forEach((city) => {
        if (!matchesSearch(city.nome)) return;
        hasResults = true;
        DOM.content.appendChild(_createCityCard(city, index++));
    });

    return hasResults;
}

/**
 * Crea la card di una città per la griglia.
 *
 * @private
 * @param {Object} city  - Oggetto città dal database.
 * @param {number} index - Indice per il delay dell'animazione stagger.
 * @returns {HTMLElement}
 */
function _createCityCard(city, index) {
    const card = document.createElement("div");
    card.className = "list-item-card card-enter";
    card.dataset.search = city.nome.toLowerCase();
    card.style.animationDelay = `${index * CONFIG.ANIMATION.CARD_STAGGER}ms`;

    card.innerHTML = `
        <div class="avatar-small" style="margin-bottom:0.5rem;">
            <i class="fa-solid fa-city" aria-hidden="true"></i>
        </div>
        <div class="list-item-title">${city.nome}</div>
        <div class="list-item-subtitle">${city.gruppi.length} Gruppi</div>
    `;

    card.onclick = () => {
        state.selectedCity = city;
        state.selectedGroup = null;
        render();
    };

    return card;
}

// ─── Livello 2: lista gruppi ──────────────────────────────────────────────────

/**
 * Renderizza la lista dei gruppi della città selezionata.
 *
 * @private
 * @returns {boolean} `true` se almeno un gruppo è visibile.
 */
function _renderCityGroups() {
    DOM.content.className = "view-container list-view";

    updateBreadcrumb([
        {
            text: "Tutte le Città",
            action: () => {
                state.selectedCity = null;
                resetSearch();
                render();
            },
        },
        { text: state.selectedCity.nome, active: true },
    ]);

    const sorted = [...state.selectedCity.gruppi].sort((a, b) =>
        a.nome.localeCompare(b.nome),
    );
    let hasResults = false;

    sorted.forEach((group) => {
        if (!matchesSearch(group.nome, group)) return;
        hasResults = true;
        DOM.content.appendChild(_createGroupCard(group));
    });

    return hasResults;
}

/**
 * Crea la card di un gruppo per la lista della città.
 *
 * @private
 * @param {Object} group - Oggetto gruppo.
 * @returns {HTMLElement}
 */
function _createGroupCard(group) {
    const el = document.createElement("div");
    el.className = "list-item-card card-enter";

    el.innerHTML = `
        <div class="person-compact-info">
            <div class="list-item-title">${group.nome}</div>
            <div class="list-item-subtitle">${group.incarichi.length} Persone</div>
        </div>
        <i class="fa-solid fa-chevron-right" style="color:var(--text-light)" aria-hidden="true"></i>
    `;

    el.onclick = () => {
        state.selectedGroup = group;
        render();
    };

    return el;
}

// ─── Livello 3: lista persone del gruppo ──────────────────────────────────────

/**
 * Renderizza la lista delle persone del gruppo selezionato.
 *
 * @private
 * @returns {boolean} `true` se almeno una persona corrisponde alla ricerca.
 */
function _renderGroupPeople() {
    DOM.content.className = "view-container list-view";

    updateBreadcrumb([
        {
            text: "Tutte le Città",
            action: () => {
                state.selectedCity = null;
                state.selectedGroup = null;
                resetSearch();
                render();
            },
        },
        {
            text: state.selectedCity.nome,
            action: () => {
                state.selectedGroup = null;
                render();
            },
        },
        { text: state.selectedGroup.nome, active: true },
    ]);

    let hasResults = false;

    state.selectedGroup.incarichi.forEach((inc) => {
        if (
            !matchesSearchObj(
                inc.persona.nome,
                inc.persona.cognome,
                inc.nome,
                inc.persona.grado,
            )
        )
            return;

        hasResults = true;
        DOM.content.appendChild(
            createPersonCard(
                inc,
                state.selectedCity.nome,
                state.selectedGroup.nome,
            ),
        );
    });

    return hasResults;
}
