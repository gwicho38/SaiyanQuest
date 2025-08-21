export interface PlayerData {
    name: string;
    level: number;
    experience: number;
    maxHp: number;
    currentHp: number;
    maxKi: number;
    currentKi: number;
    attackPower: number;
    defense: number;
    speed: number;
    transformationLevel: number;
    position: { x: number; y: number };
    currentCharacter: 'goku' | 'ssj_goku' | 'piccolo';
}

export interface GameProgress {
    currentLevel: string;
    completedQuests: string[];
    unlockedCharacters: string[];
    playTime: number;
    lastSaved: number;
}

export interface GameSettings {
    volume: number;
    musicVolume: number;
    sfxVolume: number;
    fullscreen: boolean;
    vsync: boolean;
    quality: 'low' | 'medium' | 'high';
    keyBindings: { [action: string]: string };
}

export interface SaveData {
    version: string;
    playerData: PlayerData;
    progress: GameProgress;
    settings: GameSettings;
    metadata: {
        saveDate: number;
        playTime: number;
        level: number;
        location: string;
    };
}

export class SaveManager {
    private static readonly SAVE_KEY = 'dbz-saiyan-quest-save';
    private static readonly SETTINGS_KEY = 'dbz-saiyan-quest-settings';
    private static readonly VERSION = '1.0.0';
    
    private currentSave: SaveData | null = null;
    private isInitialized = false;

    constructor() {
        this.initialize();
    }

    private initialize(): void {
        if (this.isInitialized) {
            return;
        }

        console.log('Initializing save manager...');
        
        // Load existing save data
        this.loadSaveData();
        
        this.isInitialized = true;
        console.log('Save manager initialized');
    }

    public createNewSave(): SaveData {
        const newSave: SaveData = {
            version: SaveManager.VERSION,
            playerData: {
                name: 'Goku',
                level: 1,
                experience: 0,
                maxHp: 100,
                currentHp: 100,
                maxKi: 50,
                currentKi: 50,
                attackPower: 20,
                defense: 15,
                speed: 25,
                transformationLevel: 0,
                position: { x: 800, y: 600 },
                currentCharacter: 'goku'
            },
            progress: {
                currentLevel: 'overworld',
                completedQuests: [],
                unlockedCharacters: ['goku'],
                playTime: 0,
                lastSaved: Date.now()
            },
            settings: {
                volume: 0.7,
                musicVolume: 0.5,
                sfxVolume: 0.8,
                fullscreen: false,
                vsync: true,
                quality: 'high',
                keyBindings: {}
            },
            metadata: {
                saveDate: Date.now(),
                playTime: 0,
                level: 1,
                location: 'Goku\'s House'
            }
        };

        return newSave;
    }

    public saveGame(saveData?: SaveData): boolean {
        try {
            const dataToSave = saveData || this.currentSave;
            if (!dataToSave) {
                console.error('No save data to save');
                return false;
            }

            // Update metadata
            dataToSave.metadata.saveDate = Date.now();
            dataToSave.progress.lastSaved = Date.now();

            // Save to storage
            if (window.gameAPI?.storage) {
                // Use Electron storage API
                const success = window.gameAPI.storage.set(SaveManager.SAVE_KEY, dataToSave);
                if (success) {
                    this.currentSave = dataToSave;
                    console.log('Game saved successfully');
                    return true;
                } else {
                    console.error('Failed to save game via Electron API');
                    return false;
                }
            } else {
                // Fallback to localStorage
                localStorage.setItem(SaveManager.SAVE_KEY, JSON.stringify(dataToSave));
                this.currentSave = dataToSave;
                console.log('Game saved successfully to localStorage');
                return true;
            }
        } catch (error) {
            console.error('Error saving game:', error);
            return false;
        }
    }

    public loadSaveData(): SaveData | null {
        try {
            let savedData: SaveData | null = null;

            if (window.gameAPI?.storage) {
                // Use Electron storage API
                savedData = window.gameAPI.storage.get(SaveManager.SAVE_KEY);
            } else {
                // Fallback to localStorage
                const stored = localStorage.getItem(SaveManager.SAVE_KEY);
                if (stored) {
                    savedData = JSON.parse(stored);
                }
            }

            if (savedData) {
                // Validate save data version
                if (savedData.version !== SaveManager.VERSION) {
                    console.warn('Save data version mismatch, migrating...');
                    savedData = this.migrateSaveData(savedData);
                }

                this.currentSave = savedData;
                console.log('Save data loaded successfully');
                return savedData;
            } else {
                console.log('No save data found');
                return null;
            }
        } catch (error) {
            console.error('Error loading save data:', error);
            return null;
        }
    }

