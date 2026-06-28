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

// --- Lancement du jeu ---
function startGame() {
    const uiContainer = document.querySelector('.container-fluid') || document.querySelector('body > div');
    if (uiContainer) uiContainer.style.display = 'none';
    document.body.classList.add('game-active');

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
        host.style.display = 'block';
    }

    config.scale.parent = 'phaser-host';

    if (!game) {
        game = new Phaser.Game(config);
    }
}

// --- Gestionnaire de démarrage ---
document.addEventListener('DOMContentLoaded', function () {
    const startButton = document.getElementById('startButton');
    if (!startButton) {
        console.warn('Start button introuvable.');
        return;
    }
    startButton.addEventListener('click', startGame);
});

const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;

const MAP_COLS = 3;
const MAP_ROWS = 3;

let currentX = 1;
let currentY = 1;

const margin = 5;

function preload() {
    console.log('preload start');
    this.load.image('background', '../assets/background.png');
    this.load.spritesheet('static_down', '../assets/character/static_down.png', {
        frameWidth: 96,
        frameHeight: 80
    });
    this.load.spritesheet('static_left', '../assets/character/static_left.png', {
        frameWidth: 96,
        frameHeight: 80
    });
    this.load.spritesheet('static_right', '../assets/character/static_right.png', {
        frameWidth: 96,
        frameHeight: 80
    });
    this.load.spritesheet('static_up', '../assets/character/static_up.png', {
        frameWidth: 96,
        frameHeight: 80
    });
    this.load.spritesheet('run_down', '../assets/character/run_down.png', {
        frameWidth: 96,
        frameHeight: 80
    });
    this.load.spritesheet('run_left', '../assets/character/run_left.png', {
        frameWidth: 96,
        frameHeight: 80
    }); this.load.spritesheet('run_right', '../assets/character/run_right.png', {
        frameWidth: 96,
        frameHeight: 80
    }); this.load.spritesheet('run_up', '../assets/character/run_up.png', {
        frameWidth: 96,
        frameHeight: 80
    });
}

