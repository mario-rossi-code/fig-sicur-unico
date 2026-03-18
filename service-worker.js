/**
 * Service Worker per l'applicazione FIG UniCo
 * Gestisce la cache e il funzionamento offline dell'applicazione
 *
 * ⚠️  ATTENZIONE: Questo è il FILE TEMPLATE — non modificare service-worker.js direttamente.
 *     Ogni modifica va fatta qui. Il file service-worker.js viene generato
 *     automaticamente da build.js durante il deploy.
 *
 * @version 1.0.0
 */

//* ============================================================================
//* CONFIGURAZIONE
//* ============================================================================

/**
 * Versione corrente della cache.
 * Il valore viene iniettato automaticamente da build.js al momento del deploy.
 * NON modificare manualmente questo valore.
 *
 * @constant {string}
 */
const CACHE_VERSION = "__CACHE_VERSION__";

/**
 * Nome della cache per i file statici (HTML, CSS, JS, immagini, manifest)
 * @constant {string}
 */
const STATIC_CACHE = `static-data-${CACHE_VERSION}`;

/**
 * Nome della cache per i dati dinamici (db.json)
 * @constant {string}
 */
const DATA_CACHE = `dynamic-data-${CACHE_VERSION}`;

/**
 * Elenco dei file statici da mettere in cache durante l'installazione
 * Questi file saranno disponibili offline
 * @constant {string[]}
 */
const STATIC_ASSETS = [
    "/", // Root dell'applicazione
    "/index.html", // Pagina principale
    "/style.css", // Fogli di stile
    "/script.js", // Script principale
    "/manifest.json", // Manifest della PWA
    "/assets/db.json", // Database JSON (dati)
    "/assets/img/logo.png", // Logo dell'applicazione
    "/assets/icons/icon-192.png", // Icona per dispositivi (192x192)
    "/assets/icons/icon-512.png", // Icona per dispositivi (512x512)
];

//* ============================================================================
//* EVENTI DEL SERVICE WORKER
//* ============================================================================

/**
 * Evento 'install' - Si verifica quando il Service Worker viene installato
 * Mette in cache i file statici per l'uso offline
 *
 * @event install
 * @param {ExtendableEvent} event - L'evento di installazione
 */
self.addEventListener("install", (event) => {
    // NON chiamiamo self.skipWaiting() qui: vogliamo che il nuovo SW
    // resti in attesa finché l'utente non conferma l'aggiornamento
    // tramite il modale. In questo modo la pagina non si ricarica
    // in modo inaspettato mentre l'utente sta usando l'app.

    event.waitUntil(
        caches
            .open(STATIC_CACHE)
            .then((cache) => {
                console.log(
                    `[Service Worker] Installazione: caching file statici (${STATIC_CACHE})`,
                );
                return cache.addAll(STATIC_ASSETS);
            })
            .catch((error) => {
                console.error(
                    "[Service Worker] Errore durante il caching:",
                    error,
                );
            }),
    );
});

/**
 * Evento 'activate' - Si verifica quando il Service Worker viene attivato
 * Pulisce le cache obsolete e prende il controllo delle pagine aperte
 *
 * @event activate
 * @param {ExtendableEvent} event - L'evento di attivazione
 */
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            // Mantiene solo le cache con la versione corrente
                            const isObsolete =
                                !cacheName.includes(CACHE_VERSION);
                            if (isObsolete) {
                                console.log(
                                    `[Service Worker] Attivazione: rimozione cache obsoleta ${cacheName}`,
                                );
                            }
                            return isObsolete;
                        })
                        .map((obsoleteCache) => caches.delete(obsoleteCache)),
                );
            })
            .then(() => {
                console.log(
                    `[Service Worker] Attivazione completata (versione ${CACHE_VERSION})`,
                );
                // Notifica tutti i client che la nuova versione è stata attivata
                return self.clients.claim().then(() => {
                    return self.clients.matchAll().then((clients) => {
                        clients.forEach((client) => {
                            client.postMessage({
                                type: "NEW_VERSION_ACTIVATED",
                                version: CACHE_VERSION,
                            });
                        });
                    });
                });
            }),
    );
});

