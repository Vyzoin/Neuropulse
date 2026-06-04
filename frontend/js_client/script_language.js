window.langueActuelle = localStorage.getItem('langue') || 'fr';
// 2. Fonction globale pour traduire la page actuelle
function traduirePage() {
    const elementsATraduire = document.querySelectorAll('[data-key]');

    elementsATraduire.forEach(element => {
        const cle = element.getAttribute('data-key');
        // On vérifie que la traduction existe pour éviter les bugs
        if (window.traductions && window.traductions[langueActuelle] && window.traductions[langueActuelle][cle]) {
            element.textContent = window.traductions[langueActuelle][cle];
        }
    });
}

// 3. On lance la traduction automatiquement dès que le HTML est prêt
document.addEventListener('DOMContentLoaded', () => {
    traduirePage();
});