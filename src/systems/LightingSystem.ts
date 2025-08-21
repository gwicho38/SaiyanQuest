export interface LightSource {
    x: number;
    y: number;
    radius: number;
    intensity: number;
    color: number;
    type: 'static' | 'dynamic' | 'ambient';
}

export class LightingSystem {
    private scene: Phaser.Scene;
    private lightSources: LightSource[] = [];
    private ambientLightLevel: number = 0.3;
    private lightOverlay!: Phaser.GameObjects.Graphics;
    private depthOfFieldLayer!: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
        this.createLightingLayers();
    }

    private createLightingLayers(): void {
        // Main lighting overlay for HD-2D effect
        this.lightOverlay = this.scene.add.graphics();
        this.lightOverlay.setDepth(20);
        this.lightOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);

        // Depth of field layer for background blur effect
        this.depthOfFieldLayer = this.scene.add.graphics();
        this.depthOfFieldLayer.setDepth(1);
        this.depthOfFieldLayer.setScrollFactor(0.2, 0.2);
        this.depthOfFieldLayer.setAlpha(0.4);
    }

    public addLightSource(light: LightSource): void {
        this.lightSources.push(light);
    }

    public removeLightSource(x: number, y: number): void {
        this.lightSources = this.lightSources.filter(light => 
            light.x !== x || light.y !== y
        );
    }

    // Create Octopath-style depth of field effect
    public createDepthOfField(): void {
        const width = this.scene.cameras.main.width;
        const height = this.scene.cameras.main.height;

        this.depthOfFieldLayer.clear();
        
        // Create radial gradient for depth effect
        const centerX = width / 2;
        const centerY = height / 3; // Focus point slightly above center
        const maxRadius = Math.max(width, height);

        for (let radius = 0; radius < maxRadius; radius += 20) {
            const alpha = Math.min(radius / (maxRadius * 0.6), 0.6);
            this.depthOfFieldLayer.fillStyle(0x2c3e50, alpha * 0.3);
            this.depthOfFieldLayer.fillCircle(centerX, centerY, radius);
        }
    }

    // Update lighting effects each frame
    public update(playerX: number, playerY: number): void {
        this.updateLightingOverlay(playerX, playerY);
        this.updateDynamicLights();
    }

    private updateLightingOverlay(playerX: number, playerY: number): void {
        const width = this.scene.cameras.main.width * 2;
        const height = this.scene.cameras.main.height * 2;
        
        this.lightOverlay.clear();
        
        // Base ambient lighting
        this.lightOverlay.fillStyle(0x000033, 1 - this.ambientLightLevel);
        this.lightOverlay.fillRect(-width, -height, width * 2, height * 2);

        // Player light (follows character)
        this.createRadialLight(
            playerX,
            playerY,
            120,
            0.8,
            0xfff8dc
        );

        // Static light sources
        this.lightSources.forEach(light => {
            if (light.type === 'static' || light.type === 'ambient') {
                this.createRadialLight(
                    light.x,
                    light.y,
                    light.radius,
                    light.intensity,
                    light.color
                );
            }
        });
    }

    private createRadialLight(x: number, y: number, radius: number, intensity: number, color: number): void {
        const steps = 10;
        const stepSize = radius / steps;
        
        for (let i = 0; i < steps; i++) {
            const currentRadius = stepSize * (i + 1);
            const alpha = (1 - (i / steps)) * intensity;
            
            // Use ERASE blend mode to "cut out" light areas
            this.lightOverlay.fillStyle(color, alpha);
            this.lightOverlay.setBlendMode(Phaser.BlendModes.ERASE);
            this.lightOverlay.fillCircle(x, y, currentRadius);
            this.lightOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
        }
    }

    private updateDynamicLights(): void {
        // Update any dynamic light sources (torches, magic effects, etc.)
        this.lightSources.forEach(light => {
            if (light.type === 'dynamic') {
                // Add flickering effect for torches
                const flicker = 0.9 + (Math.sin(this.scene.time.now * 0.005) * 0.1);
                light.intensity = Math.max(0.3, Math.min(1, light.intensity * flicker));
            }
        });
    }

    // Create cinematic lighting for special moments
    public createCinematicLighting(type: 'dramatic' | 'peaceful' | 'battle'): void {
        switch (type) {
            case 'dramatic':
                this.ambientLightLevel = 0.1;
                this.addLightSource({
                    x: this.scene.cameras.main.centerX,
                    y: this.scene.cameras.main.centerY - 100,
                    radius: 200,
                    intensity: 0.9,
                    color: 0xff6600,
                    type: 'static'
                });
                break;
                
            case 'peaceful':
                this.ambientLightLevel = 0.7;
                // Add multiple soft ambient lights
                break;
                
            case 'battle':
                this.ambientLightLevel = 0.2;
                // Add pulsing red battle lighting
                break;
        }
    }

    // Create depth layers for HD-2D effect
    public setupDepthLayers(): void {
        const layers = [
            { depth: -5, color: 0x2c3e50, alpha: 0.1, parallax: 0.1 },
            { depth: -3, color: 0x34495e, alpha: 0.15, parallax: 0.3 },
            { depth: -1, color: 0x3b4a5c, alpha: 0.2, parallax: 0.6 }
        ];

        layers.forEach(layer => {
            const depthLayer = this.scene.add.graphics();
            depthLayer.fillStyle(layer.color, layer.alpha);
            depthLayer.fillRect(0, 0, 1600, 1200);
            depthLayer.setDepth(layer.depth);
            depthLayer.setScrollFactor(layer.parallax, layer.parallax);
            depthLayer.setBlendMode(Phaser.BlendModes.OVERLAY);
        });
    }

    // Add particle effects for enhanced HD-2D atmosphere
    public createAtmosphericEffects(): void {
        // Create floating dust particles
        for (let i = 0; i < 20; i++) {
            const particle = this.scene.add.circle(
                Math.random() * 1600,
                Math.random() * 1200,
                1,
                0xffffff,
                0.3
            );
            
            particle.setDepth(5);
            
            // Animate particles
            this.scene.tweens.add({
                targets: particle,
                y: particle.y - 50,
                x: particle.x + Math.random() * 20 - 10,
                alpha: 0,
                duration: 8000 + Math.random() * 4000,
                ease: 'Power1',
                repeat: -1,
                yoyo: false,
                onRepeat: () => {
                    particle.x = Math.random() * 1600;
                    particle.y = 1200;
                    particle.alpha = 0.3;
                }
            });
        }
    }

    // Create HD-2D style shadows
    public addCharacterShadow(sprite: Phaser.GameObjects.Sprite): Phaser.GameObjects.Ellipse {
        const shadow = this.scene.add.ellipse(
            sprite.x,
            sprite.y + 20,
            sprite.width * 0.8,
            sprite.height * 0.3,
            0x000000,
            0.3
        );
        
        shadow.setDepth(sprite.depth - 1);
        
        return shadow;
    }

    public setAmbientLightLevel(level: number): void {
        this.ambientLightLevel = Math.max(0, Math.min(1, level));
    }

    public destroy(): void {
        this.lightOverlay.destroy();
        this.depthOfFieldLayer.destroy();
        this.lightSources = [];
    }
}