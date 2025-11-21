#!/bin/bash
# C'est un simple script qui permet d'effectuer un git push sur le depôt en gerant les branches distantes et locales.



function creation_branche_locale   { 
    git checkout -b "$nom_branche"
    echo "Branche locale '$nom_branche' créée et basculée dessus."
}
function suppression_branche_locale  {
    git branch -d "$nom_branche"
    echo "Branche locale '$nom_branche' supprimée localement."
}
function suppression_branche_distante  {
    git push origin --delete "$nom_branche"
    echo "Branche distante '$nom_branche' supprimée sur le dépôt distant."
}


function ajout_message_commit  {
    git add .
    git commit -m "$message_commit"
    echo "Modifications ajoutées et commit effectuée avec le message: '$message_commit'."
}

function push_vers_depot {
    git push origin "$nom_branche"
    echo "Modifications poussées vers le dépôt distant sur la branche '$nom_branche'."
}





read -p "Entrez le nom de la nouvelle branche locale: " nom_branche
creation_branche_locale 
read -p "Entrez le message du commit: " message_commit
ajout_message_commit 
push_vers_depot 
suppression_branche_distante 
suppression_branche_locale 



