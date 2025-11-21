var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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

const game = new Phaser.Game(config);

var cursor;
var player;
var lastDirection = 'down';
var runAnim = 15;

function preload() {
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