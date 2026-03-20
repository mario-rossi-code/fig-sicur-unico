# 🚀 FIG SICUR UNICO

## Web App Statica – Guida Completa

## 📑 Indice

- [📌 Introduzione](#-introduzione)
- [🧰 Preparazione Ambiente](#-preparazione-ambiente)
- [⚙️ Configurazione Ambiente](#⚙️-configurazione-ambiente)
- [📁 Creazione del Progetto](#📁-creazione-del-progetto-fi-ur-unico)
- [🌿 Inizializzare Git](#🌿-inizializzare-git)
- [☁️ Creare Repository su GitHub](#☁️-creare-repository-su-github)
- [🔗 Collegare il Progetto a GitHub](#🔗-collegare-il-progetto-a-github)
- [🌍 Pubblicare la Web App su Render](#🌍-pubblicare-la-web-app-su-render)
- [🔄 Aggiornamenti](#🔄-aggiornare-la-web-app)
- [🛠️ Risoluzione Problemi](#🛠️-risoluzione-problemi)
- [📈 Prossimi Passi](#📈-prossimi-passi)
- [🎉 Conclusione](#🎉-conclusione)
- [⭐ Extra (consigliato)](#⭐-extra-consigliato)

---

## 📌 Introduzione

Guesta step by step per la creazione e pubblicazione della web app **FIG SICUR UNICO**.

### 🎯 Obiettivi

- Preparare l'ambiente di sviluppo
- Utilizzare Git e GitHub
- Creare e gestire un progetto web
- Pubblicare una web app statica online

---

## 🧰 Preparazione Ambiente

### 1. Git

Scarica: https://git-scm.com  
Installa con impostazioni predefinite

---

### 2. Visual Studio Code

Scarica: https://code.visualstudio.com  
Installa con impostazioni predefinite

---

### 3. Account GitHub

Vai su: https://github.com  
Registrati (**Sign up**)

---

### 4. Account Render

Vai su: https://render.com  
Registrati con GitHub

---

## ⚙️ Configurazione Ambiente

### Estensioni VSCode

Installa:

- Auto Rename Tag: https://marketplace.visualstudio.com/items?itemName=formulahendry.auto-rename-tag
- Better Comments: https://marketplace.visualstudio.com/items?itemName=aaron-bond.better-comments
- Color Highlight: https://marketplace.visualstudio.com/items?itemName=naumovs.color-highlight
- Git Graph: https://marketplace.visualstudio.com/items?itemName=mhutchie.git-graph
- Git Lens: https://marketplace.visualstudio.com/items?itemName=ecmel.vscode-html-css
- HTML CSS Support: https://marketplace.visualstudio.com/items?itemName=kisstkondoros.vscode-gutter-preview
- Image preview: https://marketplace.visualstudio.com/items?itemName=kisstkondoros.vscode-gutter-preview
- indent-rainbow: https://marketplace.visualstudio.com/items?itemName=oderwat.indent-rainbow
- Live Server: https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer
- Prettier:https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode

### Login GitHub

- Accounts → **Sign in with GitHub**
- Autorizza

---

## 📁 Importazione del Progetto FI UR Unico

### Struttura

fig-sicur-unico/
│
├── index.html ← Pagina principale
├── style.css ← Stili
├── manifest.json ← PWA manifest
├── build.sh ← Script build SW
├── service-worker.template.js ← Template SW
├── service-worker.js ← Generato da build.sh
│
├── assets/
│ ├── db.json ← Database personale
│ ├── img/
│ │ └── logo.png
│ ├── icons/
│ │ ├── icon-96.png
│ │ ├── icon-192.png
│ │ └── icon-512.png
│ └── screenshots/ ← Screenshot per il manifest
│ ├── home-screen.png
│ ├── groups-view.png
│ ├── roles-view.png
│ └── people-view.png
│
├── css/
│ ├── variables.css → :root, [data-theme="dark"]
│ ├── base.css → \*, body, .container, utility (.hidden, .no-results)
│ ├── layout.css → header, main, .view-container, .main-content
│ ├── components/
│ │ ├── cards.css → .list-item-card, .person-compact-card, .group-expandable
│ │ ├── modal.css → .modal-overlay, .modal-content, modale militare
│ │ ├── navbar.css → .bottom-nav, .nav-item
│ │ ├── search.css → .search-wrapper, .search-box, .city-filter, filtri
│ │ ├── breadcrumb.css → .breadcrumb-container
│ │ ├── banner.css → .offline-banner, .update-notification
│ │ └── avatar.css → .avatar-small, .modal-avatar
│ ├── views/
│ │ ├── cities.css → .cities-grid
│ │ └── groups.css → .group-expandable (parti specifiche)
│ ├── animations.css → @keyframes, .card-enter
│ └── responsive.css → @media queries
│
└── js/
├── config.js ← Costanti e configurazione globale
├── state.js ← Stato app + saveState/loadState
├── utils.js ← Funzioni pure (sanitize, search, layout)
├── theme.js ← Tema chiaro/scuro + meta theme-color
├── filters.js ← Logica filtri + render barra filtri
├── search.js ← Listener barra di ricerca
├── modal.js ← Modale dettaglio militare
├── render.js ← Orchestratore render + builder condivisi
├── navigation.js ← Bottom nav + deep link
├── connectivity.js ← Banner online/offline
├── service-worker-manager.js ← Registrazione SW + modale aggiornamento
├── app.js ← Bootstrap e initApp()
│
└── views/
├── cities.js ← Vista Città
├── groups.js ← Vista Gruppi espandibili
├── roles.js ← Vista Incarichi
└── people.js ← Vista Militari

---

## 🌿 Inizializzare Git

----bash
git init
git add .
git commit -m "Init progetto FI UR Unico"
----end

---

## ☁️ Creare Repository su GitHub

Vai su: https://github.com/new

### Impostazioni:

- Nome: fig-sicur-unico
- Visibilità: Pirvate
- Aggiungere README

---

## 🌍 Pubblicare la Web App su Render

### Creazione

- Dashboard → New +
- Static Site

### Collegamento

- Seleziona repository
- Connect

### Configurazione

- Name: fig-sicur-unico
- Branch: main (non modificare)
- Build Command: sh build.sh
- Publish Directory: ./

### Deploy

Dopo pochi minuti la wep app sarà raggiungibile al link:
https://fig-sicur-unico.onrender.com

---

## 🎉 Conclusione

Hai pubblicato la tua web app:  
🚀 FIG SICUR Unico è online!

---

## ⭐ Extra (consigliato)

Puoi migliorare questo README aggiungendo:

- Screenshot del progetto
- Badge (build, versioni, ecc.)
- Demo live
