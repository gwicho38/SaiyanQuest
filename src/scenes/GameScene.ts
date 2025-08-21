import { Player } from '../entities/Player';
import { SpriteManager } from '../systems/SpriteManager';
import { TileMap } from '../systems/TileMap';
import { LightingSystem } from '../systems/LightingSystem';

export class GameScene extends Phaser.Scene {
    private player!: Player;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasdKeys!: any;
    private spriteManager!: SpriteManager;
    private tileMap!: TileMap;
    private lightingSystem!: LightingSystem;

    constructor() {
        super({ key: 'GameScene' });
    }

    create(): void {
        // Initialize systems
        this.spriteManager = new SpriteManager(this);
        this.tileMap = new TileMap(this, 50, 38); // 1600x1200 world with 32px tiles
        this.lightingSystem = new LightingSystem(this);

        // Create HD-2D world
        this.createHD2DWorld();

        // Set up camera bounds for the larger world
        this.physics.world.setBounds(0, 0, 1600, 1200);
        this.cameras.main.setBounds(0, 0, 1600, 1200);

        // Create player with HD-2D sprite
        this.createPlayer();

        // Set up camera to follow player with smooth movement
        this.cameras.main.startFollow(this.player.sprite);
        this.cameras.main.setLerp(0.08, 0.08); // Smoother camera movement
        this.cameras.main.setDeadzone(100, 50); // Only move camera when player moves far enough
        
        // Add camera effects for HD-2D feel
        this.cameras.main.setZoom(1.5); // Slight zoom for pixel art
        this.cameras.main.roundPixels = true; // Keep pixel art crisp

        // Input setup
        this.cursors = this.input.keyboard!.createCursorKeys();
        this.wasdKeys = this.input.keyboard!.addKeys('W,S,A,D,SPACE,SHIFT');

        // Add HD-2D lighting and atmospheric effects
        this.setupHD2DEffects();
    }

    private createHD2DWorld(): void {
        // Generate Octopath-style layered map
        this.tileMap.generateOctopathStyleMap();

        // Add depth fog in the background for HD-2D depth effect
        const depthGradient = this.add.graphics();
        depthGradient.fillGradientStyle(0x2c3e50, 0x2c3e50, 0x34495e, 0x34495e, 0.3, 0.3, 0.1, 0.1);
        depthGradient.fillRect(0, 0, 1600, 1200);
        depthGradient.setDepth(-10);
        depthGradient.setScrollFactor(0.05, 0.05); // Very slow parallax for depth
    }

    private createPlayer(): void {
        // Create player with the HD-2D Goku sprite
        this.player = new Player(this, 800, 600); // Center of world
        this.player.setSprite('goku');
        
        // Set player depth above tiles but below UI
        this.player.sprite.setDepth(10);
    }

    private setupHD2DEffects(): void {
        // Setup depth layers for HD-2D effect
        this.lightingSystem.setupDepthLayers();
        
        // Create depth of field effect
        this.lightingSystem.createDepthOfField();
        
        // Add atmospheric particles
        this.lightingSystem.createAtmosphericEffects();
        
        // Add some static light sources around the world
        this.lightingSystem.addLightSource({
            x: 200, y: 200, radius: 150, intensity: 0.6, color: 0xffddaa, type: 'static'
        });
        
        this.lightingSystem.addLightSource({
            x: 1400, y: 800, radius: 120, intensity: 0.5, color: 0xaaddff, type: 'dynamic'
        });
        
        // Set ambient lighting for outdoor scene
        this.lightingSystem.setAmbientLightLevel(0.6);
    }

    update(): void {
        // Handle input with HD-2D character movement
        let velocityX = 0;
        let velocityY = 0;
        let isRunning = this.wasdKeys.SHIFT.isDown;
        
        const speed = isRunning ? 300 : 180; // Walking/running speeds

        // Movement input
        if (this.cursors.left.isDown || this.wasdKeys.A.isDown) {
            velocityX = -speed;
            this.player.setDirection('left');
        } else if (this.cursors.right.isDown || this.wasdKeys.D.isDown) {
            velocityX = speed;
            this.player.setDirection('right');
        }

        if (this.cursors.up.isDown || this.wasdKeys.W.isDown) {
            velocityY = -speed;
            this.player.setDirection('up');
        } else if (this.cursors.down.isDown || this.wasdKeys.S.isDown) {
            velocityY = speed;
            this.player.setDirection('down');
        }

        // Diagonal movement normalization
        if (velocityX !== 0 && velocityY !== 0) {
            velocityX *= 0.707; // Normalize diagonal movement
            velocityY *= 0.707;
        }

        // Check collision with tilemap
        const nextX = this.player.sprite.x + (velocityX * 0.016); // Predict next position
        const nextY = this.player.sprite.y + (velocityY * 0.016);
        
        if (this.tileMap.isCollisionAt(nextX, this.player.sprite.y)) {
            velocityX = 0;
        }
        if (this.tileMap.isCollisionAt(this.player.sprite.x, nextY)) {
            velocityY = 0;
        }

        // Apply movement
        this.player.move(velocityX, velocityY);

        // Handle attack with energy effects
        if (Phaser.Input.Keyboard.JustDown(this.wasdKeys.SPACE)) {
            this.player.attack();
            this.createEnergyAttackEffect();
        }

        // Update HD-2D systems
        this.tileMap.updateParallax(this.cameras.main.scrollX, this.cameras.main.scrollY);
        this.lightingSystem.update(this.player.sprite.x, this.player.sprite.y);
    }

    private createEnergyAttackEffect(): void {
        const direction = this.player.getDirection();
        let offsetX = 0;
        let offsetY = 0;
        
        // Calculate attack direction
        switch (direction) {
            case 'up': offsetY = -50; break;
            case 'down': offsetY = 50; break;
            case 'left': offsetX = -50; break;
            case 'right': offsetX = 50; break;
        }

        // Create energy blast effect
        const blast = this.add.sprite(
            this.player.sprite.x + offsetX,
            this.player.sprite.y + offsetY,
            'energy_blast'
        );
        
        blast.setScale(1.5);
        blast.setDepth(12);
        blast.setAlpha(0.9);

        // Animate the energy blast
        this.tweens.add({
            targets: blast,
            scaleX: 0.5,
            scaleY: 0.5,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => blast.destroy()
        });

        // Add screen shake for impact
        this.cameras.main.shake(100, 0.01);
    }

    public getPlayer(): Player {
        return this.player;
    }

    public getTileMap(): TileMap {
        return this.tileMap;
    }
}