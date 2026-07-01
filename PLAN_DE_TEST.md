# Plan de Test — Neuropulse

> Auteurs : N. SILLAIRE, A. VIVIEN, O. LAADRAOUI
> Date de rédaction : 30/06/2026

---

## Table des matières

1. [Périmètre et objectifs](#1-périmètre-et-objectifs)
2. [Environnement de test](#2-environnement-de-test)
3. [Conventions](#3-conventions)
4. [Module AUTH — Authentification](#4-module-auth--authentification)
5. [Module PLAYER — Gestion des personnages](#5-module-player--gestion-des-personnages)
6. [Module STATE — Sauvegarde de l'état de jeu](#6-module-state--sauvegarde-de-létat-de-jeu)
7. [Module FRONTEND — Pages web](#7-module-frontend--pages-web)
8. [Module JEU — Moteur Phaser](#8-module-jeu--moteur-phaser)
9. [Tests de sécurité](#9-tests-de-sécurité)
10. [Tests de non-régression](#10-tests-de-non-régression)
11. [Matrice de couverture](#11-matrice-de-couverture)

---

## 1. Périmètre et objectifs

### Ce qui est testé

| Composant | Inclus |
|---|---|
| API REST backend (auth + player) | Oui |
| Pages HTML (connexion, inscription, personnages, paramètres) | Oui |
| Moteur de jeu Phaser (déplacement, zones, collisions, pause) | Oui |
| Sauvegarde / chargement d'état | Oui |
| Internationalisation (FR / EN) | Oui |

### Ce qui est hors périmètre

- Tests de charge / performance
- Tests de l'inventaire, boutique et système de combat (non implémentés)
- Compatibilité mobile

### Objectifs

- Vérifier que le parcours utilisateur complet fonctionne de bout en bout
- Détecter les cas aux limites non gérés (champs vides, token expiré, slot occupé…)
- Valider la cohérence des données entre frontend et base de données

---

## 2. Environnement de test

### Prérequis

| Élément | Valeur attendue |
|---|---|
| Node.js | ≥ 18 |
| PostgreSQL | ≥ 14, base `neuropulse` créée et migrée |
| Backend | `npm start` dans `/backend` → port 3000 |
| Frontend | Servi en local (Live Server, http-server…) |
| Navigateur | Chrome ≥ 120 ou Firefox ≥ 120 |
| Outil API | Postman, Insomnia ou `curl` |

### Données de référence

Créer avant les tests :

```
Utilisateur test A : email=test.a@mail.com, username=TestA, password=Test1234!
Utilisateur test B : email=test.b@mail.com, username=TestB, password=Test1234!
```

---

## 3. Conventions

### Statuts

| Symbole | Signification |
|---|---|
| ✅ | Test passé |
| ❌ | Test échoué |
| ⏳ | À exécuter |
| N/A | Non applicable |

### Priorités

| Niveau | Description |
|---|---|
| P1 — Critique | Bloque le parcours utilisateur principal |
| P2 — Majeur | Fonctionnalité importante dégradée |
| P3 — Mineur | Confort ou cas aux limites |

### Format des cas de test

Chaque cas suit la structure : **Précondition → Action → Résultat attendu → Statut**

---

## 4. Module AUTH — Authentification

### T-AUTH-01 — Inscription valide

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Backend démarré, email `test.a@mail.com` non existant en base |
| **Étapes** | 1. `POST /api/auth/register` avec `{ email, username, password }` valides |
| **Résultat attendu** | HTTP 201 · `{ success: true, token: "eyJ..." }` · Utilisateur présent en base |
| **Statut** | ✅ |

---

### T-AUTH-02 — Inscription avec email déjà utilisé

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Utilisateur test A déjà créé |
| **Étapes** | 1. `POST /api/auth/register` avec le même email |
| **Résultat attendu** | HTTP 400 · `{ success: false, message: "Email ou pseudo déjà utilisé" }` |
| **Statut** | ✅ |

---

### T-AUTH-03 — Inscription avec pseudo déjà utilisé

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Utilisateur test A déjà créé |
| **Étapes** | 1. `POST /api/auth/register` avec un email différent mais le même username |
| **Résultat attendu** | HTTP 400 · `{ success: false, message: "Email ou pseudo déjà utilisé" }` |
| **Statut** | ✅ |

---

### T-AUTH-04 — Inscription avec champs manquants

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Backend démarré |
| **Étapes** | 1. `POST /api/auth/register` sans le champ `password` |
| **Résultat attendu** | HTTP 400 · `{ success: false, message: "Champs manquants" }` |
| **Statut** | ✅ |

---

### T-AUTH-05 — Connexion valide

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Utilisateur test A créé |
| **Étapes** | 1. `POST /api/auth/login` avec `{ email, password }` corrects |
| **Résultat attendu** | HTTP 200 · `{ success: true, token: "eyJ..." }` |
| **Statut** | ✅ |

---

### T-AUTH-06 — Connexion avec mauvais mot de passe

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Utilisateur test A créé |
| **Étapes** | 1. `POST /api/auth/login` avec le bon email et un mauvais mot de passe |
| **Résultat attendu** | HTTP 401 · `{ success: false, message: "Mot de passe incorrect" }` |
| **Statut** | ✅ |

---

### T-AUTH-07 — Connexion avec email inconnu

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Backend démarré |
| **Étapes** | 1. `POST /api/auth/login` avec un email inexistant |
| **Résultat attendu** | HTTP 401 · `{ success: false, message: "Email introuvable" }` |
| **Statut** | ✅ |

---

### T-AUTH-08 — Vérification du token (GET /me)

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Token valide obtenu via login |
| **Étapes** | 1. `GET /api/auth/me` avec `Authorization: Bearer <token>` |
| **Résultat attendu** | HTTP 200 · `{ loggedIn: true, userId: <n>, username: "TestA" }` |
| **Statut** | ✅ |

---

### T-AUTH-09 — GET /me sans token

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Backend démarré |
| **Étapes** | 1. `GET /api/auth/me` sans header Authorization |
| **Résultat attendu** | HTTP 200 · `{ loggedIn: false }` |
| **Statut** | ✅ |

---

### T-AUTH-10 — GET /me avec token invalide

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Backend démarré |
| **Étapes** | 1. `GET /api/auth/me` avec `Authorization: Bearer token_bidon` |
| **Résultat attendu** | HTTP 200 · `{ loggedIn: false }` |
| **Statut** | ✅ |

---

### T-AUTH-11 — Déconnexion

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Utilisateur connecté (token en localStorage) |
| **Étapes** | 1. Cliquer sur le bouton "Déconnexion" dans la navbar |
| **Résultat attendu** | Token supprimé du localStorage · Redirection vers `login.html` · Boutons "Connexion" et "Inscription" réaffichés |
| **Statut** | ✅ |

---

## 5. Module PLAYER — Gestion des personnages

> Toutes les requêtes de ce module nécessitent un token valide.

### T-PLAY-01 — Création d'un personnage (slot libre)

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Utilisateur connecté, aucun personnage dans le slot 1 |
| **Étapes** | 1. `POST /api/player` avec `{ name:"Anderson", firstname:"Neo", sexe:"Masculin", slot:1 }` |
| **Résultat attendu** | HTTP 201 · `{ success: true, player: { id, user_id, name, firstname, sexe, slot:1 } }` · Inventaire créé automatiquement en base |
| **Statut** | ✅ |

---

### T-PLAY-02 — Création sur un slot déjà occupé

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Slot 1 déjà occupé (T-PLAY-01 exécuté) |
| **Étapes** | 1. `POST /api/player` avec `slot:1` à nouveau |
| **Résultat attendu** | HTTP 400 · `{ success: false, message: "Ce slot est déjà occupé" }` |
| **Statut** | ✅ |

---

### T-PLAY-03 — Création avec champs manquants

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Utilisateur connecté |
| **Étapes** | 1. `POST /api/player` sans le champ `sexe` |
| **Résultat attendu** | HTTP 400 · `{ success: false, message: "Champs manquants" }` |
| **Statut** | ✅ |

---

### T-PLAY-04 — Création sans token

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Backend démarré |
| **Étapes** | 1. `POST /api/player` sans header Authorization |
| **Résultat attendu** | HTTP 401 · `{ error: "Token manquant" }` |
| **Statut** | ✅ |

---

### T-PLAY-05 — Récupération de tous les personnages

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Utilisateur connecté avec 2 personnages créés (slots 1 et 2) |
| **Étapes** | 1. `GET /api/player/me` |
| **Résultat attendu** | HTTP 200 · tableau de 2 personnages triés par slot ASC |
| **Statut** | ✅ |

---

### T-PLAY-06 — Récupération d'un personnage précis

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Personnage d'id connu appartenant à l'utilisateur connecté |
| **Étapes** | 1. `GET /api/player/:id` |
| **Résultat attendu** | HTTP 200 · `{ success: true, player: { ... } }` |
| **Statut** | ✅ |

---

### T-PLAY-07 — Accès au personnage d'un autre utilisateur

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Utilisateur B connecté, id d'un personnage appartenant à l'utilisateur A |
| **Étapes** | 1. `GET /api/player/<id_de_A>` avec le token de B |
| **Résultat attendu** | HTTP 404 · `{ success: false, message: "Personnage introuvable" }` |
| **Statut** | ✅ |

---

### T-PLAY-08 — Modification d'un personnage

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Personnage existant appartenant à l'utilisateur connecté |
| **Étapes** | 1. `PUT /api/player/:id` avec `{ name:"Anderson", firstname:"Thomas", sexe:"Masculin" }` |
| **Résultat attendu** | HTTP 200 · personnage retourné avec les nouvelles valeurs |
| **Statut** | ✅ |

---

### T-PLAY-09 — Modification du personnage d'un autre utilisateur

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Utilisateur B connecté, id d'un personnage de A |
| **Étapes** | 1. `PUT /api/player/<id_de_A>` avec le token de B |
| **Résultat attendu** | HTTP 403 · `{ success: false, message: "Non autorisé" }` |
| **Statut** | ✅ |

---

### T-PLAY-10 — Suppression d'un personnage

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Personnage existant appartenant à l'utilisateur connecté |
| **Étapes** | 1. `DELETE /api/player/:id` 2. `GET /api/player/:id` pour vérifier |
| **Résultat attendu** | HTTP 200 au DELETE · HTTP 404 au GET · Inventaire supprimé en cascade |
| **Statut** | ✅ |

---

### T-PLAY-11 — Suppression du personnage d'un autre utilisateur

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Utilisateur B connecté, id d'un personnage de A |
| **Étapes** | 1. `DELETE /api/player/<id_de_A>` avec le token de B |
| **Résultat attendu** | HTTP 403 · `{ success: false, message: "Non autorisé" }` |
| **Statut** | ✅ |

---

### T-PLAY-12 — 3 slots maximum par utilisateur

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Utilisateur avec les slots 1, 2 et 3 déjà occupés |
| **Étapes** | 1. Tenter `POST /api/player` avec `slot:4` |
| **Résultat attendu** | HTTP 400 ou comportement équivalent — aucun 4e personnage créé |
| **Statut** | ❌ · HTTP 201 retourné — le backend ne valide pas le numéro de slot (slot 4 créé) |

---

## 6. Module STATE — Sauvegarde de l'état de jeu

### T-STATE-01 — Chargement d'état inexistant (nouvelle partie)

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Personnage créé, aucune ligne dans `player_state` |
| **Étapes** | 1. `GET /api/player/:id/state` |
| **Résultat attendu** | HTTP 200 · état par défaut `{ pos_x:1249, pos_y:260, zone_x:1, zone_y:0, hp:100, mana:50 }` |
| **Statut** | ✅ |

---

### T-STATE-02 — Sauvegarde d'état (création)

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Personnage sans état existant |
| **Étapes** | 1. `PUT /api/player/:id/state` avec `{ pos_x:500, pos_y:300, zone_x:0, zone_y:1, hp:80, mana:40 }` |
| **Résultat attendu** | HTTP 200 · `{ success: true }` · Ligne créée dans `player_state` |
| **Statut** | ✅ |

---

### T-STATE-03 — Sauvegarde d'état (mise à jour / UPSERT)

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | État existant (T-STATE-02 exécuté) |
| **Étapes** | 1. `PUT /api/player/:id/state` avec de nouvelles coordonnées 2. `GET /api/player/:id/state` |
| **Résultat attendu** | HTTP 200 · Une seule ligne dans `player_state` avec les nouvelles valeurs · `updated_at` mis à jour |
| **Statut** | ✅ |

---

### T-STATE-04 — Chargement de l'état au lancement du jeu

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | État sauvegardé à `{ pos_x:500, pos_y:300, zone_x:2, zone_y:1 }` |
| **Étapes** | 1. Sélectionner le personnage dans `character_save.html` 2. Observer la position initiale du joueur dans Phaser |
| **Résultat attendu** | Le personnage apparaît à x=500, y=300 dans la zone (2,1), caméra positionnée sur cette zone |
| **Statut** | ✅ |

---

### T-STATE-05 — Sauvegarde automatique à la fermeture

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Jeu en cours, personnage déplacé loin de sa position de départ |
| **Étapes** | 1. Fermer l'onglet ou naviguer vers une autre URL 2. Relancer le jeu avec le même personnage |
| **Résultat attendu** | Le personnage réapparaît à la position où il se trouvait avant la fermeture |
| **Statut** | ✅ |

---

### T-STATE-06 — Sauvegarde via "Menu Principal" (pause)

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Jeu en cours |
| **Étapes** | 1. Appuyer sur ESC 2. Cliquer "Menu Principal" 3. Relancer le jeu avec le même personnage |
| **Résultat attendu** | Position sauvegardée · Retour vers `character_save.html` · À la reprise, position restaurée |
| **Statut** | ✅ |

---

### T-STATE-07 — Accès à l'état du personnage d'un autre utilisateur

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Utilisateur B connecté, id d'un personnage de A |
| **Étapes** | 1. `GET /api/player/<id_de_A>/state` avec le token de B |
| **Résultat attendu** | HTTP 403 · `{ success: false, message: "Non autorisé" }` |
| **Statut** | ✅ |

---

## 7. Module FRONTEND — Pages web

### T-FRONT-01 — Affichage navbar non connecté

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Aucun token dans localStorage |
| **Étapes** | 1. Ouvrir `index.html` |
| **Résultat attendu** | Boutons "Connexion" et "Inscription" visibles · "Déconnexion" masqué · Message d'accueil non connecté affiché |
| **Statut** | ✅ |

---

### T-FRONT-02 — Affichage navbar connecté

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Token valide dans localStorage |
| **Étapes** | 1. Ouvrir `index.html` |
| **Résultat attendu** | "Déconnexion" visible · "Bienvenue, TestA" affiché · "Connexion" et "Inscription" masqués |
| **Statut** | ✅ |

---

### T-FRONT-03 — Formulaire de connexion (champs vides)

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Page `login.html` ouverte |
| **Étapes** | 1. Cliquer "Se connecter" sans remplir les champs |
| **Résultat attendu** | Message d'erreur affiché dans la page (pas d'appel API) |
| **Statut** | ✅ |

---

### T-FRONT-04 — Formulaire d'inscription (mots de passe différents)

| Champ | Valeur |
|---|--|
| **Priorité** | P2 |
| **Précondition** | Page `register.html` ouverte |
| **Étapes** | 1. Remplir tous les champs avec des mots de passe différents 2. Soumettre |
| **Résultat attendu** | Message `"Les mots de passe ne correspondent pas"` · Aucun appel API envoyé |
| **Statut** | ✅ |

---

### T-FRONT-05 — Accès à character_save sans être connecté

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Aucun token dans localStorage |
| **Étapes** | 1. Naviguer directement vers `character_save.html` |
| **Résultat attendu** | Redirection automatique vers `login.html` |
| **Statut** | ✅ |

---

### T-FRONT-06 — Affichage des slots de sauvegarde

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Connecté avec 1 personnage en slot 1, slots 2 et 3 vides |
| **Étapes** | 1. Ouvrir `character_save.html` |
| **Résultat attendu** | Slot 1 : nom du personnage + boutons "Jouer" et "Modifier" · Slots 2 et 3 : "Emplacement vide" + bouton "Créer" |
| **Statut** | ✅ |

---

### T-FRONT-07 — Création d'un personnage via l'interface

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Slot 2 vide · Page `create_character.html` ouverte avec `slot=2` en paramètre |
| **Étapes** | 1. Remplir prénom, nom et sexe 2. Cliquer "Créer le personnage" |
| **Résultat attendu** | Appel `POST /api/player` · Retour vers `character_save.html` · Slot 2 désormais affiché avec le nouveau personnage |
| **Statut** | ✅ |

---

### T-FRONT-08 — Modification d'un personnage via l'interface

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Personnage existant en slot 1 |
| **Étapes** | 1. Cliquer "Modifier" sur le slot 1 2. Changer le prénom 3. Enregistrer |
| **Résultat attendu** | Appel `PUT /api/player/:id` · Retour vers `character_save.html` · Nouveau prénom affiché |
| **Statut** | ✅ |

---

### T-FRONT-09 — Suppression d'un personnage via l'interface

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Personnage existant en slot 2 |
| **Étapes** | 1. Aller sur `edit_character.html` pour le slot 2 2. Cliquer "Supprimer ce personnage" 3. Confirmer |
| **Résultat attendu** | Appel `DELETE /api/player/:id` · Slot 2 redevient "Emplacement vide" |
| **Statut** | ✅ |

---

### T-FRONT-10 — Changement de langue (FR → EN)

| Champ | Valeur |
|---|---|
| **Priorité** | P3 |
| **Précondition** | Page `settings.html` ouverte, langue FR par défaut |
| **Étapes** | 1. Sélectionner "English" dans la liste déroulante |
| **Résultat attendu** | Tous les textes de la page sont mis à jour immédiatement en anglais · `localStorage.getItem('langue')` retourne `"en"` |
| **Statut** | ✅ |

---

### T-FRONT-11 — Persistance de la langue entre les pages

| Champ | Valeur |
|---|--|
| **Priorité** | P3 |
| **Précondition** | Langue EN sélectionnée et sauvegardée (T-FRONT-10 exécuté) |
| **Étapes** | 1. Naviguer vers `index.html` |
| **Résultat attendu** | Page affichée en anglais sans action supplémentaire |
| **Statut** | ✅ |

---

## 8. Module JEU — Moteur Phaser

### T-JEU-01 — Lancement du jeu

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Personnage sélectionné (`activePlayer` en localStorage) |
| **Étapes** | 1. Cliquer "JOUER" sur un slot occupé |
| **Résultat attendu** | Canvas Phaser affiché en plein écran · Personnage visible avec son nom au-dessus · UI HTML masquée |
| **Statut** | ✅ |

---

### T-JEU-02 — Déplacement ZQSD

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Jeu en cours |
| **Étapes** | 1. Appuyer sur Z (haut), S (bas), Q (gauche), D (droite) |
| **Résultat attendu** | Le personnage se déplace dans la direction correspondante · Animation de course jouée · Vitesse = 100 px/s |
| **Statut** | ✅ |

---

### T-JEU-03 — Déplacement touches directionnelles (flèches)

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Jeu en cours |
| **Étapes** | 1. Appuyer sur les touches fléchées ↑ ↓ ← → |
| **Résultat attendu** | Déplacement identique aux touches ZQSD |
| **Statut** | ✅ |

---

### T-JEU-04 — Animation idle (personnage à l'arrêt)

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Jeu en cours, personnage en mouvement |
| **Étapes** | 1. Relâcher toutes les touches de déplacement |
| **Résultat attendu** | Animation idle jouée dans la dernière direction regardée · Vitesse = 0 |
| **Statut** | ✅ |

---

### T-JEU-05 — Collision avec les murs

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Jeu en cours |
| **Étapes** | 1. Déplacer le personnage vers un bord de la carte (ex: bord haut) 2. Continuer d'appuyer sur la touche |
| **Résultat attendu** | Le personnage s'arrête sur le mur et ne le traverse pas |
| **Statut** | ✅ |

---

### T-JEU-06 — Changement de zone (bord droit)

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Jeu en cours, zone courante (0, 0) |
| **Étapes** | 1. Déplacer le personnage jusqu'au bord droit de la zone |
| **Résultat attendu** | Transition caméra (pan) vers la zone (1, 0) · Personnage repositionné au bord gauche de la nouvelle zone |
| **Statut** | ✅ |

---

### T-JEU-07 — Pas de changement de zone hors limites

| Champ | Valeur |
|---|---|
| **Priorité** | P2 |
| **Précondition** | Jeu en cours, zone courante (0, 0) |
| **Étapes** | 1. Déplacer le personnage vers le bord gauche ou le bord haut de la zone (0,0) |
| **Résultat attendu** | Aucun changement de zone · Le personnage est bloqué par la bordure du monde |
| **Statut** | ✅ |

---

### T-JEU-08 — Ouverture du menu pause (ESC)

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Jeu en cours, chargement initial terminé |
| **Étapes** | 1. Appuyer sur la touche ESC |
| **Résultat attendu** | Overlay semi-transparent · Panneau "PAUSE" · Boutons "Reprendre" et "Menu Principal" affichés · Physique du jeu suspendue |
| **Statut** | ✅ |

---

### T-JEU-09 — Reprise du jeu depuis le menu pause

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Précondition** | Menu pause ouvert |
| **Étapes** | 1. Cliquer "Reprendre" (ou appuyer à nouveau sur ESC) |
| **Résultat attendu** | Menu pause supprimé · Physique du jeu relancée · Déplacement à nouveau fonctionnel |
| **Statut** | ✅ |

---

### T-JEU-10 — ESC ignoré pendant le chargement initial

| Champ | Valeur |
|---|---|
| **Priorité** | P3 |
| **Précondition** | Jeu en cours de chargement (avant que `loadPlayerState` se termine) |
| **Étapes** | 1. Appuyer immédiatement sur ESC après le lancement |
| **Résultat attendu** | Aucun menu pause n'apparaît · Le flag `isInitializing` protège contre cet appel |
| **Statut** | ⏳ |

---

### T-JEU-11 — Affichage du nom du personnage en jeu

| Champ | Valeur |
|---|---|
| **Priorité** | P3 |
| **Précondition** | Personnage avec prénom "Neo" et nom "Anderson" |
| **Étapes** | 1. Lancer le jeu |
| **Résultat attendu** | Texte "Neo Anderson" affiché au-dessus du sprite · Texte "Neo Anderson (Slot X)" affiché en overlay coin haut-gauche |
| **Statut** | ✅ |

---

## 9. Tests de sécurité

### T-SEC-01 — Accès aux routes protégées sans token

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Étapes** | 1. `GET /api/player/me` sans header Authorization |
| **Résultat attendu** | HTTP 401 · `{ error: "Token manquant" }` |
| **Statut** | ✅ |

---

### T-SEC-02 — Accès aux routes protégées avec token expiré ou falsifié

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Étapes** | 1. `GET /api/player/me` avec `Authorization: Bearer eyJfauxtoken` |
| **Résultat attendu** | HTTP 403 · `{ error: "Token invalide ou expiré" }` |
| **Statut** | ✅ |

---

### T-SEC-03 — Isolation des données entre utilisateurs

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Étapes** | 1. Avec le token de B, tenter GET / PUT / DELETE sur les ressources de A (player, state) |
| **Résultat attendu** | HTTP 403 ou 404 sur toutes les tentatives · Aucune donnée de A modifiée |
| **Statut** | ✅ |

---

### T-SEC-04 — Mot de passe non stocké en clair

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Étapes** | 1. Créer un utilisateur 2. Lire directement la colonne `password` dans PostgreSQL |
| **Résultat attendu** | La valeur commence par `$2b$` (hash bcrypt) · Le mot de passe en clair est introuvable |
| **Statut** | ✅ · Vérifié via le code source (`bcrypt` salt 10) et le comportement du login/mauvais mot de passe |

---

### T-SEC-05 — Injection SQL dans les champs d'authentification

| Champ | Valeur |
|---|---|
| **Priorité** | P1 |
| **Étapes** | 1. `POST /api/auth/login` avec `email: "' OR 1=1 --"` |
| **Résultat attendu** | HTTP 401 · Requête rejetée · Aucune donnée exposée (requêtes paramétrées via `$1, $2…`) |
| **Statut** | ✅ |

---

## 10. Tests de non-régression

Ces tests vérifient que les fonctionnalités stables n'ont pas été cassées par de nouvelles livraisons.

| ID | Fonctionnalité | À exécuter après |
|---|---|---|
| T-REG-01 | Connexion + accès au jeu (T-AUTH-05 + T-FRONT-06 + T-JEU-01) | Toute PR touchant `auth.js` ou `session.js` |
| T-REG-02 | Création de personnage (T-PLAY-01 + T-FRONT-07) | Toute PR touchant `player.js` |
| T-REG-03 | Sauvegarde et restauration de position (T-STATE-02 + T-STATE-04) | Toute PR touchant `main.js` ou `player.js` |
| T-REG-04 | Menu pause (T-JEU-08 + T-JEU-09 + T-JEU-06 de menu) | Toute PR touchant `main.js` |
| T-REG-05 | Changement de langue (T-FRONT-10 + T-FRONT-11) | Toute PR touchant `traduction.js` ou `script_language.js` |
| T-REG-06 | Isolation des données (T-SEC-03) | Toute PR touchant les routes `player.js` |

---

## 11. Matrice de couverture

| Module | Nb de cas | P1 | P2 | P3 |
|---|---|---|---|---|
| AUTH | 11 | 7 | 4 | 0 |
| PLAYER | 12 | 6 | 6 | 0 |
| STATE | 7 | 6 | 1 | 0 |
| FRONTEND | 11 | 3 | 5 | 3 |
| JEU | 11 | 4 | 5 | 2 |
| SÉCURITÉ | 5 | 5 | 0 | 0 |
| **TOTAL** | **57** | **31** | **21** | **5** |

### Critères de validation

| Condition | Seuil |
|---|---|
| Tous les cas P1 passés | Obligatoire pour livraison |
| Tous les cas P2 passés | Obligatoire pour livraison |
| Cas P3 non bloquants | Peuvent être reportés si justifiés |
| Aucun T-SEC-0x échoué | Obligatoire quelle que soit la priorité |
