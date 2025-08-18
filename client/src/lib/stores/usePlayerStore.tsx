import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { Vector3 } from "three";

interface PlayerState {
  // Position and movement
  position: Vector3;
  direction: string;
  isMoving: boolean;
  moveSpeed: number;
  
  // Stats
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  level: number;
  experience: number;
  nextLevelExp: number;
  
  // Abilities
  canFly: boolean;
  isFlying: boolean;
  currentAttack: string;
  
  // Actions
  setPosition: (pos: { x: number; y: number; z: number }) => void;
  setDirection: (dir: string) => void;
  setIsMoving: (moving: boolean) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  drainEnergy: (amount: number) => void;
  rechargeEnergy: (amount: number) => void;
  gainExperience: (amount: number) => void;
  levelUp: () => void;
  setCurrentAttack: (attack: string) => void;
  resetPlayer: () => void;
}

export const usePlayerStore = create<PlayerState>()(
  subscribeWithSelector((set, get) => ({
    // Initial position and movement
    position: new Vector3(0, 0, 0),
    direction: "down",
    isMoving: false,
    moveSpeed: 5,
    
    // Initial stats
    health: 100,
    maxHealth: 100,
    energy: 100,
    maxEnergy: 100,
    level: 1,
    experience: 0,
    nextLevelExp: 100,
    
    // Initial abilities
    canFly: false,
    isFlying: false,
    currentAttack: "ki_blast",
    
    setPosition: (pos) => set({ 
      position: new Vector3(pos.x, pos.y, pos.z) 
    }),
    
    setDirection: (dir) => set({ direction: dir }),
    
    setIsMoving: (moving) => set({ isMoving: moving }),
    
    takeDamage: (amount) => set((state) => {
      const newHealth = Math.max(0, state.health - amount);
      console.log(`Player took ${amount} damage. Health: ${newHealth}/${state.maxHealth}`);
      return { health: newHealth };
    }),
    
    heal: (amount) => set((state) => ({
      health: Math.min(state.maxHealth, state.health + amount)
    })),
    
    drainEnergy: (amount) => set((state) => ({
      energy: Math.max(0, state.energy - amount)
    })),
    
    rechargeEnergy: (amount) => set((state) => ({
      energy: Math.min(state.maxEnergy, state.energy + amount)
    })),
    
    gainExperience: (amount) => set((state) => {
      const newExp = state.experience + amount;
      console.log(`Gained ${amount} EXP. Total: ${newExp}/${state.nextLevelExp}`);
      
      if (newExp >= state.nextLevelExp) {
        // Level up!
        get().levelUp();
        return { experience: newExp - state.nextLevelExp };
      }
      
      return { experience: newExp };
    }),
    
    levelUp: () => set((state) => {
      const newLevel = state.level + 1;
      const newMaxHealth = state.maxHealth + 20;
      const newMaxEnergy = state.maxEnergy + 10;
      
      console.log(`LEVEL UP! Level ${newLevel}`);
      
      return {
        level: newLevel,
        maxHealth: newMaxHealth,
        health: newMaxHealth, // Full heal on level up
        maxEnergy: newMaxEnergy,
        energy: newMaxEnergy, // Full energy on level up
        nextLevelExp: Math.floor(state.nextLevelExp * 1.5)
      };
    }),
    
    setCurrentAttack: (attack) => set({ currentAttack: attack }),
    
    resetPlayer: () => set({
      position: new Vector3(0, 0, 0),
      direction: "down",
      isMoving: false,
      health: 100,
      maxHealth: 100,
      energy: 100,
      maxEnergy: 100,
      level: 1,
      experience: 0,
      nextLevelExp: 100,
      canFly: false,
      isFlying: false,
      currentAttack: "ki_blast"
    })
  }))
);
