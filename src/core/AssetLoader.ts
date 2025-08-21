import * as PIXI from 'pixi.js';

export interface AssetDefinition {
    name: string;
    url: string;
    type: 'texture' | 'spritesheet' | 'audio' | 'json';
}

export class AssetLoader {
    private static instance: AssetLoader;
    private loadedAssets: Map<string, any> = new Map();
    private game?: any;

    constructor() {
        // No need to store Assets reference as it's a static API
    }

    public setGameInstance(game: any): void {
        this.game = game;
    }

    public static getInstance(): AssetLoader {
        if (!AssetLoader.instance) {
            AssetLoader.instance = new AssetLoader();
        }
        return AssetLoader.instance;
    }

    public async loadAssets(progressCallback?: (progress: number) => void): Promise<void> {
        const assets = this.getAssetDefinitions();
        
        try {
            // First preload missing assets with fallbacks
            this.preloadMissingAssets();

            // Add assets to loader with error handling
            const assetsToLoad: any = {};
            assets.forEach(asset => {
                assetsToLoad[asset.name] = asset.url;
            });

            // Setup progress tracking with error tolerance
            if (progressCallback) {
                let loadedCount = 0;
                const totalCount = assets.length;
                
                const updateProgress = () => {
                    loadedCount++;
                    progressCallback(loadedCount / totalCount);
                };

                // Load assets one by one with fallback handling
                for (const asset of assets) {
                    try {
                        await PIXI.Assets.load(asset.url);
                        this.loadedAssets.set(asset.name, PIXI.Assets.get(asset.url));
                    } catch (error) {
                        console.warn(`Failed to load asset ${asset.name}, using fallback`);
                        // Fallback will already be loaded from preloadMissingAssets
                    }
                    updateProgress();
                }
            } else {
                // Load with error tolerance
                try {
                    const loadedAssets = await PIXI.Assets.load(Object.values(assetsToLoad));
                    Object.entries(assetsToLoad).forEach(([name, url]) => {
                        const loadedAsset = loadedAssets[url as string];
                        if (loadedAsset) {
                            this.loadedAssets.set(name, loadedAsset);
                        }
                    });
                } catch (error) {
                    console.warn('Some assets failed to load, using fallbacks');
                }
            }

            console.log(`Asset loading completed with fallbacks`);
            
        } catch (error) {
            console.error('Asset loading failed:', error);
            // Still proceed with fallbacks
            this.preloadMissingAssets();
        }
    }

    private getAssetDefinitions(): AssetDefinition[] {
        return [
            // Character sprites
            {
                name: 'goku_spritesheet',
                url: 'assets/sprites/characters/goku_sheet.png',
                type: 'spritesheet'
            },
            {
                name: 'ssj_goku_spritesheet',
                url: 'assets/sprites/characters/ssj_goku_sheet.png',
                type: 'spritesheet'
            },
            {
                name: 'piccolo_spritesheet',
                url: 'assets/sprites/characters/piccolo_sheet.png',
                type: 'spritesheet'
            },

            // Fallback sprites
            {
                name: 'player_sprite',
                url: 'assets/player.png',
                type: 'texture'
            },
            {
                name: 'enemy_sprite',
                url: 'assets/enemy.png',
                type: 'texture'
            },

            // Effects
            {
                name: 'ki_blast',
                url: 'assets/sprites/effects/ki_blast.png',
                type: 'texture'
            },
            {
                name: 'kamehameha_effect',
                url: 'assets/sprites/effects/kamehameha.png',
                type: 'texture'
            },
            {
                name: 'power_spark',
                url: 'assets/sprites/effects/power_spark.png',
                type: 'texture'
            },
            {
                name: 'ssj_aura',
                url: 'assets/sprites/effects/ssj_aura.png',
                type: 'texture'
            },

            // Tiles and backgrounds
            {
                name: 'grass_tile',
                url: 'assets/sprites/tiles/grass.png',
                type: 'texture'
            },
            {
                name: 'stone_tile',
                url: 'assets/sprites/tiles/stone.png',
                type: 'texture'
            },
            {
                name: 'water_tile',
                url: 'assets/sprites/tiles/water.png',
                type: 'texture'
            },

            // Audio assets (if needed)
            // {
            //     name: 'bgm_overworld',
            //     url: 'assets/audio/bgm_overworld.mp3',
            //     type: 'audio'
            // },
            // {
            //     name: 'sfx_punch',
            //     url: 'assets/audio/sfx_punch.wav',
            //     type: 'audio'
            // },
        ];
    }

