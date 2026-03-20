/**
 * @file views/roles.js
 * @description Vista elenco Incarichi, ordinati alfabeticamente con separatori
 *              alfabetici e barra filtri (UniCo + In attesa di nomina).
 *
 *              Espone:
 *              - `renderRolesList()` → entry point chiamato da `render()`
 */

"use strict";

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Renderizza la lista di tutti gli incarichi da tutti i gruppi e città,
 * ordinati alfabeticamente con intestazioni per lettera.
 *
 * Applica i filtri attivi (UniCo e/o "In attesa") e la ricerca testuale.
 *
 * @returns {boolean} `true` se almeno un incarico è visibile.
 */
function renderRolesList() {
    DOM.content.className = "view-container list-view";

    renderFilterBar("roles");

    // Raccoglie e ordina tutti gli incarichi da tutti i gruppi
    const allRoles = _collectAllRoles();
    allRoles.sort((a, b) => a.role.localeCompare(b.role));

    let currentLetter = "";
    let hasResults = false;

    allRoles.forEach((item) => {
        if (!passesAllFilters(item) || !_matchesRoleSearch(item)) return;

        hasResults = true;

        const letter = item.role.charAt(0).toUpperCase();
        if (letter !== currentLetter) {
            currentLetter = letter;
            DOM.content.appendChild(createLetterHeader(letter));
        }

        DOM.content.appendChild(_createRoleCard(item));
    });

    return hasResults;
}

// ─── Helper privati ───────────────────────────────────────────────────────────

/**
 * Raccoglie tutti gli incarichi dal database in una struttura piatta.
 *
 * @private
 * @returns {Array<{role: string, militare: Object, city: string, group: string}>}
 */
function _collectAllRoles() {
    const roles = [];

    dbData.forEach((city) => {
        city.gruppi.forEach((group) => {
            group.incarichi.forEach((inc) => {
                roles.push({
                    role: inc.nome,
                    militare: inc.militare,
                    city: city.nome,
                    group: group.nome,
                });
            });
        });
    });

    return roles;
}

/**
 * Verifica se un incarico corrisponde alla ricerca testuale corrente.
 *
 * @private
 * @param {{ role: string, militare: Object, city: string, group: string }} item
 * @returns {boolean}
 */
function _matchesRoleSearch(item) {
    return matchesSearchObj(
        item.city,
        item.group,
        item.role,
        item.militare?.grado || "",
        item.militare?.nome || "",
        item.militare?.cognome || "",
    );
}

/**
 * Crea la card di un incarico.
 *
 * Se l'incarico è vacante ("In attesa di nomina"), la card è non interattiva.
 * Altrimenti mostra nome, grado, gruppo, città e il badge UniCo.
 *
 * @private
 * @param {{ role: string, militare: Object, city: string, group: string }} item
 * @returns {HTMLElement}
 */
function _createRoleCard(item) {
    const card = document.createElement("div");
    card.className = "person-compact-card card-enter";
    card.dataset.search = [
        item.role,
        item.city,
        item.group,
        item.militare?.nome || "",
        item.militare?.cognome || "",
        item.militare?.grado || "",
    ]
        .join(" ")
        .toLowerCase();

    const hasValidPerson = hasValidPersonData(item.militare);

    if (!hasValidPerson) {
        card.innerHTML = `
            <div class="avatar-small" style="background: var(--text-light);">
                <i class="fa-solid fa-hourglass-half" aria-hidden="true"></i>
            </div>
            <div class="person-compact-info">
                <div class="person-compact-role" style="font-weight:600; color:var(--primary);">
                    ${item.role}
                </div>
                <div class="person-compact-name" style="color:var(--text-light); font-style:italic;">
                    In attesa di nomina
                </div>
                <div class="person-compact-role" style="font-size:0.8rem; color:var(--text-light);">
                    ${item.group}, <span class="card-city">${item.city}</span>
                </div>
            </div>
        `;
        card.style.cursor = "default";
        card.style.opacity = "0.8";
    } else {
        const militare = sanitizeSoldier(item.militare);
        const isUnico = militare.abilitUniCo.toLowerCase() === "si";
        const initials = getInitials(militare.nome, militare.cognome);

        card.innerHTML = `
            <div class="avatar-small" style="position: relative;">
                ${initials}
                <div class="avatar-status ${isUnico ? "status-ok" : "status-no"}"></div>
            </div>
            <div class="person-compact-info">
                <div class="person-compact-role" style="font-weight:600; color:var(--primary);">
                    ${item.role}
                </div>
                <div class="person-compact-name">
                    ${militare.grado} ${militare.nome} ${militare.cognome}
                </div>
                <div class="person-compact-role" style="font-size:0.8rem;">
                    ${item.group}, <span class="card-city">${item.city}</span>
                </div>
            </div>
        `;

        card.onclick = () =>
            openModal(militare, item.role, item.city, item.group);
    }

    return card;
}
