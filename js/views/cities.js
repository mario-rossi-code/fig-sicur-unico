/**
 * @file views/cities.js
 * @description Vista gerarchica Città → Comandi → Militari.
 *
 *              Livello 1 – Griglia di tutte le città.
 *              Livello 2 – Lista comandi della città selezionata.
 *              Livello 3 – Lista militari del comando selezionato.
 *
 *              Espone:
 *              - `renderCitiesHierarchy()` → entry point chiamato da `render()`
 */

"use strict";

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Renderizza la navigazione gerarchica in base allo stato corrente:
 * - Se nessuna città è selezionata: griglia delle città (livello 1).
 * - Se è selezionata una città ma non un comando: lista comandi (livello 2).
 * - Se è selezionato anche un comando: lista militari (livello 3).
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

    let index = 0;
    let hasResults = false;

    dbData.forEach((city) => {
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
    card.className = "list-item-card";
    card.dataset.search = city.nome.toLowerCase();
    card.style.animationDelay = `${index * CONFIG.ANIMATION.CARD_STAGGER}ms`;

    card.innerHTML = `
        <div class="avatar-small" style="margin-bottom:0.5rem;">
            <i class="fa-solid fa-city" aria-hidden="true"></i>
        </div>
        <div class="list-item-title">${city.nome}</div>
        <div class="list-item-subtitle">${city.comandi.length} Comandi</div>
    `;

    card.onclick = () => {
        navigateToCityGroups(city);
    };

    return card;
}

// ─── Livello 2: lista comandi ──────────────────────────────────────────────────

/**
 * Renderizza la lista dei comandi della città selezionata.
 *
 * @private
 * @returns {boolean} `true` se almeno un comando è visibile.
 */
function _renderCityGroups() {
    DOM.content.className = "view-container list-view";

    updateBreadcrumb([
        {
            text: "Tutte le Città",
            action: () => {
                // Torna alla lista delle città
                state.selectedCity = null;
                state.selectedGroup = null;
                resetSearch();
                render();
                saveState();

                // Aggiunge lo stato alla history
                pushHistoryState("cities", null, null);
            },
        },
        { text: state.selectedCity.nome, active: true },
    ]);

    const groups = state.selectedCity.comandi;
    let hasResults = false;

    groups.forEach((group) => {
        if (!matchesSearch(group.nome, group)) return;
        hasResults = true;
        DOM.content.appendChild(_createGroupCard(group));
    });

    return hasResults;
}

/**
 * Crea la card di un comando per la lista della città.
 *
 * @private
 * @param {Object} group - Oggetto comando.
 * @returns {HTMLElement}
 */
function _createGroupCard(group) {
    const el = document.createElement("div");
    el.className = "list-item-card";

    el.innerHTML = `
        <div class="person-compact-info">
            <div class="list-item-title">${group.nome}</div>
            <div class="list-item-subtitle">${group.incarichi.length} Militari</div>
        </div>
        <i class="fa-solid fa-chevron-right" style="color:var(--text-light)" aria-hidden="true"></i>
    `;

    el.onclick = () => {
        navigateToGroupPeople(state.selectedCity, group);
    };

    return el;
}

// ─── Livello 3: lista militari del comando ──────────────────────────────────────

/**
 * Renderizza la lista dei militari del comando selezionato.
 *
 * @private
 * @returns {boolean} `true` se almeno un militare corrisponde alla ricerca.
 */
function _renderGroupPeople() {
    DOM.content.className = "view-container list-view";

    updateBreadcrumb([
        {
            text: "Tutte le Città",
            action: () => {
                // Torna alla lista delle città
                state.selectedCity = null;
                state.selectedGroup = null;
                resetSearch();
                render();
                saveState();

                // Aggiunge lo stato alla history
                pushHistoryState("cities", null, null);
            },
        },
        {
            text: state.selectedCity.nome,
            action: () => {
                // Torna alla lista dei comandi della città
                state.selectedGroup = null;
                render();
                saveState();

                // Aggiunge lo stato alla history
                pushHistoryState("cities", state.selectedCity, null);
            },
        },
        { text: state.selectedGroup.nome, active: true },
    ]);

    let hasResults = false;

    state.selectedGroup.incarichi.forEach((inc) => {
        if (
            !matchesSearchObj(
                inc.militare.nome,
                inc.militare.cognome,
                inc.nome,
                inc.militare.grado,
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
