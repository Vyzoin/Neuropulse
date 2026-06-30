// --- Config Phaser ---
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

var game = null;
var cursor;
var player;
var lastDirection = 'down';
var runAnim = 15;
var activePlayerData = null;
var keyZ, keyQ, keyS, keyD;  // touches ZQSD déclarées globalement

let isInitializing = true;
let isPaused = false;
let pauseMenuGroup = null;

// --- DOMContentLoaded unique ---
document.addEventListener('DOMContentLoaded', function () {
  activePlayerData = getActivePlayer();
  console.log('Personnage actif en session :', activePlayerData);

  const summary = document.getElementById('activePlayerSummary');
  if (summary && activePlayerData) {
    summary.textContent = `${activePlayerData.firstname} ${activePlayerData.name} (Slot ${activePlayerData.slot}, ${activePlayerData.sexe})`;
  }
});

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

// --- Constantes carte ---
const VIEW_WIDTH = 800;
const VIEW_HEIGHT = 600;
const MAP_COLS = 3;
const MAP_ROWS = 3;

let currentX = 1;
let currentY = 1;
const margin = 5;

// --- Chargement d'état ---
async function loadPlayerState() {
  if (!activePlayerData) return null;

  try {
    const token = getToken();
    const res = await fetch(`${API}/api/player/${activePlayerData.id}/state`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success && data.state) {
      console.log('LOAD STATE', data.state);
      return data.state;
    }
  } catch (err) {
    console.error('Erreur loadPlayerState', err);
  }

  return null;
}

// --- Sauvegarde d'état ---
async function savePlayerState() {
  if (!activePlayerData || !player) return;

  const maxX = VIEW_WIDTH * MAP_COLS;
  const maxY = VIEW_HEIGHT * MAP_ROWS;
  const safeX = Phaser.Math.Clamp(player.x, margin, maxX - margin);
  const safeY = Phaser.Math.Clamp(player.y, margin, maxY - margin);

  const body = {
    pos_x: safeX,
    pos_y: safeY,
    zone_x: currentX,
    zone_y: currentY,
    hp: 100,
    mana: 50
  };

  try {
    const token = getToken();
    const res = await fetch(`${API}/api/player/${activePlayerData.id}/state`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      console.error('Erreur HTTP savePlayerState', res.status);
    } else {
      console.log('État sauvegardé', body);
    }
  } catch (err) {
    console.error('Erreur savePlayerState', err);
  }
}

window.addEventListener('beforeunload', () => {
  savePlayerState();
});

// --- Scènes Phaser ---
function preload() {
  console.log('preload start');
  this.load.image('background', '../assets/background.png');
  this.load.spritesheet('static_down',  '../assets/character/static_down.png',  { frameWidth: 96, frameHeight: 80 });
  this.load.spritesheet('static_left',  '../assets/character/static_left.png',  { frameWidth: 96, frameHeight: 80 });
  this.load.spritesheet('static_right', '../assets/character/static_right.png', { frameWidth: 96, frameHeight: 80 });
  this.load.spritesheet('static_up',    '../assets/character/static_up.png',    { frameWidth: 96, frameHeight: 80 });
  this.load.spritesheet('run_down',  '../assets/character/run_down.png',  { frameWidth: 96, frameHeight: 80 });
  this.load.spritesheet('run_left',  '../assets/character/run_left.png',  { frameWidth: 96, frameHeight: 80 });
  this.load.spritesheet('run_right', '../assets/character/run_right.png', { frameWidth: 96, frameHeight: 80 });
  this.load.spritesheet('run_up',    '../assets/character/run_up.png',    { frameWidth: 96, frameHeight: 80 });
}

