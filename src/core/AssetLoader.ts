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
                        // Ensure we store a Texture instance
                        const texture = PIXI.Texture.from(asset.url);
                        this.loadedAssets.set(asset.name, texture);
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
                        // Ensure we store a Texture instance
                        const texture = PIXI.Texture.from(url as string);
                        if (texture) {
                            this.loadedAssets.set(name, texture);
                        }
                    });
                } catch (error) {
                    console.warn('Some assets failed to load, using fallbacks');
                }
            }

            // After loading, if town tilesheet exists, register default sub-tiles
            this.registerTilesFromTownTiles();

            console.log(`Asset loading completed with fallbacks`);
            
        } catch (error) {
            console.error('Asset loading failed:', error);
            // Still proceed with fallbacks
            this.preloadMissingAssets();
        }
    }

    private getAssetDefinitions(): AssetDefinition[] {
        return [
            // Character sprites (generic hero, plus legacy DBZ options)
            {
                name: 'hero_spritesheet',
                url: 'assets/sprites/characters/male_walkcycle.png',
                type: 'spritesheet'
            },
            {
                name: 'hero_texture',
                url: 'assets/sprites/characters/male_walkcycle.png',
                type: 'texture'
            },
            {
                name: 'hero_female_spritesheet',
                url: 'assets/sprites/characters/female_walkcycle.png',
                type: 'spritesheet'
            },

            // Legacy DBZ sheets (kept as optional fallbacks)
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

            // Primary tilesheet (resources)
            {
                name: 'town_tiles',
                url: 'assets/resources/town_tiles.png',
                type: 'spritesheet'
            },

            // Tiles (LPC fallback)
            {
                name: 'grass_tile',
                url: 'assets/sprites/tiles/grass.png',
                type: 'texture'
            },
            {
                name: 'stone_tile',
                url: 'assets/sprites/tiles/rock.png',
                type: 'texture'
            },
            {
                name: 'water_tile',
                url: 'assets/sprites/tiles/water.png',
                type: 'texture'
            },

            // Fallback/simple sprites (exist on disk)
            {
                name: 'player_sprite',
                url: 'assets/player.png',
                type: 'texture'
            },
            {
                name: 'enemy_sprite',
                url: 'assets/enemy.png',
                type: 'texture'
            }
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
        // Create missing asset textures as colored rectangles (limited to known names)
        const missingAssets = [
            'hero_spritesheet',
            'hero_texture',
            'hero_female_spritesheet',
            'player_sprite',
            'enemy_sprite',
            'goku_spritesheet',
            'ssj_goku_spritesheet',
            'piccolo_spritesheet'
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
                        case 'hero_spritesheet':
                        case 'hero_texture':
                            ctx.fillStyle = '#c68642'; // Skin tone
                            ctx.fillRect(12, 8, 8, 8); // Head
                            ctx.fillStyle = '#3b3b3b'; // Hair
                            ctx.fillRect(10, 6, 12, 4);
                            ctx.fillStyle = '#2b6cb0'; // Shirt
                            ctx.fillRect(10, 16, 12, 10);
                            ctx.fillStyle = '#2f855a'; // Pants
                            ctx.fillRect(10, 26, 12, 6);
                            break;
                        case 'hero_female_spritesheet':
                            ctx.fillStyle = '#d2a679';
                            ctx.fillRect(12, 8, 8, 8);
                            ctx.fillStyle = '#5a2d0c'; // Hair
                            ctx.fillRect(10, 6, 12, 4);
                            ctx.fillStyle = '#e53e3e'; // Shirt
                            ctx.fillRect(10, 16, 12, 10);
                            ctx.fillStyle = '#4a5568'; // Pants
                            ctx.fillRect(10, 26, 12, 6);
                            break;
                        case 'goku_spritesheet':
                        case 'player_sprite':
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
                            ctx.fillStyle = '#fdbcb4';
                            ctx.fillRect(12, 8, 8, 8);
                            ctx.fillStyle = '#ffd700'; // Golden hair
                            ctx.fillRect(10, 6, 12, 4);
                            ctx.fillStyle = '#ff6600';
                            ctx.fillRect(10, 16, 12, 10);
                            ctx.fillStyle = '#0066ff';
                            ctx.fillRect(10, 26, 12, 6);
                            break;
                        case 'piccolo_spritesheet':
                            ctx.fillStyle = '#90EE90';
                            ctx.fillRect(12, 8, 8, 8);
                            ctx.fillStyle = '#000000'; // Turban
                            ctx.fillRect(10, 6, 12, 4);
                            ctx.fillStyle = '#800080'; // Purple gi
                            ctx.fillRect(10, 16, 12, 10);
                            ctx.fillStyle = '#ffffff'; // White cape
                            ctx.fillRect(8, 18, 16, 8);
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

    private registerTilesFromTownTiles(): void {
        const baseTexture = this.getAsset<PIXI.Texture>('town_tiles');
        if (!baseTexture) {
            return;
        }
        const tileSize = 32;
        const mappings: Record<string, { col: number; row: number }> = {
            grass_tile: { col: 0, row: 0 },
            stone_tile: { col: 1, row: 0 },
            water_tile: { col: 2, row: 0 },
        };

        Object.entries(mappings).forEach(([name, pos]) => {
            try {
                const sub = new PIXI.Texture({
                    source: baseTexture.source,
                    frame: new PIXI.Rectangle(
                        pos.col * tileSize,
                        pos.row * tileSize,
                        tileSize,
                        tileSize
                    )
                });
                this.loadedAssets.set(name, sub);
            } catch (e) {
                // Ignore if slicing fails; fallbacks remain
            }
        });
    }
}