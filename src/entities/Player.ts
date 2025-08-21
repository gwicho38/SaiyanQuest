import * as PIXI from 'pixi.js';
import { AssetLoader } from '../core/AssetLoader';

export type CharacterType = 'goku' | 'ssj_goku' | 'piccolo';
export type Direction = 'up' | 'down' | 'left' | 'right';

export class Player {
    private sprite!: PIXI.Sprite;
    private x: number;
    private y: number;
    private direction: Direction = 'down';
    private isMoving = false;
    private isRunning = false;
    private currentCharacter: CharacterType = 'goku';
    
    // Stats
    private level = 1;
    private maxHp = 100;
    private currentHp = 100;
    private maxKi = 50;
    private currentKi = 50;
    private attackPower = 20;
    private defense = 15;
    private speed = 180;
    private runSpeed = 300;
    
    // Animation
    private animationTimer = 0;
    private animationSpeed = 0.15;
    private currentFrame = 0;
    
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        
        this.createSprite();
    }
    
    private createSprite(): void {
        const assetLoader = AssetLoader.getInstance();
        
        // Try to create sprite from asset loader
        let sprite = assetLoader.createSprite('player_sprite');
        
        if (!sprite) {
            // Create fallback sprite
            console.warn('Player sprite not found, creating fallback');
            
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ff6b00';
                ctx.fillRect(8, 8, 16, 16);
            }
            const fallbackTexture = PIXI.Texture.from(canvas);
            sprite = new PIXI.Sprite(fallbackTexture);
        }
        
        this.sprite = sprite;
        this.sprite.anchor.set(0.5);
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        
        // Set sprite size
        this.sprite.width = 32;
        this.sprite.height = 32;
    }
    
    public update(deltaTime: number): void {
        // Update sprite position
        this.sprite.x = this.x;
        this.sprite.y = this.y;
        
        // Update animations
        this.updateAnimation(deltaTime);
    }
    
    private updateAnimation(deltaTime: number): void {
        if (this.isMoving) {
            this.animationTimer += deltaTime;
            
            if (this.animationTimer >= this.animationSpeed) {
                this.currentFrame = (this.currentFrame + 1) % 4; // 4 frame walk cycle
                this.animationTimer = 0;
                
                // Simple animation by scaling slightly
                const scale = 1.0 + Math.sin(this.currentFrame * Math.PI * 0.5) * 0.1;
                this.sprite.scale.set(scale);
            }
        } else {
            // Idle animation
            this.currentFrame = 0;
            this.sprite.scale.set(1.0);
        }
    }
    
    public move(directionX: number, directionY: number, running = false): void {
        this.isMoving = true;
        this.isRunning = running;
        
        // Update direction based on movement
        if (Math.abs(directionX) > Math.abs(directionY)) {
            this.direction = directionX > 0 ? 'right' : 'left';
        } else if (directionY !== 0) {
            this.direction = directionY > 0 ? 'down' : 'up';
        }
        
        // Calculate movement speed
        const currentSpeed = running ? this.runSpeed : this.speed;
        const moveSpeed = currentSpeed / 60; // Convert to per-frame movement
        
        // Apply movement
        this.x += directionX * moveSpeed;
        this.y += directionY * moveSpeed;
        
        // Update sprite rotation based on direction
        switch (this.direction) {
            case 'left':
                this.sprite.scale.x = -Math.abs(this.sprite.scale.x);
                break;
            case 'right':
                this.sprite.scale.x = Math.abs(this.sprite.scale.x);
                break;
        }
    }
    
    public stop(): void {
        this.isMoving = false;
        this.isRunning = false;
    }
    
    public attack(): void {
        console.log(`${this.currentCharacter} performs basic attack!`);
        
        // Simple attack animation
        const originalScale = this.sprite.scale.clone();
        this.sprite.scale.set(originalScale.x * 1.2, originalScale.y * 1.2);
        
        setTimeout(() => {
            this.sprite.scale.copyFrom(originalScale);
        }, 100);
    }
    
    public kiAttack(): void {
        if (this.currentKi >= 10) {
            this.currentKi -= 10;
            console.log(`${this.currentCharacter} fires a ki blast! Ki: ${this.currentKi}/${this.maxKi}`);
            
            // Ki attack animation
            const originalTint = this.sprite.tint;
            this.sprite.tint = 0x00ffff;
            
            setTimeout(() => {
                this.sprite.tint = originalTint;
            }, 200);
        } else {
            console.log('Not enough Ki!');
        }
    }
    
    public specialAttack(): void {
        if (this.currentKi >= 30) {
            this.currentKi -= 30;
            console.log(`${this.currentCharacter} performs special attack! Ki: ${this.currentKi}/${this.maxKi}`);
            
            // Special attack animation
            const originalTint = this.sprite.tint;
            this.sprite.tint = 0xffd700;
            
            setTimeout(() => {
                this.sprite.tint = originalTint;
            }, 500);
        } else {
            console.log('Not enough Ki for special attack!');
        }
    }
    
    public transformNext(): void {
        const characters: CharacterType[] = ['goku', 'ssj_goku', 'piccolo'];
        const currentIndex = characters.indexOf(this.currentCharacter);
        const nextIndex = (currentIndex + 1) % characters.length;
        
        this.transform(characters[nextIndex]);
    }
    
    public transformPrevious(): void {
        const characters: CharacterType[] = ['goku', 'ssj_goku', 'piccolo'];
        const currentIndex = characters.indexOf(this.currentCharacter);
        const prevIndex = currentIndex === 0 ? characters.length - 1 : currentIndex - 1;
        
        this.transform(characters[prevIndex]);
    }
    
    private transform(newCharacter: CharacterType): void {
        if (this.currentKi >= 20 && newCharacter !== this.currentCharacter) {
            this.currentKi -= 20;
            const oldCharacter = this.currentCharacter;
            this.currentCharacter = newCharacter;
            
            console.log(`Transformed from ${oldCharacter} to ${newCharacter}!`);
            
            // Update stats based on character
            this.updateStatsForCharacter();
            
            // Transformation effect
            this.sprite.tint = 0xffffff;
            let pulseCount = 0;
            const pulseInterval = setInterval(() => {
                this.sprite.alpha = this.sprite.alpha === 1 ? 0.5 : 1;
                pulseCount++;
                
                if (pulseCount >= 6) {
                    clearInterval(pulseInterval);
                    this.sprite.alpha = 1;
                    this.updateSpriteForCharacter();
                }
            }, 100);
        } else if (newCharacter === this.currentCharacter) {
            console.log(`Already in ${newCharacter} form!`);
        } else {
            console.log('Not enough Ki to transform!');
        }
    }
    
    private updateStatsForCharacter(): void {
        switch (this.currentCharacter) {
            case 'goku':
                this.attackPower = 20;
                this.speed = 180;
                this.runSpeed = 300;
                break;
            case 'ssj_goku':
                this.attackPower = 35;
                this.speed = 220;
                this.runSpeed = 380;
                break;
            case 'piccolo':
                this.attackPower = 25;
                this.speed = 200;
                this.runSpeed = 320;
                break;
        }
    }
    
    private updateSpriteForCharacter(): void {
        // Update sprite color based on character
        switch (this.currentCharacter) {
            case 'goku':
                this.sprite.tint = 0xff6b00; // Orange
                break;
            case 'ssj_goku':
                this.sprite.tint = 0xffd700; // Golden
                break;
            case 'piccolo':
                this.sprite.tint = 0x90ee90; // Light green
                break;
        }
    }
    
    public takeDamage(damage: number): void {
        const actualDamage = Math.max(1, damage - this.defense);
        this.currentHp = Math.max(0, this.currentHp - actualDamage);
        
        console.log(`${this.currentCharacter} takes ${actualDamage} damage! HP: ${this.currentHp}/${this.maxHp}`);
        
        // Damage effect
        const originalTint = this.sprite.tint;
        this.sprite.tint = 0xff0000;
        
        setTimeout(() => {
            this.sprite.tint = originalTint;
        }, 100);
    }
    
    public heal(amount: number): void {
        this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
        console.log(`${this.currentCharacter} healed for ${amount}! HP: ${this.currentHp}/${this.maxHp}`);
    }
    
    public restoreKi(amount: number): void {
        this.currentKi = Math.min(this.maxKi, this.currentKi + amount);
        console.log(`${this.currentCharacter} restored ${amount} Ki! Ki: ${this.currentKi}/${this.maxKi}`);
    }
    
    public levelUp(): void {
        this.level++;
        this.maxHp += 15;
        this.maxKi += 10;
        this.attackPower += 3;
        this.defense += 2;
        
        // Restore to full health and ki on level up
        this.currentHp = this.maxHp;
        this.currentKi = this.maxKi;
        
        console.log(`${this.currentCharacter} reached level ${this.level}!`);
        
        // Level up effect
        this.sprite.tint = 0xffffff;
        setTimeout(() => {
            this.updateSpriteForCharacter();
        }, 1000);
    }
    
    // Getters and setters
    public getSprite(): PIXI.Sprite {
        return this.sprite;
    }
    
    public getX(): number {
        return this.x;
    }
    
    public getY(): number {
        return this.y;
    }
    
    public setPosition(x: number, y: number): void {
        this.x = x;
        this.y = y;
    }
    
    public getDirection(): Direction {
        return this.direction;
    }
    
    public setDirection(direction: Direction): void {
        this.direction = direction;
    }
    
    public getCurrentCharacter(): CharacterType {
        return this.currentCharacter;
    }
    
    public getLevel(): number {
        return this.level;
    }
    
    public getHp(): { current: number; max: number } {
        return { current: this.currentHp, max: this.maxHp };
    }
    
    public getKi(): { current: number; max: number } {
        return { current: this.currentKi, max: this.maxKi };
    }
    
    public getStats(): {
        level: number;
        attackPower: number;
        defense: number;
        speed: number;
    } {
        return {
            level: this.level,
            attackPower: this.attackPower,
            defense: this.defense,
            speed: this.speed
        };
    }
    
    public isPlayerMoving(): boolean {
        return this.isMoving;
    }
    
    public isPlayerRunning(): boolean {
        return this.isRunning;
    }
    
    public destroy(): void {
        if (this.sprite && this.sprite.parent) {
            this.sprite.parent.removeChild(this.sprite);
        }
        this.sprite?.destroy();
    }
}