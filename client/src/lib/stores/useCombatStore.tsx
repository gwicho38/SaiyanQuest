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

interface CombatState {
  kiBlasts: KiBlast[];
  meleeAttacks: MeleeAttack[];
  
  // Actions
  createKiBlast: (position: Vector3, direction: string) => void;
  removeKiBlast: (id: string) => void;
  performMeleeAttack: (position: Vector3, direction: string) => void;
  removeMeleeAttack: (id: string) => void;
  clearAllProjectiles: () => void;
}

export const useCombatStore = create<CombatState>((set, get) => ({
  kiBlasts: [],
  meleeAttacks: [],
  
  createKiBlast: (position, direction) => {
    const blast: KiBlast = {
      id: nanoid(),
      position: position.clone(),
      direction,
      speed: 15,
      damage: 25
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
  
  clearAllProjectiles: () => {
    set({
      kiBlasts: [],
      meleeAttacks: []
    });
  }
}));