    private migrateSaveData(oldSave: any): SaveData {
        // Handle save data migration between versions
        console.log('Migrating save data from version', oldSave.version, 'to', SaveManager.VERSION);
        
        // Create new save with default values
        const newSave = this.createNewSave();
        
        // Copy over what we can from the old save
        try {
            if (oldSave.playerData) {
                Object.assign(newSave.playerData, oldSave.playerData);
            }
            if (oldSave.progress) {
                Object.assign(newSave.progress, oldSave.progress);
            }
            if (oldSave.settings) {
                Object.assign(newSave.settings, oldSave.settings);
            }
        } catch (error) {
            console.error('Error during save migration:', error);
        }
        
        // Update version
        newSave.version = SaveManager.VERSION;
        
        return newSave;
    }

    public saveSettings(settings: GameSettings): boolean {
        try {
            if (window.gameAPI?.storage) {
                // Use Electron storage API
                return window.gameAPI.storage.set(SaveManager.SETTINGS_KEY, settings);
            } else {
                // Fallback to localStorage
                localStorage.setItem(SaveManager.SETTINGS_KEY, JSON.stringify(settings));
                return true;
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    public loadSettings(): GameSettings {
        try {
            let settings: GameSettings | null = null;

            if (window.gameAPI?.storage) {
                // Use Electron storage API
                settings = window.gameAPI.storage.get(SaveManager.SETTINGS_KEY);
            } else {
                // Fallback to localStorage
                const stored = localStorage.getItem(SaveManager.SETTINGS_KEY);
                if (stored) {
                    settings = JSON.parse(stored);
                }
            }

            if (settings) {
                return settings;
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }

        // Return default settings
        return {
            volume: 0.7,
            musicVolume: 0.5,
            sfxVolume: 0.8,
            fullscreen: false,
            vsync: true,
            quality: 'high',
            keyBindings: {}
        };
    }

    public getCurrentSave(): SaveData | null {
        return this.currentSave;
    }

    public hasSaveData(): boolean {
        return this.currentSave !== null;
    }

    public deleteSaveData(): boolean {
        try {
            if (window.gameAPI?.storage) {
                // Use Electron storage API
                const success = window.gameAPI.storage.remove(SaveManager.SAVE_KEY);
                if (success) {
                    this.currentSave = null;
                    return true;
                }
                return false;
            } else {
                // Fallback to localStorage
                localStorage.removeItem(SaveManager.SAVE_KEY);
                this.currentSave = null;
                return true;
            }
        } catch (error) {
            console.error('Error deleting save data:', error);
            return false;
        }
    }

    public exportSave(): string | null {
        if (!this.currentSave) {
            return null;
        }

        try {
            return JSON.stringify(this.currentSave, null, 2);
        } catch (error) {
            console.error('Error exporting save:', error);
            return null;
        }
    }

    public importSave(saveString: string): boolean {
        try {
            const saveData = JSON.parse(saveString) as SaveData;
            
            // Validate the save data structure
            if (!this.validateSaveData(saveData)) {
                console.error('Invalid save data structure');
                return false;
            }

            // Migrate if necessary
            if (saveData.version !== SaveManager.VERSION) {
                const migrated = this.migrateSaveData(saveData);
                return this.saveGame(migrated);
            } else {
                return this.saveGame(saveData);
            }
        } catch (error) {
            console.error('Error importing save:', error);
            return false;
        }
    }

    private validateSaveData(data: any): boolean {
        // Basic validation of save data structure
        return data &&
               typeof data.version === 'string' &&
               data.playerData &&
               data.progress &&
               data.settings &&
               data.metadata;
    }

    public getPlayTime(): number {
        return this.currentSave?.progress.playTime || 0;
    }

    public updatePlayTime(deltaTime: number): void {
        if (this.currentSave) {
            this.currentSave.progress.playTime += deltaTime;
            this.currentSave.metadata.playTime = this.currentSave.progress.playTime;
        }
    }

    public destroy(): void {
        console.log('Destroying save manager...');
        this.currentSave = null;
        this.isInitialized = false;
        console.log('Save manager destroyed');
    }
}