# Dragon Ball Z: Legacy of Goku - GBA Game (Rust Edition)

A complete Dragon Ball Z: Legacy of Goku-style top-down action RPG for the Game Boy Advance, written in Rust using the AGB framework.

## 🚀 Quick Start

### Prerequisites

1. **Install Rust via rustup** (not Homebrew):

   ```bash
   # If you have Homebrew Rust, remove it first
   brew uninstall rust

   # Install rustup
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source ~/.cargo/env
   ```

2. **Set up nightly toolchain**:

   ```bash
   rustup toolchain install nightly
   rustup default nightly
   rustup component add rust-src
   ```

3. **Install GBA emulator** (optional for testing):
   ```bash
   brew install mgba
   ```

### Building the Game

```bash
# Quick build
make build

# Build optimized release ROM
make release

# Build and run in emulator
make run

# Just run if already built
make play
```

### Development Commands

```bash
make check    # Quick syntax check
make clippy   # Code quality checks
make fmt      # Format code
make clean    # Clean build files
make info     # Show build information
```

## 🎮 Game Features

### Migrated from C Implementation

- **Player Character System**: Complete RPG stats, movement, and progression
- **Combat System**: Melee attacks, energy/Ki attacks, combo system
- **RPG Mechanics**: Experience points, leveling, stat progression
- **Quest System**: Main story quests following DBZ saga
- **Transformation System**: Super Saiyan forms

### Core Systems

- **Real-time Combat**: Melee and energy-based attacks
- **8-directional Movement**: Smooth character control
- **Level Progression**: Experience-based character growth
- **Quest Management**: Story progression and side quests
- **Inventory System**: Items and equipment (planned)

## 🏗️ Architecture

### Project Structure

```
src/
├── main.rs              # Entry point
├── game/
│   ├── mod.rs           # Game state management
│   ├── player.rs        # Player character system
│   ├── combat.rs        # Combat mechanics
│   ├── rpg.rs           # RPG progression system
│   └── quest.rs         # Quest management
├── systems/
│   ├── display.rs       # Graphics and rendering
│   ├── audio.rs         # Sound system
│   └── input.rs         # Input handling
└── assets/
    ├── sprites.rs       # Sprite management
    ├── backgrounds.rs   # Background assets
    └── audio.rs         # Audio assets
```

### Key Components

#### Player Character (`src/game/player.rs`)

- Fixed-point position system for smooth movement
- RPG stats: HP, Ki, Attack, Defense, Speed
- 8-directional movement with animation
- Transformation levels and abilities

#### Combat System (`src/game/combat.rs`)

- Hitbox-based collision detection
- Combo system with timing windows
- Energy attacks (Kamehameha, Energy Blast, Solar Flare)
- Damage calculation with defense

#### RPG System (`src/game/rpg.rs`)

- Experience curve: `level² × 100`
- Automatic stat growth on level up
- Ability unlocking at specific levels
- Transformation system

#### Quest Management (`src/game/quest.rs`)

- DBZ story progression (Raditz, Snake Way, Nappa, etc.)
- Quest status tracking and completion
- Experience and item rewards
- Quest chain activation

## 🔧 Technical Details

### Framework

- **AGB**: Modern Rust framework for GBA development
- **Fixed-point Math**: Smooth movement and positioning
- **No-std Environment**: Embedded Rust for GBA hardware

### Memory Layout

- **IWRAM**: Game state and critical data
- **EWRAM**: Level data, enemies, dialogue
- **VRAM**: Graphics and sprites
- **OAM**: Sprite management

### Display System

- **Mode 0**: Tiled background mode
- **4 Background Layers**: UI, tilemap, parallax, effects
- **128 Sprites**: Players, enemies, projectiles, items

## 🎯 Migration Status

✅ **Completed Migration from C**

- All C game systems converted to Rust
- Player movement and input handling
- RPG progression and leveling
- Combat system with hitboxes
- Quest management system
- Build system updated for Rust-only development

### Differences from Original C Implementation

- **Type Safety**: Rust's type system prevents many runtime errors
- **Memory Safety**: No manual memory management
- **Modern Tooling**: Cargo build system and crate ecosystem
- **Fixed-point Math**: Using AGB's `Num` type for smooth movement
- **Cleaner Architecture**: Modular system design

## 🚧 Development

### Adding New Features

1. **New Character Abilities**:
   - Add to `abilities` array in `PlayerCharacter`
   - Implement in `check_new_abilities()` function
   - Add energy cost and effects in combat system

2. **New Quests**:
   - Add to `QuestManager::new()` initialization
   - Implement completion logic in `check_quest_completion()`
   - Add rewards in `complete_quest()`

3. **New Enemies**:
   - Create enemy struct similar to `PlayerCharacter`
   - Add AI system in combat module
   - Implement spawn system in level manager

### Performance Considerations

- Use fixed-point math for smooth animation
- Batch sprite updates during VBlank
- Efficient collision detection with spatial partitioning
- Memory-conscious asset management

## 📚 Resources

- [AGB Framework Documentation](https://agbrs.dev/)
- [GBA Development Guide](https://gbadev.org/)
- [Original Game Analysis](./CLAUDE.md)
- [Rust Embedded Book](https://docs.rust-embedded.org/book/)

## 🤝 Contributing

This project follows the specifications in `CLAUDE.md` for a faithful Dragon Ball Z: Legacy of Goku recreation. When contributing:

1. Maintain the top-down RPG gameplay style
2. Follow DBZ storyline progression
3. Keep code well-documented and type-safe
4. Test on actual GBA hardware when possible

---

**Note**: This project was migrated from a C implementation to Rust for improved safety, maintainability, and modern development practices while preserving all original game mechanics and features.
