export class Player {
    public sprite: Phaser.Physics.Arcade.Sprite;
    public maxHp: number = 100;
    public currentHp: number = 100;
    public level: number = 1;
    public experience: number = 0;
    public attackPower: number = 10;
    
    private scene: Phaser.Scene;
    private lastAttackTime: number = 0;
    private attackCooldown: number = 500; // ms
    private currentDirection: string = 'down';
    private isMoving: boolean = false;
    private spriteKey: string = 'goku';

    constructor(scene: Phaser.Scene, x: number, y: number) {
        this.scene = scene;
        
        // Create sprite with HD-2D character
        this.sprite = scene.physics.add.sprite(x, y, this.spriteKey);
        this.sprite.setCollideWorldBounds(true);
        
        // HD-2D character proportions
        this.sprite.setSize(16, 20); // Smaller collision box
        this.sprite.setOffset(8, 28); // Adjust collision offset
        this.sprite.setScale(2); // Scale up pixel art
    }

    public setSprite(spriteKey: string): void {
        this.spriteKey = spriteKey;
        this.sprite.setTexture(spriteKey);
    }

    public setDirection(direction: string): void {
        this.currentDirection = direction;
    }

    public getDirection(): string {
        return this.currentDirection;
    }

    public move(velocityX: number, velocityY: number): void {
        this.sprite.setVelocity(velocityX, velocityY);
        
        // HD-2D animation system
        const wasMoving = this.isMoving;
        this.isMoving = velocityX !== 0 || velocityY !== 0;
        
        if (this.isMoving) {
            // Play walking animation for current direction
            const animKey = `${this.spriteKey}_walk_${this.currentDirection}`;
            if (this.scene.anims.exists(animKey) && !this.sprite.anims.isPlaying) {
                this.sprite.anims.play(animKey);
            }
        } else {
            // Stop animation and show idle frame
            if (wasMoving) {
                this.sprite.anims.stop();
                this.sprite.setTexture(this.spriteKey);
            }
        }
    }

    public attack(): void {
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastAttackTime < this.attackCooldown) {
            return; // Still on cooldown
        }

        this.lastAttackTime = currentTime;
        
        // Visual attack effect
        this.sprite.setTint(0xffff00); // Yellow flash
        this.scene.time.delayedCall(100, () => {
            this.sprite.clearTint();
        });

        // Create attack hitbox (simple implementation)
        this.createAttackEffect();
    }

    private createAttackEffect(): void {
        const attackRadius = 50;
        const attack = this.scene.add.circle(
            this.sprite.x, 
            this.sprite.y, 
            attackRadius, 
            0xffff00, 
            0.5
        );
        
        // Remove attack effect after short time
        this.scene.time.delayedCall(200, () => {
            attack.destroy();
        });
    }

    public takeDamage(amount: number): void {
        this.currentHp = Math.max(0, this.currentHp - amount);
        
        // Visual damage effect
        this.sprite.setTint(0xff0000);
        this.scene.time.delayedCall(200, () => {
            this.sprite.clearTint();
        });

        if (this.currentHp <= 0) {
            this.die();
        }
    }

    public gainExperience(amount: number): void {
        this.experience += amount;
        const requiredExp = this.getRequiredExp();
        
        if (this.experience >= requiredExp) {
            this.levelUp();
        }
    }

    public getRequiredExp(): number {
        return this.level * 100;
    }

    private levelUp(): void {
        this.level++;
        this.experience = 0;
        this.maxHp += 20;
        this.currentHp = this.maxHp; // Full heal on level up
        this.attackPower += 5;
        
        // Level up effect
        this.sprite.setTint(0x00ff00);
        this.scene.time.delayedCall(500, () => {
            this.sprite.clearTint();
        });
    }

    private die(): void {
        // Death logic
        this.sprite.setTint(0x666666);
        console.log('Player died!');
        // Could restart level or show game over screen
    }
}