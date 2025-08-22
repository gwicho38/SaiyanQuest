import * as PIXI from 'pixi.js';
import { Game } from '../core/Game';

export abstract class BaseScene {
    protected game: Game;
    protected container: PIXI.Container;
    protected isInitialized = false;
    protected isActive = false;

    constructor(game: Game) {
        this.game = game;
        this.container = new PIXI.Container();
        this.container.label = this.constructor.name;
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        console.log(`Initializing scene: ${this.constructor.name}`);
        
        try {
            await this.onCreate();
            this.isInitialized = true;
            console.log(`Scene initialized: ${this.constructor.name}`);
        } catch (error) {
            console.error(`Failed to initialize scene ${this.constructor.name}:`, error);
            throw error;
        }
    }

    public async onEnter(): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        this.isActive = true;
        this.container.visible = true;
        
        console.log(`Entered scene: ${this.constructor.name}`);
        await this.onSceneEnter();
    }

    public onExit(): void {
        this.isActive = false;
        this.container.visible = false;
        
        console.log(`Exited scene: ${this.constructor.name}`);
        this.onSceneExit();
    }

    public update(deltaTime: number): void {
        if (!this.isActive) {
            return;
        }
        
        this.onUpdate(deltaTime);
    }

    public resize(width: number, height: number): void {
        this.onResize(width, height);
    }

    public getContainer(): PIXI.Container {
        return this.container;
    }

    public isSceneInitialized(): boolean {
        return this.isInitialized;
    }

    public isSceneActive(): boolean {
        return this.isActive;
    }

    public destroy(): void {
        console.log(`Destroying scene: ${this.constructor.name}`);
        
        this.onDestroy();
        
        if (this.container.parent) {
            this.container.parent.removeChild(this.container);
        }
        
        this.container.destroy({ children: true });
        this.isInitialized = false;
        this.isActive = false;
    }

    // Abstract methods to be implemented by subclasses
    protected abstract onCreate(): Promise<void>;
    protected abstract onUpdate(deltaTime: number): void;

    // Optional methods with default implementations
    protected async onSceneEnter(): Promise<void> {
        // Override in subclasses if needed
    }

    protected onSceneExit(): void {
        // Override in subclasses if needed
    }

    protected onResize(width: number, height: number): void {
        // Override in subclasses if needed
    }

    protected onDestroy(): void {
        // Override in subclasses if needed
    }

    // Utility methods
    protected createBackground(color: number = 0x000000): PIXI.Graphics {
        const background = new PIXI.Graphics();
        background.rect(0, 0, this.game.getApp().screen.width, this.game.getApp().screen.height);
        background.fill(color);
        background.zIndex = -1000;
        this.container.addChild(background);
        return background;
    }

    protected createText(text: string, style?: Partial<PIXI.TextStyle>): PIXI.Text {
        const defaultStyle: Partial<PIXI.TextStyle> = {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xffffff,
            align: 'center'
        };

        const finalStyle = { ...defaultStyle, ...style };
        return new PIXI.Text({ text, style: finalStyle });
    }

    protected centerObject(object: PIXI.Container, offsetX = 0, offsetY = 0): void {
        const app = this.game.getApp();
        object.x = (app.screen.width / 2) + offsetX;
        object.y = (app.screen.height / 2) + offsetY;
    }

    protected fadeIn(object: PIXI.Container, duration = 500): Promise<void> {
        return new Promise((resolve) => {
            object.alpha = 0;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                object.alpha = progress;
                
                if (progress >= 1) {
                    resolve();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        });
    }

    protected fadeOut(object: PIXI.Container, duration = 500): Promise<void> {
        return new Promise((resolve) => {
            const startAlpha = object.alpha;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                object.alpha = startAlpha * (1 - progress);
                
                if (progress >= 1) {
                    object.alpha = 0;
                    resolve();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        });
    }

    protected tween(
        target: any,
        properties: { [key: string]: number },
        duration: number,
        easing: (t: number) => number = (t) => t
    ): Promise<void> {
        return new Promise((resolve) => {
            const startValues: { [key: string]: number } = {};
            Object.keys(properties).forEach(key => {
                startValues[key] = target[key];
            });
            
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easing(progress);
                
                Object.keys(properties).forEach(key => {
                    const start = startValues[key];
                    const end = properties[key];
                    target[key] = start + (end - start) * easedProgress;
                });
                
                if (progress >= 1) {
                    Object.keys(properties).forEach(key => {
                        target[key] = properties[key];
                    });
                    resolve();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        });
    }

    // Easing functions
    protected easeInOut(t: number): number {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    protected easeOut(t: number): number {
        return 1 - Math.pow(1 - t, 3);
    }

    protected easeIn(t: number): number {
        return t * t * t;
    }

    protected createDialog(text: string): { container: PIXI.Container; setText: (t: string)=>void; close: ()=>void } {
        const app = this.game.getApp();
        const container = new PIXI.Container();
        container.label = 'Dialog';
        container.zIndex = 2000;

        const padding = 16;
        const width = Math.min(app.screen.width - padding * 2, 600);
        const height = 120;
        const x = (app.screen.width - width) / 2;
        const y = app.screen.height - height - padding;

        const bg = new PIXI.Graphics();
        bg.roundRect(0, 0, width, height, 10);
        bg.fill(0x000000, 0.7);
        bg.stroke({ color: 0xffffff, width: 2, alpha: 0.8 });
        bg.x = x;
        bg.y = y;

        const txt = this.createText(text, {
            fontSize: 16,
            fill: 0xffffff,
            wordWrap: true,
            wordWrapWidth: width - padding * 2
        });
        txt.x = x + padding;
        txt.y = y + padding;

        container.addChild(bg);
        container.addChild(txt);
        this.container.addChild(container);

        return {
            container,
            setText: (t: string) => { (txt as any).text = t; },
            close: () => { container.destroy({ children: true }); }
        };
    }
}