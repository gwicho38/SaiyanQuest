export const GAME_CONFIG = {
  // Display settings (GBA resolution scaled up)
  SCREEN_WIDTH: 240,
  SCREEN_HEIGHT: 160,
  SCALE_FACTOR: 3,
  
  // Player settings
  PLAYER: {
    MOVE_SPEED: 5,
    MAX_HEALTH: 100,
    MAX_ENERGY: 100,
    ENERGY_RECHARGE_RATE: 20, // per second
    ATTACK_COOLDOWN: 300, // milliseconds
  },
  
  // Combat settings
  COMBAT: {
    MELEE_DAMAGE: 40,
    KI_BLAST_DAMAGE: 25,
    KI_BLAST_COST: 10,
    KI_BLAST_SPEED: 15,
    MELEE_RANGE: 1.5,
  },
  
  // Enemy settings
  ENEMIES: {
    WOLF: {
      HEALTH: 60,
      DAMAGE: 15,
      MOVE_SPEED: 3,
      ATTACK_RANGE: 1.2,
      DETECTION_RANGE: 8,
      EXP_REWARD: 25,
    }
  },
  
  // Game mechanics
  MECHANICS: {
    SAVE_POINTS: ['kame_house', 'lookout', 'king_kai_planet'],
    EXP_MULTIPLIER: 1.5, // For level progression
    ENERGY_DRAIN_RATE: 5, // When flying
  }
};
