import { SpriteManager } from '../systems/SpriteManager';

export class PreloadScene extends Phaser.Scene {
    private spriteManager!: SpriteManager;
    private loadingSteps: string[] = [];
    private currentStep = 0;

    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload(): void {
        this.spriteManager = new SpriteManager(this);
        
        // Create loading UI
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

        const loadingText = this.add.text(width / 2, height / 2 - 50, 'Generating HD-2D Assets...', {
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const percentText = this.add.text(width / 2, height / 2, '0%', {
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);

        const assetText = this.add.text(width / 2, height / 2 + 50, '', {
            fontSize: '14px',
            color: '#ffffff'
        }).setOrigin(0.5);

        // Define loading steps
        this.loadingSteps = [
            'Generating Character Sprites',
            'Creating HD-2D Tiles', 
            'Setting up Animations',
            'Preparing Lighting Effects',
            'Finalizing Assets'
        ];

        // Try to load external assets first, fallback to generated ones
        this.load.image('player', 'assets/player.png');
        this.load.image('enemy', 'assets/enemy.png');

        // Update progress bar
        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
            percentText.setText(Math.floor(value * 100) + '%');
        });

        this.load.on('fileprogress', (file: any) => {
            assetText.setText('Loading asset: ' + file.key);
        });

        this.load.on('complete', () => {
            // Generate procedural assets
            this.generateAssets(progressBar, percentText, assetText);
        });
    }

    private generateAssets(
        progressBar: Phaser.GameObjects.Graphics,
        percentText: Phaser.GameObjects.Text,
        assetText: Phaser.GameObjects.Text
    ): void {
        const updateProgress = () => {
            this.currentStep++;
            const progress = this.currentStep / this.loadingSteps.length;
            
            progressBar.clear();
            progressBar.fillStyle(0xff6b00, 1);
            progressBar.fillRect(400 - 150, 300 - 15, 300 * progress, 30);
            percentText.setText(Math.floor(progress * 100) + '%');
            
            if (this.currentStep < this.loadingSteps.length) {
                assetText.setText(this.loadingSteps[this.currentStep]);
            }
        };

        // Step 1: Generate Character Sprites
        assetText.setText(this.loadingSteps[0]);
        this.time.delayedCall(200, () => {
            this.generateCharacterSprites();
            updateProgress();
            
            // Step 2: Create HD-2D Tiles
            this.time.delayedCall(300, () => {
                this.generateTileAssets();
                updateProgress();
                
                // Step 3: Setup Animations  
                this.time.delayedCall(300, () => {
                    this.setupAnimations();
                    updateProgress();
                    
                    // Step 4: Lighting Effects
                    this.time.delayedCall(200, () => {
                        this.generateEffects();
                        updateProgress();
                        
                        // Step 5: Finalize
                        this.time.delayedCall(200, () => {
                            updateProgress();
                            this.finishLoading(progressBar, percentText, assetText);
                        });
                    });
                });
            });
        });
    }

    private generateCharacterSprites(): void {
        // Generate Goku-style character (orange gi)
        this.spriteManager.generateCharacterSprite({
            name: 'goku',
            baseColor: 0xff6b00, // Orange gi
            accentColor: 0x0066cc, // Blue undershirt
            width: 32,
            height: 48
        });

        // Generate enemy character (red)
        this.spriteManager.generateCharacterSprite({
            name: 'enemy_basic',
            baseColor: 0xcc0000, // Red
            accentColor: 0x333333, // Dark accents
            width: 32,
            height: 48
        });

        // Generate additional characters
        this.spriteManager.generateCharacterSprite({
            name: 'vegeta',
            baseColor: 0x000066, // Dark blue
            accentColor: 0xffffff, // White
            width: 32,
            height: 48
        });
    }

    private generateTileAssets(): void {
        // Octopath-style color palette
        const palette = {
            grass: { base: 0x4a7c59, highlight: 0x5d9e6b, shadow: 0x3a5c45 },
            stone: { base: 0x8b8680, highlight: 0xa19b96, shadow: 0x6b655f },
            water: { base: 0x3a6ea5, highlight: 0x4d7fb5, shadow: 0x2d5a85 },
            dirt: { base: 0x8b5a2b, highlight: 0xa56b3b, shadow: 0x6b4521 },
            wood: { base: 0x8b4513, highlight: 0xa0572b, shadow: 0x6b3510 }
        };

        // Generate HD-2D tiles
        Object.entries(palette).forEach(([type, colors]) => {
            this.spriteManager.generateHD2DTile({
                name: `${type}_tile`,
                baseColor: colors.base,
                highlightColor: colors.highlight,
                shadowColor: colors.shadow,
                size: 32,
                type: type as any
            });
        });

        // Generate wall tile
        this.spriteManager.generateHD2DTile({
            name: 'wall_tile',
            baseColor: 0x404040,
            highlightColor: 0x606060,
            shadowColor: 0x202020,
            size: 32,
            type: 'stone'
        });
    }

    private setupAnimations(): void {
        this.spriteManager.setupCharacterAnimations('goku');
        this.spriteManager.setupCharacterAnimations('enemy_basic');
        this.spriteManager.setupCharacterAnimations('vegeta');
    }

    private generateEffects(): void {
        // Generate energy effect sprites
        const canvas = this.add.graphics();
        
        // Kamehameha effect
        canvas.fillStyle(0x00aaff, 0.8);
        canvas.fillCircle(16, 16, 12);
        canvas.fillStyle(0xffffff, 0.6);
        canvas.fillCircle(16, 16, 8);
        canvas.generateTexture('energy_blast', 32, 32);
        
        // Explosion effect
        canvas.clear();
        canvas.fillStyle(0xff6600, 0.9);
        canvas.fillCircle(16, 16, 16);
        canvas.fillStyle(0xffaa00, 0.7);
        canvas.fillCircle(16, 16, 12);
        canvas.fillStyle(0xffff66, 0.5);
        canvas.fillCircle(16, 16, 8);
        canvas.generateTexture('explosion', 32, 32);
        
        canvas.destroy();
    }

    private finishLoading(
        progressBar: Phaser.GameObjects.Graphics,
        percentText: Phaser.GameObjects.Text,
        assetText: Phaser.GameObjects.Text
    ): void {
        progressBar.destroy();
        percentText.destroy();
        assetText.destroy();
        
        this.time.delayedCall(500, () => {
            this.scene.start('MenuScene');
        });
    }

    create(): void {
        // This will be called after preload completes
    }
}