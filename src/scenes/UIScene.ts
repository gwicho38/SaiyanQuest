import { GameScene } from './GameScene';

export class UIScene extends Phaser.Scene {
    private hpText!: Phaser.GameObjects.Text;
    private levelText!: Phaser.GameObjects.Text;
    private expText!: Phaser.GameObjects.Text;

    constructor() {
        super({ key: 'UIScene' });
    }

    create(): void {
        // Create UI background
        const uiBackground = this.add.graphics();
        uiBackground.fillStyle(0x000000, 0.7);
        uiBackground.fillRect(10, 10, 250, 100);
        uiBackground.setScrollFactor(0);

        // HP Display
        this.hpText = this.add.text(20, 20, 'HP: 100/100', {
            fontSize: '18px',
            color: '#ff0000'
        }).setScrollFactor(0);

        // Level Display
        this.levelText = this.add.text(20, 45, 'Level: 1', {
            fontSize: '18px',
            color: '#00ff00'
        }).setScrollFactor(0);

        // Experience Display
        this.expText = this.add.text(20, 70, 'EXP: 0/100', {
            fontSize: '18px',
            color: '#0000ff'
        }).setScrollFactor(0);

        // Menu button
        const menuButton = this.add.text(this.cameras.main.width - 70, 20, 'Menu', {
            fontSize: '18px',
            color: '#ffffff',
            backgroundColor: '#666666',
            padding: { x: 10, y: 5 }
        }).setScrollFactor(0).setInteractive();

        menuButton.on('pointerdown', () => {
            this.scene.pause('GameScene');
            this.scene.start('MenuScene');
            this.scene.stop('UIScene');
        });

        // Update UI periodically
        this.time.addEvent({
            delay: 100,
            callback: this.updateUI,
            callbackScope: this,
            loop: true
        });
    }

    private updateUI(): void {
        const gameScene = this.scene.get('GameScene') as GameScene;
        if (gameScene && gameScene.scene.isActive()) {
            const player = gameScene.getPlayer();
            if (player) {
                this.hpText.setText(`HP: ${player.currentHp}/${player.maxHp}`);
                this.levelText.setText(`Level: ${player.level}`);
                this.expText.setText(`EXP: ${player.experience}/${player.getRequiredExp()}`);
            }
        }
    }
}