/**
 * Evento 'fetch' - Intercetta tutte le richieste di rete
 * Applica strategie di caching diverse in base al tipo di risorsa
 *
 * @event fetch
 * @param {FetchEvent} event - L'evento di fetch
 */
self.addEventListener("fetch", (event) => {
    const request = event.request;

    // Ignora le richieste non-GET e le richieste a estensioni Chrome
    if (request.method !== "GET" || !request.url.startsWith("http")) {
        return;
    }

    // Strategia: Network First per i dati (db.json)
    if (request.url.includes("db.json")) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Strategia: Cache First per tutti gli altri file statici
    event.respondWith(cacheFirst(request));
});

//* ============================================================================
//* STRATEGIE DI CACHING
//* ============================================================================

/**
 * Strategia Cache First: cerca prima nella cache, poi in rete
 * Ideale per file statici che cambiano raramente
 *
 * @async
 * @param {Request} request - La richiesta HTTP originale
 * @returns {Promise<Response>} La risposta dalla cache o dalla rete
 */
async function cacheFirst(request) {
    try {
        // Prova a ottenere la risposta dalla cache
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Se non è in cache, effettua la richiesta di rete
        const networkResponse = await fetch(request);

        // Verifica che la risposta sia valida prima di metterla in cache
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(STATIC_CACHE);
            // Clona la risposta perché può essere consumata solo una volta
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.error(`[Cache] ❌ Errore per ${request.url}:`, error);

        // In caso di errore, restituisce una risposta di fallback se disponibile
        if (request.url.includes(".html")) {
            return caches.match("/");
        }

        throw error;
    }
}

/**
 * Strategia Network First: prova prima la rete, poi la cache
 * Ideale per dati che cambiano frequentemente (db.json)
 *
 * @async
 * @param {Request} request - La richiesta HTTP originale
 * @returns {Promise<Response>} La risposta dalla rete o dalla cache
 */
async function networkFirst(request) {
    try {
        // Prova a ottenere una versione aggiornata dalla rete
        console.log(`[Network] ⬇️ Download dati aggiornati: ${request.url}`);
        const networkResponse = await fetch(request);

        // Se la richiesta ha successo, aggiorna la cache
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(DATA_CACHE);
            cache.put(request, networkResponse.clone());
            console.log(`[Network First] ✅ Dati aggiornati in cache`);
        }

        return networkResponse;
    } catch (error) {
        // Se la rete non è disponibile, usa i dati in cache
        console.log(
            `[Network] ⚠️ Rete non disponibile, uso cache: ${request.url}`,
        );
        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // Se non c'è nemmeno in cache, restituisce un errore
        console.error(
            `[Network] ❌ Dati non disponibili (offline): ${request.url}`,
        );
        throw error;
    }
}

//* ============================================================================
//* GESTIONE MESSAGGI
//* ============================================================================

/**
 * Evento 'message' - Gestisce i messaggi inviati al Service Worker
 *
 * @event message
 * @param {ExtendableMessageEvent} event - L'evento di messaggio
 */
self.addEventListener("message", (event) => {
    if (event.data && event.data.type === "SKIP_WAITING") {
        // Forza l'attivazione immediata del nuovo Service Worker
        self.skipWaiting();

        // Notifica tutte le pagine controllate che una nuova versione è attiva
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
                client.postMessage({
                    type: "NEW_VERSION_ACTIVATED",
                    version: CACHE_VERSION,
                });
            });
        });
    }
});

//* ============================================================================
//* GESTIONE EVENTI AGGIUNTIVI
//* ============================================================================

/**
 * Evento 'push' - Gestisce le notifiche push (da implementare)
 *
 * @event push
 * @param {PushEvent} event - L'evento di push notification
 */
self.addEventListener("push", (event) => {
    // TODO: Implementare notifiche push se necessario
    console.log("[Service Worker] Notifica Push ricevuta:", event);
});

/**
 * Evento 'sync' - Gestisce la sincronizzazione in background (da implementare)
 *
 * @event sync
 * @param {SyncEvent} event - L'evento di sincronizzazione
 */
self.addEventListener("sync", (event) => {
    // TODO: Implementare sincronizzazione in background se necessario
    console.log("[Service Worker] Sincronizzazione in background:", event);
});
