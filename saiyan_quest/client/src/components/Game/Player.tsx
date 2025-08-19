import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Mesh } from 'three';
import { usePlayerStore } from '../../lib/stores/usePlayerStore';
import { useCombatStore } from '../../lib/stores/useCombatStore';
import { useAudio } from '../../lib/stores/useAudio';
import { GBA_CONFIG } from '../../lib/game/GBAConfig';
import * as THREE from 'three';

// Create a 2D Goku sprite texture (authentic DBZ GBA style)
function createGokuSprite(isAttacking: boolean, isInvincible: boolean): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 48;
  const ctx = canvas.getContext('2d')!;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Colors from authentic DBZ GBA sprites
  const skinColor = '#fdbcb4';
  const hairColor = isAttacking ? '#ffff00' : '#1a1a1a'; // Super Saiyan effect
  const giColor = '#ff8c00';
  const blueColor = '#1e3a8a';
  
  // Draw Goku sprite pixel art style
  ctx.fillStyle = skinColor;
  
  // Head
  ctx.fillRect(12, 8, 8, 8);
  
  // Hair (spiky)
  ctx.fillStyle = hairColor;
  ctx.fillRect(10, 4, 12, 6);
  ctx.fillRect(8, 6, 2, 4);  // Left spike
  ctx.fillRect(22, 6, 2, 4); // Right spike
  ctx.fillRect(14, 2, 4, 4); // Top spike
  
  // Body - Orange gi
  ctx.fillStyle = giColor;
  ctx.fillRect(10, 16, 12, 12);
  
  // Blue undershirt/belt
  ctx.fillStyle = blueColor;
  ctx.fillRect(10, 24, 12, 4);
  
  // Blue pants
  ctx.fillStyle = blueColor;
  ctx.fillRect(11, 28, 10, 12);
  
  // Arms (skin)
  ctx.fillStyle = skinColor;
  ctx.fillRect(6, 18, 4, 8);   // Left arm
  ctx.fillRect(22, 18, 4, 8);  // Right arm
  
  // Wristbands (blue)
  ctx.fillStyle = blueColor;
  ctx.fillRect(6, 24, 4, 2);   // Left wristband
  ctx.fillRect(22, 24, 4, 2);  // Right wristband
  
  // Legs (skin)
  ctx.fillStyle = skinColor;
  ctx.fillRect(12, 40, 3, 6);  // Left leg
  ctx.fillRect(17, 40, 3, 6);  // Right leg
  
  // Boots (blue)
  ctx.fillStyle = blueColor;
  ctx.fillRect(11, 44, 5, 4);  // Left boot
  ctx.fillRect(16, 44, 5, 4);  // Right boot
  
  // Eyes (black dots)
  ctx.fillStyle = '#000000';
  ctx.fillRect(13, 10, 1, 1);  // Left eye
  ctx.fillRect(18, 10, 1, 1);  // Right eye
  
  return canvas;
}

enum Controls {
  up = 'up',
  down = 'down',
  left = 'left',
  right = 'right', 
  punch = 'punch',
  energyAttack = 'energyAttack',
  cycleAttack = 'cycleAttack',
  flight = 'flight',
}

export default function Player() {
  const meshRef = useRef<THREE.Group>(null);
  const [subscribe, getState] = useKeyboardControls<Controls>();
  
  const { 
    position, 
    setPosition, 
    health, 
    energy, 
    level,
    isMoving,
    setIsMoving,
    direction,
    setDirection,
    drainEnergy,
    rechargeEnergy,
    isInvincible
  } = usePlayerStore();
  
  const { performMeleeAttack } = useCombatStore();
  const { playHit } = useAudio();
  
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);
  
  // Create sprite texture (memoized to prevent recreation every render)
  const spriteTexture = useMemo(() => {
    const canvas = createGokuSprite(isAttacking, isInvincible);
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.needsUpdate = true;
    return texture;
  }, [isAttacking, isInvincible]);

  // Handle movement and combat
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const controls = getState();
    let moved = false;
    let newDirection = direction;
    
    // Movement logic using GBA-authentic speed
    const moveDistance = GBA_CONFIG.BALANCE.PLAYER.MOVE_SPEED * delta;
    let newX = position.x;
    let newZ = position.z;
    
    if (controls.up) {
      newZ -= moveDistance;
      newDirection = 'up';
      moved = true;
    }
    if (controls.down) {
      newZ += moveDistance;
      newDirection = 'down';
      moved = true;
    }
    if (controls.left) {
      newX -= moveDistance;
      newDirection = 'left';
      moved = true;
    }
    if (controls.right) {
      newX += moveDistance;
      newDirection = 'right';
      moved = true;
    }
    
    // Update position if moved
    if (moved) {
      setPosition({ x: newX, y: 0, z: newZ });
      setIsMoving(true);
      setDirection(newDirection);
      setLastMoveTime(state.clock.elapsedTime);
    } else {
      // Stop moving after a brief delay
      if (state.clock.elapsedTime - lastMoveTime > 0.1) {
        setIsMoving(false);
      }
    }
    
    // Update mesh position
    meshRef.current.position.set(position.x, position.y, position.z);
    
    // Energy recharge using GBA-authentic rate
    if (!isAttacking) {
      rechargeEnergy(GBA_CONFIG.BALANCE.PLAYER.ENERGY_REGEN_RATE * delta);
    }
  });

  // Handle combat inputs
  useEffect(() => {
    const unsubscribePunch = subscribe(
      state => state.punch,
      (pressed) => {
        if (pressed && !isAttacking) {
          console.log("Punch attack!");
          setIsAttacking(true);
          performMeleeAttack(position, direction);
          playHit();
          
          // Reset attack state using GBA timing
          setTimeout(() => setIsAttacking(false), GBA_CONFIG.BALANCE.PLAYER.PUNCH_COOLDOWN);
        }
      }
    );

    return () => {
      unsubscribePunch();
    };
  }, [subscribe, position, direction, isAttacking, performMeleeAttack, playHit]);

  return (
    <group>
      {/* Player sprite - 2D DBZ GBA style (not 3D boxes!) */}
      <mesh ref={meshRef} position={[position.x, position.y, position.z]} rotation={[0, 0, 0]}>
        <planeGeometry args={[1.5, 2]} />
        <meshBasicMaterial 
          transparent={true}
          opacity={isInvincible ? 0.4 : 1.0}
          map={spriteTexture}
        />
      </mesh>
      
      {/* Player shadow */}
      <mesh position={[position.x, -0.01, position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6]} />
        <meshBasicMaterial color="#000000" opacity={0.3} transparent />
      </mesh>
      
      {/* Direction indicator */}
      {isMoving && (
        <mesh position={[
          position.x + (direction === 'right' ? 0.8 : direction === 'left' ? -0.8 : 0),
          position.y + 0.2,
          position.z + (direction === 'down' ? 0.8 : direction === 'up' ? -0.8 : 0)
        ]}>
          <coneGeometry args={[0.2, 0.4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  );
}
