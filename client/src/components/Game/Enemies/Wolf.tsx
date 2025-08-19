import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { usePlayerStore } from '../../../lib/stores/usePlayerStore';
import { useCombatStore } from '../../../lib/stores/useCombatStore';
import { GBA_CONFIG } from '../../../lib/game/GBAConfig';
import { nanoid } from 'nanoid';

interface WolfProps {
  position: [number, number, number];
}

export default function Wolf({ position }: WolfProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [health, setHealth] = useState(GBA_CONFIG.BALANCE.ENEMIES.WOLF.HEALTH);
  const [isAlive, setIsAlive] = useState(true);
  const [lastAttackTime, setLastAttackTime] = useState(Math.random() * -2); // Random initial delay
  const [targetPosition, setTargetPosition] = useState(new Vector3(...position));
  const [id] = useState(nanoid());
  const [attackCooldownVariation] = useState(Math.random() * 500 + 750); // 750-1250ms cooldown
  
  const playerStore = usePlayerStore();
  const { meleeAttacks, kiBlasts } = useCombatStore();

  useFrame((state, delta) => {
    if (!meshRef.current || !isAlive) return;

    const wolfPos = meshRef.current.position;
    const playerPos = playerStore.position;
    const distanceToPlayer = wolfPos.distanceTo(playerPos);

    // AI Behavior using GBA config values
    if (distanceToPlayer <= GBA_CONFIG.BALANCE.ENEMIES.WOLF.DETECTION_RANGE) {
      // Chase player
      const direction = playerPos.clone().sub(wolfPos).normalize();
      const moveDistance = GBA_CONFIG.BALANCE.ENEMIES.WOLF.MOVE_SPEED * delta;
      
      meshRef.current.position.add(direction.multiplyScalar(moveDistance));

      // Attack if close enough and player is alive
      if (distanceToPlayer <= GBA_CONFIG.BALANCE.ENEMIES.WOLF.ATTACK_RANGE && playerStore.health > 0) {
        const currentTime = state.clock.elapsedTime;
        const cooldownSeconds = attackCooldownVariation / 1000;
        if (currentTime - lastAttackTime > cooldownSeconds) {
          // Only attack if player is actually vulnerable (not during invincibility frames)
          if (!playerStore.isInvincible) {
            playerStore.takeDamage(GBA_CONFIG.BALANCE.ENEMIES.WOLF.DAMAGE);
            setLastAttackTime(currentTime);
            console.log(`Wolf ${id.slice(0,4)} attacked player for ${GBA_CONFIG.BALANCE.ENEMIES.WOLF.DAMAGE} damage!`);
          }
        }
      }
    }

    // Check for damage from player attacks
    checkForDamage();
  });

  const checkForDamage = () => {
    if (!meshRef.current) return;

    const wolfPos = meshRef.current.position;

    // Check melee attacks
    meleeAttacks.forEach(attack => {
      const distance = wolfPos.distanceTo(attack.position);
      if (distance <= 1.5) { // Melee range
        takeDamage(GBA_CONFIG.BALANCE.PLAYER.PUNCH_DAMAGE);
      }
    });

    // Check ki blast collisions
    kiBlasts.forEach(blast => {
      const distance = wolfPos.distanceTo(blast.position);
      if (distance <= 1.0) { // Ki blast hit radius
        takeDamage(blast.damage);
      }
    });
  };

  const takeDamage = (damage: number) => {
    const newHealth = health - damage;
    setHealth(newHealth);
    
    console.log(`Wolf took ${damage} damage. Health: ${newHealth}`);
    
    if (newHealth <= 0) {
      die();
    }
  };

  const die = () => {
    setIsAlive(false);
    playerStore.gainExperience(GBA_CONFIG.BALANCE.PROGRESSION.EXP_PER_ENEMY.WOLF);
    
    console.log(`Wolf defeated! Player gained ${GBA_CONFIG.BALANCE.PROGRESSION.EXP_PER_ENEMY.WOLF} EXP`);
  };

  if (!isAlive) {
    return null; // Remove from scene when dead
  }

  return (
    <group>
      {/* Wolf - DBZ GBA style enemy */}
      <group ref={meshRef} position={position}>
        {/* Wolf body */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[1.2, 0.7, 0.9]} />
          <meshBasicMaterial color="#8B4513" />
        </mesh>
        
        {/* Wolf head */}
        <mesh position={[0, 0.5, -0.6]}>
          <boxGeometry args={[0.8, 0.6, 0.7]} />
          <meshBasicMaterial color="#654321" />
        </mesh>
        
        {/* Eyes (glowing red) */}
        <mesh position={[-0.2, 0.6, -0.9]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        <mesh position={[0.2, 0.6, -0.9]}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
        
        {/* Ears */}
        <mesh position={[-0.25, 0.8, -0.4]}>
          <boxGeometry args={[0.2, 0.3, 0.1]} />
          <meshBasicMaterial color="#654321" />
        </mesh>
        <mesh position={[0.25, 0.8, -0.4]}>
          <boxGeometry args={[0.2, 0.3, 0.1]} />
          <meshBasicMaterial color="#654321" />
        </mesh>
        
        {/* Legs */}
        <mesh position={[-0.35, -0.2, -0.2]}>
          <boxGeometry args={[0.25, 0.6, 0.25]} />
          <meshBasicMaterial color="#654321" />
        </mesh>
        <mesh position={[0.35, -0.2, -0.2]}>
          <boxGeometry args={[0.25, 0.6, 0.25]} />
          <meshBasicMaterial color="#654321" />
        </mesh>
        <mesh position={[-0.35, -0.2, 0.4]}>
          <boxGeometry args={[0.25, 0.6, 0.25]} />
          <meshBasicMaterial color="#654321" />
        </mesh>
        <mesh position={[0.35, -0.2, 0.4]}>
          <boxGeometry args={[0.25, 0.6, 0.25]} />
          <meshBasicMaterial color="#654321" />
        </mesh>
        
        {/* Tail */}
        <mesh position={[0, 0.6, 0.7]}>
          <boxGeometry args={[0.15, 0.15, 0.5]} />
          <meshBasicMaterial color="#654321" />
        </mesh>
      </group>
      
      {/* Health bar above wolf */}
      <mesh position={[position[0], position[1] + 1.5, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 0.1]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      <mesh 
        position={[position[0], position[1] + 1.51, position[2]]} 
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[health / GBA_CONFIG.BALANCE.ENEMIES.WOLF.HEALTH, 1, 1]}
      >
        <planeGeometry args={[1, 0.1]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      
      {/* Wolf shadow */}
      <mesh position={[position[0], -0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.8]} />
        <meshBasicMaterial color="#000000" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}
