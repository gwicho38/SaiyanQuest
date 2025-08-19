import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Vector3 } from 'three';
import { useCombatStore } from '../../../lib/stores/useCombatStore';

interface KiBlastProps {
  id: string;
  position: Vector3;
  direction: string;
  speed?: number;
}

export default function KiBlast({ id, position, direction, speed = 15 }: KiBlastProps) {
  const meshRef = useRef<Mesh>(null);
  const { removeKiBlast } = useCombatStore();
  const startPosition = position.clone();
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Move ki blast based on direction
    const moveDistance = speed * delta;
    
    switch (direction) {
      case 'up':
        meshRef.current.position.z -= moveDistance;
        break;
      case 'down':
        meshRef.current.position.z += moveDistance;
        break;
      case 'left':
        meshRef.current.position.x -= moveDistance;
        break;
      case 'right':
        meshRef.current.position.x += moveDistance;
        break;
    }
    
    // Remove ki blast if it travels too far
    const distance = meshRef.current.position.distanceTo(startPosition);
    if (distance > 20) {
      removeKiBlast(id);
    }
  });
  
  useEffect(() => {
    // Auto-remove after 3 seconds
    const timer = setTimeout(() => {
      removeKiBlast(id);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [id, removeKiBlast]);

  return (
    <group>
      {/* Ki blast sphere */}
      <mesh ref={meshRef} position={[position.x, position.y + 0.5, position.z]}>
        <sphereGeometry args={[0.2]} />
        <meshBasicMaterial 
          color="#00bfff" 
          emissive="#00bfff"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Trail effect */}
      <mesh ref={meshRef} position={[position.x, position.y + 0.5, position.z]}>
        <sphereGeometry args={[0.3]} />
        <meshBasicMaterial 
          color="#87ceeb" 
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
}