    public getAsset<T = any>(name: string): T | null {
        return this.loadedAssets.get(name) || null;
    }

    public hasAsset(name: string): boolean {
        return this.loadedAssets.has(name);
    }

    public createTexture(name: string): PIXI.Texture | null {
        const asset = this.getAsset(name);
        if (asset && asset instanceof PIXI.Texture) {
            return asset;
        }
        
        // Try to get from PIXI.Assets cache
        const texture = PIXI.Assets.get(name);
        if (texture && texture instanceof PIXI.Texture) {
            this.loadedAssets.set(name, texture);
            return texture;
        }
        
        return null;
    }

    public createSprite(textureName: string): PIXI.Sprite | null {
        const texture = this.createTexture(textureName);
        if (texture) {
            return new PIXI.Sprite(texture);
        }
        
        // Fallback: create a colored rectangle (suppress individual warnings)
        const graphics = new PIXI.Graphics();
        graphics.rect(0, 0, 32, 32);
        graphics.fill({ color: 0xff6b00 }); // Orange color for Dragon Ball theme
        
        const fallbackTexture = PIXI.RenderTexture.create({ width: 32, height: 32 });
        const app = this.game?.getApp();
        if (app?.renderer) {
            app.renderer.render({ container: graphics, target: fallbackTexture });
        }
        graphics.destroy();
        return new PIXI.Sprite(fallbackTexture);
    }

