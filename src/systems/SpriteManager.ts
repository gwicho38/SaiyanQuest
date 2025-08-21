export interface SpriteConfig {
    key: string;
    width: number;
    height: number;
    frameCount: number;
    animations: AnimationConfig[];
}

export interface AnimationConfig {
    key: string;
    frames: number[];
    frameRate: number;
    repeat: boolean;
}

export class SpriteManager {
    private scene: Phaser.Scene;
    private loadedSprites: Map<string, SpriteConfig> = new Map();

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    // Generate HD-2D style pixel art sprites programmatically
    public generateCharacterSprite(config: {
        name: string;
        baseColor: number;
        accentColor: number;
        width: number;
        height: number;
    }): void {
        const { name, baseColor, accentColor, width, height } = config;
        const canvas = this.scene.add.graphics();
        
        // Create character sprite with Octopath-style proportions
        // Head (larger proportion typical of HD-2D style)
        const headSize = Math.floor(height * 0.4);
        canvas.fillStyle(baseColor);
        canvas.fillCircle(width / 2, headSize / 2 + 2, headSize / 2);
        
        // Body
        const bodyHeight = height - headSize - 4;
        canvas.fillRect(width / 2 - width / 4, headSize, width / 2, bodyHeight);
        
        // Arms
        canvas.fillRect(2, headSize + 4, 4, bodyHeight / 2);
        canvas.fillRect(width - 6, headSize + 4, 4, bodyHeight / 2);
        
        // Legs
        canvas.fillRect(width / 2 - 6, headSize + bodyHeight - 4, 4, 8);
        canvas.fillRect(width / 2 + 2, headSize + bodyHeight - 4, 4, 8);
        
        // Add accent details (typical of RPG character design)
        canvas.fillStyle(accentColor);
        canvas.fillRect(width / 2 - 2, headSize + 2, 4, 6); // Chest accent
        
        // Generate texture
        canvas.generateTexture(name, width, height);
        canvas.destroy();
        
        // Create walking animation frames
        this.generateWalkingFrames(name, width, height, baseColor, accentColor);
    }

    private generateWalkingFrames(
        baseName: string, 
        width: number, 
        height: number, 
        baseColor: number, 
        accentColor: number
    ): void {
        const directions = ['down', 'left', 'right', 'up'];
        const frameOffsets = [
            [0, 0], [-1, 0], [0, 0], [1, 0] // Simple walking cycle
        ];

        directions.forEach((direction, dirIndex) => {
            frameOffsets.forEach((offset, frameIndex) => {
                const frameName = `${baseName}_walk_${direction}_${frameIndex}`;
                const canvas = this.scene.add.graphics();
                
                // Offset the sprite slightly for walking animation
                const offsetX = offset[0];
                const offsetY = offset[1];
                
                // Recreate base sprite with offset
                const headSize = Math.floor(height * 0.4);
                canvas.fillStyle(baseColor);
                canvas.fillCircle(width / 2 + offsetX, headSize / 2 + 2 + offsetY, headSize / 2);
                
                const bodyHeight = height - headSize - 4;
                canvas.fillRect(width / 2 - width / 4 + offsetX, headSize + offsetY, width / 2, bodyHeight);
                
                // Vary arm/leg positions for walking
                const armOffset = frameIndex % 2 === 0 ? 0 : 1;
                canvas.fillRect(2 + offsetX, headSize + 4 + armOffset, 4, bodyHeight / 2);
                canvas.fillRect(width - 6 + offsetX, headSize + 4 - armOffset, 4, bodyHeight / 2);
                
                const legOffset = frameIndex % 2 === 0 ? 0 : 1;
                canvas.fillRect(width / 2 - 6 + offsetX, headSize + bodyHeight - 4 + legOffset, 4, 8);
                canvas.fillRect(width / 2 + 2 + offsetX, headSize + bodyHeight - 4 - legOffset, 4, 8);
                
                canvas.fillStyle(accentColor);
                canvas.fillRect(width / 2 - 2 + offsetX, headSize + 2 + offsetY, 4, 6);
                
                canvas.generateTexture(frameName, width, height);
                canvas.destroy();
            });
        });
    }

