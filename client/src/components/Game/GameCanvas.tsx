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

  // Camera follows player
  useFrame(() => {
    if (camera && position) {
      // Smooth camera follow
      const targetX = position.x;
      const targetZ = position.z + 5; // Offset behind player for better view
      
      camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.1);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);
      camera.lookAt(position.x, 0, position.z);
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
      
      {/* Enemies */}
      <Wolf position={[5, 0, 0]} />
      <Wolf position={[-3, 0, -2]} />
      <Wolf position={[8, 0, -5]} />
    </>
  );
}
