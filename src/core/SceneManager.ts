import * as PIXI from 'pixi.js';
import { BaseScene } from '../scenes/BaseScene';

export class SceneManager {
    private app: PIXI.Application;
    private scenes: Map<string, BaseScene> = new Map();
    private currentScene: BaseScene | null = null;
    private transitionContainer: PIXI.Container;

    constructor(app: PIXI.Application) {
        this.app = app;
        this.transitionContainer = new PIXI.Container();
        this.app.stage.addChild(this.transitionContainer);
    }

    public addScene(name: string, scene: BaseScene): void {
        this.scenes.set(name, scene);
        console.log(`Added scene: ${name}`);
    }

    public async switchToScene(sceneName: string, transitionType: 'instant' | 'fade' = 'instant'): Promise<void> {
        const newScene = this.scenes.get(sceneName);
        if (!newScene) {
            console.error(`Scene '${sceneName}' not found`);
            return;
        }

        console.log(`Switching to scene: ${sceneName}`);

        if (transitionType === 'fade') {
            await this.fadeTransition(newScene);
        } else {
            await this.instantTransition(newScene);
        }
    }

    private async instantTransition(newScene: BaseScene): Promise<void> {
        // Remove current scene
        if (this.currentScene) {
            this.currentScene.onExit();
            this.app.stage.removeChild(this.currentScene.getContainer());
        }

        // Add new scene
        this.currentScene = newScene;
        this.app.stage.addChild(newScene.getContainer());
        await newScene.onEnter();
    }

    private async fadeTransition(newScene: BaseScene): Promise<void> {
        const fadeDuration = 500; // milliseconds
        
        // Create fade overlay
        const fadeOverlay = new PIXI.Graphics();
        fadeOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
        fadeOverlay.fill(0x000000);
        fadeOverlay.alpha = 0;
        this.transitionContainer.addChild(fadeOverlay);

        // Fade out
        await this.animateAlpha(fadeOverlay, 0, 1, fadeDuration / 2);

        // Switch scenes during blackout
        if (this.currentScene) {
            this.currentScene.onExit();
            this.app.stage.removeChild(this.currentScene.getContainer());
        }

        this.currentScene = newScene;
        this.app.stage.addChild(newScene.getContainer());
        await newScene.onEnter();

        // Fade in
        await this.animateAlpha(fadeOverlay, 1, 0, fadeDuration / 2);

        // Clean up
        this.transitionContainer.removeChild(fadeOverlay);
        fadeOverlay.destroy();
    }

    private animateAlpha(target: PIXI.Container, from: number, to: number, duration: number): Promise<void> {
        return new Promise((resolve) => {
            target.alpha = from;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                target.alpha = from + (to - from) * eased;
                
                if (progress >= 1) {
                    target.alpha = to;
                    resolve();
                } else {
                    requestAnimationFrame(animate);
                }
            };
            
            animate();
        });
    }

    public getCurrentScene(): BaseScene | null {
        return this.currentScene;
    }

    public getScene(name: string): BaseScene | null {
        return this.scenes.get(name) || null;
    }

    public update(deltaTime: number): void {
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
        }
    }

    public resize(width: number, height: number): void {
        this.scenes.forEach(scene => {
            scene.resize(width, height);
        });
    }

    public destroy(): void {
        this.scenes.forEach(scene => {
            scene.destroy();
        });
        this.scenes.clear();
        this.currentScene = null;
        
        if (this.transitionContainer.parent) {
            this.transitionContainer.parent.removeChild(this.transitionContainer);
        }
        this.transitionContainer.destroy();
    }
}