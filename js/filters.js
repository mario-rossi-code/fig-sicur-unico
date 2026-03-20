/**
 * @file filters.js
 * @description Logica dei filtri attivi sulle viste Incarichi e Militari.
 *
 *              Filtri disponibili:
 *              - **UniCo** (ciclico): OFF → Solo abilitati → Solo non abilitati → OFF
 *              - **In attesa** (toggle): mostra solo gli incarichi senza militare assegnata
 *
 *              Espone funzioni per:
 *              - Verificare se un incarico/militare passa i filtri attivi
 *              - Ciclare/resettare i filtri
 *              - Aggiornare visivamente i pulsanti nella UI
 */

"use strict";

// ─── Predicati filtro ─────────────────────────────────────────────────────────

/**
 * Verifica se un militare supera il filtro UniCo attivo.
 *
 * - `OFF`: tutti passano.
 * - `SI`:  passa solo chi ha `abilitUniCo === "si"` (case-insensitive).
 * - `NO`:  passa solo chi NON ha `abilitUniCo === "si"`.
 *
 * @param {Object|null|undefined} militare - Oggetto militare.
 * @returns {boolean} `true` se il militare supera il filtro.
 */
function passesUnicoFilter(militare) {
    if (state.filters.unico === CONFIG.FILTER_STATES.UNICO.OFF) return true;

    const isUnico =
        militare?.abilitUniCo && militare.abilitUniCo.toLowerCase() === "si";

    return state.filters.unico === CONFIG.FILTER_STATES.UNICO.SI
        ? isUnico
        : !isUnico;
}

/**
 * Verifica se un incarico supera il filtro "In attesa di nomina".
 *
 * Quando il filtro è attivo, vengono mostrati **solo** gli incarichi privi
 * di militare valida (slot vacanti).
 *
 * @param {Object|null|undefined} militare - Oggetto militare dell'incarico.
 * @returns {boolean} `true` se l'incarico supera il filtro.
 */
function passesPendingFilter(militare) {
    if (!state.filters.pending) return true;
    return !hasValidPersonData(militare);
}

/**
 * Verifica se un incarico supera **tutti** i filtri attivi contemporaneamente.
 * Usato nella vista Incarichi dove sia UniCo che Pending sono applicabili.
 *
 * @param {{ militare?: Object }} inc - Oggetto incarico con eventuale militare.
 * @returns {boolean} `true` se l'incarico supera tutti i filtri.
 */
function passesAllFilters(inc) {
    const militare = inc?.militare;
    return passesUnicoFilter(militare) && passesPendingFilter(militare);
}

// ─── Azioni filtro ────────────────────────────────────────────────────────────

/**
 * Fa avanzare il filtro UniCo al passo successivo nel ciclo:
 * `OFF (0) → SI (1) → NO (2) → OFF (0)`.
 * Aggiorna la UI e ri-renderizza la vista corrente.
 *
 * @returns {void}
 */
function cycleUnicoFilter() {
    const oldValue = state.filters.unico;
    const numStates = Object.keys(CONFIG.FILTER_STATES.UNICO).length;
    state.filters.unico = (state.filters.unico + 1) % numStates;

    // Traccia cambio filtro
    trackFilterChange("unico", oldValue, state.filters.unico);

    updateFilterButtons();
    render();
}

/**
 * Attiva o disattiva il filtro "In attesa di nomina".
 * Aggiorna la UI e ri-renderizza la vista corrente.
 *
 * @returns {void}
 */
function togglePendingFilter() {
    const oldValue = state.filters.pending;
    state.filters.pending = !state.filters.pending;

    trackFilterChange("pending", oldValue, state.filters.pending);

    updateFilterButtons();
    render();
}

/**
 * Resetta tutti i filtri ai valori predefiniti (`CONFIG.FILTERS.DEFAULTS`).
 * Aggiorna la UI e ri-renderizza la vista corrente.
 *
 * @returns {void}
 */
function resetFilters() {
    trackFilterReset();
    resetFiltersToDefaults();
    updateFilterButtons();
    render();
}

