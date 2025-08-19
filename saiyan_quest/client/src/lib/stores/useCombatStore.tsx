import { create } from "zustand";
import { Vector3 } from "three";
import { nanoid } from "nanoid";

interface KiBlast {
  id: string;
  position: Vector3;
  direction: string;
  speed: number;
  damage: number;
}

interface MeleeAttack {
  id: string;
  position: Vector3;
  direction: string;
  damage: number;
  timestamp: number;
}

interface SolarFlareEffect {
  id: string;
  position: Vector3;
  timestamp: number;
  radius: number;
}

interface CombatState {
  kiBlasts: KiBlast[];
  meleeAttacks: MeleeAttack[];
  solarFlares: SolarFlareEffect[];
  
  // Actions
  createKiBlast: (position: Vector3, direction: string, damage?: number, speed?: number, color?: string) => void;
  removeKiBlast: (id: string) => void;
  performMeleeAttack: (position: Vector3, direction: string) => void;
  removeMeleeAttack: (id: string) => void;
  createSolarFlare: (position: Vector3) => void;
  removeSolarFlare: (id: string) => void;
  clearAllProjectiles: () => void;
}

export const useCombatStore = create<CombatState>((set, get) => ({
  kiBlasts: [],
  meleeAttacks: [],
  solarFlares: [],
  
  createKiBlast: (position, direction, damage = 25, speed = 15, color = '#00bfff') => {
    const blast: KiBlast = {
      id: nanoid(),
      position: position.clone(),
      direction,
      speed,
      damage
    };
    
    console.log(`Created Ki Blast at ${position.x}, ${position.z} going ${direction}`);
    
    set((state) => ({
      kiBlasts: [...state.kiBlasts, blast]
    }));
  },
  
  removeKiBlast: (id) => {
    set((state) => ({
      kiBlasts: state.kiBlasts.filter(blast => blast.id !== id)
    }));
  },
  
  performMeleeAttack: (position, direction) => {
    const attack: MeleeAttack = {
      id: nanoid(),
      position: position.clone(),
      direction,
      damage: 40,
      timestamp: Date.now()
    };
    
    console.log(`Performed melee attack at ${position.x}, ${position.z} in direction ${direction}`);
    
    set((state) => ({
      meleeAttacks: [...state.meleeAttacks, attack]
    }));
    
    // Remove melee attack after 500ms
    setTimeout(() => {
      get().removeMeleeAttack(attack.id);
    }, 500);
  },
  
  removeMeleeAttack: (id) => {
    set((state) => ({
      meleeAttacks: state.meleeAttacks.filter(attack => attack.id !== id)
    }));
  },
  
  createSolarFlare: (position) => {
    const flare: SolarFlareEffect = {
      id: nanoid(),
      position: position.clone(),
      timestamp: Date.now(),
      radius: 10
    };
    
    console.log(`Created Solar Flare at ${position.x}, ${position.z}`);
    
    set((state) => ({
      solarFlares: [...state.solarFlares, flare]
    }));
    
    // Remove solar flare after 3 seconds
    setTimeout(() => {
      set((state) => ({
        solarFlares: state.solarFlares.filter(f => f.id !== flare.id)
      }));
    }, 3000);
  },

  removeSolarFlare: (id) => set((state) => ({
    solarFlares: state.solarFlares.filter(flare => flare.id !== id)
  })),

  clearAllProjectiles: () => {
    set({
      kiBlasts: [],
      meleeAttacks: [],
      solarFlares: []
    });
  }
}));
