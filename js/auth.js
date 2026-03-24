/**
 * @file auth.js
 * @description Gestione autenticazione lato client.
 *
 *              ⚠️  Protezione client side — non è sicurezza crittografica.
 *              La password è visibile nel sorgente.
 *
 *              Flusso:
 *              - Se la sessione è valida (localStorage, max 2 settimane) → passa subito.
 *              - Altrimenti mostra l'overlay di login e blocca l'app.
 *              - Al submit verifica la password; se corretta salva il timestamp,
 *                rimuove l'overlay e chiama il callback (initApp).
 *              - La sessione dura 2 settimane dall'ultimo login riuscito,
 *                indipendentemente da chiusura del browser o riavvio del dispositivo.
 */

"use strict";

// ─── Costanti ─────────────────────────────────────────────────────────────────

/** Chiave localStorage per il timestamp di autenticazione. */
const _AUTH_KEY = "fig_sicur_auth_ts";

/** Durata della sessione: 2 settimane in millisecondi. */
const _SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

// ─── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Controlla se l'utente è già autenticato e la sessione non è scaduta.
 * Se sì chiama subito onSuccess; altrimenti mostra l'overlay di login.
 *
 * @param {Function} onSuccess - Callback da eseguire dopo il login (es. initApp).
 * @returns {void}
 */
function requireAuth(onSuccess) {
    if (_isSessionValid()) {
        onSuccess();
        return;
    }
    _showLoginOverlay(onSuccess);
}

// ─── Helper privati ───────────────────────────────────────────────────────────

/**
 * Restituisce true se esiste un timestamp di login valido
 * e non sono passate più di 2 settimane.
 * @private
 */
function _isSessionValid() {
    try {
        const ts = localStorage.getItem(_AUTH_KEY);
        if (!ts) return false;
        return Date.now() - parseInt(ts, 10) < _SESSION_DURATION_MS;
    } catch {
        return false;
    }
}

/**
 * Salva il timestamp corrente come momento dell'ultimo login.
 * @private
 */
function _saveSession() {
    try {
        localStorage.setItem(_AUTH_KEY, String(Date.now()));
    } catch {
        // localStorage non disponibile: non bloccante
    }
}

/**
 * Crea e inietta l'overlay di login nel DOM, poi gestisce il submit.
 * @private
 * @param {Function} onSuccess
 */
function _showLoginOverlay(onSuccess) {
    const overlay = document.createElement("div");
    overlay.id = "authOverlay";
    overlay.className = "auth-overlay";
    overlay.innerHTML = `
        <div class="auth-card">
            <div class="auth-logo-wrapper">
                <img class="auth-logo" src="./assets/img/logo.png" alt="Logo" />
            </div>
            <h2 class="auth-title">Figure di Sicurezza</h2>
            <p class="auth-subtitle">Inserisci la password per continuare</p>

            <div class="auth-input-wrapper" id="authInputWrapper">
                <i class="fa-solid fa-lock"></i>
                <input
                    type="password"
                    id="authPasswordInput"
                    placeholder="Password"
                    autocomplete="current-password"
                    autofocus
                />
                <button id="authToggleVisibility" type="button" aria-label="Mostra/Nascondi password">
                    <i class="fa-solid fa-eye"></i>
                </button>
            </div>

            <p class="auth-error hidden" id="authError">
                <i class="fa-solid fa-circle-exclamation"></i>
                Password non corretta
            </p>

            <button class="auth-submit" id="authSubmit">
                <i class="fa-solid fa-arrow-right-to-bracket"></i>
                Accedi
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    const input = document.getElementById("authPasswordInput");
    const submitBtn = document.getElementById("authSubmit");
    const errorEl = document.getElementById("authError");
    const toggleBtn = document.getElementById("authToggleVisibility");
    const wrapper = document.getElementById("authInputWrapper");

    // Toggle visibilità password
    toggleBtn.addEventListener("click", () => {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        toggleBtn.querySelector("i").className = isPassword
            ? "fa-solid fa-eye-slash"
            : "fa-solid fa-eye";
    });

    // Verifica password
    const _verify = () => {
        if (input.value === CONFIG.AUTH.PASSWORD) {
            _saveSession();
            overlay.classList.add("auth-overlay--exit");
            overlay.addEventListener(
                "animationend",
                () => {
                    overlay.remove();
                    onSuccess();
                },
                { once: true },
            );
        } else {
            errorEl.classList.remove("hidden");
            wrapper.classList.add("auth-input--shake");
            input.value = "";
            input.focus();
            wrapper.addEventListener(
                "animationend",
                () => wrapper.classList.remove("auth-input--shake"),
                { once: true },
            );
        }
    };

    submitBtn.addEventListener("click", _verify);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") _verify();
        if (!errorEl.classList.contains("hidden")) {
            errorEl.classList.add("hidden");
        }
    });

    requestAnimationFrame(() => overlay.classList.add("auth-overlay--visible"));
}
