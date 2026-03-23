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
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach((item) => {
        item.addEventListener("click", (e) => {
            const view = item.getAttribute("data-view");
            if (view && view !== state.view) {
                // Stato alla cronologia prima di cambiare vista
                addToHistory(view);
                changeView(view);
            }
        });
    });

    // Gestisci il pulsante indietro del browser/swipe back
    window.addEventListener("popstate", handlePopState);

    // Salva lo stato iniziale nella cronologia
    const initialState = {
        view: state.view,
        selectedCity: state.selectedCity?.nome || null,
        selectedGroup: state.selectedGroup?.nome || null,
    };
    window.history.replaceState(initialState, "", window.location.pathname);
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
 * - `militari`      → Vista Militari.
 *
 * Da chiamare **dopo** `loadData()`, in modo che `dbData` sia popolato.
 *
 * @returns {void}
 */
function handlePopState(event) {
    // console.log("[Navigation] PopState rilevato", event.state);

    if (event.state) {
        // Ripristina lo stato precedente
        const previousState = event.state;

        // Trova la città selezionata in base al nome
        let selectedCity = null;
        if (previousState.selectedCity) {
            selectedCity = dbData.find(
                (city) => city.nome === previousState.selectedCity,
            );
        }

        // Trova il gruppo selezionato
        let selectedGroup = null;
        if (previousState.selectedGroup && selectedCity) {
            selectedGroup = selectedCity.gruppi.find(
                (g) => g.nome === previousState.selectedGroup,
            );
        }

        // Aggiorna lo stato globale
        state.view = previousState.view;
        state.selectedCity = selectedCity;
        state.selectedGroup = selectedGroup;

        // Sincronizza la navbar
        syncNavbarWithView(previousState.view);

        // Renderizza la vista
        render();

        // Traccia analytics
        if (typeof trackEvent === "function") {
            trackEvent("navigation_back", {
                from: window.currentView,
                to: previousState.view,
                source: "popstate",
            });
        }

        window.currentView = previousState.view;
    } else {
        // Nessuno stato nella cronologia, torna alla home
        // console.log("[Navigation] Nessuno stato, navigazione alla home");
        navigateToHome();
    }
}

/**
 * Aggiunge uno stato alla cronologia prima di navigare
 * @param {string} newView - Nuova vista
 * @param {Object} options - Opzioni aggiuntive (città, gruppo)
 */
function addToHistory(newView, options = {}) {
    const currentState = {
        view: state.view,
        selectedCity: state.selectedCity?.nome || null,
        selectedGroup: state.selectedGroup?.nome || null,
    };

    const newState = {
        view: newView,
        selectedCity: options.city || null,
        selectedGroup: options.group || null,
    };

    // Aggiungi il nuovo stato alla cronologia
    window.history.pushState(newState, "", window.location.pathname);

    // Mantieni anche lo stato precedente (opzionale)
    console.log("[Navigation] Aggiunto stato alla cronologia:", newState);
}

/**
 * Cambia vista e aggiorna la cronologia
 * @param {string} newView - Nuova vista da attivare
 * @param {Object} options - Opzioni aggiuntive
 */
function changeView(newView, options = {}) {
    if (newView === state.view) return;

    // Aggiungi alla cronologia prima di cambiare
    addToHistory(newView, options);

    // Aggiorna lo stato
    state.view = newView;
    if (options.city) state.selectedCity = options.city;
    if (options.group) state.selectedGroup = options.group;

    // Sincronizza navbar
    syncNavbarWithView(newView);

    // Rendi
    render();

    window.currentView = newView;
}

/**
 * Sincronizza la navbar con la vista corrente
 * @param {string} view - Vista corrente
 */
function syncNavbarWithView(view) {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach((item) => {
        item.classList.remove("active");
        if (item.getAttribute("data-view") === view) {
            item.classList.add("active");
        }
    });
}

/**
 * Naviga alla home (città)
 */
function navigateToHome() {
    const homeState = {
        view: "cities",
        selectedCity: null,
        selectedGroup: null,
    };

    // Sostituisci lo stato corrente con la home
    window.history.replaceState(homeState, "", window.location.pathname);

    // Aggiorna lo stato
    state.view = "cities";
    state.selectedCity = null;
    state.selectedGroup = null;

    // Sincronizza navbar
    syncNavbarWithView("cities");

    // Rendi
    render();

    window.currentView = "cities";
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