// ─── UI filtri ────────────────────────────────────────────────────────────────

/**
 * Mappa degli stati UniCo → icona Font Awesome corrispondente.
 * @private
 * @type {Record<number, string>}
 */
const _UNICO_ICONS = {
    [CONFIG.FILTER_STATES.UNICO.OFF]: "fa-id-card",
    [CONFIG.FILTER_STATES.UNICO.SI]: "fa-check-circle",
    [CONFIG.FILTER_STATES.UNICO.NO]: "fa-times-circle",
};

/**
 * Renderizza (o ri-renderizza) la barra filtri nel `cityFilterContainer`
 * per le viste Incarichi (`"roles"`) e Militari (`"people"`).
 *
 * Se la barra è già presente per la stessa vista, aggiorna solo lo stato
 * visivo dei pulsanti senza ricostruire il DOM.
 *
 * @param {'roles'|'people'} view - Vista per cui mostrare la barra filtri.
 * @returns {void}
 */
function renderFilterBar(view) {
    const container = document.getElementById("cityFilterContainer");
    if (!container) return;

    // Se la barra è già presente per questa vista, aggiorna solo i bottoni
    const alreadyBuilt =
        container.getAttribute("data-view-type") === view &&
        container.querySelector("#unico-filter-btn");

    if (alreadyBuilt) {
        container.classList.remove("hidden");
        updateFilterButtons();
        return;
    }

    // Ricostruzione completa
    container.innerHTML = "";
    container.setAttribute("data-view-type", view);
    container.classList.remove("hidden");

    // Pulsante reset
    const resetBtn = document.createElement("button");
    resetBtn.className = "filter-nav-btn reset-filter-btn";
    resetBtn.innerHTML = '<i class="fa-solid fa-undo-alt"></i>';
    resetBtn.title = "Resetta filtri";
    resetBtn.onclick = resetFilters;
    container.appendChild(resetBtn);

    // Pulsante filtro UniCo
    const unicoBtn = document.createElement("button");
    unicoBtn.id = "unico-filter-btn";
    unicoBtn.className = `filter-nav-btn ${state.filters.unico !== CONFIG.FILTER_STATES.UNICO.OFF ? "active" : ""}`;
    unicoBtn.innerHTML = `<span>Unico</span><i class="fa-solid ${_UNICO_ICONS[state.filters.unico]}"></i>`;
    unicoBtn.onclick = cycleUnicoFilter;
    container.appendChild(unicoBtn);

    // Pulsante filtro "In attesa" — solo nella vista Incarichi
    if (view === "roles") {
        const pendingBtn = document.createElement("button");
        pendingBtn.id = "waiting-filter-btn";
        pendingBtn.className = `filter-nav-btn ${state.filters.pending ? "active" : ""}`;
        pendingBtn.innerHTML = `<span>In attesa</span><i class="fa-solid fa-hourglass-half"></i>`;
        pendingBtn.onclick = togglePendingFilter;
        container.appendChild(pendingBtn);
    }
}

/**
 * Aggiorna lo stato visivo (classe `active` e icona) dei pulsanti filtro
 * senza ricostruire il DOM.
 * Da chiamare ogni volta che lo stato dei filtri cambia.
 *
 * @returns {void}
 */
function updateFilterButtons() {
    const container = document.getElementById("cityFilterContainer");
    if (!container) return;

    const unicoBtn = container.querySelector("#unico-filter-btn");
    if (unicoBtn) {
        const isActive = state.filters.unico !== CONFIG.FILTER_STATES.UNICO.OFF;
        unicoBtn.className = `filter-nav-btn ${isActive ? "active" : ""}`;

        const icon = unicoBtn.querySelector("i");
        if (icon)
            icon.className = `fa-solid ${_UNICO_ICONS[state.filters.unico]}`;
    }

    const pendingBtn = container.querySelector("#waiting-filter-btn");
    if (pendingBtn) {
        pendingBtn.className = `filter-nav-btn ${state.filters.pending ? "active" : ""}`;
    }
}
