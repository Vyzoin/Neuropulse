#!/bin/bash
# Script Git automatisé avec création de branche, commit, push et nettoyage





function creation_branche_locale {
    read -p "Entrez le nom de la nouvelle branche locale: feature/" saisie
    nom_branche="feature/$saisie"
    git checkout -b "$nom_branche"
    echo "Branche locale '$nom_branche' créée et basculée dessus."
    echo "------------------------------------------------------------------------"
}

function ajout_message_commit {
    read -p "Entrez le message du commit: " message_commit
    git add .
    git commit -m "$message_commit"
    echo "Commit effectué avec le message: '$message_commit'."
    echo "------------------------------------------------------------------------"
}

function push_vers_depot {
    git push origin "$nom_branche"
    echo "Modifications poussées vers le dépôt distant sur la branche '$nom_branche'."
    echo "------------------------------------------------------------------------"
}

function retour_main {
    git switch main
    echo "Rebasculé sur la branche 'main'."
}

function suppression_branche_locale {
    git branch -D "$nom_branche"
    echo "Branche locale '$nom_branche' supprimée localement."
    echo "------------------------------------------------------------------------"
}



creation_branche_locale
ajout_message_commit
push_vers_depot
retour_main
suppression_branche_locale

echo "Opération Git terminée avec succès. A toi de jouer maintenant, va faire ton PR  !"