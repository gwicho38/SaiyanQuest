import * as PIXI from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Game } from '../core/Game';
import { AssetLoader } from '../core/AssetLoader';
import { Player } from '../entities/Player';
import { TileMap } from '../systems/TileMap';
import { HD2DRenderer } from '../systems/HD2DRenderer';

export class GameScene extends BaseScene {
    private player!: Player;
    private tileMap!: TileMap;
    private hd2dRenderer!: HD2DRenderer;
    private worldContainer!: PIXI.Container;
    private backgroundContainer!: PIXI.Container;
    private gameContainer!: PIXI.Container;
    private uiContainer!: PIXI.Container;
    private camera: { x: number; y: number; targetX: number; targetY: number } = {
        x: 0, y: 0, targetX: 0, targetY: 0
    };

    // Game world settings
    private readonly WORLD_WIDTH = 1600;
    private readonly WORLD_HEIGHT = 1200;
    private readonly TILE_SIZE = 32;

    constructor(game: Game) {
        super(game);
    }

    protected async onCreate(): Promise<void> {
        console.log('Creating Dragon Ball Z game scene...');
        
        this.setupContainers();
        this.createWorld();
        this.createPlayer();
        this.setupCamera();
        this.createUI();
        
        console.log('Dragon Ball Z game scene created successfully');
    }

    private setupContainers(): void {
        // Create layered containers for proper rendering order
        this.backgroundContainer = new PIXI.Container();
        this.backgroundContainer.label = 'Background';
        this.backgroundContainer.zIndex = -1000;

        this.worldContainer = new PIXI.Container();
        this.worldContainer.label = 'World';
        this.worldContainer.zIndex = 0;

        this.gameContainer = new PIXI.Container();
        this.gameContainer.label = 'Game';
        this.gameContainer.zIndex = 100;

        this.uiContainer = new PIXI.Container();
        this.uiContainer.label = 'UI';
        this.uiContainer.zIndex = 1000;

        this.container.addChild(this.backgroundContainer);
        this.container.addChild(this.worldContainer);
        this.container.addChild(this.gameContainer);
        this.container.addChild(this.uiContainer);

        // Enable sorting by zIndex
        this.container.sortableChildren = true;
    }

    private createWorld(): void {
        // Initialize HD-2D renderer
        this.hd2dRenderer = new HD2DRenderer(this.game.getApp());
        
        // Create tilemap
        const tilesWidth = Math.floor(this.WORLD_WIDTH / this.TILE_SIZE);
        const tilesHeight = Math.floor(this.WORLD_HEIGHT / this.TILE_SIZE);
        
        console.log(`Creating TileMap: ${tilesWidth}x${tilesHeight} tiles`);
        
        this.tileMap = new TileMap(tilesWidth, tilesHeight, this.TILE_SIZE);
        
        // Generate the world
        this.generateDBZWorld();
        
        // Add world elements to containers
        this.worldContainer.addChild(this.tileMap.getContainer());
    }

