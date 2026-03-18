/**
 * @file views/people.js
 * @description Vista elenco Persone, de-duplicate per persona fisica,
 *              ordinate alfabeticamente per nome con separatori alfabetici
 *              e barra filtro UniCo.
 *
 *              Espone:
 *              - `renderPeopleList()` → entry point chiamato da `render()`
 */

"use strict";

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Renderizza la lista de-duplicata di tutte le persone presenti nel database.
 * Le persone con più incarichi appaiono una sola volta con il conteggio.
 * I slot vacanti ("In attesa di nomina") non vengono mostrati in questa vista.
 *
 * Applica il filtro UniCo e la ricerca testuale.
 *
 * @returns {boolean} `true` se almeno una persona è visibile.
 */
function renderPeopleList() {
    DOM.content.className = "view-container list-view";

    renderFilterBar("people");

    const people = _collectUniquePeople();

    // Ordina per nome, poi cognome
    people.sort((a, b) => {
        const nomeCompare = (a.persona.nome || "").localeCompare(
            b.persona.nome || "",
        );
        return nomeCompare !== 0
            ? nomeCompare
            : (a.persona.cognome || "").localeCompare(b.persona.cognome || "");
    });

    let currentLetter = "";
    let hasResults = false;

    people.forEach((item) => {
        if (!passesUnicoFilter(item.persona) || !_matchesPeopleSearch(item))
            return;

        hasResults = true;

        const letter = (item.persona.nome || "").charAt(0).toUpperCase();
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
 * Raccoglie tutte le persone valide dal database, de-duplicandole per chiave
 * univoca (nome + cognome + grado + telefoni + abilitUniCo).
 * Per ogni persona aggrega la lista di tutti i suoi incarichi.
 *
 * @private
 * @returns {Array<{persona: Object, incarichi: string[], role: string, city: string, group: string}>}
 */
function _collectUniquePeople() {
    const map = new Map();

    dbData.forEach((city) => {
        city.gruppi.forEach((group) => {
            group.incarichi.forEach((inc) => {
                const p = inc.persona;
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
                        persona: p,
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
 * Verifica se una persona corrisponde alla ricerca testuale corrente.
 *
 * @private
 * @param {{ persona: Object, role: string, city: string, group: string }} item
 * @returns {boolean}
 */
function _matchesPeopleSearch(item) {
    return matchesSearchObj(
        item.city || "",
        item.group || "",
        item.role || "",
        item.persona?.grado || "",
        item.persona?.nome || "",
        item.persona?.cognome || "",
    );
}

/**
 * Crea la card di una persona per la vista Persone.
 *
 * Mostra: avatar, nome completo, grado, gruppo, badge UniCo e conteggio incarichi.
 * Al click apre la modale con tutti gli incarichi aggregati.
 *
 * @private
 * @param {{ persona: Object, incarichi: string[], role: string, city: string, group: string }} item
 * @returns {HTMLElement}
 */
function _createPersonListItem(item) {
    const card = document.createElement("div");
    card.className = "person-compact-card card-enter";
    card.dataset.search = [
        item.persona.nome,
        item.persona.cognome,
        item.persona.grado,
        item.group,
        item.city,
        ...(item.incarichi || []),
    ]
        .join(" ")
        .toLowerCase();

    const persona = sanitizePersona(item.persona);
    const isUnico = persona.abilitUniCo.toLowerCase() === "si";
    const initials = getInitials(persona.nome, persona.cognome);
    const numIncarichi = item.incarichi?.length || 0;
    const incarichiLabel = numIncarichi === 1 ? "incarico" : "incarichi";

    card.innerHTML = `
        <div class="avatar-small">${initials}</div>
        <div class="person-compact-info">
            <div class="list-item-title" style="color:var(--text-main); font-size:1.1rem;">
                ${persona.nome} ${persona.cognome}
            </div>
            <div class="person-compact-role" style="font-size:0.8rem; color:var(--text-light); margin-top:2px;">
                ${persona.grado} &mdash; ${item.group || ""}
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
            persona,
            item.role || "",
            item.city || "",
            item.group || "",
            item.incarichi || [],
        );

    return card;
}
