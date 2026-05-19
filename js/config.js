/**
 * @file config.js
 * @description Configurazione centrale dell'applicazione Figure di Sicurezza.
 *              Tutte le costanti, percorsi e valori di default sono definiti qui.
 *              Modificare questo file per cambiare comportamenti globali.
 */

"use strict";

/**
 * Configurazione principale dell'applicazione.
 * @namespace CONFIG
 */
const CONFIG = {
    /** Versione dell'applicazione (visualizzata nell'header). */
    APP_VERSION: "1.0",

    /** Nome dell'applicazione. */
    APP_NAME: "Figure di Sicurezza (DEMO)",

    /** Nome breve per PWA */
    APP_SHORT_NAME: "Fig. Sicurezza",

    // ─── Autenticazione ───────────────────────────────────────────────────────
    AUTH: {
        /** Password richiesta per accedere all'applicazione. */
        PASSWORD: "sicurezza1",
    },

    // ─── Google Analytics ──────────────────────────────────────────────────
    GOOGLE_ANALYTICS: {
        /** Il tuo ID di misurazione GA4 */
        MEASUREMENT_ID: "G-3MCJ10R94P",

        /** Se true, abilita il tracciamento */
        ENABLED: false,

        /** Se true, mostra il bottone di installazione PWA personalizzato */
        SHOW_INSTALL_BUTTON: false,
    },

    // ─── Chiavi localStorage ──────────────────────────────────────────────────

    /** Chiavi utilizzate per il salvataggio nel localStorage. */
    STORAGE_KEYS: {
        /** Preferenza tema (light/dark). */
        THEME: "fig_sicur_unico_theme",
        /** Stato serializzato dell'applicazione (vista corrente). */
        APP_STATE: "fig_sicur_unico_state",
    },

    // ─── Colori tema (sincronizzati con le CSS var e il meta theme-color) ─────

    /** Colori di background per le due modalità tema, usati per aggiornare il meta theme-color. */
    THEME_COLORS: {
        light: "#f3f5f3",
        dark: "#04140d",
    },

    // ─── Animazioni ───────────────────────────────────────────────────────────

    /** Durate delle animazioni in millisecondi. */
    ANIMATION: {
        /** Durata dell'animazione di apertura/chiusura modale. */
        MODAL_DURATION: 300,
        /** Ritardo base per l'effetto cascata (stagger) delle card. */
        CARD_STAGGER: 50,
    },

    // ─── Percorsi file ────────────────────────────────────────────────────────

    /** Percorsi delle risorse. */
    PATHS: {
        /** Database JSON con tutti i dati del personale. */
        DB_JSON: "./assets/db.json",
    },

    // ─── Stati filtro UniCo ───────────────────────────────────────────────────

    /**
     * Valori possibili del filtro UniCo (ciclico: OFF → SI → NO → OFF).
     * @enum {number}
     */
    FILTER_STATES: {
        UNICO: {
            /** Nessun filtro attivo. */
            OFF: 0,
            /** Mostra solo abilitati UniCo. */
            SI: 1,
            /** Mostra solo non abilitati UniCo. */
            NO: 2,
        },
    },

    // ─── Comportamento filtri ─────────────────────────────────────────────────

    /**
     * Opzioni per il comportamento dei filtri.
     * Modifica questi valori per cambiare la persistenza o il reset automatico.
     */
    FILTERS: {
        /**
         * Se `true`, i filtri vengono salvati nel localStorage e ripristinati
         * alla riapertura dell'app.
         */
        PERSISTENT: false,

        /**
         * Se `true`, i filtri vengono azzerati automaticamente ad ogni cambio
         * di vista (tab della bottom nav).
         */
        RESET_ON_VIEW_CHANGE: true,

        /** Valori predefiniti dei filtri all'avvio (o dopo un reset). */
        DEFAULTS: {
            /** Stato iniziale filtro UniCo (0 = OFF). */
            unico: 0,
            /** Stato iniziale filtro "In attesa di nomina". */
            pending: false,
        },
    },

    // ─── Aggiornamento automatico ─────────────────────────────────────────────

    /**
     * Intervallo in millisecondi per il controllo periodico di aggiornamenti
     * del Service Worker (default: 1 ora).
     */
    UPDATE_CHECK_INTERVAL: 60 * 60 * 1000,
};
