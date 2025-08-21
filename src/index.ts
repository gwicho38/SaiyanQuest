import * as Phaser from 'phaser';
import { GameConfig } from './config/GameConfig';
import { PreloadScene } from './scenes/PreloadScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { UIScene } from './scenes/UIScene';

export class SaiyanQuestGame {
    private game: Phaser.Game;

    constructor() {
        // Register scenes
        const config: Phaser.Types.Core.GameConfig = {
            ...GameConfig,
            scene: [
                PreloadScene,
                MenuScene,
                GameScene,
                UIScene
            ]
        };

        this.game = new Phaser.Game(config);
    }

    public getGame(): Phaser.Game {
        return this.game;
    }
}

// Initialize the game when the DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    new SaiyanQuestGame();
});