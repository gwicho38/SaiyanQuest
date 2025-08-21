export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // Title
        this.add.text(width / 2, height / 3, 'Dragon Ball Z\nSaiyan Quest', {
            fontSize: '48px',
            color: '#ff6b00',
            align: 'center'
        }).setOrigin(0.5);

        // Start button
        const startButton = this.add.text(width / 2, height / 2, 'Start Game', {
            fontSize: '32px',
            color: '#ffffff',
            backgroundColor: '#ff6b00',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive();

        startButton.on('pointerdown', () => {
            this.scene.start('GameScene');
            this.scene.start('UIScene');
        });

        startButton.on('pointerover', () => {
            startButton.setStyle({ backgroundColor: '#ff8c00' });
        });

        startButton.on('pointerout', () => {
            startButton.setStyle({ backgroundColor: '#ff6b00' });
        });

        // Instructions
        this.add.text(width / 2, height * 0.75, 'Use WASD or Arrow Keys to move\nPress SPACE to attack', {
            fontSize: '18px',
            color: '#cccccc',
            align: 'center'
        }).setOrigin(0.5);
    }
}