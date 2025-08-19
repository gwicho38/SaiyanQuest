import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { useGameStore } from '../../lib/stores/useGameStore';
import { usePlayerStore } from '../../lib/stores/usePlayerStore';
import Player from './Player';
import Environment from './Environment';
import Wolf from './Enemies/Wolf';
import CombatSystem from './Combat/CombatSystem';
import AttackSystem from './Combat/AttackSystem';
import GameOverSystem from './Systems/GameOverSystem';
import * as THREE from 'three';

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

export default function GameCanvas() {
  const { camera } = useThree();
  const { gamePhase, currentArea } = useGameStore();
  const { position } = usePlayerStore();
  const [subscribe, getState] = useKeyboardControls<Controls>();

  // Camera follows player - angled behind like original GBA game
  useFrame(() => {
    if (camera && position) {
      // Camera positioned behind and above player at an angle
      const targetX = position.x;
      const targetY = 6; // Height for angled view
      const targetZ = position.z + 8; // Distance behind player
      
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.1);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.1);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);
      
      // Look slightly ahead of player instead of directly at them
      camera.lookAt(position.x, 0, position.z - 2);
    }
  });

  // Handle menu input
  useEffect(() => {
    return subscribe(
      state => state.menu,
      (pressed) => {
        if (pressed) {
          console.log("Menu button pressed");
          // TODO: Toggle pause menu
        }
      }
    );
  }, [subscribe]);

  return (
    <>
      {/* Game Systems */}
      <GameOverSystem />
      <AttackSystem />
      
      {/* Game Environment */}
      <Environment area={currentArea} />
      
      {/* Player Character */}
      <Player />
      
      {/* Combat System */}
      <CombatSystem />
      
      {/* Enemies - single wolf for balanced gameplay */}
      <Wolf position={[5, 0, 0]} />
    </>
  );
}
