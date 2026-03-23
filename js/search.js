/**
 * @file search.js
 * @description Gestione della barra di ricerca.
 *
 *              Strategia:
 *              - Al primo render (cambio vista) il DOM viene costruito completo.
 *              - Ad ogni keystroke viene chiamato `filterInPlace()` che
 *                mostra/nasconde le card visualizzate.
 *              - Il re-render completo avviene solo al cambio di vista o
 *                al click su città/comando (navigazione gerarchica).
 *
 *              Elementi filtrabili: qualsiasi elemento con `data-search`
 *              nel DOM di `#content`. Ogni vista deve popolare questo
 *              attributo sui propri elementi (vedi note nelle viste).
 */

"use strict";

// ─── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Inizializza i listener sulla barra di ricerca e sul pulsante di pulizia.
 * Da chiamare una sola volta durante `initApp()`.
 *
 * @returns {void}
 */
function initSearch() {
    const searchInput = document.getElementById("searchInput");
    const clearBtn = document.getElementById("clearBtn");

    if (searchInput) {
        let searchTimeout;

        searchInput.addEventListener("input", (e) => {
            const newText = e.target.value.toLowerCase().trim();

            // Debounce per non tracciare ogni singolo carattere
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (newText !== state.searchText) {
                    trackSearch(newText || "(empty)", window.currentView);
                }
            }, 1000);

            state.searchText = newText;
            clearBtn?.classList.toggle("hidden", state.searchText === "");
            filterInPlace();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (state.searchText) {
                trackSearchCleared(window.currentView);
            }

            if (searchInput) searchInput.value = "";
            state.searchText = "";
            clearBtn.classList.add("hidden");
            filterInPlace();
        });
    }
}

/**
 * Filtra in-place gli elementi del DOM senza ricostruirlo.
 *
 * Logica:
 * - Nella vista `cities` (livello 1): mostra/nasconde le card città
 *   il cui `data-search` contiene il testo cercato.
 * - Nelle altre viste: mostra/nasconde le `person-compact-card` e le
 *   `group-expandable` il cui `data-search` contiene il testo cercato.
 *   Gli header alfabetici/città vengono nascosti se tutte le card sotto
 *   di loro sono nascoste.
 *
 * Mostra/nasconde `#noResults` in base all'esito.
 *
 * @returns {void}
 */
/**
 * Filtra in-place gli elementi del DOM senza ricostruirlo.
 *
 * Logica:
 * - Vista `cities` livello 1: mostra/nasconde le card città.
 * - Vista `cities` livelli 2-3: re-render completo (navigazione gerarchica).
 * - Vista `groups`: mostra/nasconde card militare dentro ogni accordion,
 *   espande i comandi con risultati, nasconde quelli senza.
 * - Viste `roles` / `people`: mostra/nasconde le card e gli header alfabetici orfani.
 *
 * Mostra/nasconde `#noResults` in base all'esito.
 *
 * @returns {void}
 */
function filterInPlace() {
    const content = document.getElementById("content");
    const noResults = document.getElementById("noResults");
    if (!content) return;

    // I livelli 2-3 della gerarchia città richiedono re-render completo
    // perché il DOM cambia strutturalmente (breadcrumb, lista comandi/militari)
    if (state.view === "cities" && state.selectedCity) {
        render();
        return;
    }

    const query = state.searchText;
    let visibleCount = 0;

    if (state.view === "cities") {
        // ── Livello 1: griglia città ──────────────────────────────────────
        const cards = content.querySelectorAll(".list-item-card[data-search]");
        cards.forEach((card) => {
            const match = !query || card.dataset.search.includes(query);
            card.style.display = match ? "" : "none";
            if (match) visibleCount++;
        });
    } else if (state.view === "groups") {
        // ── Vista Comandi: accordion ───────────────────────────────────────
        const groups = content.querySelectorAll(".group-expandable");

        groups.forEach((groupEl) => {
            const cards = groupEl.querySelectorAll(
                ".person-compact-card[data-search]",
            );
            const contentDiv = groupEl.querySelector(".group-content");
            const innerDiv = groupEl.querySelector(".group-content-inner");
            const chevron = groupEl.querySelector(".group-chevron");
            let groupVisible = 0;

            // Mostra/nasconde le singole card militare
            cards.forEach((card) => {
                const match = !query || card.dataset.search.includes(query);
                card.style.display = match ? "" : "none";
                if (match) groupVisible++;
            });

            if (groupVisible === 0) {
                // Nessuna card corrisponde: nasconde l'intero comando
                groupEl.style.display = "none";
            } else {
                groupEl.style.display = "";
                visibleCount += groupVisible;

                if (query) {
                    // Con ricerca attiva: espande il comando
                    groupEl.classList.add("expanded");
                    chevron.style.transform = "rotate(180deg)";
                    setTimeout(() => {
                        contentDiv.style.maxHeight = `${innerDiv.offsetHeight}px`;
                    }, 10);
                } else {
                    // Ricerca azzerata: chiude tutto tranne il comando aperto manualmente
                    if (_openGroup?.div !== groupEl) {
                        // Imposta maxHeight al valore attuale prima di animare verso 0,
                        // così l'animazione parte dal punto corretto
                        contentDiv.style.maxHeight = `${innerDiv.offsetHeight}px`;
                        // Forza reflow prima di impostare 0 per far partire la transizione CSS
                        contentDiv.offsetHeight;
                        groupEl.classList.remove("expanded");
                        chevron.style.transform = "rotate(0deg)";
                        contentDiv.style.maxHeight = "0";
                    }
                }
            }
        });

        // Nasconde gli header città senza comandi visibili sotto di loro
        const headers = content.querySelectorAll(".letter-header");
        headers.forEach((header) => {
            let next = header.nextElementSibling;
            let hasVisible = false;
            while (next && !next.classList.contains("letter-header")) {
                if (next.style.display !== "none") hasVisible = true;
                next = next.nextElementSibling;
            }
            header.style.display = hasVisible ? "" : "none";
        });
    } else {
        // ── Viste Incarichi e Militari ─────────────────────────────────────
        const cards = content.querySelectorAll(
            ".person-compact-card[data-search]",
        );
        cards.forEach((card) => {
            const match = !query || card.dataset.search.includes(query);
            card.style.display = match ? "" : "none";
            if (match) visibleCount++;
        });

        // Nasconde i letter-header alfabetici senza card visibili sotto di loro
        const headers = content.querySelectorAll(".letter-header");
        headers.forEach((header) => {
            let next = header.nextElementSibling;
            let hasVisible = false;
            while (next && !next.classList.contains("letter-header")) {
                if (next.style.display !== "none") hasVisible = true;
                next = next.nextElementSibling;
            }
            header.style.display = hasVisible ? "" : "none";
        });
    }

    noResults?.classList.toggle("hidden", visibleCount > 0);
}

/**
 * Azzera il testo di ricerca nello stato e nell'input visibile.
 * @returns {void}
 */
function resetSearch() {
    state.searchText = "";
    const input = document.getElementById("searchInput");
    if (input) input.value = "";
    document.getElementById("clearBtn")?.classList.add("hidden");
}
