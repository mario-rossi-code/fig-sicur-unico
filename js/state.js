/**
 * @file state.js
 * @description Stato centralizzato dell'applicazione e funzioni di
 *              persistenza nel localStorage.
 *
 *              Espone:
 *              - `dbData`   : array dei dati caricati dal db.json
 *              - `state`    : oggetto stato reattivo (vista, selezioni, ricerca, filtri)
 *              - `saveState()` / `loadState()` per la persistenza
 */

"use strict";

// ─── Dati applicazione ────────────────────────────────────────────────────────

/**
 * Dati caricati dal database JSON (`assets/db.json`).
 * Viene popolato da `app.js` dopo il fetch iniziale.
 * @type {Object[]}
 */
let dbData = [];

// ─── Stato applicazione ───────────────────────────────────────────────────────

/**
 * @typedef {Object} AppFilters
 * @property {number}  unico   - Stato filtro UniCo: 0=OFF, 1=SI, 2=NO.
 * @property {boolean} pending - Se `true`, mostra solo incarichi senza militare assegnato.
 */

/**
 * @typedef {Object} AppState
 * @property {'cities'|'groups'|'roles'|'people'} view - Vista (tab) correntemente attiva.
 * @property {Object|null} selectedCity  - Città selezionata nella navigazione gerarchica.
 * @property {Object|null} selectedGroup - Gruppo selezionato nella navigazione gerarchica.
 * @property {string}      searchText   - Testo di ricerca normalizzato (lowercase, trim).
 * @property {AppFilters}  filters      - Filtri attivi.
 */

/**
 * Stato corrente dell'applicazione.
 * Viene inizializzato dal localStorage (se disponibile) oppure con i valori di default.
 * @type {AppState}
 */
const state = _initState();

// ─── Funzioni di stato ────────────────────────────────────────────────────────

/**
 * Legge i parametri dall'URL e restituisce un oggetto con i valori.
 * Utile per gestire shortcut e navigazione diretta.
 * @returns {Object}
 */
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        view: params.get("view"),
        protocol: params.get("protocol"),
        source: params.get("source"),
    };
}

/**
 * Rimuove i parametri dall'URL dopo che sono stati processati.
 * Utile per evitare che i parametri delle shortcut rimangano visibili.
 */
function cleanUrlParams() {
    if (window.location.search) {
        const url = new URL(window.location.href);
        url.search = "";
        window.history.replaceState({}, "", url.toString());
    }
}

/**
 * Inizializza lo stato caricando dal localStorage, dai parametri URL o usando i valori di default.
 * I filtri vengono sempre ricreati dai default se `CONFIG.FILTERS.PERSISTENT` è false.
 * @private
 * @returns {AppState}
 */
function _initState() {
    const saved = loadState();
    const urlParams = getUrlParams();

    // Determina la vista: priorità a URL params, poi localStorage, infine default
    let initialView = "cities";

    if (
        urlParams.view &&
        ["cities", "groups", "roles", "people"].includes(urlParams.view)
    ) {
        initialView = urlParams.view;
        console.log(`[State] Vista impostata da URL param: ${initialView}`);
    } else if (saved?.view) {
        initialView = saved.view;
    }

    const base = {
        view: initialView,
        selectedCity: null,
        selectedGroup: null,
        searchText: "",
    };

    // I filtri vengono ripristinati solo se la persistenza è attiva
    base.filters =
        CONFIG.FILTERS.PERSISTENT && saved?.filters
            ? saved.filters
            : { ...CONFIG.FILTERS.DEFAULTS };

    return base;
}

/**
 * Salva una versione ridotta dello stato nel localStorage.
 *
 * Viene persisitita solo la vista corrente (per riprendere da dove si era).
 * `selectedCity`, `selectedGroup` e `searchText` vengono sempre azzerati
 * al riavvio per evitare stati inconsistenti con dati aggiornati.
 * Se `CONFIG.FILTERS.PERSISTENT` è `true`, vengono salvati anche i filtri.
 *
 * @returns {void}
 */
function saveState() {
    try {
        // Non salva lo stato se è stato impostato da una shortcut
        const urlParams = getUrlParams();
        if (urlParams.source === "pwa-shortcut") {
            console.log(
                "[State] Stato da shortcut, non salvo nel localStorage",
            );
            return;
        }

        const payload = {
            view: state.view,
            selectedCity: null,
            selectedGroup: null,
            searchText: "",
        };

        if (CONFIG.FILTERS.PERSISTENT) {
            payload.filters = state.filters;
        }

        localStorage.setItem(
            CONFIG.STORAGE_KEYS.APP_STATE,
            JSON.stringify(payload),
        );
    } catch (err) {
        console.warn("[State] Impossibile salvare lo stato:", err);
    }
}

/**
 * Carica lo stato precedentemente salvato nel localStorage.
 * Se la vista salvata non è valida viene sostituita con `"cities"`.
 *
 * @returns {AppState|null} Lo stato salvato, oppure `null` se assente o corrotto.
 */
function loadState() {
    try {
        const raw = localStorage.getItem(CONFIG.STORAGE_KEYS.APP_STATE);
        if (!raw) return null;

        const parsed = JSON.parse(raw);

        const VALID_VIEWS = ["cities", "groups", "roles", "people"];
        if (!VALID_VIEWS.includes(parsed.view)) {
            parsed.view = "cities";
        }

        if (!CONFIG.FILTERS.PERSISTENT) {
            delete parsed.filters;
        }

        return parsed;
    } catch (err) {
        console.warn("[State] Impossibile caricare lo stato:", err);
        return null;
    }
}

/**
 * Resetta i filtri ai valori predefiniti definiti in `CONFIG.FILTERS.DEFAULTS`.
 * @returns {void}
 */
function resetFiltersToDefaults() {
    state.filters = { ...CONFIG.FILTERS.DEFAULTS };
}