    // Generate HD-2D style tile textures with depth and lighting
    public generateHD2DTile(config: {
        name: string;
        baseColor: number;
        highlightColor: number;
        shadowColor: number;
        size: number;
        type: 'grass' | 'stone' | 'water' | 'dirt' | 'wood';
    }): void {
        const { name, baseColor, highlightColor, shadowColor, size, type } = config;
        const canvas = this.scene.add.graphics();
        
        // Base tile
        canvas.fillStyle(baseColor);
        canvas.fillRect(0, 0, size, size);
        
        // Add HD-2D depth effect based on tile type
        switch (type) {
            case 'grass':
                this.addGrassPattern(canvas, size, baseColor, highlightColor);
                break;
            case 'stone':
                this.addStonePattern(canvas, size, baseColor, highlightColor, shadowColor);
                break;
            case 'water':
                this.addWaterPattern(canvas, size, baseColor, highlightColor);
                break;
            case 'dirt':
                this.addDirtPattern(canvas, size, baseColor, shadowColor);
                break;
            case 'wood':
                this.addWoodPattern(canvas, size, baseColor, highlightColor, shadowColor);
                break;
        }
        
        // Add subtle lighting gradient (key to HD-2D look)
        this.addLightingGradient(canvas, size, highlightColor, shadowColor);
        
        canvas.generateTexture(name, size, size);
        canvas.destroy();
    }

    private addGrassPattern(canvas: Phaser.GameObjects.Graphics, size: number, base: number, highlight: number): void {
        canvas.fillStyle(highlight);
        // Add small grass blade details
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * size;
            const y = Math.random() * size;
            canvas.fillRect(x, y, 1, 2);
        }
    }

    private addStonePattern(canvas: Phaser.GameObjects.Graphics, size: number, base: number, highlight: number, shadow: number): void {
        // Stone texture with highlights and shadows
        canvas.fillStyle(shadow);
        canvas.fillRect(2, 2, size - 4, size - 4);
        
        canvas.fillStyle(highlight);
        canvas.fillRect(0, 0, size - 2, size - 2);
    }

    private addWaterPattern(canvas: Phaser.GameObjects.Graphics, size: number, base: number, highlight: number): void {
        canvas.fillStyle(highlight);
        // Simple wave pattern
        for (let x = 0; x < size; x += 4) {
            canvas.fillRect(x, size / 2, 2, 1);
        }
    }

    private addDirtPattern(canvas: Phaser.GameObjects.Graphics, size: number, base: number, shadow: number): void {
        canvas.fillStyle(shadow);
        // Random dirt spots
        for (let i = 0; i < 6; i++) {
            const x = Math.random() * (size - 2);
            const y = Math.random() * (size - 2);
            canvas.fillRect(x, y, 1, 1);
        }
    }

    private addWoodPattern(canvas: Phaser.GameObjects.Graphics, size: number, base: number, highlight: number, shadow: number): void {
        // Wood grain pattern
        canvas.fillStyle(shadow);
        for (let y = 0; y < size; y += 4) {
            canvas.fillRect(0, y, size, 1);
        }
        
        canvas.fillStyle(highlight);
        for (let y = 2; y < size; y += 4) {
            canvas.fillRect(0, y, size, 1);
        }
    }

    private addLightingGradient(canvas: Phaser.GameObjects.Graphics, size: number, highlight: number, shadow: number): void {
        // Top-left highlight (simulates light source from top-left, typical in HD-2D)
        canvas.fillStyle(highlight, 0.3);
        canvas.fillRect(0, 0, size / 2, size / 2);
        
        // Bottom-right shadow
        canvas.fillStyle(shadow, 0.2);
        canvas.fillRect(size / 2, size / 2, size / 2, size / 2);
    }

    // Create Octopath-style character with proper proportions
    public createCharacter(config: {
        name: string;
        x: number;
        y: number;
        spriteKey: string;
    }): Phaser.Physics.Arcade.Sprite {
        const sprite = this.scene.physics.add.sprite(config.x, config.y, config.spriteKey);
        
        // Octopath characters typically have these proportions
        sprite.setScale(2); // Upscale pixel art
        sprite.setSize(16, 24); // Collision box
        sprite.setOffset(8, 8); // Center the collision box
        
        return sprite;
    }

    // Setup animations for HD-2D style movement
    public setupCharacterAnimations(spriteKey: string): void {
        const directions = ['down', 'left', 'right', 'up'];
        
        directions.forEach(direction => {
            this.scene.anims.create({
                key: `${spriteKey}_walk_${direction}`,
                frames: [
                    { key: `${spriteKey}_walk_${direction}_0` },
                    { key: `${spriteKey}_walk_${direction}_1` },
                    { key: `${spriteKey}_walk_${direction}_2` },
                    { key: `${spriteKey}_walk_${direction}_3` }
                ],
                frameRate: 8,
                repeat: -1
            });
        });
        
        // Idle animation
        this.scene.anims.create({
            key: `${spriteKey}_idle`,
            frames: [{ key: spriteKey }],
            frameRate: 1
        });
    }
}