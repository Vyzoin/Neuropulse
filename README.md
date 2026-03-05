 ## NeuroPulse

**NeuroPulse** est un jeu RPG narratif développé avec **Phaser.js**, jouable directement dans un navigateur grâce à l’export HTML5/WebAssembly sur ordinateur **uniquement**. 
Le joueur incarne un humain confronté à une IA génératrice qui lui a volé son emploi. 
Son objectif : découvrir ses failles et la vaincre.

---

##  Installation et lancement

## Technologies utilisées
- Framework de développement : Phaser (JavaScript)
- Front-end : HTML5, CSS / Bootstrap, JavaScript
- Back-end : Node.js
- Base de données : PostgreSQL

###  Prérequis pour lancement en local
- IDE (VSCode, WebStorm, etc.)
- Wamp / Xampp (pour la base de données on ne peux pas utiliser Live Server)
- Navigateur web moderne (Chrome, Firefox, Edge…)
- Git (Codeberg)

L'utilisateur n'aura rien à télécharger de son côté lorsque le jeu sera publié.

###  Cloner le dépôt

```bash
git clone https://codeberg.org/NEUROPULSE/Neuropulse.git
```


#### Pense bête 

**Pour tester la connexion bdd:** http://localhost:3000/db-test

Lancer le back (node.js) avec le reload automatique 
```bash
npm run dev 
```

Se connecter à la base de donnée (PostgreSQL)
```bash 
psql -U nom_de_user -d nom_de_la_bdd
```


