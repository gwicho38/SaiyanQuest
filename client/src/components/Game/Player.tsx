import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import { Mesh } from 'three';
import { usePlayerStore } from '../../lib/stores/usePlayerStore';
import { useCombatStore } from '../../lib/stores/useCombatStore';
import { useAudio } from '../../lib/stores/useAudio';
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
  const meshRef = useRef<Mesh>(null);
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
    moveSpeed,
    drainEnergy,
    rechargeEnergy
  } = usePlayerStore();
  
  const { createKiBlast, performMeleeAttack } = useCombatStore();
  const { playHit } = useAudio();
  
  const [lastMoveTime, setLastMoveTime] = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);

  // Handle movement and combat
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    const controls = getState();
    let moved = false;
    let newDirection = direction;
    
    // Movement logic
    const moveDistance = moveSpeed * delta;
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
    
    // Energy recharge when not attacking
    if (!isAttacking) {
      rechargeEnergy(20 * delta); // Recharge 20 energy per second
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
          
          // Reset attack state
          setTimeout(() => setIsAttacking(false), 300);
        }
      }
    );

    const unsubscribeEnergy = subscribe(
      state => state.energyAttack,
      (pressed) => {
        if (pressed && energy >= 10 && !isAttacking) {
          console.log("Ki blast attack!");
          setIsAttacking(true);
          drainEnergy(10);
          createKiBlast(position, direction);
          
          setTimeout(() => setIsAttacking(false), 200);
        }
      }
    );

    return () => {
      unsubscribePunch();
      unsubscribeEnergy();
    };
  }, [subscribe, position, direction, energy, isAttacking, performMeleeAttack, createKiBlast, drainEnergy, playHit]);

  return (
    <group>
      {/* Player mesh - representing Goku */}
      <mesh ref={meshRef} position={[position.x, position.y, position.z]}>
        <boxGeometry args={[1, 1.5, 0.5]} />
        <meshStandardMaterial 
          color={isAttacking ? "#ffff00" : "#ff8c00"} // Golden when attacking (Super Saiyan hint)
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
