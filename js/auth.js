/**
 * @file auth.js
 * @description Gestione autenticazione lato client.
 *
 *              ⚠️  Protezione client side — non è sicurezza crittografica.
 *              La password è visibile nel sorgente.
 *
 *              Flusso:
 *              - Se la sessione è valida (max 2 settimane) E la password non è
 *                cambiata dall'ultimo login → passa subito.
 *              - Se la password in config.js è cambiata → forza nuovo login.
 *              - La sessione dura 2 settimane dall'ultimo login riuscito.
 */

"use strict";

// ─── Costanti ─────────────────────────────────────────────────────────────────

/** Chiave localStorage per il timestamp di autenticazione. */
const _AUTH_TS_KEY = "fig_sicur_auth_ts";

/** Chiave localStorage per il fingerprint della password al momento del login. */
const _AUTH_PWD_KEY = "fig_sicur_auth_pwd";

/** Durata della sessione: 2 settimane in millisecondi. */
const _SESSION_DURATION_MS = 14 * 24 * 60 * 60 * 1000;

// ─── API pubblica ─────────────────────────────────────────────────────────────

/**
 * Controlla se l'utente è già autenticato, la sessione non è scaduta
 * e la password non è cambiata. Se tutto ok chiama subito onSuccess;
 * altrimenti mostra l'overlay di login.
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
 * Restituisce true se:
 * 1. Esiste un timestamp di login non scaduto (< 2 settimane).
 * 2. Il fingerprint salvato corrisponde alla password attuale in CONFIG.
 *
 * Se la password in config.js è stata cambiata, il fingerprint non coincide
 * e la funzione restituisce false → viene richiesto un nuovo login.
 *
 * @private
 */
function _isSessionValid() {
    try {
        const ts = localStorage.getItem(_AUTH_TS_KEY);
        const pwd = localStorage.getItem(_AUTH_PWD_KEY);
        if (!ts || !pwd) return false;

        const notExpired = Date.now() - parseInt(ts, 10) < _SESSION_DURATION_MS;
        const passwordMatch = pwd === _fingerprint(CONFIG.AUTH.PASSWORD);

        return notExpired && passwordMatch;
    } catch {
        return false;
    }
}

/**
 * Salva timestamp e il fingerprint della password corrente.
 * @private
 */
function _saveSession() {
    try {
        localStorage.setItem(_AUTH_TS_KEY, String(Date.now()));
        localStorage.setItem(_AUTH_PWD_KEY, _fingerprint(CONFIG.AUTH.PASSWORD));
    } catch {
        // localStorage non disponibile: non bloccante
    }
}

/**
 * Genera un fingerprint semplice della password.
 * Serve solo a rilevare se la password è cambiata
 * tra un'apertura e l'altra senza salvare la password in chiaro.
 *
 * @private
 * @param {string} str
 * @returns {string}
 */
function _fingerprint(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
    }
    return String(hash);
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
