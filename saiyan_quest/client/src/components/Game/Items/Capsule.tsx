import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import { usePlayerStore } from '../../../lib/stores/usePlayerStore';

interface CapsuleProps {
  position: [number, number, number];
  type: 'health' | 'energy';
  amount: number;
}

export default function Capsule({ position, type, amount }: CapsuleProps) {
  const meshRef = useRef<Mesh>(null);
  const [collected, setCollected] = useState(false);
  const [rotationY, setRotationY] = useState(0);
  
  const { heal, rechargeEnergy, position: playerPos } = usePlayerStore();

  useFrame((state, delta) => {
    if (!meshRef.current || collected) return;
    
    // Rotating animation
    setRotationY(prev => prev + delta * 2);
    meshRef.current.rotation.y = rotationY;
    
    // Floating animation
    meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    
    // Check for collection
    const distance = meshRef.current.position.distanceTo(playerPos);
    if (distance < 1) {
      collect();
    }
  });

  const collect = () => {
    if (collected) return;
    
    setCollected(true);
    
    if (type === 'health') {
      heal(amount);
      console.log(`Collected health capsule (+${amount} HP)`);
    } else if (type === 'energy') {
      rechargeEnergy(amount);
      console.log(`Collected energy capsule (+${amount} Energy)`);
    }
  };

  if (collected) {
    return null;
  }

  return (
    <group>
      {/* Capsule body */}
      <mesh ref={meshRef} position={position}>
        <capsuleGeometry args={[0.2, 0.5, 4, 8]} />
        <meshStandardMaterial 
          color={type === 'health' ? "#ff0000" : "#0000ff"}
          emissive={type === 'health' ? "#330000" : "#000033"}
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Glow effect */}
      <mesh position={position}>
        <sphereGeometry args={[0.4]} />
        <meshBasicMaterial 
          color={type === 'health' ? "#ff6666" : "#6666ff"}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Collection hint */}
      <mesh position={[position[0], position[1] + 0.8, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5]} />
        <meshBasicMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.8}
        />
      </mesh>
    </group>
  );
}
