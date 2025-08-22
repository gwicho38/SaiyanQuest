import * as PIXI from 'pixi.js';
import { GameScene } from '../scenes/GameScene';
import { MenuScene } from '../scenes/MenuScene';
import { InputManager } from './InputManager';
import { AudioManager } from './AudioManager';
import { SaveManager } from './SaveManager';
import { SceneManager } from './SceneManager';
import { AssetLoader } from './AssetLoader';
import { QuestManager } from './QuestManager';

export interface GameSettings {
    width: number;
    height: number;
    resolution: number;
    antialias: boolean;
    backgroundColor: number;
    preserveDrawingBuffer: boolean;
}

export class Game {
    private app!: PIXI.Application;
    private sceneManager!: SceneManager;
    private inputManager!: InputManager;
    private audioManager!: AudioManager;
    private saveManager!: SaveManager;
    private isInitialized = false;
    private gameSettings: GameSettings;
    private questManager!: QuestManager;

    constructor() {
        this.gameSettings = {
            width: 1024,
            height: 768,
            resolution: window.devicePixelRatio || 1,
            antialias: false, // Keep crisp pixel art
            backgroundColor: 0x000000,
            preserveDrawingBuffer: false
        };
    }

    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            console.log('Initializing PixiJS application...');
            
            // Initialize PixiJS application
            await this.initializePixiApp();
            
            // Initialize game systems
            this.inputManager = new InputManager();
            this.audioManager = new AudioManager();
            this.saveManager = new SaveManager();
            this.sceneManager = new SceneManager(this.app);
            
            // Setup AssetLoader with game instance
            const assetLoader = AssetLoader.getInstance();
            assetLoader.setGameInstance(this);

            // Quest manager
            this.questManager = new QuestManager(this.saveManager);

            // Setup canvas and DOM
            this.setupCanvas();
            
            // Setup resize handling
            this.setupResizeHandler();
            
            // Initialize scenes
            await this.initializeScenes();
            
            this.isInitialized = true;
            console.log('Game initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
            throw error;
        }
    }

    private async initializePixiApp(): Promise<void> {
        // Create PixiJS application with modern settings
        this.app = new PIXI.Application();
        
        await this.app.init({
            width: this.gameSettings.width,
            height: this.gameSettings.height,
            resolution: this.gameSettings.resolution,
            antialias: this.gameSettings.antialias,
            backgroundColor: this.gameSettings.backgroundColor,
            preserveDrawingBuffer: this.gameSettings.preserveDrawingBuffer,
            canvas: document.getElementById('game-canvas') as HTMLCanvasElement,
            preference: 'webgl'
        });

        // Enable ticker for game loop
        this.app.ticker.maxFPS = 60;
        this.app.ticker.minFPS = 30;
        
        console.log('PixiJS version:', PIXI.VERSION);
        console.log('Renderer type:', this.app.renderer.type === PIXI.RendererType.WEBGL ? 'WebGL' : 'Canvas');
    }

    private setupCanvas(): void {
        const canvas = this.app.canvas;
        if (canvas) {
            canvas.style.display = 'block';
            canvas.style.imageRendering = 'pixelated';
            canvas.style.imageRendering = 'crisp-edges';
            
            // Set initial size
            this.resizeCanvas();
        }
    }

    private setupResizeHandler(): void {
        window.addEventListener('resize', () => {
            this.resizeCanvas();
        });
    }

    private resizeCanvas(): void {
        const container = document.getElementById('game-container');
        if (!container || !this.app) return;

        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // Calculate scale to fit while maintaining aspect ratio
        const scaleX = containerWidth / this.gameSettings.width;
        const scaleY = containerHeight / this.gameSettings.height;
        const scale = Math.min(scaleX, scaleY);
        
        // Keep renderer at logical size; scale canvas via CSS only
        const newCssWidth = this.gameSettings.width * scale;
        const newCssHeight = this.gameSettings.height * scale;
        
        const canvas = this.app.canvas;
        if (canvas) {
            canvas.style.width = `${newCssWidth}px`;
            canvas.style.height = `${newCssHeight}px`;
        }
    }

    private async initializeScenes(): Promise<void> {
        // Register scenes
        const menuScene = new MenuScene(this);
        const gameScene = new GameScene(this);
        
        this.sceneManager.addScene('menu', menuScene);
        this.sceneManager.addScene('game', gameScene);
        
        // Initialize scenes
        await menuScene.initialize();
        await gameScene.initialize();
    }

    public start(): void {
        if (!this.isInitialized) {
            throw new Error('Game must be initialized before starting');
        }

        console.log('Starting game...');
        
        // Start with menu scene
        this.sceneManager.switchToScene('menu');
        
        // Start the game loop
        this.app.ticker.add(this.gameLoop, this);
        
        // Setup input handling
        this.inputManager.initialize();
        
        // Initialize audio
        this.audioManager.initialize();
    }

    private gameLoop(deltaTime: PIXI.Ticker): void {
        const dt = deltaTime.deltaTime / 60; // Convert to seconds
        
        // Update current scene
        this.sceneManager.update(dt);
        
        // Update input
        this.inputManager.update(dt);
        
        // Update audio
        this.audioManager.update(dt);
    }

    public switchToScene(sceneName: string): void {
        this.sceneManager.switchToScene(sceneName);
    }

    public getApp(): PIXI.Application {
        return this.app;
    }

    public getInputManager(): InputManager {
        return this.inputManager;
    }

    public getAudioManager(): AudioManager {
        return this.audioManager;
    }

    public getSaveManager(): SaveManager {
        return this.saveManager;
    }

    public getQuestManager(): QuestManager {
        return this.questManager;
    }

    public getSceneManager(): SceneManager {
        return this.sceneManager;
    }

    public destroy(): void {
        if (this.app) {
            this.app.destroy(true, true);
        }
        
        if (this.inputManager) {
            this.inputManager.destroy();
        }
        
        if (this.audioManager) {
            this.audioManager.destroy();
        }
        
        this.isInitialized = false;
    }
}