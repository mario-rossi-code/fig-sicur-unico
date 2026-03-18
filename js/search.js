/**
 * @file search.js
 * @description Gestione della barra di ricerca.
 *
 *              - Input: aggiorna `state.searchText` e ri-renderizza.
 *              - Clear: azzera la ricerca e ri-renderizza.
 */

"use strict";

/**
 * Inizializza i listener sulla barra di ricerca e sul pulsante di pulizia.
 * Da chiamare una sola volta durante `initApp()`.
 *
 * @returns {void}
 */
function initSearch() {
    const searchInput = document.getElementById("searchInput");
    const clearBtn    = document.getElementById("clearBtn");

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            state.searchText = e.target.value.toLowerCase().trim();
            clearBtn?.classList.toggle("hidden", state.searchText === "");
            render();
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            state.searchText = "";
            clearBtn.classList.add("hidden");
            render();
        });
    }
}
