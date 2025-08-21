import { Game } from './core/Game';
import { AssetLoader } from './core/AssetLoader';
import './styles/global.css';

class GameBootstrap {
    private game?: Game;
    private loadingScreen?: HTMLElement;
    private loadingProgress?: HTMLElement;
    private loadingText?: HTMLElement;

    constructor() {
        this.initializeDOM();
        this.setupErrorHandling();
        this.start();
    }

    private initializeDOM(): void {
        this.loadingScreen = document.getElementById('loading-screen') as HTMLElement;
        this.loadingProgress = document.getElementById('loading-progress') as HTMLElement;
        this.loadingText = document.getElementById('loading-text') as HTMLElement;
    }

    private setupErrorHandling(): void {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.showError('Game encountered an error. Please refresh the page.');
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.showError('Game encountered an error. Please refresh the page.');
        });
    }

    private async start(): Promise<void> {
        try {
            this.updateLoadingText('Loading game assets...');
            
            // Initialize asset loader
            const assetLoader = new AssetLoader();
            
            // Load assets with progress tracking
            await assetLoader.loadAssets((progress: number) => {
                this.updateLoadingProgress(progress * 0.8); // 80% for asset loading
                
                if (progress < 0.3) {
                    this.updateLoadingText('Loading sprites...');
                } else if (progress < 0.6) {
                    this.updateLoadingText('Loading audio...');
                } else if (progress < 0.9) {
                    this.updateLoadingText('Loading game data...');
                } else {
                    this.updateLoadingText('Preparing game world...');
                }
            });

            this.updateLoadingProgress(85);
            this.updateLoadingText('Initializing PixiJS engine...');

            // Initialize game
            this.game = new Game();
            await this.game.initialize();

            this.updateLoadingProgress(95);
            this.updateLoadingText('Starting Dragon Ball Z adventure...');

            // Small delay for dramatic effect
            await new Promise(resolve => setTimeout(resolve, 500));

            this.updateLoadingProgress(100);
            this.hideLoadingScreen();

            // Start the game
            this.game.start();

            console.log('🐉 Dragon Ball Z: Saiyan Quest HD-2D loaded successfully!');

        } catch (error) {
            console.error('Failed to start game:', error);
            this.showError('Failed to load the game. Please refresh the page.');
        }
    }

    private updateLoadingProgress(percentage: number): void {
        if (this.loadingProgress) {
            this.loadingProgress.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
        }
    }

    private updateLoadingText(text: string): void {
        if (this.loadingText) {
            this.loadingText.textContent = text;
        }
    }

    private hideLoadingScreen(): void {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                if (this.loadingScreen) {
                    this.loadingScreen.style.display = 'none';
                }
            }, 500);
        }
    }

    private showError(message: string): void {
        if (this.loadingText) {
            this.loadingText.textContent = message;
            this.loadingText.style.color = '#ff4444';
        }
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new GameBootstrap();
    });
} else {
    new GameBootstrap();
}

// Electron integration
declare global {
    interface Window {
        electronAPI?: any;
        gameAPI?: any;
        debugAPI?: any;
    }
}

// Handle Electron menu events
if (window.electronAPI) {
    window.electronAPI.onMenuAction?.((action: string) => {
        console.log('Menu action:', action);
        // Handle menu actions like save, load, etc.
    });
}