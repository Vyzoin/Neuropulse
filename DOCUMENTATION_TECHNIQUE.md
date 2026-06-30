# Documentation Technique — Neuropulse

> Auteurs : N. SILLAIRE, A. VIVIEN, O. LAADRAOUI

---

## Table des matières

1. [Présentation du projet](#1-présentation-du-projet)
2. [Architecture générale](#2-architecture-générale)
3. [Modélisation Merise](#3-modélisation-merise)
   - 3.1 [MCD — Modèle Conceptuel de Données](#31-mcd--modèle-conceptuel-de-données)
   - 3.2 [MLD — Modèle Logique de Données](#32-mld--modèle-logique-de-données)
   - 3.3 [MPD — Modèle Physique de Données](#33-mpd--modèle-physique-de-données)
4. [Schéma d'architecture technique](#4-schéma-darchitecture-technique)
5. [Documentation API REST](#5-documentation-api-rest)
   - 5.1 [Authentification](#51-authentification)
   - 5.2 [Personnages (Player)](#52-personnages-player)
6. [Sécurité et authentification JWT](#6-sécurité-et-authentification-jwt)
7. [Structure des fichiers](#7-structure-des-fichiers)
8. [Technologies utilisées](#8-technologies-utilisées)

---

## 1. Présentation du projet

**Neuropulse** est un jeu d'aventure cyberpunk en 2D jouable directement dans le navigateur. Le joueur incarne un hacker cherchant à percer les secrets d'une mégacorporation.

| Caractéristique | Détail |
|---|---|
| Genre | RPG / Aventure 2D top-down |
| Technologie moteur | Phaser.js 3 |
| Mode réseau | Single-player avec compte en ligne |
| Carte | Grille 3×3 de zones (2400×1800 px totaux) |
| Sauvegarde | Côté serveur (PostgreSQL) |

---

## 2. Architecture générale

Le projet suit une architecture **3-tiers** classique :

```
┌───────────────────────────────────────────────────────────┐
│                        NAVIGATEUR                         │
│                                                           │
│  HTML / CSS / JS natif        Phaser.js (moteur de jeu)  │
│  ┌──────────────────┐         ┌──────────────────────┐   │
│  │ Pages web        │         │ Scène de jeu         │   │
│  │ - index.html     │         │ - Carte 3×3          │   │
│  │ - login.html     │         │ - Sprites personnage │   │
│  │ - register.html  │         │ - Collisions         │   │
│  │ - character_save │         │ - Menu pause (ESC)   │   │
│  │ - create_char    │         │ - Chargement/sauveg. │   │
│  │ - edit_char      │         └──────────────────────┘   │
│  │ - settings.html  │                                     │
│  │ - guide.html     │         Scripts partagés :          │
│  └──────────────────┘         session.js, auth.js,        │
│                               traduction.js, settings.js  │
└──────────────────────┬────────────────────────────────────┘
                       │  HTTP/REST (JSON) via fetch()
                       │  Authorization: Bearer <JWT>
                       │
┌──────────────────────▼────────────────────────────────────┐
│                   BACKEND — Node.js / Express             │
│                        Port 3000                          │
│                                                           │
│  server.js                                                │
│  ├── /api/auth  → routes/auth.js                         │
│  └── /api/player → routes/player.js                      │
│                   (protégé par middleware/auth.js)         │
│                                                           │
│  Middleware JWT : vérifie le token à chaque requête       │
│  protégée et injecte req.user                             │
└──────────────────────┬────────────────────────────────────┘
                       │  TCP (node-postgres / pg)
                       │
┌──────────────────────▼────────────────────────────────────┐
│               BASE DE DONNÉES — PostgreSQL                │
│                                                           │
│  users · player · player_state · inventory · slot        │
│  item · weapon · consumable · advancement                 │
│  enemy · backup · shop                                    │
└───────────────────────────────────────────────────────────┘
```

---

## 3. Modélisation Merise

### 3.1 MCD — Modèle Conceptuel de Données

Le MCD identifie les entités métier et leurs associations indépendamment de toute technologie.

```
┌──────────────┐        ┌──────────────────┐        ┌──────────────┐
│  UTILISATEUR │        │    PERSONNAGE    │        │   AVANCEMENT │
│──────────────│        │──────────────────│        │──────────────│
│ id           │        │ id               │        │ id           │
│ email        │1     n │ nom              │1     n │ pourcentage  │
│ pseudo       ├────────┤ prénom           ├────────┤ chapitre     │
│ mot_de_passe │possède │ sexe             │progresse              │
│ date_création│        │ slot (1 à 3)     │        └──────────────┘
└──────────────┘        └────────┬─────────┘
                                 │
               ┌─────────────────┼──────────────────┐
               │                 │                  │
           1   │ 1           1   │ n            1   │ n
    ┌──────────▼───┐    ┌────────▼──────┐   ┌──────▼──────┐
    │  INVENTAIRE  │    │  ETAT_PARTIE  │   │ SAUVEGARDE  │
    │──────────────│    │───────────────│   │─────────────│
    │ id           │    │ pos_x         │   │ id          │
    │              │    │ pos_y         │   │ horodatage  │
    └──────┬───────┘    │ zone_x        │   │ état (JSON) │
           │            │ zone_y        │   └─────────────┘
           │ contient   │ hp            │
           │ (0,n)      │ mana          │
    ┌──────▼───────┐    │ dernière_màj  │
    │     SLOT     │    └───────────────┘
    │──────────────│
    │ id           │
    └──────┬───────┘
           │ référence (0,1)
    ┌──────▼───────┐
    │    OBJET     │
    │──────────────│
    │ id           │
    │ nom          │   Spécialisations :
    │ prix         │   ┌─────────┐   ┌─────────────┐
    │ type         │──►│  ARME   │   │ CONSOMMABLE │
    │ en_vente     │   │ dégâts  │   │ points_soin │
    └──────────────┘   └─────────┘   └─────────────┘


┌──────────┐
│  ENNEMI  │
│──────────│   (entité indépendante, non encore liée en jeu)
│ id       │
│ nom      │
│ pv       │
└──────────┘

┌──────────┐
│ BOUTIQUE │
│──────────│   (entité réservée aux évolutions futures)
│ id       │
└──────────┘
```

**Cardinalités clés :**

| Association | Cardinalité |
|---|---|
| UTILISATEUR — possède — PERSONNAGE | 1,N (jusqu'à 3 slots) |
| PERSONNAGE — a — INVENTAIRE | 1,1 (créé automatiquement) |
| INVENTAIRE — contient (via SLOT) — OBJET | 0,N |
| PERSONNAGE — progresse — AVANCEMENT | 0,N |
| PERSONNAGE — sauvegarde — SAUVEGARDE | 0,N |
| PERSONNAGE — a — ETAT_PARTIE | 0,1 (upsert) |
| ARME / CONSOMMABLE spécialisent OBJET | IS-A (héritage) |

---

### 3.2 MLD — Modèle Logique de Données

Le MLD traduit le MCD en tables relationnelles. Les clés étrangères sont notées `#`.

```
USERS          (id, email_adress, username, password, created_at)
PLAYER         (id, #user_id, name, firstname, sexe, slot)
                   UNIQUE (user_id, slot)
PLAYER_STATE   (id, #player_id, pos_x, pos_y, zone_x, zone_y, hp, mana, updated_at)
INVENTORY      (id, #player_id)
                   UNIQUE (player_id)
SLOT           (id, #inventory_id, #item_id)
ITEM           (id, name, price, type, is_for_sale)
WEAPON         (id → #ITEM.id, damage)
CONSUMABLE     (id → #ITEM.id, care_point)
ADVANCEMENT    (id, #player_id, percentage, chapter)
ENEMY          (id, name, pv)
BACKUP         (id, #player_id, timestamp, state)
SHOP           (id)
```

---

### 3.3 MPD — Modèle Physique de Données

Script SQL de création (PostgreSQL) :

```sql
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email_adress  VARCHAR(255) UNIQUE NOT NULL,
  username      VARCHAR(100) UNIQUE NOT NULL,
  password      VARCHAR(255) NOT NULL,        -- hash bcrypt
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE player (
  id        SERIAL PRIMARY KEY,
  user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name      VARCHAR(100) NOT NULL,
  firstname VARCHAR(100) NOT NULL,
  sexe      VARCHAR(10)  NOT NULL,
  slot      INTEGER DEFAULT 1,
  CONSTRAINT unique_user_slot UNIQUE (user_id, slot)
);

CREATE TABLE player_state (
  id          SERIAL PRIMARY KEY,
  player_id   INTEGER UNIQUE REFERENCES player(id) ON DELETE CASCADE,
  pos_x       NUMERIC,
  pos_y       NUMERIC,
  zone_x      INTEGER,
  zone_y      INTEGER,
  hp          INTEGER DEFAULT 100,
  mana        INTEGER DEFAULT 50,
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE inventory (
  id        SERIAL PRIMARY KEY,
  player_id INTEGER UNIQUE REFERENCES player(id) ON DELETE CASCADE
);

CREATE TABLE item (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  price       NUMERIC(10,2),
  type        VARCHAR(50),
  is_for_sale BOOLEAN DEFAULT FALSE
);

CREATE TABLE slot (
  id           SERIAL PRIMARY KEY,
  inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
  item_id      INTEGER REFERENCES item(id) ON DELETE SET NULL
);

CREATE TABLE weapon (
  id     INTEGER PRIMARY KEY REFERENCES item(id) ON DELETE CASCADE,
  damage INTEGER
);

CREATE TABLE consumable (
  id          INTEGER PRIMARY KEY REFERENCES item(id) ON DELETE CASCADE,
  care_point  INTEGER
);

CREATE TABLE advancement (
  id         SERIAL PRIMARY KEY,
  player_id  INTEGER REFERENCES player(id) ON DELETE CASCADE,
  percentage NUMERIC(5,2),
  chapter    VARCHAR(100)
);

CREATE TABLE enemy (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  pv   INTEGER
);

CREATE TABLE backup (
  id        SERIAL PRIMARY KEY,
  player_id INTEGER REFERENCES player(id) ON DELETE CASCADE,
  timestamp TIMESTAMP DEFAULT NOW(),
  state     TEXT
);

CREATE TABLE shop (
  id SERIAL PRIMARY KEY
);
```

---

## 4. Schéma d'architecture technique

### Flux d'une session de jeu complète

```
Utilisateur
    │
    │  1. Ouvre index.html
    ▼
[Navigateur]─── GET index.html ─────────────────────────► [Fichiers statiques]
    │
    │  2. Clique "Connexion"
    ▼
[login.html] ─── POST /api/auth/login ──────────────────► [Express /api/auth]
                    { email, password }                         │
                                                         bcrypt.compare()
                                                                │
                ◄─── { success:true, token } ─────────────────┘
    │
    │  3. Token stocké dans localStorage
    │     Redirection vers character_save.html
    ▼
[character_save] ── GET /api/player/me ─────────────────► [Express /api/player]
                    Authorization: Bearer <JWT>                 │
                                                        jwt.verify()
                                                                │
                                                        SELECT * FROM player
                                                        WHERE user_id = ?
                                                                │
                ◄─── { players: [...] } ─────────────────────┘
    │
    │  4. Sélectionne un slot → activePlayer dans localStorage
    │     Charge index.html (moteur Phaser)
    ▼
[Phaser.create()] ── GET /api/player/:id/state ─────────► [Express /api/player]
                    Authorization: Bearer <JWT>                 │
                                                        SELECT * FROM player_state
                                                        WHERE player_id = ?
                                                                │
                ◄─── { state: { pos_x, pos_y, ... } } ────────┘
    │
    │  5. Jeu en cours (déplacements locaux)
    │
    │  6a. Touche ESC → menu pause (Phaser UI)
    │      "Menu Principal" → savePlayerState() → redirection
    │
    │  6b. beforeunload → savePlayerState()
    ▼
[Phaser] ────────── PUT /api/player/:id/state ──────────► [Express /api/player]
                    { pos_x, pos_y, zone_x, zone_y,              │
                      hp, mana }                          UPSERT player_state
                                                                │
                ◄─── { success: true } ──────────────────────┘
```

### Carte du monde (grille de zones)

```
          zone_x=0      zone_x=1      zone_x=2
         ┌─────────┬─────────┬─────────┐
zone_y=0 │  [0,0]  │  [1,0]  │  [2,0]  │
         │         │         │         │
         ├─────────┼─────────┼─────────┤
zone_y=1 │  [0,1]  │  [1,1]  │  [2,1]  │
         │         │         │         │
         ├─────────┼─────────┼─────────┤
zone_y=2 │  [0,2]  │  [1,2]  │  [2,2]  │
         │         │         │         │
         └─────────┴─────────┴─────────┘
   Chaque zone = 800×600 px   │  Carte totale = 2400×1800 px
```

---

## 5. Documentation API REST

**URL de base :** `http://localhost:3000`

**Format :** JSON

**Authentification :** Header `Authorization: Bearer <token>` (requis sur les routes `/api/player`)

---

### 5.1 Authentification

#### POST `/api/auth/register`

Crée un nouveau compte utilisateur.

**Corps de la requête :**
```json
{
  "email": "user@example.com",
  "username": "MonPseudo",
  "password": "motdepasse123"
}
```

**Réponse 201 — Succès :**
```json
{
  "success": true,
  "token": "<JWT valable 24h>"
}
```

**Réponses d'erreur :**

| Code | Message | Cause |
|---|---|---|
| 400 | `Champs manquants` | email, username ou password absent |
| 400 | `Email ou pseudo déjà utilisé` | Contrainte UNIQUE violée (code PG 23505) |
| 500 | `Erreur serveur` | Erreur interne PostgreSQL |

---

#### POST `/api/auth/login`

Authentifie un utilisateur existant.

**Corps de la requête :**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Réponse 200 — Succès :**
```json
{
  "success": true,
  "token": "<JWT valable 24h>"
}
```

**Réponses d'erreur :**

| Code | Message | Cause |
|---|---|---|
| 400 | `Champs manquants` | email ou password absent |
| 401 | `Email introuvable` | Aucun utilisateur avec cet email |
| 401 | `Mot de passe incorrect` | Hash bcrypt non correspondant |
| 500 | `Erreur serveur` | Erreur interne PostgreSQL |

---

#### POST `/api/auth/logout`

Déconnexion symbolique (le token JWT doit être supprimé côté client).

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Déconnecté"
}
```

> Note : le backend étant stateless (JWT), c'est le frontend qui invalide la session en supprimant le token du `localStorage`.

---

#### GET `/api/auth/me`

Vérifie si le token courant est valide et retourne l'identité de l'utilisateur.

**Header requis :** `Authorization: Bearer <token>`

**Réponse 200 — Connecté :**
```json
{
  "loggedIn": true,
  "userId": 42,
  "username": "MonPseudo"
}
```

**Réponse 200 — Non connecté / token invalide :**
```json
{
  "loggedIn": false
}
```

---

### 5.2 Personnages (Player)

> Toutes les routes suivantes requièrent le header `Authorization: Bearer <token>`.
> Le middleware JWT injecte `req.user = { userId, username }`.

---

#### POST `/api/player`

Crée un nouveau personnage dans le slot indiqué. Crée automatiquement son inventaire.

**Corps de la requête :**
```json
{
  "name": "Anderson",
  "firstname": "Neo",
  "sexe": "Masculin",
  "slot": 1
}
```

**Réponse 201 — Succès :**
```json
{
  "success": true,
  "player": {
    "id": 7,
    "user_id": 42,
    "name": "Anderson",
    "firstname": "Neo",
    "sexe": "Masculin",
    "slot": 1
  }
}
```

**Réponses d'erreur :**

| Code | Message | Cause |
|---|---|---|
| 400 | `Champs manquants` | name, firstname ou sexe absent |
| 400 | `Ce slot est déjà occupé` | Contrainte UNIQUE (user_id, slot) |
| 401 | — | Token absent |
| 403 | — | Token invalide ou expiré |
| 500 | `Erreur serveur` | Erreur interne |

---

#### GET `/api/player/me`

Retourne tous les personnages de l'utilisateur connecté, triés par slot.

**Réponse 200 :**
```json
{
  "success": true,
  "players": [
    {
      "id": 7,
      "user_id": 42,
      "name": "Anderson",
      "firstname": "Neo",
      "sexe": "Masculin",
      "slot": 1
    },
    {
      "id": 12,
      "user_id": 42,
      "name": "Smith",
      "firstname": "Trinity",
      "sexe": "Féminin",
      "slot": 2
    }
  ]
}
```

---

#### GET `/api/player/:id`

Retourne un personnage précis. Vérifie que le personnage appartient à l'utilisateur connecté.

**Paramètre URL :** `id` — identifiant du personnage

**Réponse 200 :**
```json
{
  "success": true,
  "player": {
    "id": 7,
    "user_id": 42,
    "name": "Anderson",
    "firstname": "Neo",
    "sexe": "Masculin",
    "slot": 1
  }
}
```

**Réponses d'erreur :**

| Code | Message | Cause |
|---|---|---|
| 404 | `Personnage introuvable` | id inexistant ou n'appartient pas à l'utilisateur |
| 500 | `Erreur serveur` | Erreur interne |

---

#### PUT `/api/player/:id`

Modifie les informations cosmétiques d'un personnage (nom, prénom, sexe).

**Paramètre URL :** `id` — identifiant du personnage

**Corps de la requête :**
```json
{
  "name": "Anderson",
  "firstname": "Thomas",
  "sexe": "Masculin"
}
```

**Réponse 200 :**
```json
{
  "success": true,
  "player": {
    "id": 7,
    "user_id": 42,
    "name": "Anderson",
    "firstname": "Thomas",
    "sexe": "Masculin",
    "slot": 1
  }
}
```

**Réponses d'erreur :**

| Code | Message | Cause |
|---|---|---|
| 400 | `Champs manquants` | name, firstname ou sexe absent |
| 403 | `Non autorisé` | Le personnage n'appartient pas à l'utilisateur |
| 500 | `Erreur serveur` | Erreur interne |

---

#### DELETE `/api/player/:id`

Supprime un personnage et son inventaire associé.

**Paramètre URL :** `id` — identifiant du personnage

**Réponse 200 :**
```json
{
  "success": true,
  "message": "Personnage supprimé"
}
```

**Réponses d'erreur :**

| Code | Message | Cause |
|---|---|---|
| 403 | `Non autorisé` | Le personnage n'appartient pas à l'utilisateur |
| 500 | `Erreur serveur` | Erreur interne |

---

#### GET `/api/player/:id/state`

Charge l'état de jeu (position, zone, HP, mana) d'un personnage.
Si aucun état n'existe, retourne les valeurs par défaut (position de départ).

**Paramètre URL :** `id` — identifiant du personnage

**Réponse 200 — État existant :**
```json
{
  "success": true,
  "state": {
    "id": 3,
    "player_id": 7,
    "pos_x": 1249,
    "pos_y": 260,
    "zone_x": 1,
    "zone_y": 0,
    "hp": 100,
    "mana": 50,
    "updated_at": "2025-06-30T14:22:00.000Z"
  }
}
```

**Réponse 200 — Aucun état (nouvelle partie) :**
```json
{
  "success": true,
  "state": {
    "pos_x": 1249,
    "pos_y": 260,
    "zone_x": 1,
    "zone_y": 0,
    "hp": 100,
    "mana": 50
  }
}
```

**Réponses d'erreur :**

| Code | Message | Cause |
|---|---|---|
| 403 | `Non autorisé` | Le personnage n'appartient pas à l'utilisateur |
| 500 | `Erreur serveur` | Erreur interne |

---

#### PUT `/api/player/:id/state`

Sauvegarde (ou met à jour) l'état de jeu d'un personnage. Opération UPSERT : crée la ligne si elle n'existe pas, la met à jour sinon.

**Paramètre URL :** `id` — identifiant du personnage

**Corps de la requête :**
```json
{
  "pos_x": 850.5,
  "pos_y": 412.0,
  "zone_x": 2,
  "zone_y": 1,
  "hp": 80,
  "mana": 35
}
```

**Champs du corps :**

| Champ | Type | Description |
|---|---|---|
| `pos_x` | number | Position X du joueur dans la carte globale (0–2400) |
| `pos_y` | number | Position Y du joueur dans la carte globale (0–1800) |
| `zone_x` | integer | Colonne de la zone active (0, 1 ou 2) |
| `zone_y` | integer | Ligne de la zone active (0, 1 ou 2) |
| `hp` | integer | Points de vie actuels |
| `mana` | integer | Points de mana actuels |

**Réponse 200 :**
```json
{
  "success": true
}
```

**Réponses d'erreur :**

| Code | Message | Cause |
|---|---|---|
| 403 | `Non autorisé` | Le personnage n'appartient pas à l'utilisateur |
| 500 | `Erreur serveur` | Erreur interne |

---

## 6. Sécurité et authentification JWT

### Flux d'authentification

```
Client                          Serveur
  │                                │
  │── POST /api/auth/login ────────►│
  │   { email, password }           │ bcrypt.compare(password, hash)
  │                                 │ jwt.sign({ userId, username },
  │                                 │           SECRET, { expiresIn: '24h' })
  │◄── { token: "eyJ..." } ────────│
  │                                 │
  │  localStorage.setItem('token')  │
  │                                 │
  │── GET /api/player/me ──────────►│
  │   Authorization: Bearer eyJ...  │ jwt.verify(token, SECRET)
  │                                 │ → req.user = { userId, username }
  │◄── { players: [...] } ─────────│
```

### Points importants

| Aspect | Implémentation |
|---|---|
| Hachage des mots de passe | `bcrypt` avec salt factor 10 |
| Durée de vie du token | 24 heures |
| Stockage client | `localStorage` (clé : `"token"`) |
| Personnage actif | `localStorage` (clé : `"activePlayer"`, JSON) |
| Révocation | Impossible côté serveur — suppression locale uniquement |
| CORS | `origin: true, credentials: true` (à restreindre en production) |

---

## 7. Structure des fichiers

```
Neuropulse/
├── backend/
│   ├── server.js              Point d'entrée Express (port 3000)
│   ├── db.js                  Pool de connexion PostgreSQL
│   ├── .env                   Variables d'environnement (PGHOST, JWT_SECRET…)
│   ├── package.json
│   ├── middleware/
│   │   └── auth.js            Vérification JWT — injecte req.user
│   └── routes/
│       ├── auth.js            POST register/login/logout, GET me
│       └── player.js          CRUD personnages + GET/PUT state
│
├── frontend/
│   ├── webpages/
│   │   ├── index.html         Page d'accueil
│   │   ├── login.html         Formulaire de connexion
│   │   ├── register.html      Formulaire d'inscription
│   │   ├── character_save.html Sélection des slots de sauvegarde
│   │   ├── create_character.html Création d'un personnage
│   │   ├── edit_character.html   Modification d'un personnage
│   │   ├── settings.html      Paramètres (audio, langue, contrôles)
│   │   ├── guide.html         Guide du jeu
│   │   └── style.css          Styles communs à toutes les pages
│   ├── js_client/
│   │   ├── session.js         Gestion token JWT + personnage actif
│   │   ├── auth.js            Vérification état de connexion (UI)
│   │   ├── main.js            Moteur Phaser : scène, carte, sauvegarde
│   │   ├── traduction.js      Dictionnaire FR/EN pour i18n
│   │   ├── settings.js        Logique page paramètres
│   │   ├── script_language.js Changement de langue à la volée
│   │   └── phaser.js          Bibliothèque Phaser.js (locale)
│   └── assets/
│       ├── background.png          Carte de jeu complète (2400×1800)
│       ├── background_hitbox.png   Debug des zones de collision
│       └── character/
│           ├── static_{down,left,right,up}.png   Spritesheet idle
│           └── run_{down,left,right,up}.png       Spritesheet course
│
├── database/
│   └── shema.sql              Script de création des tables
│
├── package.json               (racine du monorepo)
├── gitpush.sh                 Script de push automatisé
└── README.md
```

---

## 8. Technologies utilisées

### Backend

| Technologie | Version | Rôle |
|---|---|---|
| Node.js | ≥ 18 | Environnement d'exécution |
| Express.js | 5.x | Framework HTTP REST |
| PostgreSQL | ≥ 14 | Base de données relationnelle |
| pg (node-postgres) | 8.x | Driver PostgreSQL |
| bcrypt | 6.x | Hachage des mots de passe |
| jsonwebtoken | 9.x | Génération et vérification JWT |
| dotenv | 17.x | Gestion des variables d'environnement |
| cors | 2.x | Middleware CORS |
| nodemon | 3.x | Rechargement automatique (dev) |

### Frontend

| Technologie | Rôle |
|---|---|
| HTML5 / CSS3 | Structure et style des pages |
| JavaScript ES6+ | Logique client, appels API (`fetch`) |
| Phaser.js 3 | Moteur de jeu 2D (rendu, physique, animations) |
| localStorage | Persistance du token et du personnage actif |

### Infrastructure

| Outil | Rôle |
|---|---|
| Git / GitHub | Versionnement et collaboration |
| `.env` | Configuration locale (non commitée) |