function create() {
  console.log('create start');

  // Contrôles clavier — flèches ET ZQSD
  cursor = this.input.keyboard.createCursorKeys();
  keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
  keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

  this.input.keyboard.on('keydown-ESC', function () {
    if (isInitializing) return;
    if (isPaused) resumeGame.call(this);
    else pauseGame.call(this);
  }, this);

  // Animations
  const animDefs = [
    { key: 'static_down_anim',  sprite: 'static_down'  },
    { key: 'static_left_anim',  sprite: 'static_left'  },
    { key: 'static_right_anim', sprite: 'static_right' },
    { key: 'static_up_anim',    sprite: 'static_up'    },
    { key: 'run_down_anim',     sprite: 'run_down',  frameRate: runAnim },
    { key: 'run_left_anim',     sprite: 'run_left',  frameRate: runAnim },
    { key: 'run_right_anim',    sprite: 'run_right', frameRate: runAnim },
    { key: 'run_up_anim',       sprite: 'run_up',    frameRate: runAnim }
  ];

  animDefs.forEach(a => {
    this.anims.create({
      key: a.key,
      frames: this.anims.generateFrameNumbers(a.sprite, { start: 0, end: 7 }),
      frameRate: a.frameRate || 10,
      repeat: -1
    });
  });

  // Carte complète
  const fullMapWidth  = VIEW_WIDTH  * MAP_COLS;
  const fullMapHeight = VIEW_HEIGHT * MAP_ROWS;

  const bgFull = this.add.image(fullMapWidth / 2, fullMapHeight / 2, 'background');
  bgFull.setOrigin(0.5, 0.5);
  const scaleX = fullMapWidth  / bgFull.texture.source[0].width;
  const scaleY = fullMapHeight / bgFull.texture.source[0].height;
  bgFull.setScale(Math.max(scaleX, scaleY));

  // Joueur (position par défaut, écrasée par loadPlayerState)
  player = this.physics.add.sprite(1249, 260, 'static_down', 0);
  player.setOrigin(0.5, 0.5);
  player.setCollideWorldBounds(true);
  player.play('static_down_anim');

  // Nom au-dessus de la tête
  if (activePlayerData) {
    const nameLabel = this.add.text(
      player.x, player.y - 40,
      `${activePlayerData.firstname} ${activePlayerData.name}`,
      { fontSize: '18px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 }
    );
    nameLabel.setOrigin(0.5, 0.5);
    this.events.on('update', () => {
      nameLabel.x = player.x;
      nameLabel.y = player.y - 40;
    });
  }

  // Overlay identité (coin haut-gauche)
  if (activePlayerData) {
    this.add.text(
      32, 32,
      `${activePlayerData.firstname} ${activePlayerData.name} (Slot ${activePlayerData.slot})`,
      { fontSize: '18px', fill: '#ffffff', stroke: '#000000', strokeThickness: 2 }
    );
  }

  // Monde physique et caméra
  this.physics.world.setBounds(0, 0, fullMapWidth, fullMapHeight);
  this.cameras.main.setBounds(0, 0, fullMapWidth, fullMapHeight);

  currentX = 1;
  currentY = 0;
  this.cameras.main.scrollX = currentX * VIEW_WIDTH;
  this.cameras.main.scrollY = currentY * VIEW_HEIGHT;

  // Hitbox réduite
  player.body.setSize(20, 16);
  player.body.setOffset(38, 54);

  const scene = this;

  // Charger la position sauvegardée, puis déverrouiller update()
  loadPlayerState().then(state => {
    if (state) {
      player.x = state.pos_x;
      player.y = state.pos_y;
      currentX  = state.zone_x;
      currentY  = state.zone_y;
      scene.cameras.main.scrollX = currentX * VIEW_WIDTH;
      scene.cameras.main.scrollY = currentY * VIEW_HEIGHT;
    }
    isInitializing = false;
  });

  // Collisions
  const DEBUG_COLLISIONS = false;
  const alpha = DEBUG_COLLISIONS ? 0.35 : 0;
  const walls = this.physics.add.staticGroup();

  function addWall(x, y, w, h) {
    const rect = scene.add.rectangle(x + w / 2, y + h / 2, w, h, 0xff0000, alpha);
    walls.add(rect, false);
  }

  addWall(0, 0, 840, 210);
  addWall(0, 210, 780, 270);
  addWall(0, 480, 90, 480);
  addWall(0, 1050, 300, 60);
  addWall(0, 1110, 330, 120);
  addWall(0, 1230, 300, 30);
  addWall(0, 1260, 270, 210);
  addWall(0, 1470, 240, 30);
  addWall(0, 1500, 210, 120);
  addWall(0, 1620, 750, 120);
  addWall(0, 1740, 1200, 60);
  addWall(150, 540, 630, 420);
  addWall(180, 480, 600, 60);
  addWall(300, 1560, 300, 60);
  addWall(330, 1320, 270, 150);
  addWall(330, 1530, 270, 30);
  addWall(390, 1020, 210, 300);
  addWall(420, 1470, 180, 30);
  addWall(510, 1500, 90, 30);
  addWall(660, 1410, 90, 90);
  addWall(660, 1050, 90, 60);
  addWall(660, 1110, 90, 300);
  addWall(660, 1500, 90, 30);
  addWall(810, 300, 390, 660);
  addWall(810, 1050, 390, 480);
  addWall(810, 1620, 390, 120);
  addWall(840, 1020, 360, 30);
  addWall(840, 1590, 360, 30);
  addWall(870, 0, 330, 240);
  addWall(1290, 0, 570, 240);
  addWall(1290, 300, 570, 660);
  addWall(1290, 1110, 210, 30);
  addWall(1290, 1140, 240, 120);
  addWall(1290, 1290, 570, 60);
  addWall(1290, 1350, 570, 30);
  addWall(1290, 1380, 570, 150);
  addWall(1290, 1590, 570, 60);
  addWall(1290, 1650, 570, 30);
  addWall(1290, 1680, 570, 60);
  addWall(1290, 1740, 570, 60);
  addWall(1320, 1050, 180, 60);
  addWall(1530, 1050, 210, 60);
  addWall(1560, 1110, 180, 150);
  addWall(1770, 1050, 100, 210);
  addWall(1920, 0, 480, 240);
  addWall(1920, 300, 480, 240);
  addWall(1920, 540, 210, 420);
  addWall(1920, 1050, 480, 150);
  addWall(1920, 1200, 300, 30);
  addWall(1950, 1290, 270, 120);
  addWall(1920, 1620, 390, 180);
  addWall(1920, 1020, 480, 30);
  addWall(1920, 1230, 270, 30);
  addWall(1950, 1410, 270, 120);
  addWall(1950, 1590, 360, 30);
  addWall(1980, 240, 420, 60);
  addWall(2190, 540, 210, 420);
  addWall(2250, 1230, 150, 300);
  addWall(2370, 1590, 30, 210);

  walls.refresh();
  this.physics.add.collider(player, walls);
}

function pauseGame() {
  isPaused = true;
  this.physics.pause();
  player.setVelocity(0, 0);
  player.play('static_' + lastDirection + '_anim', true);

  const scene = this;
  pauseMenuGroup = scene.add.group();

  // Fond semi-transparent
  const overlay = scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.65);
  overlay.setScrollFactor(0).setDepth(100);
  pauseMenuGroup.add(overlay);

  // Bordure du panneau
  const border = scene.add.rectangle(400, 300, 308, 228, 0x6655aa, 1);
  border.setScrollFactor(0).setDepth(101);
  pauseMenuGroup.add(border);

  // Panneau principal
  const panel = scene.add.rectangle(400, 300, 300, 220, 0x1a1a2e, 1);
  panel.setScrollFactor(0).setDepth(102);
  pauseMenuGroup.add(panel);

  // Titre
  const title = scene.add.text(400, 220, 'PAUSE', {
    fontSize: '34px', fill: '#e0d0ff', fontStyle: 'bold',
    stroke: '#000000', strokeThickness: 3
  });
  title.setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(103);
  pauseMenuGroup.add(title);

  // Bouton Reprendre
  const resumeBtn = scene.add.text(400, 295, '  Reprendre  ', {
    fontSize: '20px', fill: '#ffffff',
    backgroundColor: '#3355aa',
    padding: { x: 18, y: 10 }
  });
  resumeBtn.setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(103);
  resumeBtn.setInteractive({ useHandCursor: true });
  resumeBtn.on('pointerover', () => resumeBtn.setStyle({ fill: '#aaddff', backgroundColor: '#4466cc' }));
  resumeBtn.on('pointerout',  () => resumeBtn.setStyle({ fill: '#ffffff', backgroundColor: '#3355aa' }));
  resumeBtn.on('pointerdown', () => resumeGame.call(scene));
  pauseMenuGroup.add(resumeBtn);

  // Bouton Menu Principal
  const menuBtn = scene.add.text(400, 360, '  Menu Principal  ', {
    fontSize: '20px', fill: '#ffffff',
    backgroundColor: '#7a2020',
    padding: { x: 18, y: 10 }
  });
  menuBtn.setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(103);
  menuBtn.setInteractive({ useHandCursor: true });
  menuBtn.on('pointerover', () => menuBtn.setStyle({ fill: '#ffbbbb', backgroundColor: '#aa3030' }));
  menuBtn.on('pointerout',  () => menuBtn.setStyle({ fill: '#ffffff', backgroundColor: '#7a2020' }));
  menuBtn.on('pointerdown', () => goToMainMenu());
  pauseMenuGroup.add(menuBtn);
}

