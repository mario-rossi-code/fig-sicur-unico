/**
 * @file bounce.js
 * @description Implementa un effetto "rimbalzo" (rubber band) per lo scroll su mobile
 *              quando le liste non superano l'altezza dello schermo, migliorando l'UX.
 */

"use strict";

function initBounceEffect() {
    const content = document.getElementById("content");
    if (!content) return;

    let startY = 0;
    let currentY = 0;
    let isBouncing = false;
    let isPullingDown = false;
    let isPullingUp = false;

    // Aggiunge la transizione solo quando rilasciamo il tocco
    const resetBounce = () => {
        if (isBouncing) {
            content.style.transition = "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)";
            content.style.transform = "translateY(0px)";
            
            setTimeout(() => {
                content.style.transition = "";
                content.style.transform = "";
                isBouncing = false;
                isPullingDown = false;
                isPullingUp = false;
            }, 300);
        }
    };

    content.addEventListener("touchstart", (e) => {
        if (e.touches.length !== 1) return;
        
        // Se c'è un'animazione in corso, la interrompiamo (opzionale)
        content.style.transition = "";
        
        startY = e.touches[0].clientY;
        currentY = startY;
        isBouncing = false;
        isPullingDown = false;
        isPullingUp = false;
    }, { passive: true });

    content.addEventListener("touchmove", (e) => {
        if (e.touches.length !== 1) return;
        
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;
        
        const scrollTop = content.scrollTop;
        const scrollHeight = content.scrollHeight;
        const clientHeight = content.clientHeight;

        // Determina se siamo all'inizio o alla fine dello scroll
        const atTop = scrollTop <= 0;
        const atBottom = scrollTop + clientHeight >= scrollHeight - 1; // -1 per tolleranza approssimazione
        const fitsOnScreen = scrollHeight <= clientHeight;

        // Applichiamo il rimbalzo custom SOLO se la lista non supera l'altezza dello schermo.
        // Se supera, lasciamo il comportamento nativo (bounce su iOS, glow su Android).
        if (!fitsOnScreen) return;

        // Se siamo in cima e stiamo tirando verso il basso
        if (atTop && deltaY > 0) {
            isPullingDown = true;
        } else if (isPullingDown && deltaY <= 0) {
            isPullingDown = false;
        }

        // Se siamo in fondo e stiamo tirando verso l'alto
        if (atBottom && deltaY < 0) {
            isPullingUp = true;
        } else if (isPullingUp && deltaY >= 0) {
            isPullingUp = false;
        }

        // Se stiamo effettuando l'overscroll
        if (isPullingDown || isPullingUp) {
            isBouncing = true;
            // Calcola la resistenza (più tiri, più oppone resistenza)
            const dampening = 0.3;
            // Se isPullingUp deltaY è negativo, se isPullingDown deltaY è positivo.
            // Calcoliamo la distanza effettiva per evitare salti se l'utente inverte la direzione.
            const moveY = deltaY * dampening;
            
            content.style.transform = `translateY(${moveY}px)`;
            
            // Su alcuni browser potrebbe servire preventDefault per evitare il ricaricamento pagina nativo
            if (e.cancelable) {
                e.preventDefault();
            }
        }
    }, { passive: false });

    content.addEventListener("touchend", () => {
        resetBounce();
    });

    content.addEventListener("touchcancel", () => {
        resetBounce();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    // Inizializza l'effetto con un piccolo ritardo per assicurarsi che il DOM sia pronto
    setTimeout(initBounceEffect, 100);
});
