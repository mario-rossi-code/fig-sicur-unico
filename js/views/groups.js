/**
 * @file views/groups.js
 * @description Vista elenco Gruppi con card espandibili e pill di filtro per città.
 *
 *              Espone:
 *              - `renderGroupsList()` → entry point chiamato da `render()`
 */

"use strict";

// ─── Entry point ──────────────────────────────────────────────────────────────

/**
 * Renderizza la lista di tutti i gruppi, raggruppati per città e ordinati
 * alfabeticamente. Ogni gruppo è racchiuso in una card espandibile.
 *
 * Se `state.selectedCity` è impostato, mostra solo i gruppi di quella città.
 * Supporta la ricerca testuale: i gruppi con almeno un incarico corrispondente
 * vengono mostrati automaticamente espansi.
 *
 * @returns {boolean} `true` se almeno un gruppo è visibile.
 */
function renderGroupsList() {
    DOM.content.className = "view-container list-view";

    const sortedCities = [...dbData].sort((a, b) =>
        a.nome.localeCompare(b.nome),
    );

    _renderCityFilterBar(sortedCities);

    const citiesToShow = state.selectedCity
        ? [state.selectedCity]
        : sortedCities;
    const wrapper = document.createElement("div");
    let hasResults = false;

    citiesToShow.forEach((city) => {
        const sortedGroups = [...city.gruppi].sort((a, b) =>
            a.nome.localeCompare(b.nome),
        );
        const matchedGroups = [];

        sortedGroups.forEach((group) => {
            const matchedIncarichi = group.incarichi.filter((inc) =>
                matchesSearchObj(
                    group.nome,
                    inc.nome,
                    inc.persona.grado,
                    inc.persona.nome,
                    inc.persona.cognome,
                ),
            );

            if (matchedIncarichi.length > 0) {
                matchedGroups.push(
                    _createGroupExpandable(city, group, matchedIncarichi),
                );
            }
        });

        if (matchedGroups.length > 0) {
            hasResults = true;
            wrapper.appendChild(_createCityHeader(city.nome));
            matchedGroups.forEach((el) => wrapper.appendChild(el));
        }
    });

    if (hasResults) DOM.content.appendChild(wrapper);

    return hasResults;
}

// ─── Pill filtro città ────────────────────────────────────────────────────────

/**
 * Renderizza la barra di pill per filtrare per città nella vista Gruppi.
 * Il pulsante "Tutte" deseleziona il filtro; gli altri selezionano la città
 * (e la deselezionano se si clicca di nuovo sulla stessa).
 *
 * @private
 * @param {Object[]} cities - Lista di tutte le città.
 * @returns {void}
 */
function _renderCityFilterBar(cities) {
    const container = document.getElementById("cityFilterContainer");
    if (!container) return;

    container.innerHTML = "";
    container.removeAttribute("data-view-type");
    container.classList.remove("hidden");

    /** @param {string} label @param {Object|null} cityObj @param {boolean} isActive */
    const addBtn = (label, cityObj, isActive) => {
        const btn = document.createElement("button");
        btn.className = `city-nav-btn ${isActive ? "active" : ""}`;
        btn.textContent = label;
        btn.onclick = () => {
            state.selectedCity =
                state.selectedCity?.nome === label ? null : cityObj;
            render();
        };
        container.appendChild(btn);
    };

    addBtn("Tutte", null, !state.selectedCity);

    cities.forEach((city) => {
        // Se c'è una ricerca attiva, mostra solo le città con risultati
        if (state.searchText) {
            const hasMatches = city.gruppi.some((g) =>
                g.incarichi.some((inc) =>
                    matchesSearchObj(
                        g.nome,
                        inc.nome,
                        inc.persona.grado,
                        inc.persona.nome,
                        inc.persona.cognome,
                    ),
                ),
            );
            if (!hasMatches) return;
        }
        addBtn(city.nome, city, state.selectedCity?.nome === city.nome);
    });
}

// ─── Card gruppo espandibile ──────────────────────────────────────────────────

/**
 * Crea una card gruppo espandibile con animazione accordion.
 *
 * Il gruppo si apre automaticamente se è attiva una ricerca (`state.searchText`).
 * Alla chiusura/apertura, il contenuto si anima tramite `max-height` e lo
 * scroll porta il gruppo in cima alla viewport (sotto l'eventuale header di città).
 *
 * @private
 * @param {Object}   city             - Città a cui appartiene il gruppo.
 * @param {Object}   group            - Gruppo da renderizzare.
 * @param {Object[]} matchedIncarichi - Incarichi che superano la ricerca attiva.
 * @returns {HTMLElement} Elemento pronto per il DOM.
 */
