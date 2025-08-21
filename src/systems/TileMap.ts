export interface TileData {
    id: number;
    type: 'grass' | 'stone' | 'water' | 'dirt' | 'wood' | 'wall';
    collision: boolean;
    depth: number; // For HD-2D layering
}

export interface MapLayer {
    name: string;
    data: number[][];
    depth: number;
    parallax: { x: number; y: number };
}

export class TileMap {
    private scene: Phaser.Scene;
    private tileSize: number = 32;
    private mapWidth: number;
    private mapHeight: number;
    private layers: MapLayer[] = [];
    private tileSprites: Phaser.GameObjects.Group;

    constructor(scene: Phaser.Scene, width: number, height: number) {
        this.scene = scene;
        this.mapWidth = width;
        this.mapHeight = height;
        this.tileSprites = scene.add.group();
    }

    // Create an Octopath-style layered map
    public generateOctopathStyleMap(): void {
        // Background layer (furthest back)
        const backgroundLayer: MapLayer = {
            name: 'background',
            data: this.generateTerrainLayer('grass'),
            depth: 0,
            parallax: { x: 0.1, y: 0.1 }
        };

        // Mid-ground layer (main gameplay area)
        const midgroundLayer: MapLayer = {
            name: 'midground',
            data: this.generateMixedTerrain(),
            depth: 1,
            parallax: { x: 0.3, y: 0.3 }
        };

        // Foreground layer (objects and obstacles)
        const foregroundLayer: MapLayer = {
            name: 'foreground',
            data: this.generateObstacles(),
            depth: 2,
            parallax: { x: 1, y: 1 }
        };

        this.layers = [backgroundLayer, midgroundLayer, foregroundLayer];
        this.renderLayers();
    }

    private generateTerrainLayer(primaryType: string): number[][] {
        const layer: number[][] = [];
        
        for (let y = 0; y < this.mapHeight; y++) {
            layer[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                // Create natural-looking terrain variation
                const noise = this.simplexNoise(x * 0.1, y * 0.1);
                
                if (noise > 0.3) {
                    layer[y][x] = 1; // Grass
                } else if (noise > 0.1) {
                    layer[y][x] = 2; // Dirt
                } else {
                    layer[y][x] = 3; // Stone
                }
            }
        }
        
        return layer;
    }

    private generateMixedTerrain(): number[][] {
        const layer: number[][] = [];
        
        for (let y = 0; y < this.mapHeight; y++) {
            layer[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                const noise = this.simplexNoise(x * 0.05, y * 0.05);
                
                if (noise > 0.4) {
                    layer[y][x] = 4; // Water
                } else if (noise > 0.2) {
                    layer[y][x] = 5; // Wood
                } else {
                    layer[y][x] = 0; // Empty (transparent)
                }
            }
        }
        
        return layer;
    }

    private generateObstacles(): number[][] {
        const layer: number[][] = [];
        
        for (let y = 0; y < this.mapHeight; y++) {
            layer[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                const random = Math.random();
                
                if (random > 0.95) {
                    layer[y][x] = 6; // Wall/Obstacle
                } else {
                    layer[y][x] = 0; // Empty
                }
            }
        }
        
        return layer;
    }

    // Simple noise function for terrain generation
    private simplexNoise(x: number, y: number): number {
        return Math.sin(x * 2.5) * Math.cos(y * 2.5) * 0.3 +
               Math.sin(x * 5) * Math.cos(y * 5) * 0.2 +
               Math.random() * 0.1;
    }

    private renderLayers(): void {
        this.layers.forEach(layer => {
            this.renderLayer(layer);
        });
    }

    private renderLayer(layer: MapLayer): void {
        const layerGroup = this.scene.add.group();
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tileId = layer.data[y][x];
                if (tileId === 0) continue; // Skip empty tiles
                
                const tileSprite = this.createTileSprite(x, y, tileId);
                if (tileSprite) {
                    // Set depth for HD-2D layering
                    tileSprite.setDepth(layer.depth);
                    
                    // Apply parallax scrolling
                    tileSprite.setScrollFactor(layer.parallax.x, layer.parallax.y);
                    
                    layerGroup.add(tileSprite);
                }
            }
        }
    }

    private createTileSprite(x: number, y: number, tileId: number): Phaser.GameObjects.Sprite | null {
        const tileKey = this.getTileKey(tileId);
        if (!this.scene.textures.exists(tileKey)) {
            return null;
        }
        
        const worldX = x * this.tileSize + this.tileSize / 2;
        const worldY = y * this.tileSize + this.tileSize / 2;
        
        const sprite = this.scene.add.sprite(worldX, worldY, tileKey);
        sprite.setOrigin(0.5, 0.5);
        
        return sprite;
    }

    private getTileKey(tileId: number): string {
        const tileTypes = [
            'empty',
            'grass_tile',
            'dirt_tile', 
            'stone_tile',
            'water_tile',
            'wood_tile',
            'wall_tile'
        ];
        
        return tileTypes[tileId] || 'grass_tile';
    }

    // Check collision at world position
    public isCollisionAt(x: number, y: number): boolean {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
            return true; // Out of bounds = collision
        }
        
        // Check foreground layer for obstacles
        const foregroundLayer = this.layers.find(layer => layer.name === 'foreground');
        if (foregroundLayer) {
            const tileId = foregroundLayer.data[tileY][tileX];
            return tileId === 6; // Wall tile
        }
        
        return false;
    }

    // Get tile info at position
    public getTileAt(x: number, y: number): TileData | null {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (tileX < 0 || tileX >= this.mapWidth || tileY < 0 || tileY >= this.mapHeight) {
            return null;
        }
        
        // Get top-most non-empty tile
        for (let i = this.layers.length - 1; i >= 0; i--) {
            const layer = this.layers[i];
            const tileId = layer.data[tileY][tileX];
            if (tileId > 0) {
                return {
                    id: tileId,
                    type: this.getTileType(tileId),
                    collision: tileId === 6,
                    depth: layer.depth
                };
            }
        }
        
        return null;
    }

    private getTileType(tileId: number): 'grass' | 'stone' | 'water' | 'dirt' | 'wood' | 'wall' {
        const types: ('grass' | 'stone' | 'water' | 'dirt' | 'wood' | 'wall')[] = [
            'grass', 'grass', 'dirt', 'stone', 'water', 'wood', 'wall'
        ];
        return types[tileId] || 'grass';
    }

    // Update parallax effects
    public updateParallax(cameraX: number, cameraY: number): void {
        this.layers.forEach(layer => {
            if (layer.parallax.x !== 1 || layer.parallax.y !== 1) {
                // Update parallax positions
                // This would be handled by Phaser's built-in scrollFactor
            }
        });
    }
}