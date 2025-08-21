import * as PIXI from 'pixi.js';

export interface HD2DEffect {
    container: PIXI.Container;
    update: (deltaTime: number) => void;
    destroy: () => void;
}

export class HD2DRenderer {
    private app: PIXI.Application;
    private effects: HD2DEffect[] = [];
    private depthLayers: Map<number, PIXI.Container> = new Map();
    private particles: PIXI.Container;
    private backgroundTime = 0;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.particles = new PIXI.Container();
        this.particles.label = 'Particles';
        this.setupDepthLayers();
    }

    private setupDepthLayers(): void {
        // Create depth layers for HD-2D effect
        for (let depth = -10; depth <= 10; depth++) {
            const layer = new PIXI.Container();
            layer.label = `DepthLayer_${depth}`;
            layer.zIndex = depth * 100;
            this.depthLayers.set(depth, layer);
        }
    }

    public getDepthLayer(depth: number): PIXI.Container {
        let layer = this.depthLayers.get(depth);
        if (!layer) {
            layer = new PIXI.Container();
            layer.label = `DepthLayer_${depth}`;
            layer.zIndex = depth * 100;
            this.depthLayers.set(depth, layer);
        }
        return layer;
    }

    public createParallaxBackground(): HD2DEffect {
        const container = new PIXI.Container();
        container.label = 'ParallaxBackground';
        
        // Create multiple background layers
        const layers: { graphics: PIXI.Graphics; speed: number; depth: number }[] = [];
        
        // Sky layer (furthest)
        const sky = new PIXI.Graphics();
        sky.rect(0, 0, this.app.screen.width * 2, this.app.screen.height);
        sky.fill(0x87CEEB); // Sky blue
        layers.push({ graphics: sky, speed: 0.1, depth: -1000 });
        
        // Cloud layer
        const clouds = new PIXI.Graphics();
        for (let i = 0; i < 15; i++) {
            const cloudX = Math.random() * this.app.screen.width * 2;
            const cloudY = Math.random() * this.app.screen.height * 0.6;
            const cloudSize = 20 + Math.random() * 30;
            
            clouds.circle(cloudX, cloudY, cloudSize);
            clouds.fill(0xffffff, 0.7);
        }
        layers.push({ graphics: clouds, speed: 0.3, depth: -500 });
        
        // Mountain layer
        const mountains = new PIXI.Graphics();
        mountains.moveTo(0, this.app.screen.height * 0.7);
        for (let x = 0; x < this.app.screen.width * 2; x += 50) {
            const height = this.app.screen.height * 0.7 + Math.sin(x * 0.01) * 50;
            mountains.lineTo(x, height);
        }
        mountains.lineTo(this.app.screen.width * 2, this.app.screen.height);
        mountains.lineTo(0, this.app.screen.height);
        mountains.fill(0x696969, 0.8);
        layers.push({ graphics: mountains, speed: 0.5, depth: -300 });
        
        layers.forEach(layer => {
            layer.graphics.zIndex = layer.depth;
            container.addChild(layer.graphics);
        });
        
        const effect: HD2DEffect = {
            container,
            update: (deltaTime: number) => {
                // Parallax scrolling effect
                layers.forEach(layer => {
                    layer.graphics.x -= layer.speed * deltaTime * 60;
                    
                    // Wrap around
                    if (layer.graphics.x <= -this.app.screen.width) {
                        layer.graphics.x = 0;
                    }
                });
            },
            destroy: () => {
                layers.forEach(layer => layer.graphics.destroy());
                container.destroy();
            }
        };
        
        this.effects.push(effect);
        return effect;
    }

    public createDepthOfField(): HD2DEffect {
        const container = new PIXI.Container();
        container.label = 'DepthOfField';
        
        // Create blur layers at different depths
        const blurLayers: PIXI.Graphics[] = [];
        
        for (let i = 0; i < 3; i++) {
            const layer = new PIXI.Graphics();
            layer.rect(0, 0, this.app.screen.width, this.app.screen.height);
            layer.fill(0x000000, 0.1 + i * 0.05);
            layer.zIndex = -100 + i * 10;
            blurLayers.push(layer);
            container.addChild(layer);
        }
        
        const effect: HD2DEffect = {
            container,
            update: (deltaTime: number) => {
                // Animate depth of field
                blurLayers.forEach((layer, index) => {
                    layer.alpha = 0.1 + Math.sin(this.backgroundTime + index) * 0.05;
                });
            },
            destroy: () => {
                blurLayers.forEach(layer => layer.destroy());
                container.destroy();
            }
        };
        
        this.effects.push(effect);
        return effect;
    }

    public createAtmosphericParticles(): HD2DEffect {
        const container = new PIXI.Container();
        container.label = 'AtmosphericParticles';
        
        const particles: { sprite: PIXI.Graphics; velocity: { x: number; y: number }; life: number }[] = [];
        
        // Create floating particles
        for (let i = 0; i < 30; i++) {
            const particle = new PIXI.Graphics();
            particle.circle(0, 0, 1 + Math.random() * 2);
            particle.fill(0xffffff, 0.3 + Math.random() * 0.4);
            
            particle.x = Math.random() * this.app.screen.width;
            particle.y = Math.random() * this.app.screen.height;
            
            particles.push({
                sprite: particle,
                velocity: {
                    x: (Math.random() - 0.5) * 0.5,
                    y: -Math.random() * 0.8 - 0.2
                },
                life: Math.random() * 5 + 2
            });
            
            container.addChild(particle);
        }
        
        const effect: HD2DEffect = {
            container,
            update: (deltaTime: number) => {
                particles.forEach((particle, index) => {
                    // Update position
                    particle.sprite.x += particle.velocity.x * deltaTime * 60;
                    particle.sprite.y += particle.velocity.y * deltaTime * 60;
                    
                    // Update life
                    particle.life -= deltaTime;
                    particle.sprite.alpha = Math.max(0, particle.life / 5);
                    
                    // Reset particle if it dies or goes off screen
                    if (particle.life <= 0 || particle.sprite.y < -10 || particle.sprite.x < -10 || particle.sprite.x > this.app.screen.width + 10) {
                        particle.sprite.x = Math.random() * this.app.screen.width;
                        particle.sprite.y = this.app.screen.height + 10;
                        particle.life = Math.random() * 5 + 2;
                        particle.velocity.x = (Math.random() - 0.5) * 0.5;
                        particle.velocity.y = -Math.random() * 0.8 - 0.2;
                    }
                });
            },
            destroy: () => {
                particles.forEach(particle => particle.sprite.destroy());
                container.destroy();
            }
        };
        
        this.effects.push(effect);
        return effect;
    }

    public createEnergyParticles(x: number, y: number, color: number = 0x00ffff): HD2DEffect {
        const container = new PIXI.Container();
        container.label = 'EnergyParticles';
        container.x = x;
        container.y = y;
        
        const particles: { sprite: PIXI.Graphics; velocity: { x: number; y: number }; life: number; maxLife: number }[] = [];
        
        // Create energy particles
        for (let i = 0; i < 20; i++) {
            const particle = new PIXI.Graphics();
            particle.circle(0, 0, 2 + Math.random() * 3);
            particle.fill(color, 0.8);
            
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            
            particles.push({
                sprite: particle,
                velocity: {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                },
                life: 1 + Math.random() * 2,
                maxLife: 1 + Math.random() * 2
            });
            
            container.addChild(particle);
        }
        
        const effect: HD2DEffect = {
            container,
            update: (deltaTime: number) => {
                particles.forEach((particle, index) => {
                    // Update position
                    particle.sprite.x += particle.velocity.x * deltaTime * 60;
                    particle.sprite.y += particle.velocity.y * deltaTime * 60;
                    
                    // Update life
                    particle.life -= deltaTime;
                    particle.sprite.alpha = particle.life / particle.maxLife;
                    particle.sprite.scale.set(particle.life / particle.maxLife);
                    
                    // Remove dead particles
                    if (particle.life <= 0) {
                        particle.sprite.destroy();
                        particles.splice(index, 1);
                    }
                });
                
                // Remove effect when all particles are dead
                if (particles.length === 0) {
                    this.removeEffect(effect);
                }
            },
            destroy: () => {
                particles.forEach(particle => particle.sprite.destroy());
                container.destroy();
            }
        };
        
        this.effects.push(effect);
        return effect;
    }

    public createBloomEffect(target: PIXI.Sprite): void {
        // Simple bloom effect by adding a glowing duplicate
        if (!target.parent) return;
        
        const glow = new PIXI.Sprite(target.texture);
        glow.anchor.copyFrom(target.anchor);
        glow.x = target.x;
        glow.y = target.y;
        glow.scale.copyFrom(target.scale);
        glow.tint = 0xffffff;
        glow.alpha = 0.3;
        glow.blendMode = 'add';
        
        // Scale slightly larger for glow effect
        glow.scale.x *= 1.2;
        glow.scale.y *= 1.2;
        
        target.parent.addChild(glow);
        
        // Animate glow
        let glowTime = 0;
        const updateGlow = (deltaTime: number) => {
            glowTime += deltaTime;
            glow.alpha = 0.3 + Math.sin(glowTime * 5) * 0.1;
            glow.scale.x = target.scale.x * (1.2 + Math.sin(glowTime * 3) * 0.1);
            glow.scale.y = target.scale.y * (1.2 + Math.sin(glowTime * 3) * 0.1);
        };
        
        // Clean up glow after target is destroyed
        const originalDestroy = target.destroy.bind(target);
        target.destroy = (options?: any) => {
            glow.destroy();
            originalDestroy(options);
        };
    }

    public createScreenShake(intensity: number = 5, duration: number = 300): HD2DEffect {
        const container = new PIXI.Container();
        container.label = 'ScreenShake';
        
        let shakeTime = 0;
        const originalX = this.app.stage.x;
        const originalY = this.app.stage.y;
        
        const effect: HD2DEffect = {
            container,
            update: (deltaTime: number) => {
                shakeTime += deltaTime * 1000; // Convert to milliseconds
                
                if (shakeTime < duration) {
                    const progress = shakeTime / duration;
                    const currentIntensity = intensity * (1 - progress);
                    
                    this.app.stage.x = originalX + (Math.random() - 0.5) * currentIntensity * 2;
                    this.app.stage.y = originalY + (Math.random() - 0.5) * currentIntensity * 2;
                } else {
                    // Reset position and remove effect
                    this.app.stage.x = originalX;
                    this.app.stage.y = originalY;
                    this.removeEffect(effect);
                }
            },
            destroy: () => {
                this.app.stage.x = originalX;
                this.app.stage.y = originalY;
                container.destroy();
            }
        };
        
        this.effects.push(effect);
        return effect;
    }

    public update(deltaTime: number): void {
        this.backgroundTime += deltaTime;
        
        // Update all effects
        this.effects.forEach(effect => {
            effect.update(deltaTime);
        });
    }

    public removeEffect(effect: HD2DEffect): void {
        const index = this.effects.indexOf(effect);
        if (index !== -1) {
            this.effects.splice(index, 1);
            effect.destroy();
        }
    }

    public addToDepthLayer(object: PIXI.Container, depth: number): void {
        const layer = this.getDepthLayer(depth);
        layer.addChild(object);
    }

    public createPixelPerfectTexture(graphics: PIXI.Graphics, width: number, height: number): PIXI.Texture {
        const renderTexture = PIXI.RenderTexture.create({ 
            width, 
            height,
            resolution: 1 // Ensure pixel perfect
        });
        
        this.app.renderer.render({ container: graphics, target: renderTexture });
        return renderTexture;
    }

    public destroy(): void {
        // Clean up all effects
        this.effects.forEach(effect => {
            effect.destroy();
        });
        this.effects = [];
        
        // Clean up depth layers
        this.depthLayers.forEach(layer => {
            layer.destroy();
        });
        this.depthLayers.clear();
        
        this.particles.destroy();
        
        console.log('HD2DRenderer destroyed');
    }
}