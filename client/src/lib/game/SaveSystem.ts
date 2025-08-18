interface SaveData {
  playerData: {
    position: { x: number; y: number; z: number };
    health: number;
    maxHealth: number;
    energy: number;
    maxEnergy: number;
    level: number;
    experience: number;
    abilities: string[];
  };
  gameData: {
    currentArea: string;
    completedQuests: string[];
    activeQuests: string[];
    questProgress: Record<string, Record<string, number>>;
    gameTime: number;
  };
  timestamp: number;
}

export class SaveSystem {
  private static instance: SaveSystem;
  private saveSlots: Map<string, SaveData> = new Map();
  private autoSaveInterval: number = 30000; // 30 seconds
  private autoSaveTimer?: NodeJS.Timeout;

  static getInstance(): SaveSystem {
    if (!this.instance) {
      this.instance = new SaveSystem();
    }
    return this.instance;
  }

  constructor() {
    this.loadFromLocalStorage();
    this.startAutoSave();
  }

  save(slotName: string = 'autosave'): boolean {
    try {
      // This would integrate with the actual stores to get current game state
      const saveData: SaveData = {
        playerData: {
          position: { x: 0, y: 0, z: 0 }, // Get from player store
          health: 100,
          maxHealth: 100,
          energy: 100,
          maxEnergy: 100,
          level: 1,
          experience: 0,
          abilities: []
        },
        gameData: {
          currentArea: 'kame_house',
          completedQuests: [],
          activeQuests: ['dirty_magazines'],
          questProgress: {},
          gameTime: Date.now()
        },
        timestamp: Date.now()
      };

      this.saveSlots.set(slotName, saveData);
      this.saveToLocalStorage();
      
      console.log(`Game saved to slot: ${slotName}`);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  load(slotName: string = 'autosave'): boolean {
    const saveData = this.saveSlots.get(slotName);
    if (!saveData) {
      console.log(`No save data found for slot: ${slotName}`);
      return false;
    }

    try {
      // This would integrate with the stores to restore game state
      console.log(`Game loaded from slot: ${slotName}`);
      console.log('Save data:', saveData);
      
      // Here you would call methods on your stores to restore the state:
      // playerStore.setState(saveData.playerData);
      // gameStore.setState(saveData.gameData);
      // questSystem.loadState(saveData.gameData.questProgress);
      
      return true;
    } catch (error) {
      console.error('Failed to load game:', error);
      return false;
    }
  }

  deleteSave(slotName: string): boolean {
    if (this.saveSlots.has(slotName)) {
      this.saveSlots.delete(slotName);
      this.saveToLocalStorage();
      console.log(`Save slot deleted: ${slotName}`);
      return true;
    }
    return false;
  }

  getSaveSlots(): string[] {
    return Array.from(this.saveSlots.keys());
  }

  getSaveInfo(slotName: string): { timestamp: number; area: string; level: number } | null {
    const saveData = this.saveSlots.get(slotName);
    if (!saveData) return null;

    return {
      timestamp: saveData.timestamp,
      area: saveData.gameData.currentArea,
      level: saveData.playerData.level
    };
  }

  private saveToLocalStorage(): void {
    try {
      const saveDataObject = Object.fromEntries(this.saveSlots);
      localStorage.setItem('dbz_legacy_saves', JSON.stringify(saveDataObject));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const savedData = localStorage.getItem('dbz_legacy_saves');
      if (savedData) {
        const saveDataObject = JSON.parse(savedData);
        this.saveSlots = new Map(Object.entries(saveDataObject));
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  private startAutoSave(): void {
    this.autoSaveTimer = setInterval(() => {
      this.save('autosave');
    }, this.autoSaveInterval);
  }

  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = undefined;
    }
  }

  // Save point system - only allow saves at specific locations
  canSaveAtCurrentLocation(area: string): boolean {
    const savePoints = ['kame_house', 'lookout', 'king_kai_planet', 'frieza_ship'];
    return savePoints.includes(area);
  }

  quickSave(): boolean {
    return this.save('quicksave');
  }

  quickLoad(): boolean {
    return this.load('quicksave');
  }
}
