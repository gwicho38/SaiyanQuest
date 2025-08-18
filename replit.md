# Dragon Ball Z: The Legacy of Goku Recreation

## Overview

This project is a high-fidelity recreation of Dragon Ball Z: The Legacy of Goku (GBA) as a modern web-based game. Built with React Three Fiber for 3D graphics, the game faithfully recreates the original's top-down action RPG gameplay, storyline progression through the Saiyan and Namek sagas, and authentic GBA-style mechanics. The application features real-time combat, quest systems, character progression, and faithful reproduction of the original's controls and difficulty curve.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Core UI framework with strict typing for game state management
- **React Three Fiber**: 3D rendering engine for game world, characters, and effects using Three.js
- **Zustand**: State management for game systems (player stats, combat, quests, audio)
- **Tailwind CSS + Radix UI**: Styling framework with accessible component library for UI overlays
- **Vite**: Build tool with hot module replacement for development workflow

### Game Engine Design
- **Component-based 3D System**: Player, enemies, environment, and projectiles as separate React components
- **Real-time Physics**: Custom collision detection system using AABB (Axis-Aligned Bounding Box) calculations
- **Input Handling**: GBA-mapped controls (WASD/arrows for movement, Z/X for attacks) via KeyboardControls
- **Game Loop**: Frame-based updates using useFrame hook for movement, combat, and projectile physics

### State Management Pattern
- **Player Store**: Health, energy, position, level, abilities, and movement state
- **Combat Store**: Ki blasts, melee attacks, projectile tracking with unique IDs
- **Game Store**: Current area, game phase (menu/playing/paused), dialogue system
- **Audio Store**: Background music, sound effects, mute state with HTML5 Audio API

### Combat System Architecture
- **Melee Combat**: Short-range punch attacks with hitbox detection and animation timing
- **Energy Attacks**: Ki blast projectiles with directional movement and energy cost
- **Attack Cycling**: L button equivalent for switching between Basic Ki Blast, Kamehameha, Solar Flare
- **Enemy AI**: Behavior patterns for wolves (aggressive), dinosaurs (patrol), with detection ranges

### Quest and Progression Systems
- **Linear Quest Structure**: ~20 side quests with objectives (collect, kill, escort, talk)
- **Experience System**: Enemy kills and quest completion grant EXP for level progression
- **Save System**: Auto-save and manual save points at specific locations (LocalStorage based)
- **Area Progression**: Gated progression requiring quest completion to access new areas

## External Dependencies

### Core Frameworks
- **React Three Fiber**: 3D rendering and scene management for game world
- **@react-three/drei**: Additional utilities for camera controls, textures, and 3D helpers
- **@react-three/postprocessing**: Visual effects and rendering enhancements

### UI and Styling
- **Radix UI Components**: Complete accessible component suite for menus, dialogs, buttons
- **Tailwind CSS**: Utility-first styling with custom theme configuration
- **Lucide React**: Icon library for UI elements and game interface

### State and Data Management
- **Zustand**: Lightweight state management with subscriptions for game state
- **TanStack React Query**: Server state management for potential future API integration
- **Nanoid**: Unique ID generation for game entities (projectiles, enemies)

### Database and Backend
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **@neondatabase/serverless**: Serverless PostgreSQL database connection
- **Express.js**: RESTful API server for potential multiplayer or cloud save features

### Development Tools
- **TypeScript**: Static typing for game logic and component interfaces
- **Vite**: Fast build tool with plugins for GLSL shaders and runtime error handling
- **ESBuild**: Production bundling for server-side code optimization