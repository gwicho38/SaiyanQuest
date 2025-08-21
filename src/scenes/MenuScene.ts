import * as PIXI from 'pixi.js';
import { BaseScene } from './BaseScene';
import { Game } from '../core/Game';

interface MenuOption {
    text: string;
    action: () => void;
    enabled: boolean;
}

export class MenuScene extends BaseScene {
    private background!: PIXI.Graphics;
    private titleText!: PIXI.Text;
    private subtitleText!: PIXI.Text;
    private menuOptions: MenuOption[] = [];
    private menuTexts: PIXI.Text[] = [];
    private selectedIndex = 0;
    private particles: PIXI.Graphics[] = [];
    private backgroundAnimation = 0;

    constructor(game: Game) {
        super(game);
    }

    protected async onCreate(): Promise<void> {
        this.createMenuBackground();
        this.createTitle();
        this.createMenu();
        this.createParticleEffect();
        this.setupMenuOptions();
    }

    private createMenuBackground(): void {
        // Create animated gradient background
        this.background = new PIXI.Graphics();
        this.updateBackground();
        this.container.addChild(this.background);
    }

    private updateBackground(): void {
        const app = this.game.getApp();
        this.background.clear();
        
        // Create animated gradient using sine waves
        const time = this.backgroundAnimation;
        const color1 = 0x1a1a2e + Math.sin(time * 0.001) * 0x101010;
        const color2 = 0x16213e + Math.cos(time * 0.0015) * 0x101010;
        const color3 = 0x0f0f23 + Math.sin(time * 0.002) * 0x050505;
        
        // Draw gradient rectangles
        this.background.rect(0, 0, app.screen.width, app.screen.height / 3);
        this.background.fill(color1);
        
        this.background.rect(0, app.screen.height / 3, app.screen.width, app.screen.height / 3);
        this.background.fill(color2);
        
        this.background.rect(0, (app.screen.height / 3) * 2, app.screen.width, app.screen.height / 3);
        this.background.fill(color3);
    }

    private createTitle(): void {
        // Main title
        this.titleText = this.createText('DRAGON BALL Z', {
            fontSize: 64,
            fontFamily: 'Arial Black, Arial',
            fill: 0xffd700,
            stroke: { color: 0x000000, width: 4 },
            dropShadow: {
                alpha: 1,
                angle: Math.PI / 6,
                blur: 10,
                color: 0x000000,
                distance: 5
            }
        });
        
        this.centerObject(this.titleText, 0, -200);
        this.container.addChild(this.titleText);
        
        // Subtitle
        this.subtitleText = this.createText('SAIYAN QUEST HD-2D', {
            fontSize: 36,
            fontFamily: 'Arial',
            fill: 0xff6b00,
            stroke: { color: 0x000000, width: 2 },
            fontStyle: 'italic'
        });
        
        this.centerObject(this.subtitleText, 0, -140);
        this.container.addChild(this.subtitleText);
    }

    private createMenu(): void {
        const menuY = this.game.getApp().screen.height / 2 - 50;
        
        this.menuOptions = [
            {
                text: 'New Game',
                action: () => this.startNewGame(),
                enabled: true
            },
            {
                text: 'Continue',
                action: () => this.continueGame(),
                enabled: this.game.getSaveManager().hasSaveData()
            },
            {
                text: 'Settings',
                action: () => this.openSettings(),
                enabled: true
            },
            {
                text: 'Credits',
                action: () => this.showCredits(),
                enabled: true
            },
            {
                text: 'Exit',
                action: () => this.exitGame(),
                enabled: true
            }
        ];

        // Create menu text objects
        this.menuOptions.forEach((option, index) => {
            const text = this.createText(option.text, {
                fontSize: 32,
                fontFamily: 'Arial',
                fill: option.enabled ? 0xffffff : 0x666666,
                stroke: { color: 0x000000, width: 2 }
            });
            
            text.x = this.game.getApp().screen.width / 2;
            text.y = menuY + (index * 60);
            text.anchor.set(0.5);
            
            this.menuTexts.push(text);
            this.container.addChild(text);
        });

        this.updateMenuSelection();
    }

    private createParticleEffect(): void {
        // Create floating energy particles
        for (let i = 0; i < 20; i++) {
            const particle = new PIXI.Graphics();
            particle.circle(0, 0, Math.random() * 3 + 1);
            particle.fill(0xffd700);
            particle.alpha = Math.random() * 0.5 + 0.3;
            
            particle.x = Math.random() * this.game.getApp().screen.width;
            particle.y = Math.random() * this.game.getApp().screen.height;
            
            // Store initial position and velocity
            (particle as any).initialY = particle.y;
            (particle as any).velocity = Math.random() * 0.5 + 0.2;
            (particle as any).amplitude = Math.random() * 20 + 10;
            (particle as any).frequency = Math.random() * 0.02 + 0.01;
            
            this.particles.push(particle);
            this.container.addChild(particle);
        }
    }

