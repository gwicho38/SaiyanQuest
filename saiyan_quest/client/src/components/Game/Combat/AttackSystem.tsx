import { useEffect, useState } from 'react';
import { useKeyboardControls } from '@react-three/drei';
import { usePlayerStore } from '../../../lib/stores/usePlayerStore';
import { useCombatStore } from '../../../lib/stores/useCombatStore';
import { useGameStore } from '../../../lib/stores/useGameStore';
import { GBA_CONFIG } from '../../../lib/game/GBAConfig';

enum Controls {
  up = 'up',
  down = 'down',
  left = 'left',
  right = 'right',
  punch = 'punch',
  energyAttack = 'energyAttack',
  cycleAttack = 'cycleAttack',
  flight = 'flight',
  menu = 'menu',
}

// Available energy attacks matching the original game
const ENERGY_ATTACKS = [
  {
    id: 'ki_blast',
    name: 'Ki Blast',
    damage: GBA_CONFIG.BALANCE.PLAYER.KI_BLAST_DAMAGE,
    cost: GBA_CONFIG.BALANCE.PLAYER.KI_BLAST_COST,
    description: 'Basic energy attack'
  },
  {
    id: 'kamehameha',
    name: 'Kamehameha',
    damage: GBA_CONFIG.BALANCE.PLAYER.KAMEHAMEHA_DAMAGE,
    cost: GBA_CONFIG.BALANCE.PLAYER.KAMEHAMEHA_COST,
    description: 'Powerful beam attack'
  },
  {
    id: 'solar_flare',
    name: 'Solar Flare',
    damage: 0,
    cost: 20,
    description: 'Blinds and stuns enemies'
  }
];

export default function AttackSystem() {
  const [subscribe, getState] = useKeyboardControls<Controls>();
  const [currentAttackIndex, setCurrentAttackIndex] = useState(0);
  const [lastAttackTime, setLastAttackTime] = useState(0);
  
  const { position, direction, energy, drainEnergy, currentAttack, setCurrentAttack } = usePlayerStore();
  const { createKiBlast, createSolarFlare } = useCombatStore();
  const { showDialogueBox } = useGameStore();

  // Handle attack cycling (L button)
  useEffect(() => {
    return subscribe(
      state => state.cycleAttack,
      (pressed) => {
        if (pressed) {
          const nextIndex = (currentAttackIndex + 1) % ENERGY_ATTACKS.length;
          setCurrentAttackIndex(nextIndex);
          const newAttack = ENERGY_ATTACKS[nextIndex];
          setCurrentAttack(newAttack.id);
          
          // Show attack name like original game
          showDialogueBox(`${newAttack.name} selected!`, 'System');
          setTimeout(() => {
            const gameStore = require('../../../lib/stores/useGameStore').useGameStore.getState();
            gameStore.hideDialogue();
          }, 1500);
          
          console.log(`Switched to ${newAttack.name}`);
        }
      }
    );
  }, [subscribe, currentAttackIndex, setCurrentAttack, showDialogueBox]);

  // Handle energy attacks (X/B button)
  useEffect(() => {
    return subscribe(
      state => state.energyAttack,
      (pressed) => {
        if (pressed) {
          const currentTime = Date.now();
          const currentAttackData = ENERGY_ATTACKS[currentAttackIndex];
          
          // Check cooldown and energy
          if (currentTime - lastAttackTime < 600 || energy < currentAttackData.cost) {
            if (energy < currentAttackData.cost) {
              console.log(`Not enough energy for ${currentAttackData.name}! Need ${currentAttackData.cost}, have ${energy}`);
            }
            return;
          }
          
          drainEnergy(currentAttackData.cost);
          setLastAttackTime(currentTime);
          
          // Execute attack based on type
          switch (currentAttackData.id) {
            case 'ki_blast':
              createKiBlast(position, direction, currentAttackData.damage);
              console.log(`Fired Ki Blast for ${currentAttackData.damage} damage!`);
              break;
              
            case 'kamehameha':
              // Create more powerful ki blast for Kamehameha
              createKiBlast(position, direction, currentAttackData.damage, 8, '#0088ff'); // Slower, blue
              console.log(`Fired Kamehameha for ${currentAttackData.damage} damage!`);
              break;
              
            case 'solar_flare':
              createSolarFlare(position);
              console.log('Used Solar Flare! Enemies stunned!');
              break;
          }
        }
      }
    );
  }, [subscribe, currentAttackIndex, energy, position, direction, drainEnergy, createKiBlast, createSolarFlare, lastAttackTime]);

  return null; // System component, no rendering
}