function resumeGame() {
  isPaused = false;
  if (pauseMenuGroup) {
    pauseMenuGroup.getChildren().forEach(child => child.destroy());
    pauseMenuGroup.clear(true, true);
    pauseMenuGroup = null;
  }
  this.physics.resume();
}

async function goToMainMenu() {
  await savePlayerState();
  window.location.href = '../webpages/character_save.html';
}

function update() {
  if (isInitializing || isPaused) return;

  if (cursor.left.isDown || keyQ.isDown) {
    player.play('run_left_anim', true);
    player.setVelocityX(-100);
    player.setVelocityY(0);
    lastDirection = 'left';
  } else if (cursor.right.isDown || keyD.isDown) {
    player.play('run_right_anim', true);
    player.setVelocityX(100);
    player.setVelocityY(0);
    lastDirection = 'right';
  } else if (cursor.up.isDown || keyZ.isDown) {
    player.play('run_up_anim', true);
    player.setVelocityY(-100);
    player.setVelocityX(0);
    lastDirection = 'up';
  } else if (cursor.down.isDown || keyS.isDown) {
    player.play('run_down_anim', true);
    player.setVelocityY(100);
    player.setVelocityX(0);
    lastDirection = 'down';
  } else {
    player.setVelocity(0, 0);
    const idleAnim = {
      down:  'static_down_anim',
      up:    'static_up_anim',
      left:  'static_left_anim',
      right: 'static_right_anim'
    }[lastDirection] || 'static_down_anim';
    player.play(idleAnim, true);
  }

  checkZoneChange.call(this);
}

