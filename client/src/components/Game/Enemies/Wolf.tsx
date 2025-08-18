import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { usePlayerStore } from '../../../lib/stores/usePlayerStore';
import { useCombatStore } from '../../../lib/stores/useCombatStore';
import { CollisionSystem } from '../../../lib/game/CollisionSystem';
import { GAME_CONFIG } from '../../../lib/game/GameConfig';
import { nanoid } from 'nanoid';

interface WolfProps {
  position: [number, number, number];
}

export default function Wolf({ position }: WolfProps) {
  const meshRef = useRef<Mesh>(null);
  const [health, setHealth] = useState(GAME_CONFIG.ENEMIES.WOLF.HEALTH);
  const [isAlive, setIsAlive] = useState(true);
  const [lastAttackTime, setLastAttackTime] = useState(0);
  const [targetPosition, setTargetPosition] = useState(new Vector3(...position));
  const [id] = useState(nanoid());
  
  const playerStore = usePlayerStore();
  const { meleeAttacks, kiBlasts } = useCombatStore();
  const collisionSystem = CollisionSystem.getInstance();

  useEffect(() => {
    // Register wolf in collision system
    collisionSystem.addCollidable({
      id,
      position: new Vector3(...position),
      size: new Vector3(1, 1, 1),
      type: 'enemy'
    });

    return () => {
      collisionSystem.removeCollidable(id);
    };
  }, [id, position, collisionSystem]);

  useFrame((state, delta) => {
    if (!meshRef.current || !isAlive) return;

    const wolfPos = meshRef.current.position;
    const playerPos = playerStore.position;
    const distanceToPlayer = wolfPos.distanceTo(playerPos);

    // Update collision system
    collisionSystem.updateCollidable(id, wolfPos);

    // AI Behavior
    if (distanceToPlayer <= GAME_CONFIG.ENEMIES.WOLF.DETECTION_RANGE) {
      // Chase player
      const direction = playerPos.clone().sub(wolfPos).normalize();
      const moveDistance = GAME_CONFIG.ENEMIES.WOLF.MOVE_SPEED * delta;
      
      meshRef.current.position.add(direction.multiplyScalar(moveDistance));

      // Attack if close enough
      if (distanceToPlayer <= GAME_CONFIG.ENEMIES.WOLF.ATTACK_RANGE) {
        const currentTime = state.clock.elapsedTime;
        if (currentTime - lastAttackTime > 1.5) { // Attack every 1.5 seconds
          playerStore.takeDamage(GAME_CONFIG.ENEMIES.WOLF.DAMAGE);
          setLastAttackTime(currentTime);
          console.log(`Wolf attacked player for ${GAME_CONFIG.ENEMIES.WOLF.DAMAGE} damage!`);
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
      if (distance <= GAME_CONFIG.COMBAT.MELEE_RANGE) {
        takeDamage(GAME_CONFIG.COMBAT.MELEE_DAMAGE);
      }
    });

    // Check ki blast collisions
    kiBlasts.forEach(blast => {
      const distance = wolfPos.distanceTo(blast.position);
      if (distance <= 0.5) { // Ki blast hit radius
        takeDamage(GAME_CONFIG.COMBAT.KI_BLAST_DAMAGE);
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
    playerStore.gainExperience(GAME_CONFIG.ENEMIES.WOLF.EXP_REWARD);
    collisionSystem.removeCollidable(id);
    
    console.log(`Wolf defeated! Player gained ${GAME_CONFIG.ENEMIES.WOLF.EXP_REWARD} EXP`);
  };

  if (!isAlive) {
    return null; // Remove from scene when dead
  }

  return (
    <group>
      {/* Wolf body */}
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={[1, 0.8, 1.5]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      
      {/* Wolf head */}
      <mesh position={[position[0], position[1] + 0.3, position[2] - 0.6]}>
        <boxGeometry args={[0.6, 0.6, 0.8]} />
        <meshStandardMaterial color="#654321" />
      </mesh>
      
      {/* Health bar above wolf */}
      <mesh position={[position[0], position[1] + 1.5, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1, 0.1]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      <mesh 
        position={[position[0], position[1] + 1.51, position[2]]} 
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[health / GAME_CONFIG.ENEMIES.WOLF.HEALTH, 1, 1]}
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
