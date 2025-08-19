// Dragon Ball Z: Legacy of Goku - Authentic GBA Configuration
// Based on the original game's balance and mechanics

export const GBA_CONFIG = {
  // Display settings matching original GBA screen
  DISPLAY: {
    WIDTH: 240,
    HEIGHT: 160,
    PIXEL_SCALE: 2, // Scale factor for modern screens
    FPS_TARGET: 30, // Original GBA target framerate
  },

  // Player mechanics from original game
  BALANCE: {
    PLAYER: {
      MOVE_SPEED: 4.5, // Grid units per second
      BASE_HEALTH: 100,
      BASE_ENERGY: 100,
      ENERGY_REGEN_RATE: 2, // Energy per second
      
      // Attack values from original game
      PUNCH_DAMAGE: 15,
      PUNCH_COOLDOWN: 400, // milliseconds
      
      KI_BLAST_DAMAGE: 25,
      KI_BLAST_COST: 15,
      KI_BLAST_SPEED: 12,
      KI_BLAST_COOLDOWN: 600,
      
      KAMEHAMEHA_DAMAGE: 50,
      KAMEHAMEHA_COST: 35,
      KAMEHAMEHA_SPEED: 8,
      KAMEHAMEHA_COOLDOWN: 1200,
      
      // Status effects
      INVINCIBILITY_FRAMES: 800, // milliseconds after taking damage (increased)
      ATTACK_STUN_TIME: 200,
    },

    ENEMIES: {
      WOLF: {
        HEALTH: 40,
        DAMAGE: 5, // Much lower damage
        MOVE_SPEED: 1.5, // Much slower movement
        ATTACK_RANGE: 1.2, // Shorter range
        DETECTION_RANGE: 4.0, // Much shorter detection
        ATTACK_COOLDOWN: 3000, // 3 second cooldown
      },
      
      DINOSAUR: {
        HEALTH: 80,
        DAMAGE: 20,
        MOVE_SPEED: 2.5,
        ATTACK_RANGE: 2.0,
        DETECTION_RANGE: 6.0,
        ATTACK_COOLDOWN: 1500,
      },
    },

    // Experience and leveling
    PROGRESSION: {
      EXP_PER_ENEMY: {
        WOLF: 15,
        DINOSAUR: 35,
      },
      LEVEL_UP_MULTIPLIER: 1.5,
      BASE_EXP_TO_NEXT_LEVEL: 100,
    },
  },

  // Game world settings
  WORLD: {
    GRID_SIZE: 1, // Size of each world grid unit
    COLLISION_TOLERANCE: 0.1,
    MAX_RENDER_DISTANCE: 50,
    
    // Area boundaries matching original game
    STARTING_AREA_SIZE: 40,
    FOREST_AREA_SIZE: 60,
    MOUNTAIN_AREA_SIZE: 80,
  },

  // Audio settings matching GBA limitations
  AUDIO: {
    MAX_CHANNELS: 4, // GBA had 4 audio channels
    MUSIC_VOLUME: 0.6,
    SFX_VOLUME: 0.8,
    
    // Sound effect timings
    HIT_SOUND_DURATION: 200,
    ATTACK_SOUND_DURATION: 400,
  },

  // UI settings for GBA-style interface
  UI: {
    FONT_SIZE_SMALL: 8,
    FONT_SIZE_NORMAL: 12,
    FONT_SIZE_LARGE: 16,
    
    // Color palette from original game
    COLORS: {
      TEXT_WHITE: '#f8f8f8',
      TEXT_YELLOW: '#ffff00',
      HEALTH_GREEN: '#00ff00',
      HEALTH_YELLOW: '#ffff00',
      HEALTH_RED: '#ff0000',
      ENERGY_BLUE: '#0080ff',
      MENU_BLUE: '#0040a0',
      DIALOGUE_BOX: '#000080',
    },
    
    // Timing for UI elements
    DIALOGUE_CHAR_DELAY: 50, // milliseconds per character
    MENU_TRANSITION_TIME: 200,
    HEALTH_BAR_UPDATE_TIME: 300,
  },

  // Input configuration matching GBA controls
  INPUT: {
    // Button mappings
    BUTTONS: {
      A: ['KeyZ', 'Enter'], // Primary action
      B: ['KeyX', 'Escape'], // Secondary action/cancel
      SELECT: ['Tab'], // Menu/status
      START: ['Space'], // Pause
      L: ['KeyQ'], // Cycle attacks
      R: ['KeyE'], // Target lock (if implemented)
    },
    
    // Input timing
    BUTTON_REPEAT_DELAY: 150,
    DPAD_DEADZONE: 0.3,
  },

  // Game state timing
  TIMING: {
    SAVE_POINT_ACTIVATION: 1000,
    LEVEL_UP_ANIMATION: 2000,
    GAME_OVER_DELAY: 2000,
    AREA_TRANSITION: 1500,
  },
};

// Derived calculations
export const DERIVED_CONFIG = {
  PLAYER_HEALTH_PER_LEVEL: (level: number) => 
    GBA_CONFIG.BALANCE.PLAYER.BASE_HEALTH + (level - 1) * 25,
    
  PLAYER_ENERGY_PER_LEVEL: (level: number) => 
    GBA_CONFIG.BALANCE.PLAYER.BASE_ENERGY + (level - 1) * 20,
    
  EXP_TO_NEXT_LEVEL: (level: number) => 
    Math.floor(GBA_CONFIG.BALANCE.PROGRESSION.BASE_EXP_TO_NEXT_LEVEL * 
    Math.pow(GBA_CONFIG.BALANCE.PROGRESSION.LEVEL_UP_MULTIPLIER, level - 1)),
};