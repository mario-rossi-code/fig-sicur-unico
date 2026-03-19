# 🚀 FI UR Unico

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