    public createAnimatedSprite(textureName: string, frameWidth: number, frameHeight: number): PIXI.AnimatedSprite | null {
        const baseTexture = this.createTexture(textureName);
        if (!baseTexture) {
            return null;
        }

        // Create frame textures
        const frames: PIXI.Texture[] = [];
        const cols = Math.floor(baseTexture.width / frameWidth);
        const rows = Math.floor(baseTexture.height / frameHeight);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const frame = new PIXI.Texture({
                    source: baseTexture.source,
                    frame: new PIXI.Rectangle(
                        col * frameWidth,
                        row * frameHeight,
                        frameWidth,
                        frameHeight
                    )
                });
                frames.push(frame);
            }
        }

        if (frames.length === 0) {
            return null;
        }

        return new PIXI.AnimatedSprite(frames);
    }

    public getAllAssets(): Map<string, any> {
        return new Map(this.loadedAssets);
    }

    public preloadMissingAssets(): void {
        // Create missing asset textures as colored rectangles
        const missingAssets = [
            'ki_blast', 'kamehameha_effect', 'power_spark', 'ssj_aura',
            'grass_tile', 'stone_tile', 'water_tile', 'player_sprite',
            'goku_spritesheet', 'ssj_goku_spritesheet', 'piccolo_spritesheet',
            'enemy_sprite'
        ];

        const missingCount = missingAssets.filter(name => !this.hasAsset(name)).length;
        if (missingCount > 0) {
            console.warn(`Creating fallback textures for ${missingCount} missing assets`);
        }
        
        missingAssets.forEach(assetName => {
            if (!this.hasAsset(assetName)) {
                
                // Create fallback using canvas approach
                const canvas = document.createElement('canvas');
                canvas.width = 32;
                canvas.height = 32;
                const ctx = canvas.getContext('2d');
                
                if (ctx) {
                    let color = '#ff6b00'; // Default orange
                    
                    // Set colors based on asset type
                    switch (assetName) {
                        case 'ki_blast': 
                            color = '#00ffff';
                            ctx.fillStyle = color;
                            ctx.beginPath();
                            ctx.arc(16, 16, 12, 0, 2 * Math.PI);
                            ctx.fill();
                            break;
                        case 'kamehameha_effect': 
                            color = '#0088ff';
                            ctx.fillStyle = color;
                            ctx.fillRect(0, 12, 32, 8);
                            break;
                        case 'power_spark': 
                            color = '#ffff00';
                            ctx.fillStyle = color;
                            ctx.beginPath();
                            ctx.arc(16, 16, 8, 0, 2 * Math.PI);
                            ctx.fill();
                            break;
                        case 'ssj_aura': 
                            color = '#ffd700';
                            ctx.fillStyle = color;
                            ctx.fillRect(4, 4, 24, 24);
                            break;
                        case 'grass_tile': 
                            color = '#228b22';
                            ctx.fillStyle = color;
                            ctx.fillRect(0, 0, 32, 32);
                            // Add grass texture
                            ctx.fillStyle = '#32cd32';
                            for (let i = 0; i < 8; i++) {
                                ctx.fillRect(i * 4 + 1, i * 4 + 1, 2, 2);
                            }
                            break;
                        case 'stone_tile': 
                            color = '#808080';
                            ctx.fillStyle = color;
                            ctx.fillRect(0, 0, 32, 32);
                            ctx.fillStyle = '#696969';
                            ctx.fillRect(2, 2, 6, 6);
                            ctx.fillRect(20, 15, 8, 8);
                            break;
                        case 'water_tile': 
                            color = '#4169e1';
                            ctx.fillStyle = color;
                            ctx.fillRect(0, 0, 32, 32);
                            ctx.fillStyle = '#87ceeb';
                            ctx.fillRect(8, 8, 2, 2);
                            ctx.fillRect(20, 20, 2, 2);
                            break;
                        case 'player_sprite':
                        case 'goku_spritesheet':
                            // Create a simple Goku-like character
                            ctx.fillStyle = '#fdbcb4'; // Skin tone
                            ctx.fillRect(12, 8, 8, 8); // Head
                            ctx.fillStyle = '#000000'; // Hair
                            ctx.fillRect(10, 6, 12, 4); // Hair
                            ctx.fillStyle = '#ff6600'; // Gi
                            ctx.fillRect(10, 16, 12, 10); // Body
                            ctx.fillStyle = '#0066ff'; // Belt/Pants
                            ctx.fillRect(10, 26, 12, 6); // Legs
                            break;
                        case 'ssj_goku_spritesheet':
                            // Create SSJ Goku
                            ctx.fillStyle = '#fdbcb4'; // Skin tone
                            ctx.fillRect(12, 8, 8, 8); // Head
                            ctx.fillStyle = '#ffd700'; // Golden hair
                            ctx.fillRect(10, 6, 12, 4); // Hair
                            ctx.fillStyle = '#ff6600'; // Gi
                            ctx.fillRect(10, 16, 12, 10); // Body
                            ctx.fillStyle = '#0066ff'; // Belt/Pants
                            ctx.fillRect(10, 26, 12, 6); // Legs
                            break;
                        case 'piccolo_spritesheet':
                            // Create Piccolo
                            ctx.fillStyle = '#90EE90'; // Green skin
                            ctx.fillRect(12, 8, 8, 8); // Head
                            ctx.fillStyle = '#000000'; // Turban
                            ctx.fillRect(10, 6, 12, 4); // Turban
                            ctx.fillStyle = '#800080'; // Purple gi
                            ctx.fillRect(10, 16, 12, 10); // Body
                            ctx.fillStyle = '#ffffff'; // White cape
                            ctx.fillRect(8, 18, 16, 8); // Cape
                            break;
                        case 'enemy_sprite':
                            ctx.fillStyle = '#ff0000';
                            ctx.fillRect(8, 8, 16, 16);
                            break;
                        default:
                            ctx.fillStyle = color;
                            ctx.fillRect(0, 0, 32, 32);
                            break;
                    }
                }
                
                const texture = PIXI.Texture.from(canvas);
                this.loadedAssets.set(assetName, texture);
            }
        });
    }
}