function _createGroupExpandable(city, group, matchedIncarichi) {
    const shouldExpand = state.searchText !== "";

    const validPersonsCount = group.incarichi.filter((inc) =>
        hasValidPersonData(inc.persona),
    ).length;
    const pendingCount = group.incarichi.length - validPersonsCount;

    const div = document.createElement("div");
    div.className = `group-expandable ${shouldExpand ? "expanded" : ""}`;

    div.innerHTML = `
        <div class="group-header">
            <div class="group-text">
                <div class="group-title">${group.nome}</div>
                <div class="group-subtitle">
                    ${!state.selectedCity ? `(${city.nome})` : ""}
                    ${pendingCount > 0 ? `<span class="pending-badge">${pendingCount} in attesa</span>` : ""}
                </div>
            </div>
            <i class="fa-solid fa-chevron-down group-chevron" aria-hidden="true"></i>
        </div>
        <div class="group-content">
            <div class="group-content-inner"></div>
        </div>
    `;

    const header = div.querySelector(".group-header");
    const contentDiv = div.querySelector(".group-content");
    const innerDiv = div.querySelector(".group-content-inner");
    const chevron = div.querySelector(".group-chevron");

    // Inserisce le card persona nel corpo espandibile
    // CreatePersonCard ritorna la card, aggiungiamo data-search prima di inserirla
    matchedIncarichi.forEach((inc) => {
        const card = createPersonCard(inc, city.nome, group.nome);
        card.dataset.search = [
            inc.nome,
            inc.persona?.nome || "",
            inc.persona?.cognome || "",
            inc.persona?.grado || "",
            group.nome,
            city.nome,
        ]
            .join(" ")
            .toLowerCase();
        innerDiv.appendChild(card);
    });

    _attachAccordionBehavior(
        div,
        header,
        contentDiv,
        innerDiv,
        chevron,
        shouldExpand,
    );

    return div;
}

/**
 * Aggiunge il comportamento accordion alla card gruppo.
 * Un solo gruppo può essere aperto alla volta: aprirne uno chiude il precedente.
 *
 * @private
 * @param {HTMLElement} div         - Card gruppo radice.
 * @param {HTMLElement} header      - Intestazione cliccabile.
 * @param {HTMLElement} contentDiv  - Contenitore animato.
 * @param {HTMLElement} innerDiv    - Contenuto reale (misurato).
 * @param {HTMLElement} chevron     - Icona freccia.
 * @param {boolean}     startOpen   - Se `true`, la card parte aperta.
 * @returns {void}
 */
function _attachAccordionBehavior(
    div,
    header,
    contentDiv,
    innerDiv,
    chevron,
    startOpen,
) {
    let isAnimating = false;
    let _openGroup = null;

    // Oggetto che rappresenta questo gruppo, usato da _openGroup
    const self = { div, contentDiv, innerDiv, chevron };

    // Funzione che chiude questo gruppo
    const close = () => {
        chevron.style.transform = "rotate(0deg)";
        contentDiv.style.maxHeight = "0";
        setTimeout(() => div.classList.remove("expanded"), 400);
    };

    // Funzione che apre questo gruppo
    const open = () => {
        div.classList.add("expanded");
        chevron.style.transform = "rotate(180deg)";
        setTimeout(() => {
            contentDiv.style.maxHeight = `${innerDiv.offsetHeight}px`;
            setTimeout(() => _scrollGroupToTop(div), 50);
        }, 10);
    };

    // Stato iniziale
    if (startOpen) {
        _openGroup = self;
        chevron.style.transform = "rotate(180deg)";
        setTimeout(() => {
            contentDiv.style.maxHeight = `${innerDiv.offsetHeight}px`;
            setTimeout(() => _scrollGroupToTop(div), 100);
        }, 50);
    } else {
        chevron.style.transform = "rotate(0deg)";
    }

    header.onclick = () => {
        if (isAnimating) return;
        isAnimating = true;
        setTimeout(() => {
            isAnimating = false;
        }, 400);

        const isExpanding = !div.classList.contains("expanded");

        if (isExpanding) {
            // Chiude il gruppo attualmente aperto (se diverso da questo)
            if (_openGroup && _openGroup.div !== div) {
                _openGroup.chevron.style.transform = "rotate(0deg)";
                _openGroup.contentDiv.style.maxHeight = "0";
                setTimeout(
                    () => _openGroup.div.classList.remove("expanded"),
                    400,
                );
            }
            _openGroup = self;
            open();
        } else {
            _openGroup = null;
            close();
        }
    };

    // Mantiene l'altezza aggiornata al resize
    const observer = new ResizeObserver(() => {
        if (div.classList.contains("expanded")) {
            contentDiv.style.maxHeight = `${innerDiv.offsetHeight}px`;
        }
    });
    observer.observe(innerDiv);
}

/**
 * Scrolla il contenitore principale per portare la card gruppo in cima,
 * posizionandola 0.5rem sotto l'eventuale intestazione di città sticky.
 *
 * @private
 * @param {HTMLElement} groupDiv - Card gruppo da portare in vista.
 * @returns {void}
 */
function _scrollGroupToTop(groupDiv) {
    const container = DOM.content;
    const groupRect = groupDiv.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const halfRem = rem * 0.5;

    // Cerca l'ultimo letter-header sopra il gruppo
    const letterHeaders = container.querySelectorAll(".letter-header");
    let lastHeaderBottom = 0;

    for (const h of letterHeaders) {
        const hRect = h.getBoundingClientRect();
        if (hRect.top < groupRect.top) {
            lastHeaderBottom = hRect.bottom;
        } else {
            break;
        }
    }

    const offset = lastHeaderBottom
        ? groupRect.top - (lastHeaderBottom + halfRem)
        : groupRect.top - containerRect.top - halfRem;

    container.scrollBy({ top: offset, behavior: "smooth" });
}

/**
 * Crea l'intestazione sticky di una città usata come separatore
 * nella lista dei gruppi.
 *
 * @private
 * @param {string} cityName - Nome della città.
 * @returns {HTMLElement}
 */
function _createCityHeader(cityName) {
    const header = document.createElement("div");
    header.className = "letter-header";
    header.id = `city-${cityName.replace(/\s+/g, "-")}`;
    header.textContent = cityName;
    return header;
}
