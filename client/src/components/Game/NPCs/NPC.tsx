import { useRef, useState } from 'react';
import { Mesh } from 'three';
import { useGameStore } from '../../../lib/stores/useGameStore';

interface NPCProps {
  position: [number, number, number];
  name: string;
  dialogue: string;
  color?: string;
}

export default function NPC({ position, name, dialogue, color = "#00ff00" }: NPCProps) {
  const meshRef = useRef<Mesh>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const { showDialogueBox } = useGameStore();

  const handleInteraction = () => {
    if (!isInteracting) {
      setIsInteracting(true);
      showDialogueBox(dialogue, name);
      
      // Reset interaction state after dialogue
      setTimeout(() => {
        setIsInteracting(false);
      }, 3000);
    }
  };

  return (
    <group>
      {/* NPC body */}
      <mesh 
        ref={meshRef} 
        position={position}
        onClick={handleInteraction}
      >
        <boxGeometry args={[1, 1.8, 0.5]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Interaction indicator */}
      {!isInteracting && (
        <mesh position={[position[0], position[1] + 1.5, position[2]]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#ffff00" />
        </mesh>
      )}
      
      {/* Name label */}
      <mesh position={[position[0], position[1] + 2, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 0.3]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.7} />
      </mesh>
      
      {/* Shadow */}
      <mesh position={[position[0], -0.01, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.6]} />
        <meshBasicMaterial color="#000000" opacity={0.3} transparent />
      </mesh>
    </group>
  );
}