    private setupMenuOptions(): void {
        // Enable continue option if save data exists
        if (this.game.getSaveManager().hasSaveData()) {
            this.menuOptions[1].enabled = true;
            this.menuTexts[1].style.fill = 0xffffff;
        }
    }

    private updateMenuSelection(): void {
        this.menuTexts.forEach((text, index) => {
            const option = this.menuOptions[index];
            
            if (index === this.selectedIndex && option.enabled) {
                // Selected item
                text.style.fill = 0xffd700;
                text.scale.set(1.1);
                text.style.dropShadow = {
                    alpha: 1,
                    angle: Math.PI / 6,
                    blur: 5,
                    color: 0xff6b00,
                    distance: 2
                };
            } else if (option.enabled) {
                // Enabled item
                text.style.fill = 0xffffff;
                text.scale.set(1.0);
                text.style.dropShadow = false;
            } else {
                // Disabled item
                text.style.fill = 0x666666;
                text.scale.set(1.0);
                text.style.dropShadow = false;
            }
        });
    }

    protected onUpdate(deltaTime: number): void {
        this.backgroundAnimation += deltaTime * 16; // Convert to milliseconds
        this.updateBackground();
        this.updateParticles(deltaTime);
        this.updateTitle(deltaTime);
        this.handleInput();
    }

    private updateParticles(deltaTime: number): void {
        this.particles.forEach(particle => {
            const p = particle as any;
            
            // Floating motion
            p.y += p.velocity * deltaTime * 60;
            p.x += Math.sin(this.backgroundAnimation * p.frequency) * 0.5;
            
            // Wrap around screen
            if (p.y > this.game.getApp().screen.height + 10) {
                p.y = -10;
                p.x = Math.random() * this.game.getApp().screen.width;
            }
            
            // Pulse alpha
            particle.alpha = 0.3 + Math.sin(this.backgroundAnimation * 0.003 + p.x * 0.01) * 0.2;
        });
    }

    private updateTitle(deltaTime: number): void {
        // Subtle title animation
        const pulse = Math.sin(this.backgroundAnimation * 0.002) * 0.05 + 1;
        this.titleText.scale.set(pulse);
        
        // Subtitle glow effect
        const glow = Math.sin(this.backgroundAnimation * 0.003) * 0.3 + 0.7;
        this.subtitleText.alpha = glow;
    }

    private handleInput(): void {
        const input = this.game.getInputManager();
        
        if (input.isActionJustPressed('up')) {
            this.navigateUp();
        } else if (input.isActionJustPressed('down')) {
            this.navigateDown();
        } else if (input.isActionJustPressed('confirm')) {
            this.selectCurrentOption();
        }
    }

    private navigateUp(): void {
        do {
            this.selectedIndex = (this.selectedIndex - 1 + this.menuOptions.length) % this.menuOptions.length;
        } while (!this.menuOptions[this.selectedIndex].enabled);
        
        this.updateMenuSelection();
        this.game.getAudioManager().playSfx('menu_select');
    }

    private navigateDown(): void {
        do {
            this.selectedIndex = (this.selectedIndex + 1) % this.menuOptions.length;
        } while (!this.menuOptions[this.selectedIndex].enabled);
        
        this.updateMenuSelection();
        this.game.getAudioManager().playSfx('menu_select');
    }

    private selectCurrentOption(): void {
        const option = this.menuOptions[this.selectedIndex];
        if (option.enabled) {
            this.game.getAudioManager().playSfx('menu_select');
            option.action();
        }
    }

    private startNewGame(): void {
        console.log('Starting new game...');
        this.game.getAudioManager().stopMusic(true);
        this.game.switchToScene('game');
    }

    private continueGame(): void {
        console.log('Continuing game...');
        this.game.getAudioManager().stopMusic(true);
        this.game.switchToScene('game');
    }

    private openSettings(): void {
        console.log('Opening settings...');
        // TODO: Implement settings scene
    }

    private showCredits(): void {
        console.log('Showing credits...');
        // TODO: Implement credits scene
    }

    private exitGame(): void {
        console.log('Exiting game...');
        if (window.electronAPI) {
            // Close Electron app
            window.close();
        } else {
            // Close browser tab
            window.close();
        }
    }

    protected async onSceneEnter(): Promise<void> {
        // Start menu music
        this.game.getAudioManager().playMusic('menu_theme', true);
        
        // Reset menu selection
        this.selectedIndex = 0;
        this.updateMenuSelection();
        
        // Refresh menu options
        this.setupMenuOptions();
        
        // Fade in effect
        this.container.alpha = 0;
        await this.fadeIn(this.container, 1000);
    }

    protected onSceneExit(): void {
        // Stop menu music
        this.game.getAudioManager().stopMusic(true);
    }

    protected onResize(width: number, height: number): void {
        // Update background size
        this.updateBackground();
        
        // Recenter title
        this.centerObject(this.titleText, 0, -200);
        this.centerObject(this.subtitleText, 0, -140);
        
        // Recenter menu
        const menuY = height / 2 - 50;
        this.menuTexts.forEach((text, index) => {
            text.x = width / 2;
            text.y = menuY + (index * 60);
        });
    }
}