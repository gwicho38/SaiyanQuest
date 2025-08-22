import * as PIXI from 'pixi.js';
import { AssetLoader } from '../core/AssetLoader';

export type TileType = 'grass' | 'stone' | 'water' | 'empty';

export interface TileData {
    type: TileType;
    passable: boolean;
    sprite?: PIXI.Sprite;
}

export interface MapObject {
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    props?: { [key: string]: any };
}

export class TileMap {
    private container: PIXI.Container;
    private tiles: TileData[][] = [];
    private mapWidth: number;
    private mapHeight: number;
    private tileSize: number;
    private assetLoader: AssetLoader;
    private objects: MapObject[] = [];

    constructor(mapWidth: number, mapHeight: number, tileSize: number) {
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
        this.tileSize = tileSize;
        this.assetLoader = AssetLoader.getInstance();
        
        this.container = new PIXI.Container();
        this.container.label = 'TileMap';
        
        this.initializeTiles();
    }

    private initializeTiles(): void {
        this.tiles = [];
        
        for (let y = 0; y < this.mapHeight; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.mapWidth; x++) {
                this.tiles[y][x] = {
                    type: 'empty',
                    passable: true
                };
            }
        }

        // Build a simple static map layout
        this.buildStaticLayout();
    }

    private buildStaticLayout(): void {
        // Base grass
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                this.setTile(x, y, 'grass');
            }
        }

        // Stone area (training ground)
        const stoneX = Math.floor(this.mapWidth * 0.25);
        const stoneY = Math.floor(this.mapHeight * 0.25);
        for (let y = stoneY; y < stoneY + 8; y++) {
            for (let x = stoneX; x < stoneX + 12; x++) {
                this.setTile(x, y, 'stone');
            }
        }

        // Water river (vertical strip)
        const riverX = Math.floor(this.mapWidth * 0.65);
        for (let y = 0; y < this.mapHeight; y++) {
            for (let w = 0; w < 3; w++) {
                const rx = riverX + w;
                if (rx >= 0 && rx < this.mapWidth) {
                    this.setTile(rx, y, 'water');
                }
            }
        }
    }

    public setTile(x: number, y: number, type: TileType): void {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return;
        }

        // Ensure the row exists
        if (!this.tiles[y]) {
            console.error(`TileMap row ${y} is undefined. Map dimensions: ${this.mapWidth}x${this.mapHeight}`);
            return;
        }

        const tile = this.tiles[y][x];
        if (!tile) {
            console.error(`Tile at ${x},${y} is undefined`);
            return;
        }
        
        // Remove existing sprite if present
        if (tile.sprite && tile.sprite.parent) {
            tile.sprite.parent.removeChild(tile.sprite);
            tile.sprite.destroy();
        }

        // Update tile data
        tile.type = type;
        tile.passable = this.getTilePassable(type);

        // Create new sprite
        const newSprite = this.createTileSprite(type);
        tile.sprite = newSprite || undefined;
        if (tile.sprite) {
            tile.sprite.x = x * this.tileSize;
            tile.sprite.y = y * this.tileSize;
            this.container.addChild(tile.sprite);
        }
    }

    private getTilePassable(type: TileType): boolean {
        switch (type) {
            case 'grass': return true;
            case 'stone': return false;
            case 'water': return false;
            case 'empty': return true;
            default: return true;
        }
    }

    private createTileSprite(type: TileType): PIXI.Sprite | null {
        let sprite: PIXI.Sprite | null = null;
        
        // Try to get tile texture from loaded assets (fallback included)
        const textureKey = `${type}_tile`;
        const texture = this.assetLoader.getAsset(textureKey);
        
        if (texture) {
            sprite = new PIXI.Sprite(texture);
        }
        
        if (!sprite) {
            // Create fallback sprite with colored graphics
            const graphics = new PIXI.Graphics();
            graphics.rect(0, 0, this.tileSize, this.tileSize);
            
            let color = 0x808080; // Default gray
            switch (type) {
                case 'grass':
                    color = 0x228B22; // Forest green
                    break;
                case 'stone':
                    color = 0x708090; // Slate gray
                    break;
                case 'water':
                    color = 0x4169E1; // Royal blue
                    break;
                case 'empty':
                    color = 0x654321; // Brown dirt
                    break;
            }
            
            graphics.fill({ color });
            
            // Add some texture variation
            if (type === 'grass') {
                // Add grass details
                graphics.rect(4, 4, 4, 4);
                graphics.fill({ color: 0x32CD32 });
                graphics.rect(20, 8, 4, 4);
                graphics.fill({ color: 0x32CD32 });
                graphics.rect(12, 20, 4, 4);
                graphics.fill({ color: 0x32CD32 });
            } else if (type === 'stone') {
                // Add stone details
                graphics.rect(2, 2, 6, 6);
                graphics.fill({ color: 0x2F4F4F });
                graphics.rect(16, 12, 8, 8);
                graphics.fill({ color: 0x2F4F4F });
            } else if (type === 'water') {
                // Add water shimmer
                graphics.rect(8, 8, 2, 2);
                graphics.fill({ color: 0x87CEEB });
                graphics.rect(20, 16, 2, 2);
                graphics.fill({ color: 0x87CEEB });
            }
            
            // Create texture from graphics using canvas approach
            const canvas = document.createElement('canvas');
            canvas.width = this.tileSize;
            canvas.height = this.tileSize;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
                ctx.fillRect(0, 0, this.tileSize, this.tileSize);
            }
            const tileTexture = PIXI.Texture.from(canvas);
            
            sprite = new PIXI.Sprite(tileTexture);
            graphics.destroy();
        }
        
        if (sprite) {
            sprite.width = this.tileSize;
            sprite.height = this.tileSize;
        }
        
        return sprite;
    }

    public getTile(x: number, y: number): TileData | null {
        if (x < 0 || x >= this.mapWidth || y < 0 || y >= this.mapHeight) {
            return null;
        }
        return this.tiles[y][x];
    }

    public getTileType(x: number, y: number): TileType {
        const tile = this.getTile(x, y);
        return tile ? tile.type : 'empty';
    }

    public isTilePassable(x: number, y: number): boolean {
        const tile = this.getTile(x, y);
        return tile ? tile.passable : false;
    }

    public isCollisionAt(worldX: number, worldY: number): boolean {
        const tileX = Math.floor(worldX / this.tileSize);
        const tileY = Math.floor(worldY / this.tileSize);
        
        return !this.isTilePassable(tileX, tileY);
    }

    public worldToTileCoords(worldX: number, worldY: number): { x: number; y: number } {
        return {
            x: Math.floor(worldX / this.tileSize),
            y: Math.floor(worldY / this.tileSize)
        };
    }

    public tileToWorldCoords(tileX: number, tileY: number): { x: number; y: number } {
        return {
            x: tileX * this.tileSize,
            y: tileY * this.tileSize
        };
    }

    public getMapDimensions(): { width: number; height: number; tileSize: number } {
        return {
            width: this.mapWidth,
            height: this.mapHeight,
            tileSize: this.tileSize
        };
    }

    public getWorldDimensions(): { width: number; height: number } {
        return {
            width: this.mapWidth * this.tileSize,
            height: this.mapHeight * this.tileSize
        };
    }

    public generateRandomTerrain(): void {
        console.log('Generating random terrain...');
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                let tileType: TileType = 'grass';
                
                const random = Math.random();
                const distanceFromCenter = Math.sqrt(
                    Math.pow(x - this.mapWidth / 2, 2) + 
                    Math.pow(y - this.mapHeight / 2, 2)
                );
                const normalizedDistance = distanceFromCenter / (Math.min(this.mapWidth, this.mapHeight) / 2);
                
                if (normalizedDistance > 0.8) {
                    // Outer edges - more stone
                    tileType = random < 0.7 ? 'stone' : 'grass';
                } else if (random < 0.1) {
                    tileType = 'water';
                } else if (random < 0.2) {
                    tileType = 'stone';
                } else {
                    tileType = 'grass';
                }
                
                this.setTile(x, y, tileType);
            }
        }
        
        console.log('Random terrain generation complete');
    }

    public createRiver(): void {
        console.log('Creating river...');
        
        // Create a simple river from top to bottom
        const riverX = Math.floor(this.mapWidth * 0.7);
        const riverWidth = 3;
        
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = riverX; x < riverX + riverWidth; x++) {
                if (x >= 0 && x < this.mapWidth) {
                    this.setTile(x, y, 'water');
                }
            }
        }
        
        console.log('River creation complete');
    }

    public createPath(): void {
        console.log('Creating path...');
        
        // Create a winding path through the map
        const pathWidth = 2;
        let currentX = Math.floor(this.mapWidth * 0.1);
        let currentY = Math.floor(this.mapHeight * 0.5);
        
        while (currentX < this.mapWidth - 5) {
            // Create path section
            for (let py = currentY - pathWidth; py <= currentY + pathWidth; py++) {
                for (let px = currentX - pathWidth; px <= currentX + pathWidth; px++) {
                    if (px >= 0 && px < this.mapWidth && py >= 0 && py < this.mapHeight) {
                        this.setTile(px, py, 'grass');
                    }
                }
            }
            
            // Move path forward with some randomness
            currentX += 2 + Math.floor(Math.random() * 3);
            currentY += Math.floor(Math.random() * 7) - 3; // -3 to 3
            currentY = Math.max(5, Math.min(this.mapHeight - 5, currentY));
        }
        
        console.log('Path creation complete');
    }

    public addRandomDetails(): void {
        console.log('Adding random details...');
        
        const detailCount = Math.floor((this.mapWidth * this.mapHeight) * 0.05);
        
        for (let i = 0; i < detailCount; i++) {
            const x = Math.floor(Math.random() * this.mapWidth);
            const y = Math.floor(Math.random() * this.mapHeight);
            
            // Only add details to grass tiles
            if (this.getTileType(x, y) === 'grass') {
                // Random chance for stone or water features
                if (Math.random() < 0.3) {
                    this.setTile(x, y, 'stone');
                } else if (Math.random() < 0.1) {
                    this.setTile(x, y, 'water');
                }
            }
        }
        
        console.log('Random details added');
    }

    public async loadFromTiled(mapJsonUrl: string): Promise<void> {
        try {
            const response = await fetch(mapJsonUrl);
            const data = await response.json();

            const tilewidth = data.tilewidth || this.tileSize;
            const tileheight = data.tileheight || this.tileSize;
            const width = data.width;
            const height = data.height;

            if (tilewidth !== this.tileSize || tileheight !== this.tileSize) {
                console.warn(`Tiled map tile size ${tilewidth}x${tileheight} differs from engine tile size ${this.tileSize}. Rendering may be offset.`);
            }

            // Reset internal grid to map dimensions
            this.mapWidth = width;
            this.mapHeight = height;
            this.container.removeChildren();
            this.initializeTiles();

            // Build tileset atlas mapping from gid to PIXI.Texture
            const gidToTexture: Map<number, PIXI.Texture> = new Map();
            const tilesets = data.tilesets || [];
            tilesets.forEach((ts: any) => {
                const imagePath = ts.image; // runtime path under assets/
                const imgTexture = this.assetLoader.createTexture(imagePath) || PIXI.Texture.from(imagePath);
                const cols = ts.columns || Math.floor((ts.imagewidth - (ts.margin || 0) + (ts.spacing || 0)) / (ts.tilewidth + (ts.spacing || 0)));
                const rows = ts.tilecount ? Math.ceil(ts.tilecount / cols) : Math.floor((ts.imageheight - (ts.margin || 0) + (ts.spacing || 0)) / (ts.tileheight + (ts.spacing || 0)));
                const margin = ts.margin || 0;
                const spacing = ts.spacing || 0;
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        const gid = ts.firstgid + row * cols + col;
                        const x = margin + col * (ts.tilewidth + spacing);
                        const y = margin + row * (ts.tileheight + spacing);
                        if (x + ts.tilewidth > (ts.imagewidth || Infinity) || y + ts.tileheight > (ts.imageheight || Infinity)) {
                            continue;
                        }
                        const sub = new PIXI.Texture({
                            source: imgTexture.source,
                            frame: new PIXI.Rectangle(x, y, ts.tilewidth, ts.tileheight)
                        });
                        gidToTexture.set(gid, sub);
                    }
                }
            });

            // Render tile layers in order
            (data.layers || []).filter((l: any) => l.type === 'tilelayer').forEach((layer: any) => {
                const gids: number[] = layer.data;
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const idx = y * width + x;
                        const gid = gids[idx] || 0;
                        if (gid === 0) continue;
                        const tex = gidToTexture.get(gid);
                        if (tex) {
                            const sprite = new PIXI.Sprite(tex);
                            sprite.x = x * this.tileSize;
                            sprite.y = y * this.tileSize;
                            sprite.width = this.tileSize;
                            sprite.height = this.tileSize;
                            this.container.addChild(sprite);
                            // Record tile data
                            if (this.tiles[y] && this.tiles[y][x]) {
                                this.tiles[y][x].sprite = sprite;
                                this.tiles[y][x].type = 'grass'; // default type; precise semantics can be added later
                            }
                        }
                    }
                }
            });

            // Collisions: objectgroup named 'Collisions'
            const collisionLayer = (data.layers || []).find((l: any) => l.type === 'objectgroup' && /collisions?/i.test(l.name));
            if (collisionLayer && collisionLayer.objects) {
                collisionLayer.objects.forEach((obj: any) => {
                    const minTileX = Math.floor(obj.x / this.tileSize);
                    const minTileY = Math.floor(obj.y / this.tileSize);
                    const maxTileX = Math.floor((obj.x + (obj.width || 0) - 1) / this.tileSize);
                    const maxTileY = Math.floor((obj.y + (obj.height || 0) - 1) / this.tileSize);
                    for (let ty = minTileY; ty <= maxTileY; ty++) {
                        for (let tx = minTileX; tx <= maxTileX; tx++) {
                            if (this.tiles[ty] && this.tiles[ty][tx]) {
                                this.tiles[ty][tx].passable = false;
                            }
                        }
                    }
                });
            }

            // Generic objects (NPCs, items, triggers)
            this.objects = [];
            (data.layers || []).filter((l: any) => l.type === 'objectgroup' && !/collisions?/i.test(l.name)).forEach((layer: any) => {
                (layer.objects || []).forEach((o: any) => {
                    this.objects.push({
                        name: o.name || '',
                        type: o.type || (layer.name || ''),
                        x: o.x || 0,
                        y: o.y || 0,
                        width: o.width || 0,
                        height: o.height || 0,
                        props: o.props || o.properties || {}
                    });
                });
            });
        } catch (e) {
            console.error('Failed to load Tiled map:', e);
        }
    }

    public getObjects(): MapObject[] {
        return this.objects.slice();
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public update(deltaTime: number): void {
        // Tilemap doesn't need frame updates currently
        // Could add animated tiles here in the future
    }

    public destroy(): void {
        // Clean up all tile sprites
        for (let y = 0; y < this.mapHeight; y++) {
            for (let x = 0; x < this.mapWidth; x++) {
                const tile = this.tiles[y][x];
                if (tile.sprite) {
                    tile.sprite.destroy();
                }
            }
        }
        
        this.tiles = [];
        
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
        this.container.destroy({ children: true });
        
        console.log('TileMap destroyed');
    }
}