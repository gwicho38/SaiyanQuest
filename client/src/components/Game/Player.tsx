import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Mesh } from 'three';
import { usePlayerStore } from '../../lib/stores/usePlayerStore';
import { useCombatStore } from '../../lib/stores/useCombatStore';
import { useAudio } from '../../lib/stores/useAudio';
import { GBA_CONFIG } from '../../lib/game/GBAConfig';
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
      {/* Player mesh - DBZ GBA style Goku sprite */}
      <group ref={meshRef} position={[position.x, position.y, position.z]}>
        {/* Head and face */}
        <mesh position={[0, 1.0, 0]}>
          <boxGeometry args={[0.7, 0.7, 0.5]} />
          <meshBasicMaterial 
            color="#fdbcb4" 
            transparent={isInvincible}
            opacity={isInvincible ? 0.4 : 1.0}
          />
        </mesh>
        
        {/* Hair (spiky black) */}
        <mesh position={[0, 1.35, 0]}>
          <boxGeometry args={[0.8, 0.4, 0.6]} />
          <meshBasicMaterial 
            color={isAttacking ? "#ffff00" : "#2c1810"} 
            transparent={isInvincible}
            opacity={isInvincible ? 0.4 : 1.0}
          />
        </mesh>
        
        {/* Orange gi top */}
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.9, 0.8, 0.5]} />
          <meshBasicMaterial 
            color={isAttacking ? "#ff9500" : "#ff7f00"} 
            transparent={isInvincible}
            opacity={isInvincible ? 0.4 : 1.0}
          />
        </mesh>
        
        {/* Blue undershirt/belt area */}
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[0.9, 0.2, 0.5]} />
          <meshBasicMaterial 
            color="#1e3a8a" 
            transparent={isInvincible}
            opacity={isInvincible ? 0.4 : 1.0}
          />
        </mesh>
        
        {/* Blue pants */}
        <mesh position={[0, -0.3, 0]}>
          <boxGeometry args={[0.8, 0.6, 0.5]} />
          <meshBasicMaterial 
            color="#1e3a8a" 
            transparent={isInvincible}
            opacity={isInvincible ? 0.4 : 1.0}
          />
        </mesh>
        
        {/* Arms */}
        <mesh position={[-0.6, 0.5, 0]}>
          <boxGeometry args={[0.3, 0.6, 0.3]} />
          <meshBasicMaterial 
            color="#fdbcb4" 
            transparent={isInvincible}
            opacity={isInvincible ? 0.4 : 1.0}
          />
        </mesh>
        <mesh position={[0.6, 0.5, 0]}>
          <boxGeometry args={[0.3, 0.6, 0.3]} />
          <meshBasicMaterial 
            color="#fdbcb4" 
            transparent={isInvincible}
            opacity={isInvincible ? 0.4 : 1.0}
          />
        </mesh>
        
        {/* Legs */}
        <mesh position={[-0.25, -0.75, 0]}>
          <boxGeometry args={[0.3, 0.5, 0.3]} />
          <meshBasicMaterial 
            color="#fdbcb4" 
            transparent={isInvincible}
            opacity={isInvincible ? 0.4 : 1.0}
          />
        </mesh>
        <mesh position={[0.25, -0.75, 0]}>
          <boxGeometry args={[0.3, 0.5, 0.3]} />
          <meshBasicMaterial 
            color="#fdbcb4" 
            transparent={isInvincible}
            opacity={isInvincible ? 0.4 : 1.0}
          />
        </mesh>
        
        {/* Boots */}
        <mesh position={[-0.25, -1.0, 0]}>
          <boxGeometry args={[0.35, 0.2, 0.4]} />
          <meshBasicMaterial 
            color="#4a5568" 
            transparent={isInvincible}
            opacity={isInvincible ? 0.4 : 1.0}
          />
        </mesh>
        <mesh position={[0.25, -1.0, 0]}>
          <boxGeometry args={[0.35, 0.2, 0.4]} />
          <meshBasicMaterial 
            color="#4a5568" 
            transparent={isInvincible}
            opacity={isInvincible ? 0.4 : 1.0}
          />
        </mesh>
      </group>
      
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
