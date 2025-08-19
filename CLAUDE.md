# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development (Now using Bun)
- `bun run dev` - Start development server with hot reload (runs on port 3000)
- `bun run build` - Build production client and server bundles (currently has react-use-measure issue)
- `bun run start` - Run production server
- `bun run check` - Run TypeScript type checking with Bun
- `bun run db:push` - Push database schema changes using Drizzle

**Note:** Currently using Bun instead of npm. There's a known build issue with `react-use-measure` package resolution in Vite that needs to be resolved. Development server works fine.

### Database Management
- Database uses PostgreSQL with Drizzle ORM
- Schema defined in `shared/schema.ts`
- Configuration in `drizzle.config.ts`
- Requires `DATABASE_URL` environment variable

## Project Architecture

### Structure Overview
This is a Dragon Ball Z: Legacy of Goku recreation built as a full-stack TypeScript application:

- **`client/`** - React frontend with 2D top-down game engine
- **`server/`** - Express.js backend with session management
- **`shared/`** - Shared types and database schema

### Frontend Game Architecture

**Core Technologies:**
- React Three Fiber for 2D top-down rendering (using orthographic camera)
- Zustand for game state management (player, combat, audio)
- Tailwind CSS + Radix UI for game UI overlays
- TypeScript for type-safe game logic

**Key Game Systems:**
- `GameCanvas.tsx` - Main 2D scene with top-down camera and game loop
- `Player.tsx` - Character controller with Pokemon/GBA-style grid movement and attacks
- Combat system with melee (punch) and energy attacks (ki blasts)
- State stores in `lib/stores/` for player stats, combat tracking, game phase
- Configuration in `lib/game/GBAConfig.ts` with authentic game balance

**Game Controls (GBA-style):**
- WASD/Arrow keys for movement
- Z/Enter for punch attacks (A button)
- X/Escape for energy attacks (B button)
- Q for cycling attack types (L button)
- Space for menu/pause (Start button)

### State Management Pattern

**Player Store (`usePlayerStore`):**
- Health, energy, position, level progression
- Attack cooldowns and invincibility frames

**Combat Store (`useCombatStore`):**
- Ki blast projectile tracking with unique IDs
- Attack state management and collision detection

**Game Store (`useGameStore`):**
- Current area, game phase (menu/playing/paused/gameOver)
- Dialogue system state and character interactions

### Component Organization

**Game Components (`client/src/components/Game/`):**
- `Combat/` - Attack systems, projectiles, combat mechanics
- `Enemies/` - Wolf and enemy AI behavior patterns
- `UI/` - Health bars, energy bars, dialogue boxes, game overlay
- `Systems/` - Game over handling and core game systems

**Authentic GBA Recreation Features:**
- Top-down 2D perspective like Pokemon/original Legacy of Goku
- Pixel-perfect 240x160 scaled rendering
- Original game balance and combat timing
- Faithful control scheme and UI design
- Audio system with background music and sound effects

### Key Development Patterns

**2D Top-Down Game Components:**
- Use `useFrame` hook for game loop updates (movement, combat, physics)
- Orthographic camera positioned above for top-down Pokemon-style view
- Position tracking with `usePlayerStore` for camera following
- Collision detection using AABB bounding boxes
- Sprite-based characters with authentic Dragon Ball Z pixel art

**State Updates:**
- Immutable state updates through Zustand stores
- Combat actions trigger state changes across multiple stores
- Real-time synchronization between 2D game world and UI overlays

### Backend Architecture

**Express Server (`server/`):**
- Session-based authentication with Passport.js
- RESTful API endpoints in `routes.ts`
- Development with Vite integration, production static serving
- PostgreSQL database for user data and potential save system

### Path Aliases
- `@/*` maps to `client/src/*`  
- `@shared/*` maps to `shared/*`

### Sprite Assets Organization

**Authentic DBZ: Legacy of Goku II Sprites:**
- `client/public/sprites/characters/playable/` - Main playable characters (Goku, Gohan, Vegeta, Piccolo, Future Trunks, Teen Trunks, Hercule)
- `client/public/sprites/characters/npcs/` - Non-playable character sprites
- `client/public/sprites/enemies/animals/` - Animal enemies (Wolf, Snake)
- `client/public/sprites/enemies/bosses/` - Boss enemies (Cell)
- `client/public/sprites/backgrounds/` - Environment assets (West City, Capsule Corp, Tropical Islands)
- `client/public/sprites/ui/` - HUD and interface elements

All sprites are authentic 148x125 PNG assets from The Spriters Resource, maintaining original GBA pixel art quality and color palettes.

### Important Files for Game Logic
- `client/src/lib/game/GBAConfig.ts` - All game balance and authentic mechanics
- `client/src/components/Game/GameCanvas.tsx` - Main game loop and camera
- `client/src/components/Game/Player.tsx` - Character controller and movement
- `client/src/lib/stores/` - Core game state management

When modifying game mechanics, always reference `GBAConfig.ts` for authentic balance values and maintain consistency with the original GBA top-down game experience. The game uses Three.js with an orthographic camera for 2D Pokemon-style gameplay, not 3D perspective. Sprite assets should reference the organized PNG files in `client/public/sprites/` for authentic DBZ visuals.