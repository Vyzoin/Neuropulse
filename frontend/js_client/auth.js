// Vérifier si l'utilisateur est connecté
function checkAuthStatus() {
    const token = localStorage.getItem('authToken'); // ou sessionStorage selon votre implémentation
    const isConnected = !!token;

    const notConnectedSection = document.getElementById('notConnectedSection');
    const connectedSection = document.getElementById('connectedSection');

    if (isConnected) {
        notConnectedSection.style.display = 'none';
        connectedSection.style.display = 'block';
    } else {
        notConnectedSection.style.display = 'block';
        connectedSection.style.display = 'none';
    }
}

// Exécuter au chargement de la page
document.addEventListener('DOMContentLoaded', checkAuthStatus);