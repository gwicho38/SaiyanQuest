import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface EnvironmentProps {
  area: string;
}

export default function Environment({ area }: EnvironmentProps) {
  const grassTexture = useTexture("/textures/grass.png");
  
  // Configure texture for pixelated look
  grassTexture.magFilter = THREE.NearestFilter;
  grassTexture.minFilter = THREE.NearestFilter;
  grassTexture.wrapS = THREE.RepeatWrapping;
  grassTexture.wrapT = THREE.RepeatWrapping;
  grassTexture.repeat.set(10, 10);

  return (
    <group>
      {/* Ground plane */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial map={grassTexture} />
      </mesh>
      
      {/* Destructible boulders */}
      <mesh position={[3, 0, 3]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#888888" />
      </mesh>
      
      <mesh position={[-4, 0, 2]}>
        <boxGeometry args={[1.2, 1.2, 1.2]} />
        <meshStandardMaterial color="#777777" />
      </mesh>
      
      <mesh position={[6, 0, -3]}>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial color="#999999" />
      </mesh>
      
      {/* Trees (simple representation) */}
      <group position={[-8, 0, -8]}>
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[1.5]} />
          <meshStandardMaterial color="#228B22" />
        </mesh>
      </group>
      
      <group position={[10, 0, 8]}>
        <mesh position={[0, 1, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 2]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <sphereGeometry args={[1.5]} />
          <meshStandardMaterial color="#228B22" />
        </mesh>
      </group>
      
      {/* Area boundaries (invisible walls) */}
      <mesh position={[25, 0, 0]} visible={false}>
        <boxGeometry args={[1, 10, 50]} />
        <meshBasicMaterial />
      </mesh>
      <mesh position={[-25, 0, 0]} visible={false}>
        <boxGeometry args={[1, 10, 50]} />
        <meshBasicMaterial />
      </mesh>
      <mesh position={[0, 0, 25]} visible={false}>
        <boxGeometry args={[50, 10, 1]} />
        <meshBasicMaterial />
      </mesh>
      <mesh position={[0, 0, -25]} visible={false}>
        <boxGeometry args={[50, 10, 1]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}
