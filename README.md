# NeuroPulse

**NeuroPulse** est un jeu RPG cyberpunk 2D jouable dans le navigateur. Le joueur incarne un hacker qui cherche à percer les secrets d'une mégacorporation.

Développé avec **Phaser.js** (frontend) et **Node.js / Express** (backend), avec une base de données **PostgreSQL**.

---

## Prérequis

Avant de commencer, assurez-vous d'avoir installé :

| Outil | Version minimale | Lien |
|---|---|---|
| Node.js | ≥ 18 | https://nodejs.org |
| PostgreSQL | ≥ 14 | https://www.postgresql.org/download |
| Git | — | https://git-scm.com |
| Extension Live Server | VS Code | Marketplace VS Code |

---

## Installation

### 1. Cloner le dépôt

```bash
git clone https://codeberg.org/NEUROPULSE/Neuropulse.git
cd Neuropulse
```

---

### 2. Configurer PostgreSQL

Ouvrez un terminal `psql` en tant que superutilisateur (ex: `postgres`) et exécutez :

```sql
-- Créer l'utilisateur
CREATE USER neuropulse_user WITH PASSWORD 'neuropulse_password';

-- Créer la base de données
CREATE DATABASE neuropulse OWNER neuropulse_user;

-- Donner les droits
GRANT ALL PRIVILEGES ON DATABASE neuropulse TO neuropulse_user;
```

Ensuite, connectez-vous à la base et créez les tables à partir du schéma fourni :

```bash
psql -U neuropulse_user -d neuropulse -f database/shema.sql
```

---

### 3. Configurer le backend

Allez dans le dossier `backend` :

```bash
cd backend
```

Installez les dépendances :

```bash
npm install
```

Créez le fichier `.env` à la racine du dossier `backend` :

```
PGHOST=localhost
PGPORT=5432
PGDATABASE=neuropulse
PGUSER=neuropulse_user
PGPASSWORD=neuropulse_password
JWT_SECRET=neuropulse_secret_key_2026!
```

> Modifiez `JWT_SECRET` par une valeur aléatoire et secrète si vous déployez en production.

---

### 4. Lancer le backend

Depuis le dossier `backend` :

```bash
# Mode développement (rechargement automatique)
npm run dev

# Mode production
npm start
```

Le serveur démarre sur **http://localhost:3000**.

Pour vérifier que la connexion à la base fonctionne : http://localhost:3000/db-test

---

### 5. Lancer le frontend

Le frontend est du HTML/CSS/JS statique — il doit être servi via un serveur local (pas ouvert directement en `file://` à cause des requêtes fetch).

**Option A — Live Server (VS Code)**
1. Ouvrez le dossier `Neuropulse` dans VS Code
2. Faites un clic droit sur `frontend/webpages/index.html`
3. Sélectionnez **"Open with Live Server"**

**Option B — http-server (npm)**
```bash
npx http-server frontend/webpages -p 5500
```
Puis ouvrez http://localhost:5500 dans votre navigateur.

---

## Lancement rapide (récapitulatif)

```
Terminal 1 — Backend
  cd backend
  npm run dev

Terminal 2 — Frontend
  Ouvrir frontend/webpages/index.html avec Live Server
```

---

## Technologies

| Couche | Technologies |
|---|---|
| Moteur de jeu | Phaser.js 3 |
| Frontend | HTML5, CSS3, JavaScript ES6+ |
| Backend | Node.js, Express 5 |
| Base de données | PostgreSQL 14+, pg (node-postgres) |
| Auth | JWT (jsonwebtoken), bcrypt |