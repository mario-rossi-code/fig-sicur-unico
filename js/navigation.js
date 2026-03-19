/**
 * @file navigation.js
 * @description Gestione della bottom navigation bar e del protocollo custom URL.
 *
 *              - Cambia vista al click (o Enter/Space da tastiera) sui tab.
 *              - Resetta selezioni, ricerca e (opzionalmente) filtri al cambio vista.
 *              - Gestisce i link `web+figsicur://` per deep linking da PWA.
 *              - Sincronizza la classe `active` sui tab al caricamento.
 */

"use strict";

// ─── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Registra i listener sui tab della bottom navigation.
 * Da chiamare una sola volta durante `initApp()`.
 *
 * @returns {void}
 */
function initNavigation() {
    document.querySelectorAll(".bottom-nav .nav-item").forEach((item) => {
        // Click
        item.addEventListener("click", () => _switchView(item.dataset.view));

        // Accessibilità tastiera (Enter / Space)
        item.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                _switchView(item.dataset.view);
            }
        });
    });
}

/**
 * Allinea la classe `active` sui tab al `state.view` corrente.
 * Da chiamare dopo il ripristino dello stato dal localStorage.
 *
 * @returns {void}
 */
function syncNavigationWithState() {
    document.querySelectorAll(".bottom-nav .nav-item").forEach((item) => {
        item.classList.toggle("active", item.dataset.view === state.view);
    });
}

/**
 * Gestisce i deep link nel formato `web+figsicur://comando[/parametro]`.
 * Viene letto dal query-param `?protocol=…` nel URL di avvio della PWA.
 *
 * Comandi supportati:
 * - `citta[/nome]` → Vista Città, con eventuale selezione diretta.
 * - `gruppi`       → Vista Gruppi.
 * - `incarichi`    → Vista Incarichi.
 * - `persone`      → Vista Persone.
 *
 * Da chiamare **dopo** `loadData()`, in modo che `dbData` sia popolato.
 *
 * @returns {void}
 */
function handleProtocolUrl() {
    const params = new URLSearchParams(window.location.search);
    const protocol = params.get("protocol");
    if (!protocol) return;

    const match = protocol.match(/^web\+figsicur:\/\/([^/]+)(?:\/(.+))?$/);
    if (!match) return;

    const command = match[1];
    const param = match[2] ? decodeURIComponent(match[2]) : null;

    const VIEW_MAP = {
        citta: "cities",
        gruppi: "groups",
        incarichi: "roles",
        persone: "people",
    };

    if (VIEW_MAP[command]) {
        state.view = VIEW_MAP[command];

        if (command === "citta" && param) {
            const city = dbData.find(
                (c) => c.nome.toLowerCase() === param.toLowerCase(),
            );
            if (city) state.selectedCity = city;
        }

        render();
    }
}

// ─── Helper privati ───────────────────────────────────────────────────────────

/**
 * Esegue il cambio vista:
 * 1. Aggiorna il tab attivo nella navbar.
 * 2. Resetta stato di navigazione e ricerca.
 * 3. Resetta i filtri se `CONFIG.FILTERS.RESET_ON_VIEW_CHANGE` è `true`.
 * 4. Chiama `render()`.
 *
 * @private
 * @param {string} view - Vista di destinazione (`"cities"` | `"groups"` | `"roles"` | `"people"`).
 * @returns {void}
 */
function _switchView(view) {
    // Aggiorna la vista corrente
    window.currentView = view;

    // Traccia cambio vista PRIMA di renderizzare
    trackViewChange(state.view, view);

    // Aggiorna classi active
    document
        .querySelectorAll(".bottom-nav .nav-item")
        .forEach((n) => n.classList.toggle("active", n.dataset.view === view));

    state.view = view;
    state.selectedCity = null;
    state.selectedGroup = null;

    // Azzera la ricerca
    const searchInput = document.getElementById("searchInput");
    const clearBtn = document.getElementById("clearBtn");
    if (searchInput) searchInput.value = "";
    state.searchText = "";
    clearBtn?.classList.add("hidden");

    // Resetta filtri se configurato
    if (CONFIG.FILTERS.RESET_ON_VIEW_CHANGE) {
        resetFiltersToDefaults();
    }

    render();
    saveState();
}
