import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { usePlayerStore } from '../../lib/stores/usePlayerStore';
import { useCombatStore } from '../../lib/stores/useCombatStore';
import { CollisionSystem } from '../../lib/game/CollisionSystem';
import { GAME_CONFIG } from '../../lib/game/GameConfig';
import { nanoid } from 'nanoid';
import * as THREE from 'three';

export interface EnemyConfig {
  type: 'wolf' | 'dinosaur' | 'pterodactyl' | 'robber' | 'saiyan';
  health: number;
  damage: number;
  moveSpeed: number;
  attackRange: number;
  detectionRange: number;
  expReward: number;
  color: string;
  size: [number, number, number];
  behavior: 'aggressive' | 'patrol' | 'defensive' | 'flying';
}

interface EnemyProps {
  position: [number, number, number];
  config: EnemyConfig;
  patrolPoints?: Vector3[];
  onDeath?: () => void;
}

const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  wolf: {
    type: 'wolf',
    health: 60,
    damage: 15,
    moveSpeed: 3,
    attackRange: 1.2,
    detectionRange: 8,
    expReward: 25,
    color: "#8B4513",
    size: [1, 0.8, 1.5],
    behavior: 'aggressive'
  },
  dinosaur: {
    type: 'dinosaur',
    health: 120,
    damage: 30,
    moveSpeed: 2,
    attackRange: 2,
    detectionRange: 6,
    expReward: 50,
    color: "#228B22",
    size: [2, 1.5, 3],
    behavior: 'aggressive'
  },
  pterodactyl: {
    type: 'pterodactyl',
    health: 40,
    damage: 20,
    moveSpeed: 4,
    attackRange: 1.5,
    detectionRange: 10,
    expReward: 35,
    color: "#8FBC8F",
    size: [1.2, 0.8, 1.8],
    behavior: 'flying'
  },
  robber: {
    type: 'robber',
    health: 80,
    damage: 25,
    moveSpeed: 2.5,
    attackRange: 3,
    detectionRange: 7,
    expReward: 40,
    color: "#4B0082",
    size: [1, 1.8, 0.5],
    behavior: 'defensive'
  },
  saiyan: {
    type: 'saiyan',
    health: 200,
    damage: 50,
    moveSpeed: 4,
    attackRange: 2.5,
    detectionRange: 12,
    expReward: 100,
    color: "#FFD700",
    size: [1, 1.8, 0.5],
    behavior: 'aggressive'
  }
};