    private generateDBZWorld(): void {
        const mapWidth = Math.floor(this.WORLD_WIDTH / this.TILE_SIZE);
        const mapHeight = Math.floor(this.WORLD_HEIGHT / this.TILE_SIZE);
        
        console.log(`Generating world: ${mapWidth}x${mapHeight} tiles (${this.WORLD_WIDTH}x${this.WORLD_HEIGHT} pixels)`);
        
        // Create base terrain
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                let tileType = 'grass';
                
                // Create varied terrain
                const centerX = Math.floor(mapWidth / 2);
                const centerY = Math.floor(mapHeight / 2);
                const distanceFromCenter = Math.sqrt(
                    Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
                );
                
                // Different terrain based on distance from center
                if (distanceFromCenter > mapWidth * 0.4) {
                    tileType = 'stone'; // Mountains/rocky areas at edges
                } else if (Math.random() < 0.1) {
                    tileType = 'water'; // Random water patches
                } else if (Math.random() < 0.3) {
                    tileType = 'stone'; // Random stone patches
                }
                
                this.tileMap.setTile(x, y, tileType as any);
            }
        }
        
        // Add special areas
        this.createTrainingGrounds();
        this.createKameHouse();
        this.createCapsuleCorp();
    }

    private createTrainingGrounds(): void {
        // Create a clearing for training
        const centerX = Math.floor(this.WORLD_WIDTH / this.TILE_SIZE / 2);
        const centerY = Math.floor(this.WORLD_HEIGHT / this.TILE_SIZE / 2);
        const radius = 8;
        
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
                if (distance <= radius) {
                    this.tileMap.setTile(x, y, 'grass');
                }
            }
        }
        
        console.log(`Created training grounds at (${centerX}, ${centerY})`);
    }

    private createKameHouse(): void {
        // Small house area
        const houseX = 10;
        const houseY = 10;
        
        for (let y = houseY; y < houseY + 4; y++) {
            for (let x = houseX; x < houseX + 4; x++) {
                this.tileMap.setTile(x, y, 'stone');
            }
        }
        
        console.log(`Created Kame House at (${houseX}, ${houseY})`);
    }

    private createCapsuleCorp(): void {
        // Larger building area
        const corpX = Math.floor(this.WORLD_WIDTH / this.TILE_SIZE) - 15;
        const corpY = Math.floor(this.WORLD_HEIGHT / this.TILE_SIZE) - 15;
        
        for (let y = corpY; y < corpY + 8; y++) {
            for (let x = corpX; x < corpX + 8; x++) {
                this.tileMap.setTile(x, y, 'stone');
            }
        }
        
        console.log(`Created Capsule Corp at (${corpX}, ${corpY})`);
    }

    private createPlayer(): void {
        // Create player at the center of the world
        const startX = this.WORLD_WIDTH / 2;
        const startY = this.WORLD_HEIGHT / 2;
        
        this.player = new Player(startX, startY);
        this.gameContainer.addChild(this.player.getSprite());
        
        console.log(`Created player at (${startX}, ${startY})`);
    }

    private setupCamera(): void {
        // Initialize camera to follow player
        this.camera.x = this.player.getX() - this.game.getApp().screen.width / 2;
        this.camera.y = this.player.getY() - this.game.getApp().screen.height / 2;
        this.camera.targetX = this.camera.x;
        this.camera.targetY = this.camera.y;
        
        this.updateCameraPosition();
    }

    private updateCameraPosition(): void {
        // Smooth camera following
        const lerp = 0.1;
        this.camera.x += (this.camera.targetX - this.camera.x) * lerp;
        this.camera.y += (this.camera.targetY - this.camera.y) * lerp;
        
        // Clamp camera to world bounds
        const app = this.game.getApp();
        this.camera.x = Math.max(0, Math.min(this.WORLD_WIDTH - app.screen.width, this.camera.x));
        this.camera.y = Math.max(0, Math.min(this.WORLD_HEIGHT - app.screen.height, this.camera.y));
        
        // Apply camera transform to world containers
        this.worldContainer.x = -this.camera.x;
        this.worldContainer.y = -this.camera.y;
        this.gameContainer.x = -this.camera.x;
        this.gameContainer.y = -this.camera.y;
    }

    private createUI(): void {
        // Create health and ki bars
        this.createHealthBar();
        this.createKiBar();
        this.createCharacterInfo();
        this.createControlsHint();
    }

    private createHealthBar(): void {
        const padding = 20;
        
        // Health bar background
        const healthBg = new PIXI.Graphics();
        healthBg.rect(0, 0, 204, 24);
        healthBg.fill(0x000000, 0.7);
        healthBg.x = padding;
        healthBg.y = padding;
        this.uiContainer.addChild(healthBg);
        
        // Health bar fill
        const healthFill = new PIXI.Graphics();
        healthFill.rect(0, 0, 200, 20);
        healthFill.fill(0xff0000);
        healthFill.x = padding + 2;
        healthFill.y = padding + 2;
        this.uiContainer.addChild(healthFill);
        
        // Health bar label
        const healthLabel = this.createText('HP', {
            fontSize: 16,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        healthLabel.x = padding + 210;
        healthLabel.y = padding + 4;
        this.uiContainer.addChild(healthLabel);
    }

    private createKiBar(): void {
        const padding = 20;
        const yOffset = 50;
        
        // Ki bar background
        const kiBg = new PIXI.Graphics();
        kiBg.rect(0, 0, 204, 24);
        kiBg.fill(0x000000, 0.7);
        kiBg.x = padding;
        kiBg.y = padding + yOffset;
        this.uiContainer.addChild(kiBg);
        
        // Ki bar fill
        const kiFill = new PIXI.Graphics();
        kiFill.rect(0, 0, 200, 20);
        kiFill.fill(0x00ffff);
        kiFill.x = padding + 2;
        kiFill.y = padding + yOffset + 2;
        this.uiContainer.addChild(kiFill);
        
        // Ki bar label
        const kiLabel = this.createText('KI', {
            fontSize: 16,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        kiLabel.x = padding + 210;
        kiLabel.y = padding + yOffset + 4;
        this.uiContainer.addChild(kiLabel);
    }

    private createCharacterInfo(): void {
        const app = this.game.getApp();
        
        // Character name and level
        const characterInfo = this.createText('GOKU - Level 1', {
            fontSize: 18,
            fill: 0xffd700,
            fontWeight: 'bold',
            stroke: { color: 0x000000, width: 2 }
        });
        characterInfo.x = app.screen.width - 200;
        characterInfo.y = 20;
        this.uiContainer.addChild(characterInfo);
        
        // Power level
        const powerLevel = this.createText('Power Level: 1,000', {
            fontSize: 14,
            fill: 0xffffff,
            stroke: { color: 0x000000, width: 1 }
        });
        powerLevel.x = app.screen.width - 200;
        powerLevel.y = 45;
        this.uiContainer.addChild(powerLevel);
    }

    private createControlsHint(): void {
        const app = this.game.getApp();
        
        const controls = this.createText(
            'WASD: Move | Space: Attack | Z: Ki Blast | X: Special | Q/E: Transform',
            {
                fontSize: 12,
                fill: 0xcccccc,
                stroke: { color: 0x000000, width: 1 }
            }
        );
        controls.x = app.screen.width / 2;
        controls.y = app.screen.height - 30;
        controls.anchor.set(0.5);
        this.uiContainer.addChild(controls);
    }

    protected onUpdate(deltaTime: number): void {
        // Update player
        this.updatePlayer(deltaTime);
        
        // Update camera
        this.updateCameraFollow();
        this.updateCameraPosition();
        
        // Update HD-2D effects
        this.hd2dRenderer.update(deltaTime);
        
        // Handle input
        this.handleInput();
    }

    private updatePlayer(deltaTime: number): void {
        this.player.update(deltaTime);
        
        // Check tile collisions
        const playerTileX = Math.floor(this.player.getX() / this.TILE_SIZE);
        const playerTileY = Math.floor(this.player.getY() / this.TILE_SIZE);
        
        // Simple collision detection with world bounds
        const newX = Math.max(16, Math.min(this.WORLD_WIDTH - 16, this.player.getX()));
        const newY = Math.max(16, Math.min(this.WORLD_HEIGHT - 16, this.player.getY()));
        
        this.player.setPosition(newX, newY);
    }

    private updateCameraFollow(): void {
        // Update camera target to follow player
        this.camera.targetX = this.player.getX() - this.game.getApp().screen.width / 2;
        this.camera.targetY = this.player.getY() - this.game.getApp().screen.height / 2;
    }

    private handleInput(): void {
        const input = this.game.getInputManager();
        
        // Movement
        const movement = input.getMovementVector();
        const isRunning = input.isRunning();
        
        if (movement.x !== 0 || movement.y !== 0) {
            this.player.move(movement.x, movement.y, isRunning);
        } else {
            this.player.stop();
        }
        
        // Combat
        if (input.isAttacking()) {
            this.player.attack();
            this.createAttackEffect();
        }
        
        if (input.isKiAttacking()) {
            this.player.kiAttack();
            this.createKiBlastEffect();
        }
        
        if (input.isSpecialAttacking()) {
            this.player.specialAttack();
            this.createSpecialAttackEffect();
        }
        
        // Transformations
        if (input.isTransformNext()) {
            this.player.transformNext();
        }
        
        if (input.isTransformPrev()) {
            this.player.transformPrevious();
        }
        
        // Menu
        if (input.isMenuPressed()) {
            this.pauseGame();
        }
    }

    private createAttackEffect(): void {
        const playerX = this.player.getX();
        const playerY = this.player.getY();
        
        // Create punch effect
        const effect = new PIXI.Graphics();
        effect.circle(0, 0, 20);
        effect.fill(0xffff00, 0.7);
        effect.x = playerX;
        effect.y = playerY;
        this.gameContainer.addChild(effect);
        
        // Animate effect
        this.tween(effect, { alpha: 0 }, 300).then(() => {
            effect.destroy();
        });
        
        this.game.getAudioManager().playSfx('punch');
    }

    private createKiBlastEffect(): void {
        const playerX = this.player.getX();
        const playerY = this.player.getY();
        
        // Create ki blast
        const kiBlast = new PIXI.Graphics();
        kiBlast.circle(0, 0, 15);
        kiBlast.fill(0x00ffff);
        kiBlast.x = playerX;
        kiBlast.y = playerY;
        this.gameContainer.addChild(kiBlast);
        
        // Move ki blast forward
        const direction = this.player.getDirection();
        let targetX = playerX;
        let targetY = playerY;
        
        switch (direction) {
            case 'up': targetY -= 200; break;
            case 'down': targetY += 200; break;
            case 'left': targetX -= 200; break;
            case 'right': targetX += 200; break;
        }
        
        // Animate ki blast
        Promise.all([
            this.tween(kiBlast, { x: targetX, y: targetY }, 800),
            this.tween(kiBlast, { alpha: 0 }, 800)
        ]).then(() => {
            kiBlast.destroy();
        });
        
        this.game.getAudioManager().playSfx('ki_blast');
    }

    private createSpecialAttackEffect(): void {
        const playerX = this.player.getX();
        const playerY = this.player.getY();
        
        // Create Kamehameha effect
        const wave = new PIXI.Graphics();
        wave.rect(-100, -20, 200, 40);
        wave.fill(0x0088ff);
        wave.x = playerX;
        wave.y = playerY;
        this.gameContainer.addChild(wave);
        
        // Animate wave
        Promise.all([
            this.tween(wave, { scaleX: 3, scaleY: 2 }, 1000),
            this.tween(wave, { alpha: 0 }, 1000)
        ]).then(() => {
            wave.destroy();
        });
        
        this.game.getAudioManager().playSfx('kamehameha');
    }

    private pauseGame(): void {
        console.log('Pausing game...');
        // TODO: Implement pause menu
    }

    protected async onSceneEnter(): Promise<void> {
        console.log('Entering Dragon Ball Z game world...');
        
        // Start game music
        this.game.getAudioManager().playMusic('overworld_theme', true);
        
        // Create new save data if starting new game
        const saveManager = this.game.getSaveManager();
        if (!saveManager.hasSaveData()) {
            const newSave = saveManager.createNewSave();
            saveManager.saveGame(newSave);
        }
        
        // Fade in
        this.container.alpha = 0;
        await this.fadeIn(this.container, 1000);
    }

    protected onSceneExit(): void {
        console.log('Exiting Dragon Ball Z game world...');
        
        // Stop game music
        this.game.getAudioManager().stopMusic(true);
        
        // Save game state
        this.saveGameState();
    }

    private saveGameState(): void {
        const saveManager = this.game.getSaveManager();
        const currentSave = saveManager.getCurrentSave();
        
        if (currentSave) {
            // Update player position
            currentSave.playerData.position.x = this.player.getX();
            currentSave.playerData.position.y = this.player.getY();
            
            // Update play time
            saveManager.updatePlayTime(0.016); // One frame of time
            
            // Save to storage
            saveManager.saveGame(currentSave);
        }
    }

    protected onResize(width: number, height: number): void {
        // Update UI positions
        const characterInfo = this.uiContainer.children.find(child => 
            child instanceof PIXI.Text && child.text.includes('GOKU')
        ) as PIXI.Text;
        
        if (characterInfo) {
            characterInfo.x = width - 200;
        }
        
        const controls = this.uiContainer.children.find(child => 
            child instanceof PIXI.Text && child.text.includes('WASD')
        ) as PIXI.Text;
        
        if (controls) {
            controls.x = width / 2;
            controls.y = height - 30;
        }
        
        // Update camera bounds
        this.updateCameraPosition();
    }

    public getPlayer(): Player {
        return this.player;
    }

    public getTileMap(): TileMap {
        return this.tileMap;
    }
}