function create() {
    var MAP_COLS = 3;
    var MAP_ROWS = 3;

    var currentX = 1;
    var currentY = 1;

    var margin = 5;
    /* Animations */
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

    // Position au centre de la carte entière (1200, 900)
    const fullMapWidth = VIEW_WIDTH * MAP_COLS;
    const fullMapHeight = VIEW_HEIGHT * MAP_ROWS;

    const bgFull = this.add.image(fullMapWidth / 2, fullMapHeight / 2, 'background');
    bgFull.setOrigin(0.5, 0.5);

    // Obtenir les dimensions originales de l'image
    const originalWidth = bgFull.texture.source[0].width;
    const originalHeight = bgFull.texture.source[0].height;

    // Calculer l'échelle pour que l'image remplisse exactement la carte
    const scaleX = fullMapWidth / originalWidth;
    const scaleY = fullMapHeight / originalHeight;
    const finalScale = Math.max(scaleX, scaleY); // Utiliser le plus grand pour couvrir complètement

    bgFull.setScale(finalScale);


    // Joueur positionné sur la rue centrale (entre les bâtiments)
    player = this.physics.add.sprite(1249, 260, 'static_down', 0);
    player.setOrigin(0.5, 0.5);
    player.setCollideWorldBounds(true);
    player.play('static_down_anim');

    this.physics.world.setBounds(0, 0, VIEW_WIDTH * MAP_COLS, VIEW_HEIGHT * MAP_ROWS);
    this.cameras.main.setBounds(0, 0, VIEW_WIDTH * MAP_COLS, VIEW_HEIGHT * MAP_ROWS);

    // Caméra sur la zone (1,0) où démarre le joueur
    currentX = 1;
    currentY = 0;
    this.cameras.main.scrollX = currentX * VIEW_WIDTH;
    this.cameras.main.scrollY = currentY * VIEW_HEIGHT;

    // --- Collisions ---
    // Zones calculées par scan pixel de l'image annotée (2304x1728 → 2400x1800, scale 25/24).
    // Met DEBUG_COLLISIONS = false une fois les positions validées.
    var DEBUG_COLLISIONS = true;
    var alpha = DEBUG_COLLISIONS ? 0.35 : 0;

    // Réduction du hitbox joueur (sprite 96x80 → corps physique 28x20 centré en bas)
    // Hitbox réduite pour passer dans les petites ruelles (centré sur les pieds)
    player.body.setSize(20, 16);
    player.body.setOffset(38, 54);

    var walls = this.physics.add.staticGroup();
    var scene = this;

    function addWall(x, y, w, h) {
        var rect = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0xff0000, alpha);
        walls.add(rect, false);
    }

    // --- Collisions générées depuis background_hitbox.png ---
    // Zones rouges = non-praticables. Grille 30x30 unités jeu.

    addWall(    0,    0,  840,  210);
    addWall(    0,  210,  780,  270);
    addWall(    0,  480,   90,  480);
    addWall(    0, 1020,   90,   30);
    addWall(    0, 1050,  300,   60);
    addWall(    0, 1110,  330,  120);
    addWall(    0, 1230,  300,   30);
    addWall(    0, 1260,  270,  210);
    addWall(    0, 1470,  240,   30);
    addWall(    0, 1500,  210,  120);
    addWall(    0, 1620,  750,  120);
    addWall(    0, 1740, 1200,   60);
    addWall(  150,  540,  630,  420);
    addWall(  150, 1020,   60,   30);
    addWall(  180,  480,  600,   60);
    addWall(  300, 1560,  300,   60);
    addWall(  330, 1320,  270,  150);
    addWall(  330, 1530,  270,   30);
    addWall(  390, 1020,  210,  300);
    addWall(  420, 1470,  180,   30);
    addWall(  510, 1500,   90,   30);
    addWall(  630, 1410,  120,   90);
    addWall(  660, 1050,  120,   60);
    addWall(  660, 1110,   90,  300);
    addWall(  660, 1500,   90,   30);
    addWall(  810,  300,  390,  660);
    addWall(  810, 1050,  390,  480);
    addWall(  810, 1620,  390,  120);
    addWall(  840, 1020,  360,   30);
    addWall(  840, 1590,  360,   30);
    addWall(  870,    0,  330,  240);
    addWall( 1290,    0,  570,  240);
    addWall( 1290,  300,  570,  660);
    addWall( 1290, 1110,  210,   30);
    addWall( 1290, 1140,  240,  120);
    addWall( 1290, 1290,  570,   60);
    addWall( 1290, 1350,  600,   30);
    addWall( 1290, 1380,  570,  150);
    addWall( 1290, 1590,  570,   60);
    addWall( 1290, 1650,  600,   30);
    addWall( 1290, 1680,  570,   60);
    addWall( 1290, 1740,  600,   60);
    addWall( 1320, 1050,  180,   60);
    addWall( 1530, 1050,  210,   60);
    addWall( 1560, 1110,  180,  150);
    addWall( 1770, 1050,  120,  210);
    addWall( 1920,    0,  480,  240);
    addWall( 1920,  300,  480,  240);
    addWall( 1920,  540,  210,  420);
    addWall( 1920, 1050,  480,  150);
    addWall( 1920, 1200,  330,   30);
    addWall( 1920, 1290,  300,  120);
    addWall( 1920, 1620,  390,  180);
    addWall( 1950, 1020,  450,   30);
    addWall( 1950, 1230,  270,   30);
    addWall( 1950, 1410,  270,  120);
    addWall( 1950, 1590,  360,   30);
    addWall( 1980,  240,  420,   60);
    addWall( 2190,  540,  210,  420);
    addWall( 2250, 1230,  150,  300);
    addWall( 2370, 1590,   30,  210);

    walls.refresh(); // recalcule tous les corps statiques après ajout
    this.physics.add.collider(player, walls);
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
    checkZoneChange.call(this);

}

function checkZoneChange() {
    if (player.x >= (currentX + 1) * VIEW_WIDTH - margin) {
        changeZone.call(this, 1, 0);
    }
    if (player.x <= currentX * VIEW_WIDTH + margin) {
        changeZone.call(this, -1, 0);
    }
    if (player.y >= (currentY + 1) * VIEW_HEIGHT - margin) {
        changeZone.call(this, 0, 1);
    }
    if (player.y <= currentY * VIEW_HEIGHT + margin) {
        changeZone.call(this, 0, -1);
    }
}

function changeZone(dx, dy) {
    const newX = currentX + dx;
    const newY = currentY + dy;

    // limites
    if (newX < 0 || newX >= MAP_COLS || newY < 0 || newY >= MAP_ROWS) return;

    currentX = newX;
    currentY = newY;

    // déplacer la caméra doucement
    this.cameras.main.pan(
        currentX * VIEW_WIDTH + VIEW_WIDTH/2,
        currentY * VIEW_HEIGHT + VIEW_HEIGHT/2,
        300,
        'Power2'
    );

    // replacer le joueur pour qu'il ne reste pas collé au bord
    if (dx === 1) player.x = currentX * VIEW_WIDTH + 10;
    if (dx === -1) player.x = (currentX + 1) * VIEW_WIDTH - 10;
    if (dy === 1) player.y = currentY * VIEW_HEIGHT + 10;
    if (dy === -1) player.y = (currentY + 1) * VIEW_HEIGHT - 10;
}