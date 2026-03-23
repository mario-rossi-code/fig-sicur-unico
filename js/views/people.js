/**
 * @file views/people.js
 * @description Vista elenco Militari, de-duplicate per militare fisico,
 *              ordinate alfabeticamente per nome con separatori alfabetici
 *              e barra filtro UniCo.
 *
 *              Espone:
 *              - `renderPeopleList()` → entry point chiamato da `render()`
 */

"use strict";

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Renderizza la lista de-duplicata di tutte i militari presenti nel database.
 * I militari con più incarichi appaiono una sola volta con il conteggio.
 * I slot vacanti ("In attesa di nomina") non vengono mostrati in questa vista.
 *
 * Applica il filtro UniCo e la ricerca testuale.
 *
 * @returns {boolean} `true` se almeno un militare è visibile.
 */
function renderPeopleList() {
    DOM.content.className = "view-container list-view";

    renderFilterBar("people");

    const people = _collectUniquePeople();

    // Ordina per nome, poi cognome
    people.sort((a, b) => {
        const nomeCompare = (a.militare.nome || "").localeCompare(
            b.militare.nome || "",
        );
        return nomeCompare !== 0
            ? nomeCompare
            : (a.militare.cognome || "").localeCompare(b.militare.cognome || "");
    });

    let currentLetter = "";
    let hasResults = false;

    people.forEach((item) => {
        if (!passesUnicoFilter(item.militare) || !_matchesPeopleSearch(item))
            return;

        hasResults = true;

        const letter = (item.militare.nome || "").charAt(0).toUpperCase();
        if (letter !== currentLetter) {
            currentLetter = letter;
            DOM.content.appendChild(createLetterHeader(letter));
        }

        DOM.content.appendChild(_createPersonListItem(item));
    });

    return hasResults;
}

// ─── Helper privati ───────────────────────────────────────────────────────────

/**
 * Raccoglie tutte i militari valide dal database, de-duplicandole per chiave
 * univoca (nome + cognome + grado + telefoni + abilitUniCo).
 * Per ogni militare aggrega la lista di tutti i suoi incarichi.
 *
 * @private
 * @returns {Array<{militare: Object, incarichi: string[], role: string, city: string, group: string}>}
 */
function _collectUniquePeople() {
    const map = new Map();

    dbData.forEach((city) => {
        city.comandi.forEach((group) => {
            group.incarichi.forEach((inc) => {
                const p = inc.militare;
                if (!hasValidPersonData(p)) return;

                const key = [
                    p.nome,
                    p.cognome,
                    p.grado,
                    p.telefono_ufficio,
                    p.telefono_cell,
                    p.abilitUniCo,
                ].join("|");

                if (!map.has(key)) {
                    map.set(key, {
                        militare: p,
                        incarichi: [inc.nome],
                        role: inc.nome,
                        city: city.nome,
                        group: group.nome,
                    });
                } else {
                    const existing = map.get(key);
                    if (!existing.incarichi.includes(inc.nome)) {
                        existing.incarichi.push(inc.nome);
                    }
                }
            });
        });
    });

    return Array.from(map.values());
}

/**
 * Verifica se un militare corrisponde alla ricerca testuale corrente.
 *
 * @private
 * @param {{ militare: Object, role: string, city: string, group: string }} item
 * @returns {boolean}
 */
function _matchesPeopleSearch(item) {
    return matchesSearchObj(
        item.city || "",
        item.group || "",
        item.role || "",
        item.militare?.grado || "",
        item.militare?.nome || "",
        item.militare?.cognome || "",
    );
}

/**
 * Crea la card di un militare per la vista militari.
 *
 * Mostra: avatar, nome completo, grado, comando, badge UniCo e conteggio incarichi.
 * Al click apre la modale con tutti gli incarichi aggregati.
 *
 * @private
 * @param {{ militare: Object, incarichi: string[], role: string, city: string, group: string }} item
 * @returns {HTMLElement}
 */
function _createPersonListItem(item) {
    const card = document.createElement("div");
    card.className = "person-compact-card";
    card.dataset.search = [
        item.militare.nome,
        item.militare.cognome,
        item.militare.grado,
        item.group,
        item.city,
        ...(item.incarichi || []),
    ]
        .join(" ")
        .toLowerCase();

    const militare = sanitizeSoldier(item.militare);
    const isUnico = militare.abilitUniCo.toLowerCase() === "si";
    const initials = getInitials(militare.nome, militare.cognome);
    const numIncarichi = item.incarichi?.length || 0;
    const incarichiLabel = numIncarichi === 1 ? "incarico" : "incarichi";

    card.innerHTML = `
        <div class="avatar-small">${initials}</div>
        <div class="person-compact-info">
            <div class="list-item-title" style="color:var(--text-main); font-size:1.1rem;">
                ${militare.nome} ${militare.cognome}
            </div>
            <div class="person-compact-role" style="font-size:0.8rem; color:var(--text-light); margin-top:2px;">
                ${militare.grado} &mdash; ${item.group || ""}
            </div>
            <div class="operational-detail">
                <span class="incarichi-count">${numIncarichi} ${incarichiLabel}</span>
                <span class="divider">&mdash;</span>
                <span class="unico-badge ${isUnico ? "si" : "no"}">
                    UniCo <i class="fa-solid ${isUnico ? "fa-check" : "fa-times"}" aria-hidden="true"></i>
                </span>
            </div>
        </div>
    `;

    card.onclick = () =>
        openModal(
            militare,
            item.role || "",
            item.city || "",
            item.group || "",
            item.incarichi || [],
        );

    return card;
}
