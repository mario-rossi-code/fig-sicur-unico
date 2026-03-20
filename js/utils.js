/**
 * @file utils.js
 * @description Funzioni di utilità pure (nessuna dipendenza dal DOM o dallo stato).
 *
 *              Espone:
 *              - Sanitizzazione dei valori
 *              - Controllo dei dati militare
 *              - Calcolo delle iniziali
 *              - Matching della ricerca (testo e multi-campo)
 *              - Fix dell'altezza del layout
 */

"use strict";

// ─── Dati militare ─────────────────────────────────────────────────────────────

/**
 * Sanitizza un valore sostituendo `null`, `undefined`, `"null"` e `"undefined"`
 * con una stringa vuota.
 *
 * @param {*} value - Valore da sanitizzare.
 * @returns {string} Stringa pulita.
 */
function sanitizeValue(value) {
    if (
        value === null ||
        value === undefined ||
        value === "null" ||
        value === "undefined"
    ) {
        return "";
    }
    return String(value);
}

/**
 * Verifica se un oggetto militare contiene almeno un campo significativo
 * (nome, cognome, grado, abilitUniCo o un numero di telefono).
 *
 * Le card "In attesa di nomina" hanno tutti i campi vuoti/nulli:
 * questo metodo le distingue dai militari reali.
 *
 * @param {Object|null|undefined} militare - Oggetto militare da verificare.
 * @returns {boolean} `true` se il militare ha almeno un dato valido.
 */
function hasValidPersonData(militare) {
    if (!militare) return false;

    return (
        (militare.nome && militare.nome.trim() !== "") ||
        (militare.cognome && militare.cognome.trim() !== "") ||
        (militare.grado && militare.grado.trim() !== "") ||
        (militare.abilitUniCo && militare.abilitUniCo.trim() !== "") ||
        (militare.telefono_cell && militare.telefono_cell.trim() !== "") ||
        (militare.telefono_ufficio && militare.telefono_ufficio.trim() !== "")
    );
}

/**
 * Crea un oggetto militare con tutti i campi sanitizzati.
 * Da usare prima di renderizzare o aprire la modale.
 *
 * @param {Object} militare - Oggetto militare grezzo dal database.
 * @returns {{nome: string, cognome: string, grado: string, abilitUniCo: string, telefono_cell: string, telefono_ufficio: string}}
 */
function sanitizeSoldier(militare) {
    return {
        nome: sanitizeValue(militare.nome),
        cognome: sanitizeValue(militare.cognome),
        grado: sanitizeValue(militare.grado),
        abilitUniCo: sanitizeValue(militare.abilitUniCo),
        telefono_cell: sanitizeValue(militare.telefono_cell),
        telefono_ufficio: sanitizeValue(militare.telefono_ufficio),
    };
}

/**
 * Restituisce le iniziali di nome e cognome in maiuscolo.
 *
 * @param {string} nome    - Nome del militare.
 * @param {string} cognome - Cognome del militare.
 * @returns {string} Due caratteri maiuscoli (es. `"MR"`).
 */
function getInitials(nome, cognome) {
    return `${nome[0] ?? ""}${cognome[0] ?? ""}`.toUpperCase();
}

// ─── Ricerca ──────────────────────────────────────────────────────────────────

/**
 * Verifica se un singolo testo corrisponde al testo di ricerca corrente.
 * Opzionalmente, se il testo diretto non corrisponde, controlla anche
 * gli incarichi del gruppo (ricerca profonda).
 *
 * @param {string}      text      - Testo principale da verificare.
 * @param {Object|null} [groupObj] - Oggetto gruppo per ricerca profonda negli incarichi.
 * @returns {boolean} `true` se il testo (o un incarico del gruppo) corrisponde.
 */
function matchesSearch(text, groupObj = null) {
    if (!state.searchText) return true;

    const directMatch = text.toLowerCase().includes(state.searchText);
    if (directMatch) return true;

    if (groupObj) {
        return groupObj.incarichi.some((inc) =>
            matchesSearchObj(
                inc.militare.nome,
                inc.militare.cognome,
                inc.nome,
                inc.militare.grado,
            ),
        );
    }

    return false;
}

/**
 * Verifica se un insieme di campi corrisponde al testo di ricerca corrente.
 * Supporta la ricerca multi-parola: tutti i token devono essere presenti
 * in almeno uno dei campi forniti.
 *
 * @param {...string} fields - Campi su cui eseguire la ricerca.
 * @returns {boolean} `true` se tutti i token di ricerca trovano corrispondenza.
 *
 * @example
 * Cercando "mario rossi" trova militari con nome "Mario" e cognome "Rossi"
 * matchesSearchObj("Mario", "Rossi", "Comandante");
 */
function matchesSearchObj(...fields) {
    if (!state.searchText) return true;

    const tokens = state.searchText.split(" ").filter(Boolean);

    return tokens.every((token) =>
        fields.some(
            (field) => field && String(field).toLowerCase().includes(token),
        ),
    );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

/**
 * Registra i listener necessari per ricalcolare l'altezza del main al resize
 * e alla fine del caricamento del DOM.
 * Da chiamare una sola volta all'avvio.
 *
 * @returns {void}
 */
function initLayoutFix() {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () =>
            setTimeout(adjustMainHeight, 100),
        );
    } else {
        setTimeout(adjustMainHeight, 100);
    }
    window.addEventListener("resize", adjustMainHeight);
}

/**
 * Ricalcola e imposta l'altezza del `<main>` in modo che il contenuto
 * si adatti allo schermo senza overflow.
 *
 * @returns {void}
 */
function adjustMainHeight() {
    const header = document.querySelector(".header");
    const main = document.querySelector(".main");

    if (!main) return;

    const headerHeight = header ? header.offsetHeight : 0;
    const availableHeight = window.innerHeight - headerHeight;

    main.style.height = `${availableHeight}px`;
}