function checkZoneChange() {
  if (player.x >= (currentX + 1) * VIEW_WIDTH - margin)  changeZone.call(this,  1,  0);
  if (player.x <= currentX * VIEW_WIDTH + margin)         changeZone.call(this, -1,  0);
  if (player.y >= (currentY + 1) * VIEW_HEIGHT - margin)  changeZone.call(this,  0,  1);
  if (player.y <= currentY * VIEW_HEIGHT + margin)         changeZone.call(this,  0, -1);
}

function changeZone(dx, dy) {
  const newX = currentX + dx;
  const newY = currentY + dy;

  if (newX < 0 || newX >= MAP_COLS || newY < 0 || newY >= MAP_ROWS) return;

  currentX = newX;
  currentY = newY;

  this.cameras.main.pan(
    currentX * VIEW_WIDTH  + VIEW_WIDTH  / 2,
    currentY * VIEW_HEIGHT + VIEW_HEIGHT / 2,
    300,
    'Power2'
  );

  if (dx ===  1) player.x = currentX * VIEW_WIDTH + 10;
  if (dx === -1) player.x = (currentX + 1) * VIEW_WIDTH - 10;
  if (dy ===  1) player.y = currentY * VIEW_HEIGHT + 10;
  if (dy === -1) player.y = (currentY + 1) * VIEW_HEIGHT - 10;
}