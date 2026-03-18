/**
 * @file theme.js
 * @description Gestione del tema chiaro/scuro.
 *
 *              - Applica il tema all'attributo `data-theme` su `<html>`
 *              - Aggiorna l'icona del pulsante toggle
 *              - Aggiorna il meta `theme-color` per colorare la gesture bar
 *                di Android e la status bar di iOS quando installata come PWA
 *              - Persiste la preferenza nel localStorage
 */

"use strict";

// ─── Riferimenti DOM (privati al modulo) ──────────────────────────────────────

/** @type {HTMLButtonElement|null} */
const _themeToggleBtn = document.getElementById("themeToggle");

/** @type {HTMLMetaElement|null} */
const _themeColorMeta = document.getElementById("themeColorMeta");

// ─── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Applica il tema specificato all'applicazione.
 *
 * Effetti:
 * 1. Setta `data-theme` su `<html>` (usato dal CSS per le variabili).
 * 2. Aggiorna il meta `theme-color` con il colore di background corrispondente
 *    (questo fa sì che la gesture bar di Android e la status bar di iOS
 *     adottino il colore del tema, anche quando installata come PWA).
 * 3. Cambia l'icona del toggle (luna ↔ sole).
 * 4. Salva la preferenza nel localStorage.
 *
 * @param {'light'|'dark'} theme - Tema da applicare.
 * @returns {void}
 */
function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, theme);

    // Aggiorna il meta theme-color per la gesture/status bar
    if (_themeColorMeta) {
        _themeColorMeta.setAttribute("content", CONFIG.THEME_COLORS[theme]);
    }

    // Aggiorna l'icona del pulsante
    if (_themeToggleBtn) {
        const icon = _themeToggleBtn.querySelector("i");
        if (icon) {
            icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
        }
    }
}

/**
 * Inizializza il sistema di gestione tema:
 * - Legge la preferenza salvata nel localStorage (default: `"light"`).
 * - Applica il tema all'avvio.
 * - Registra il listener sul pulsante di toggle.
 *
 * @returns {void}
 */
function initTheme() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || "light";
    applyTheme(saved);

    _themeToggleBtn?.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme");
        applyTheme(current === "dark" ? "light" : "dark");
    });
}
