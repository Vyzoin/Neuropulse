// Mise à jour des valeurs affichées pour les sliders
document.getElementById('volumeControl').addEventListener('input', function() {
    document.getElementById('volumeValue').textContent = this.value + '%';
});

document.getElementById('musicVolume').addEventListener('input', function() {
    document.getElementById('musicValue').textContent = this.value + '%';
});

document.getElementById('sfxVolume').addEventListener('input', function() {
    document.getElementById('sfxValue').textContent = this.value + '%';
});

// Gestion des touches
const keyInputs = document.querySelectorAll('.key-input');
keyInputs.forEach(input => {
    input.addEventListener('click', function() {
        this.value = 'Appuyez sur une touche...';
        this.style.background = 'rgba(140, 50, 220, 0.3)';

        const handleKeyPress = (e) => {
            e.preventDefault();
            this.value = e.key.toUpperCase();
            this.style.background = '';
            document.removeEventListener('keydown', handleKeyPress);
        };

        document.addEventListener('keydown', handleKeyPress);
    });
});

function saveSettings() {
    alert('✅ Paramètres sauvegardés avec succès !');
}

function resetSettings() {
    if (confirm('⚠️ Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
        location.reload();
    }
}

function resetControls() {
    document.getElementById('moveUpControl').value = 'Z';
    document.getElementById('moveDownControl').value = 'S';
    document.getElementById('moveLeftControl').value = 'Q';
    document.getElementById('moveRightControl').value = 'D';
    document.getElementById('attackControl').value = 'Clic gauche';
    document.getElementById('interactControl').value = 'E';
    document.getElementById('inventoryControl').value = 'I';
    document.getElementById('mapControl').value = 'M';
    alert('✅ Contrôles réinitialisés !');
}