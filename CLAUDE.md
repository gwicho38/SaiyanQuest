# Complete Development Instructions: Dragon Ball Z Legacy of Goku Top-Down RPG for Game Boy Advance

## Table of Contents
1. [Project Overview](#project-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [Technical Architecture](#technical-architecture)
4. [Core Game Systems](#core-game-systems)
5. [Asset Creation Pipeline](#asset-creation-pipeline)
6. [Programming Implementation](#programming-implementation)
7. [Testing and Optimization](#testing-and-optimization)
8. [Resources and References](#resources-and-references)

---

## 1. Project Overview

### Game Specifications
- **Platform**: Game Boy Advance (GBA)
- **Genre**: Top-down Action RPG
- **Resolution**: 240x160 pixels
- **Color Depth**: 15-bit color (32,768 colors)
- **ROM Size**: Target 8-16MB
- **Save System**: SRAM/Flash save support

### Core Features Based on Legacy of Goku
- **Top-down perspective** with 8-directional movement
- **Real-time combat system** with melee and energy attacks
- **RPG leveling system** with experience points
- **Multiple playable characters** (Goku, Gohan, Piccolo, Vegeta, Trunks)
- **Energy/Ki system** for special attacks
- **Quest system** with main story and side quests
- **Transformation mechanics** (Super Saiyan forms)
- **Item collection and inventory management**

---

## 2. Development Environment Setup

### Required Tools

#### Compiler Toolchain
```bash
# Install devkitARM
wget https://github.com/devkitPro/pacman/releases/
# Follow installation for your OS
sudo dkp-pacman -S gba-dev

# Alternative: Use Docker for consistent environment
docker pull devkitpro/devkitarm
```

#### Essential Libraries
- **libgba**: Core GBA development library
- **libtonc**: Comprehensive GBA programming library
- **maxmod**: Audio/music playback system
- **gbfs**: File system for assets

#### Development Tools
- **No$GBA**: Debugging emulator with memory viewer
- **mGBA**: Accurate emulator with GDB debugging support
- **Aseprite**: Pixel art creation
- **Tiled**: Map editor for level design
- **OpenGameArt**: Asset resources

### Project Structure
```
dbz-legacy-goku/
├── source/
│   ├── main.c
│   ├── game/
│   │   ├── player.c
│   │   ├── combat.c
│   │   ├── rpg_system.c
│   │   └── quest_manager.c
│   ├── engine/
│   │   ├── sprite_engine.c
│   │   ├── tilemap_engine.c
│   │   ├── collision.c
│   │   └── input_handler.c
│   └── graphics/
│       ├── sprites.c
│       └── backgrounds.c
├── include/
│   └── *.h files
├── graphics/
│   ├── sprites/
│   ├── backgrounds/
│   └── tilesets/
├── maps/
├── audio/
└── Makefile
```

---

## 3. Technical Architecture

### Memory Management

#### IWRAM (32KB) - Fast Internal RAM
```c
// Critical game state and frequently accessed data
typedef struct EWRAM_DATA {
    GameState current_state;
    Player players[5];
    u16 collision_map[32][32];
} IWRAM_DATA;
```

#### EWRAM (256KB) - External Work RAM
```c
// Level data, enemy arrays, dialogue text
typedef struct EWRAM_DATA {
    Level current_level;
    Enemy enemies[MAX_ENEMIES];
    DialogueEntry dialogue[MAX_DIALOGUE];
    Quest quests[MAX_QUESTS];
} EWRAM_DATA;
```

### Display System

#### Background Layers Configuration
- **BG0**: UI Layer (health bars, energy, level)
- **BG1**: Main tilemap (game world)
- **BG2**: Parallax background
- **BG3**: Effects layer (shadows, overlays)

#### Sprite Management
```c
#define MAX_SPRITES 128
#define PLAYER_SPRITES 4  // Multi-part sprites for animations
#define ENEMY_SPRITES 60
#define EFFECT_SPRITES 20
#define ITEM_SPRITES 20
```

### Tile-Based Map System
```c
typedef struct {
    u16 tile_id;      // Tile graphic ID
    u8 collision;     // Collision type (0=walkable, 1=solid, 2=water, etc.)
    u8 event_id;      // Trigger events when stepped on
} MapTile;

typedef struct {
    MapTile tiles[64][64];  // Maximum map size
    u16 width, height;
    u8 tileset_id;
    u8 music_id;
    NPCSpawn npcs[MAX_NPCS];
    ItemSpawn items[MAX_ITEMS];
} GameMap;
```

---

## 4. Core Game Systems

### 4.1 Player Character System

```c
typedef struct {
    // Basic stats
    u16 level;
    u32 experience;
    u16 max_hp;
    u16 current_hp;
    u16 max_ki;
    u16 current_ki;
    u16 attack_power;
    u16 defense;
    u16 speed;
    
    // Position and movement
    fixed x, y;  // Fixed-point coordinates
    fixed velocity_x, velocity_y;
    u8 direction;  // 8 directions
    u8 animation_frame;
    
    // Combat
    u8 current_attack;
    u8 combo_counter;
    u16 invulnerability_timer;
    
    // Abilities
    Ability abilities[MAX_ABILITIES];
    u8 transformation_level;  // 0=normal, 1=SSJ1, 2=SSJ2, etc.
    
} PlayerCharacter;
```

### 4.2 Combat System

#### Melee Combat
```c
void ProcessMeleeAttack(PlayerCharacter* player) {
    // Basic punch combo system (3-hit combo)
    if (KEY_PRESSED(KEY_A)) {
        if (player->combo_counter < 3 && 
            player->combo_timer > 0) {
            player->combo_counter++;
        } else {
            player->combo_counter = 1;
        }
        
        // Create hitbox
        Hitbox attack_hitbox = CreateHitbox(
            player->x + (direction_offset[player->direction].x * 16),
            player->y + (direction_offset[player->direction].y * 16),
            24, 24  // width, height
        );
        
        // Check enemy collisions
        CheckEnemyHits(attack_hitbox, 
                       player->attack_power * player->combo_counter);
        
        player->combo_timer = COMBO_WINDOW_FRAMES;
    }
}
```

#### Energy/Ki Attacks
```c
typedef struct {
    char name[32];
    u16 ki_cost;
    u16 damage;
    u8 projectile_sprite;
    u8 speed;
    u8 type;  // BEAM, BLAST, SPECIAL
    void (*special_effect)(void);
} EnergyAttack;

// Define iconic attacks
EnergyAttack kamehameha = {
    "Kamehameha", 30, 150, SPR_KAMEHAMEHA, 4, BEAM, NULL
};

EnergyAttack solar_flare = {
    "Solar Flare", 20, 0, SPR_SOLAR_FLARE, 0, SPECIAL, StunAllEnemies
};
```

### 4.3 RPG Progression System

```c
// Experience curve based on Legacy of Goku
u32 GetRequiredExp(u16 level) {
    return level * level * 100;
}

void GainExperience(PlayerCharacter* player, u32 exp) {
    player->experience += exp;
    
    while (player->experience >= GetRequiredExp(player->level + 1)) {
        player->level++;
        
        // Stat increases
        player->max_hp += 10 + (player->level * 2);
        player->max_ki += 5 + player->level;
        player->attack_power += 3;
        player->defense += 2;
        
        // Learn new abilities at specific levels
        CheckNewAbilities(player);
        
        // Restore HP/Ki on level up
        player->current_hp = player->max_hp;
        player->current_ki = player->max_ki;
        
        PlaySound(SFX_LEVELUP);
        ShowLevelUpMessage(player);
    }
}
```

### 4.4 Quest System

```c
typedef enum {
    QUEST_INACTIVE,
    QUEST_ACTIVE,
    QUEST_COMPLETE
} QuestStatus;

typedef struct {
    u16 id;
    char name[64];
    char description[256];
    QuestStatus status;
    u16 required_item_id;
    u16 required_enemy_kills;
    u16 current_progress;
    u32 exp_reward;
    u16 item_reward;
} Quest;

// Main story quests following DBZ saga
Quest main_quests[] = {
    {1, "Rescue Gohan", "Save Gohan from Raditz", QUEST_INACTIVE, 0, 1, 0, 500, ITEM_SENZU},
    {2, "Snake Way", "Reach King Kai's planet", QUEST_INACTIVE, 0, 0, 0, 1000, ITEM_WEIGHTED_CLOTHES},
    {3, "Defeat Nappa", "Stop the Saiyan warrior", QUEST_INACTIVE, 0, 1, 0, 2000, ITEM_SCOUTER},
    // ... continue through Frieza saga
};
```

---

## 5. Asset Creation Pipeline

### 5.1 Sprite Creation Guidelines

#### Character Sprites
- **Size**: 32x32 pixels for main characters
- **Frames**: 
  - 4 frames walk cycle per direction (8 directions)
  - 3 frames for each attack animation
  - 2 frames idle animation
  - Special transformation animations
- **Palette**: 16 colors per sprite (15 + transparency)

#### Sprite Conversion Process
```bash
# Convert sprites to GBA format
grit goku_sprites.png -gt -gB4 -pn16 -Mw2 -Mh2

# Output files:
# - goku_sprites.h (header with sprite data)
# - goku_sprites.c (sprite tiles and palette)
```

### 5.2 Tilemap Design

#### Tileset Requirements
- **Tile Size**: 8x8 pixels
- **Tileset Size**: 256 tiles maximum per set
- **Collision Map**: Separate layer defining walkable areas

#### Map Data Structure
```c
// Tiled export format conversion
typedef struct {
    u16 tilemap[32][32];    // Screen-sized chunks
    u8 collision[32][32];
    TriggerPoint triggers[16];
    WarpPoint warps[8];
} MapChunk;
```

### 5.3 Audio Implementation

#### Music System using Maxmod
```c
// Load module files
#include "soundbank.h"
#include "soundbank_bin.h"

void InitAudio() {
    mmInitDefault((mm_addr)soundbank_bin, 8);
    
    // Load background music
    mmLoad(MOD_OVERWORLD_THEME);
    mmLoad(MOD_BATTLE_THEME);
    mmLoad(MOD_BOSS_THEME);
    
    // Load sound effects
    mmLoadEffect(SFX_PUNCH);
    mmLoadEffect(SFX_KAMEHAMEHA);
    mmLoadEffect(SFX_EXPLOSION);
}
```

---

## 6. Programming Implementation

### 6.1 Main Game Loop

```c
int main(void) {
    // Initialize hardware
    irqInit();
    irqEnable(IRQ_VBLANK);
    
    // Initialize subsystems
    InitVideo();
    InitSprites();
    InitBackgrounds();
    InitAudio();
    InitInput();
    
    // Load initial game state
    LoadGameState();
    
    while(1) {
        // Input handling
        scanKeys();
        u16 keys_held = keysHeld();
        u16 keys_pressed = keysDown();
        
        // Update game logic
        switch(game_state) {
            case STATE_GAMEPLAY:
                UpdatePlayer(keys_held, keys_pressed);
                UpdateEnemies();
                UpdateProjectiles();
                CheckCollisions();
                UpdateCamera();
                UpdateUI();
                break;
                
            case STATE_MENU:
                UpdateMenu(keys_pressed);
                break;
                
            case STATE_DIALOGUE:
                UpdateDialogue(keys_pressed);
                break;
                
            case STATE_BATTLE:
                UpdateBattle(keys_held, keys_pressed);
                break;
        }
        
        // Wait for VBlank
        VBlankIntrWait();
        
        // Update graphics during VBlank
        UpdateSprites();
        UpdateBackgrounds();
        UpdateEffects();
    }
    
    return 0;
}
```

### 6.2 Collision Detection System

```c
// Efficient tile-based collision
bool CheckTileCollision(fixed x, fixed y) {
    int tile_x = (x >> 8) / 8;  // Convert to tile coordinates
    int tile_y = (y >> 8) / 8;
    
    // Bounds check
    if (tile_x < 0 || tile_x >= map_width || 
        tile_y < 0 || tile_y >= map_height) {
        return true;  // Collision at map boundaries
    }
    
    return collision_map[tile_y][tile_x] != 0;
}

// AABB collision for sprites
bool CheckSpriteCollision(Sprite* a, Sprite* b) {
    return (a->x < b->x + b->width &&
            a->x + a->width > b->x &&
            a->y < b->y + b->height &&
            a->y + a->height > b->y);
}
```

### 6.3 Save System Implementation

```c
typedef struct {
    u32 checksum;
    u16 version;
    PlayerSaveData players[5];
    u16 current_level;
    u32 play_time;
    QuestProgress quests[MAX_QUESTS];
    Inventory inventory;
} SaveGame;

void SaveGame() {
    SaveGame* save = (SaveGame*)SRAM;
    
    // Populate save data
    save->version = SAVE_VERSION;
    save->current_level = current_level_id;
    save->play_time = frame_counter / 60;  // Convert to seconds
    
    // Copy player data
    for (int i = 0; i < num_players; i++) {
        memcpy(&save->players[i], &players[i], sizeof(PlayerSaveData));
    }
    
    // Calculate checksum
    save->checksum = CalculateChecksum(save);
    
    // Write to SRAM
    REG_WAITCNT = SRAM_WAIT;
    memcpy((void*)SRAM, save, sizeof(SaveGame));
}
```

### 6.4 Enemy AI System

```c
typedef enum {
    AI_IDLE,
    AI_PATROL,
    AI_CHASE,
    AI_ATTACK,
    AI_FLEE
} AIState;

typedef struct {
    Sprite sprite;
    u16 hp;
    u16 attack;
    AIState state;
    fixed patrol_x, patrol_y;
    u8 aggro_range;
    u8 attack_range;
    void (*behavior)(struct Enemy*);
} Enemy;

void UpdateEnemyAI(Enemy* enemy) {
    PlayerCharacter* nearest = GetNearestPlayer(enemy);
    int distance = GetDistance(enemy, nearest);
    
    switch(enemy->state) {
        case AI_IDLE:
            if (distance < enemy->aggro_range) {
                enemy->state = AI_CHASE;
            }
            break;
            
        case AI_CHASE:
            if (distance < enemy->attack_range) {
                enemy->state = AI_ATTACK;
            } else if (distance > enemy->aggro_range * 2) {
                enemy->state = AI_IDLE;
            } else {
                MoveToward(enemy, nearest);
            }
            break;
            
        case AI_ATTACK:
            if (enemy->attack_cooldown == 0) {
                PerformAttack(enemy, nearest);
                enemy->attack_cooldown = 60;  // 1 second
            }
            if (distance > enemy->attack_range) {
                enemy->state = AI_CHASE;
            }
            break;
    }
}
```

---

## 7. Testing and Optimization

### 7.1 Performance Optimization

#### Sprite Batching
```c
// Use OAM (Object Attribute Memory) efficiently
void OptimizedSpriteUpdate() {
    // Disable unused sprites
    for (int i = active_sprites; i < 128; i++) {
        OAM[i].attr0 = ATTR0_DISABLED;
    }
    
    // Update only active sprites
    for (int i = 0; i < active_sprites; i++) {
        OAM[i].attr0 = sprites[i].y | sprites[i].shape;
        OAM[i].attr1 = sprites[i].x | sprites[i].size;
        OAM[i].attr2 = sprites[i].tile | sprites[i].palette;
    }
}
```

#### DMA Transfers
```c
// Use DMA for large data transfers
void DMATransfer(void* source, void* dest, u32 count, u32 mode) {
    REG_DMA3SAD = (u32)source;
    REG_DMA3DAD = (u32)dest;
    REG_DMA3CNT = count | mode | DMA_ENABLE;
}
```

### 7.2 Memory Management

```c
// Fixed-point arithmetic for smooth movement
typedef s32 fixed;
#define FIXED_SHIFT 8
#define INT_TO_FIXED(n) ((n) << FIXED_SHIFT)
#define FIXED_TO_INT(n) ((n) >> FIXED_SHIFT)
#define FIXED_MULT(a, b) (((a) * (b)) >> FIXED_SHIFT)
```

### 7.3 Debug Features

```c
#ifdef DEBUG
void ShowDebugInfo() {
    // Display on screen
    char debug_text[32];
    sprintf(debug_text, "FPS:%d MEM:%d", fps, free_memory);
    DrawText(0, 0, debug_text);
    
    // Show collision boxes
    if (show_collision) {
        DrawCollisionBoxes();
    }
    
    // Show AI states
    if (show_ai_debug) {
        DrawAIStates();
    }
}
#endif
```

---

## 8. Resources and References

### Source Code References
1. **Reverse Engineering Guide**: https://macabeus.medium.com/reverse-engineering-a-gameboy-advance-game-introduction-ec185bd8e02
   - Study ROM structure and memory layout
   - Understand GBA hardware limitations

2. **Pokémon Emerald Decompilation**: https://github.com/pret/pokeemerald
   - Reference for RPG systems implementation
   - Study save system and menu structures

3. **GBA Development Resources**: https://github.com/gbadev-org/awesome-gbadev
   - Comprehensive list of tools and libraries
   - Community forums and documentation

4. **Game Assets**: https://opengameart.org/
   - Free sprites and tilesets
   - Sound effects and music

### Technical Documentation
- **Legacy of Goku Manual**: Study original game mechanics
- **GBA Hardware Specs**: Understand technical constraints
- **Tonc Tutorial**: Comprehensive GBA programming guide

### Build System Example
```makefile
# Makefile for DBZ Legacy of Goku GBA
DEVKITARM := /opt/devkitpro/devkitARM
PREFIX := $(DEVKITARM)/bin/arm-none-eabi-

CC := $(PREFIX)gcc
AS := $(PREFIX)as
LD := $(PREFIX)ld
OBJCOPY := $(PREFIX)objcopy

CFLAGS := -mthumb -mthumb-interwork -mcpu=arm7tdmi \
          -ffast-math -fomit-frame-pointer \
          -Wall -O2

LDFLAGS := -specs=gba.specs

TARGET := dbz_legacy_goku
SOURCES := $(wildcard source/*.c) $(wildcard source/*/*.c)
OBJECTS := $(SOURCES:.c=.o)

$(TARGET).gba: $(TARGET).elf
$(OBJCOPY) -O binary $< $@
gbafix $@

$(TARGET).elf: $(OBJECTS)
$(CC) $(LDFLAGS) -o $@ $^

%.o: %.c
$(CC) $(CFLAGS) -c -o $@ $<

clean:
rm -f $(OBJECTS) $(TARGET).elf $(TARGET).gba
```

### Testing Checklist
- [ ] All character movements smooth at 60 FPS
- [ ] Combat system responsive with no input lag
- [ ] Save/Load system works correctly
- [ ] No memory leaks or crashes during extended play
- [ ] Audio plays without glitches
- [ ] All quests completable
- [ ] Boss battles balanced and fun
- [ ] Transformation animations play correctly
- [ ] Multiplayer link cable support (if implemented)

---

## Additional Implementation Notes

### Special Features to Consider

1. **Instant Transmission System**
   - Unlockable fast travel between visited locations
   - Requires Ki energy to use

2. **Training Mini-Games**
   - Snake Way running challenge
   - Gravity training on King Kai's planet
   - Hyperbolic Time Chamber survival mode

3. **Collectibles**
   - Dragon Balls for wish system
   - Capsule Corp items
   - Character cards

4. **Post-Game Content**
   - New Game+ with increased difficulty
   - Secret bosses (Broly, Cooler)
   - Alternative story paths

This comprehensive guide provides all necessary information to create a faithful and technically sound recreation of Dragon Ball Z: Legacy of Goku as a top-down RPG for the Game Boy Advance. Follow these instructions carefully, reference the provided resources, and iterate on the design to create an engaging gameplay experience.