export default function Enemy({ position, config, patrolPoints = [], onDeath }: EnemyProps) {
  const meshRef = useRef<Mesh>(null);
  const [health, setHealth] = useState(config.health);
  const [isAlive, setIsAlive] = useState(true);
  const [lastAttackTime, setLastAttackTime] = useState(0);
  const [currentPatrolIndex, setCurrentPatrolIndex] = useState(0);
  const [isAttacking, setIsAttacking] = useState(false);
  const [id] = useState(nanoid());
  const [facing, setFacing] = useState('down');
  
  const playerStore = usePlayerStore();
  const { meleeAttacks, kiBlasts } = useCombatStore();
  const collisionSystem = CollisionSystem.getInstance();

  useEffect(() => {
    // Register enemy in collision system
    collisionSystem.addCollidable({
      id,
      position: new Vector3(...position),
      size: new Vector3(...config.size),
      type: 'enemy'
    });

    return () => {
      collisionSystem.removeCollidable(id);
    };
  }, [id, position, config.size, collisionSystem]);

  useFrame((state, delta) => {
    if (!meshRef.current || !isAlive) return;

    const enemyPos = meshRef.current.position;
    const playerPos = playerStore.position;
    const distanceToPlayer = enemyPos.distanceTo(playerPos);

    // Update collision system
    collisionSystem.updateCollidable(id, enemyPos);

    // AI Behavior based on type
    handleAIBehavior(enemyPos, playerPos, distanceToPlayer, delta, state);

    // Check for damage from player attacks
    checkForDamage();

    // Update facing direction
    updateFacing(enemyPos, playerPos);
  });

  const handleAIBehavior = (enemyPos: Vector3, playerPos: Vector3, distanceToPlayer: number, delta: number, state: any) => {
    switch (config.behavior) {
      case 'aggressive':
        handleAggressiveBehavior(enemyPos, playerPos, distanceToPlayer, delta, state);
        break;
      case 'patrol':
        handlePatrolBehavior(enemyPos, playerPos, distanceToPlayer, delta);
        break;
      case 'defensive':
        handleDefensiveBehavior(enemyPos, playerPos, distanceToPlayer, delta, state);
        break;
      case 'flying':
        handleFlyingBehavior(enemyPos, playerPos, distanceToPlayer, delta, state);
        break;
    }
  };

  const handleAggressiveBehavior = (enemyPos: Vector3, playerPos: Vector3, distanceToPlayer: number, delta: number, state: any) => {
    if (distanceToPlayer <= config.detectionRange) {
      // Chase player aggressively
      const direction = playerPos.clone().sub(enemyPos).normalize();
      const moveDistance = config.moveSpeed * delta;
      
      if (!meshRef.current) return;
      meshRef.current.position.add(direction.multiplyScalar(moveDistance));

      // Attack if close enough
      if (distanceToPlayer <= config.attackRange) {
        const currentTime = state.clock.elapsedTime;
        if (currentTime - lastAttackTime > 1.5) {
          performAttack();
          setLastAttackTime(currentTime);
        }
      }
    }
  };

  const handlePatrolBehavior = (enemyPos: Vector3, playerPos: Vector3, distanceToPlayer: number, delta: number) => {
    if (distanceToPlayer <= config.detectionRange) {
      // Switch to chase mode
      handleAggressiveBehavior(enemyPos, playerPos, distanceToPlayer, delta, { clock: { elapsedTime: Date.now() / 1000 } });
    } else if (patrolPoints.length > 0) {
      // Patrol between points
      const targetPoint = patrolPoints[currentPatrolIndex];
      const distanceToTarget = enemyPos.distanceTo(targetPoint);
      
      if (distanceToTarget < 1) {
        setCurrentPatrolIndex((prev) => (prev + 1) % patrolPoints.length);
      } else {
        const direction = targetPoint.clone().sub(enemyPos).normalize();
        const moveDistance = config.moveSpeed * 0.5 * delta; // Slower patrol speed
        
        if (!meshRef.current) return;
        meshRef.current.position.add(direction.multiplyScalar(moveDistance));
      }
    }
  };

  const handleDefensiveBehavior = (enemyPos: Vector3, playerPos: Vector3, distanceToPlayer: number, delta: number, state: any) => {
    if (distanceToPlayer <= config.attackRange) {
      // Attack when player gets too close
      const currentTime = state.clock.elapsedTime;
      if (currentTime - lastAttackTime > 2) {
        performAttack();
        setLastAttackTime(currentTime);
      }
    } else if (distanceToPlayer <= config.detectionRange && distanceToPlayer > config.attackRange * 1.5) {
      // Maintain distance - back away slowly
      const direction = enemyPos.clone().sub(playerPos).normalize();
      const moveDistance = config.moveSpeed * 0.3 * delta;
      
      if (!meshRef.current) return;
      meshRef.current.position.add(direction.multiplyScalar(moveDistance));
    }
  };

  const handleFlyingBehavior = (enemyPos: Vector3, playerPos: Vector3, distanceToPlayer: number, delta: number, state: any) => {
    // Flying enemies hover and swoop down
    const hoverHeight = 3;
    const currentTime = state.clock.elapsedTime;
    
    if (!meshRef.current) return;
    
    // Hover movement
    meshRef.current.position.y = hoverHeight + Math.sin(currentTime * 2) * 0.5;
    
    if (distanceToPlayer <= config.detectionRange) {
      // Circle around player
      const angle = currentTime * 0.5;
      const radius = config.attackRange * 2;
      const targetX = playerPos.x + Math.cos(angle) * radius;
      const targetZ = playerPos.z + Math.sin(angle) * radius;
      
      const direction = new Vector3(targetX - enemyPos.x, 0, targetZ - enemyPos.z).normalize();
      const moveDistance = config.moveSpeed * delta;
      
      meshRef.current.position.x += direction.x * moveDistance;
      meshRef.current.position.z += direction.z * moveDistance;
      
      // Swoop attack
      if (distanceToPlayer <= config.attackRange && currentTime - lastAttackTime > 3) {
        performAttack();
        setLastAttackTime(currentTime);
      }
    }
  };

  const updateFacing = (enemyPos: Vector3, playerPos: Vector3) => {
    const dx = playerPos.x - enemyPos.x;
    const dz = playerPos.z - enemyPos.z;
    
    if (Math.abs(dx) > Math.abs(dz)) {
      setFacing(dx > 0 ? 'right' : 'left');
    } else {
      setFacing(dz > 0 ? 'down' : 'up');
    }
  };

  const performAttack = () => {
    setIsAttacking(true);
    playerStore.takeDamage(config.damage);
    console.log(`${config.type} attacked player for ${config.damage} damage!`);
    
    // Reset attack animation
    setTimeout(() => setIsAttacking(false), 500);
  };

  const checkForDamage = () => {
    if (!meshRef.current) return;

    const enemyPos = meshRef.current.position;

    // Check melee attacks
    meleeAttacks.forEach(attack => {
      const distance = enemyPos.distanceTo(attack.position);
      if (distance <= GAME_CONFIG.COMBAT.MELEE_RANGE) {
        takeDamage(GAME_CONFIG.COMBAT.MELEE_DAMAGE);
      }
    });

    // Check ki blast collisions
    kiBlasts.forEach(blast => {
      const distance = enemyPos.distanceTo(blast.position);
      if (distance <= 0.5) {
        takeDamage(GAME_CONFIG.COMBAT.KI_BLAST_DAMAGE);
      }
    });
  };

  const takeDamage = (damage: number) => {
    const newHealth = health - damage;
    setHealth(newHealth);
    
    console.log(`${config.type} took ${damage} damage. Health: ${newHealth}`);
    
    if (newHealth <= 0) {
      die();
    }
  };

  const die = () => {
    setIsAlive(false);
    playerStore.gainExperience(config.expReward);
    collisionSystem.removeCollidable(id);
    
    console.log(`${config.type} defeated! Player gained ${config.expReward} EXP`);
    
    if (onDeath) {
      onDeath();
    }
  };

  if (!isAlive) {
    return null;
  }

  const healthPercentage = health / config.health;

  return (
    <group>
      {/* Enemy body */}
      <mesh ref={meshRef} position={position}>
        <boxGeometry args={config.size} />
        <meshStandardMaterial 
          color={isAttacking ? "#ff0000" : config.color}
          emissive={isAttacking ? "#330000" : "#000000"}
          emissiveIntensity={isAttacking ? 0.3 : 0}
        />
      </mesh>
      
      {/* Enemy type specific details */}
      {config.type === 'wolf' && (
        <mesh position={[position[0], position[1] + 0.3, position[2] - 0.6]}>
          <boxGeometry args={[0.6, 0.6, 0.8]} />
          <meshStandardMaterial color="#654321" />
        </mesh>
      )}
      
      {config.type === 'dinosaur' && (
        <>
          <mesh position={[position[0], position[1] + 0.5, position[2] - 1.2]}>
            <boxGeometry args={[1, 1, 1.5]} />
            <meshStandardMaterial color="#1a5a1a" />
          </mesh>
          <mesh position={[position[0], position[1] + 1.2, position[2] + 1]}>
            <boxGeometry args={[0.5, 0.5, 2]} />
            <meshStandardMaterial color="#228B22" />
          </mesh>
        </>
      )}
      
      {config.type === 'robber' && (
        <mesh position={[position[0], position[1] + 1, position[2]]}>
          <boxGeometry args={[0.8, 0.6, 0.4]} />
          <meshStandardMaterial color="#2F2F2F" />
        </mesh>
      )}
      
      {config.type === 'saiyan' && (
        <>
          <mesh position={[position[0], position[1] + 1, position[2]]}>
            <boxGeometry args={[0.8, 0.6, 0.4]} />
            <meshStandardMaterial color="#ffdbac" />
          </mesh>
          {/* Saiyan armor */}
          <mesh position={[position[0], position[1] + 0.5, position[2]]}>
            <boxGeometry args={[1.1, 0.8, 0.6]} />
            <meshStandardMaterial color="#000080" />
          </mesh>
        </>
      )}
      
      {/* Health bar above enemy */}
      <mesh position={[position[0], position[1] + 2, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[config.size[0], 0.1]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      <mesh 
        position={[position[0], position[1] + 2.01, position[2]]} 
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[healthPercentage, 1, 1]}
      >
        <planeGeometry args={[config.size[0], 0.1]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>
      
      {/* Enemy shadow */}
      <mesh position={[position[0], -0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[Math.max(...config.size) * 0.6]} />
        <meshBasicMaterial color="#000000" opacity={0.3} transparent />
      </mesh>
      
      {/* Direction indicator when moving */}
      {config.behavior !== 'defensive' && (
        <mesh position={[
          position[0] + (facing === 'right' ? 0.5 : facing === 'left' ? -0.5 : 0),
          position[1] + 0.2,
          position[2] + (facing === 'down' ? 0.5 : facing === 'up' ? -0.5 : 0)
        ]}>
          <coneGeometry args={[0.1, 0.2]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}
    </group>
  );
}

// Export enemy configurations for easy access
export { ENEMY_CONFIGS };
