import { useEffect } from 'react';
import { useGameStore } from '../../../lib/stores/useGameStore';
import { usePlayerStore } from '../../../lib/stores/usePlayerStore';
import { GBA_CONFIG } from '../../../lib/game/GBAConfig';

export default function GameOverSystem() {
  const { gamePhase, setGamePhase } = useGameStore();
  const { health, experience, setPosition, heal, rechargeEnergy, gainExperience } = usePlayerStore();

  useEffect(() => {
    // Handle game over logic
    if (health <= 0 && gamePhase !== 'gameOver') {
      setGamePhase('gameOver');
    }
  }, [health, gamePhase, setGamePhase]);

  useEffect(() => {
    // Listen for restart key when game is over
    if (gamePhase === 'gameOver') {
      const handleRestart = (event: KeyboardEvent) => {
        if (event.code === 'KeyR') {
          restartGame();
        }
      };

      document.addEventListener('keydown', handleRestart);
      return () => document.removeEventListener('keydown', handleRestart);
    }
  }, [gamePhase]);

  const restartGame = () => {
    // Apply death penalty as per original game
    const expLoss = Math.floor(experience * GBA_CONFIG.MECHANICS.DEATH_PENALTY.EXP_LOSS_PERCENTAGE);
    gainExperience(-expLoss);
    
    // Respawn with partial health and full energy (original game behavior)
    const respawnHealth = 100 * GBA_CONFIG.MECHANICS.DEATH_PENALTY.RESPAWN_HEALTH_PERCENTAGE;
    const respawnEnergy = 100 * GBA_CONFIG.MECHANICS.DEATH_PENALTY.RESPAWN_ENERGY_PERCENTAGE;
    
    heal(respawnHealth);
    rechargeEnergy(respawnEnergy);
    
    // Reset position to spawn point (Kame House)
    setPosition({ x: 0, y: 0, z: 0 });
    
    // Resume game
    setGamePhase('playing');
    
    console.log(`Game restarted! Lost ${expLoss} EXP. Respawned with ${respawnHealth} HP and ${respawnEnergy} Energy.`);
  };

  return null; // This is a system component, no rendering
}