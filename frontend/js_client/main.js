// --- Config Phaser (scale adapté) ---
var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        parent: null,
        width: 800,
        height: 600
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = null; // Le jeu ne se démarre pas immédiatement
var cursor;
var player;
var lastDirection = 'down';
var runAnim = 15;

// --- Gestionnaire de démarrage ---
document.addEventListener('DOMContentLoaded', function() {
    const startButton = document.getElementById('startButton');
    const uiContainer = document.querySelector('.container-fluid') || document.querySelector('body > div');
    if (!startButton) {
        console.warn('Start button introuvable.');
        return;
    }

    startButton.addEventListener('click', function () {
        console.log('JOUER cliqué');

        // masquer l'UI (si présente)
        if (uiContainer) uiContainer.style.display = 'none';
        document.body.classList.add('game-active');

        // Créer / trouver un conteneur plein écran pour Phaser
        let host = document.getElementById('phaser-host');
        if (!host) {
            host = document.createElement('div');
            host.id = 'phaser-host';
            host.style.position = 'fixed';
            host.style.top = '0';
            host.style.left = '0';
            host.style.width = '100%';
            host.style.height = '100%';
            host.style.zIndex = '9999';
            host.style.background = '#000';
            document.body.appendChild(host);
        } else {
            // s'assurer qu'il est visible si déjà présent
            host.style.display = 'block';
        }

        // assigner parent de scale pour que Phaser insère le canvas dans le host
        config.scale.parent = 'phaser-host';

        // lancer le jeu seulement une fois
        if (!game) {
            console.log('Création du jeu Phaser...');
            game = new Phaser.Game(config);
        } else {
            console.log('Le jeu existe déjà.');
        }
    });
});

function preload() {
    console.log('preload start');
    this.load.image('background', 'assets/background.png');
    this.load.spritesheet('static_down', 'assets/character/static_down.png', {
        frameWidth: 96,
        frameHeight: 80
    });
    this.load.spritesheet('static_left', 'assets/character/static_left.png', {
        frameWidth: 96,
        frameHeight: 80
    });
    this.load.spritesheet('static_right', 'assets/character/static_right.png', {
        frameWidth: 96,
        frameHeight: 80
    });
    this.load.spritesheet('static_up', 'assets/character/static_up.png', {
        frameWidth: 96,
        frameHeight: 80
    });
    this.load.spritesheet('run_down', 'assets/character/run_down.png', {
        frameWidth: 96,
        frameHeight: 80
    });
    this.load.spritesheet('run_left', 'assets/character/run_left.png', {
        frameWidth: 96,
        frameHeight: 80
    });this.load.spritesheet('run_right', 'assets/character/run_right.png', {
        frameWidth: 96,
        frameHeight: 80
    });this.load.spritesheet('run_up', 'assets/character/run_up.png', {
        frameWidth: 96,
        frameHeight: 80
    });
}

function create() {
    console.log('create start');
    cursor = this.input.keyboard.createCursorKeys();

    this.anims.create({
        key: 'static_down_anim',
        frames: this.anims.generateFrameNumbers('static_down', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'static_left_anim',
        frames: this.anims.generateFrameNumbers('static_left', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'static_right_anim',
        frames: this.anims.generateFrameNumbers('static_right', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'static_up_anim',
        frames: this.anims.generateFrameNumbers('static_up', { start: 0, end: 7 }),
        frameRate: 10,
        repeat: -1
    });
    this.anims.create({
        key: 'run_down_anim',
        frames: this.anims.generateFrameNumbers('run_down', { start: 0, end: 7 }),
        frameRate: runAnim,
        repeat: -1
    });
    this.anims.create({
        key: 'run_left_anim',
        frames: this.anims.generateFrameNumbers('run_left', { start: 0, end: 7 }),
        frameRate: runAnim,
        repeat: -1
    });
    this.anims.create({
        key: 'run_right_anim',
        frames: this.anims.generateFrameNumbers('run_right', { start: 0, end: 7 }),
        frameRate: runAnim,
        repeat: -1
    });
    this.anims.create({
        key: 'run_up_anim',
        frames: this.anims.generateFrameNumbers('run_up', { start: 0, end: 7 }),
        frameRate: runAnim,
        repeat: -1
    });

    var ImgBackground = this.add.image(400, 300, 'background');
    ImgBackground.setOrigin(0.5, 0.5);
    ImgBackground.setScale(0.70);

    player = this.physics.add.sprite(400, 300, 'static_down', 0);
    player.setOrigin(0.5, 0.5);
    player.setCollideWorldBounds(true);
    player.play('static_down_anim');
}

function update() {
    if (cursor.left.isDown) {
        console.log("left key pressed");
        player.play('run_left_anim', true);
        player.setVelocityX(-100);
        player.setVelocityY(0);
        lastDirection = 'left';
    } else if (cursor.right.isDown) {
        console.log("right key pressed");
        player.play('run_right_anim', true);
        player.setVelocityX(100);
        player.setVelocityY(0);
        lastDirection = 'right';
    } else if (cursor.up.isDown) {
        console.log("up key pressed");
        player.play('run_up_anim', true);
        player.setVelocityY(-100);
        player.setVelocityX(0);
        lastDirection = 'up';
    } else if (cursor.down.isDown) {
        console.log("down key pressed");
        player.play('run_down_anim', true);
        player.setVelocityY(100);
        player.setVelocityX(0);
        lastDirection = 'down';
    } else {
        player.setVelocity(0, 0);
        const idleAnim = {
            down: 'static_down_anim',
            up: 'static_up_anim',
            left: 'static_left_anim',
            right: 'static_right_anim'
        }[lastDirection] || 'static_down_anim';

        player.play(idleAnim, true);
    }
}