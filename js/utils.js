/**
 * @file utils.js
 * @description Funzioni di utilità pure (nessuna dipendenza dal DOM o dallo stato).
 *
 *              Espone:
 *              - Sanitizzazione dei valori
 *              - Controllo dei dati persona
 *              - Calcolo delle iniziali
 *              - Matching della ricerca (testo e multi-campo)
 *              - Fix dell'altezza del layout
 */

"use strict";

// ─── Dati persona ─────────────────────────────────────────────────────────────

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
 * Verifica se un oggetto persona contiene almeno un campo significativo
 * (nome, cognome, grado, abilitUniCo o un numero di telefono).
 *
 * Le card "In attesa di nomina" hanno tutti i campi vuoti/nulli:
 * questo metodo le distingue dalle persone reali.
 *
 * @param {Object|null|undefined} persona - Oggetto persona da verificare.
 * @returns {boolean} `true` se la persona ha almeno un dato valido.
 */
function hasValidPersonData(persona) {
    if (!persona) return false;

    return (
        (persona.nome && persona.nome.trim() !== "") ||
        (persona.cognome && persona.cognome.trim() !== "") ||
        (persona.grado && persona.grado.trim() !== "") ||
        (persona.abilitUniCo && persona.abilitUniCo.trim() !== "") ||
        (persona.telefono_cell && persona.telefono_cell.trim() !== "") ||
        (persona.telefono_ufficio && persona.telefono_ufficio.trim() !== "")
    );
}

/**
 * Crea un oggetto persona con tutti i campi sanitizzati.
 * Da usare prima di renderizzare o aprire la modale.
 *
 * @param {Object} persona - Oggetto persona grezzo dal database.
 * @returns {{nome: string, cognome: string, grado: string, abilitUniCo: string, telefono_cell: string, telefono_ufficio: string}}
 */
function sanitizePersona(persona) {
    return {
        nome: sanitizeValue(persona.nome),
        cognome: sanitizeValue(persona.cognome),
        grado: sanitizeValue(persona.grado),
        abilitUniCo: sanitizeValue(persona.abilitUniCo),
        telefono_cell: sanitizeValue(persona.telefono_cell),
        telefono_ufficio: sanitizeValue(persona.telefono_ufficio),
    };
}

/**
 * Restituisce le iniziali di nome e cognome in maiuscolo.
 *
 * @param {string} nome    - Nome della persona.
 * @param {string} cognome - Cognome della persona.
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
                inc.persona.nome,
                inc.persona.cognome,
                inc.nome,
                inc.persona.grado,
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
 * // Cercando "mario rossi" trova persone con nome "Mario" e cognome "Rossi"
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
