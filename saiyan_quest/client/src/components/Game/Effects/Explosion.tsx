import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh } from 'three';
import * as THREE from 'three';

interface ExplosionProps {
  position: [number, number, number];
  onComplete?: () => void;
  scale?: number;
  duration?: number;
}

export default function Explosion({ position, onComplete, scale = 1, duration = 1 }: ExplosionProps) {
  const meshRef = useRef<Mesh>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setStartTime(Date.now());
  }, []);

  useFrame((state) => {
    if (!meshRef.current || !isActive) return;

    const elapsed = (Date.now() - startTime) / 1000;
    const progress = elapsed / duration;

    if (progress >= 1) {
      setIsActive(false);
      if (onComplete) {
        onComplete();
      }
      return;
    }

    // Scale effect - grows then shrinks
    const explosionScale = scale * (progress < 0.3 ? progress * 3 : (1 - progress) * 1.5);
    meshRef.current.scale.setScalar(explosionScale);

    // Color transition from yellow to red to black
    const material = meshRef.current.material as THREE.MeshBasicMaterial;
    if (progress < 0.5) {
      // Yellow to red
      const t = progress * 2;
      material.color.setRGB(1, 1 - t, 0);
    } else {
      // Red to dark red
      const t = (progress - 0.5) * 2;
      material.color.setRGB(1 - t * 0.5, 0, 0);
    }

    // Opacity fade
    material.opacity = 1 - progress;
  });

  if (!isActive) {
    return null;
  }

  return (
    <group>
      {/* Main explosion sphere */}
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial 
          color="#ffff00"
          transparent
          opacity={1}
        />
      </mesh>
      
      {/* Secondary particles */}
      {[...Array(6)].map((_, i) => (
        <mesh 
          key={i}
          position={[
            position[0] + (Math.random() - 0.5) * 2,
            position[1] + (Math.random() - 0.5) * 2,
            position[2] + (Math.random() - 0.5) * 2
          ]}
        >
          <sphereGeometry args={[0.2]} />
          <meshBasicMaterial 
            color="#ff8800"
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}
