import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react";
import { KeyboardControls } from "@react-three/drei";
import { useAudio } from "./lib/stores/useAudio";
import { useGameStore } from "./lib/stores/useGameStore";
import GameCanvas from "./components/Game/GameCanvas";
import GameUI from "./components/Game/UI/GameUI";
import "@fontsource/inter";

// Define control keys for the game (mapped to GBA controls)
enum Controls {
  up = 'up',
  down = 'down', 
  left = 'left',
  right = 'right',
  punch = 'punch', // A button
  energyAttack = 'energyAttack', // B button
  cycleAttack = 'cycleAttack', // L button
  flight = 'flight', // Select button
  menu = 'menu', // Start button
}

const controls = [
  { name: Controls.up, keys: ["ArrowUp", "KeyW"] },
  { name: Controls.down, keys: ["ArrowDown", "KeyS"] },
  { name: Controls.left, keys: ["ArrowLeft", "KeyA"] },
  { name: Controls.right, keys: ["ArrowRight", "KeyD"] },
  { name: Controls.punch, keys: ["KeyZ", "Enter"] }, // A button - primary action
  { name: Controls.energyAttack, keys: ["KeyX", "Escape"] }, // B button - secondary action
  { name: Controls.cycleAttack, keys: ["KeyQ"] }, // L button - cycle attacks
  { name: Controls.flight, keys: ["Tab"] }, // Select - menu/status
  { name: Controls.menu, keys: ["Space"] }, // Start - pause
];

function App() {
  const { gamePhase } = useGameStore();
  const [showCanvas, setShowCanvas] = useState(false);

  // Initialize audio
  useEffect(() => {
    const backgroundMusic = new Audio("/sounds/background.mp3");
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.3;
    
    // Start background music after user interaction
    const startMusic = () => {
      backgroundMusic.play().catch(console.log);
      document.removeEventListener('click', startMusic);
    };
    document.addEventListener('click', startMusic);

    setShowCanvas(true);
  }, []);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      position: 'relative', 
      overflow: 'hidden',
      backgroundColor: '#000'
    }}>
      {showCanvas && (
        <KeyboardControls map={controls}>
          <Canvas
            camera={{
              position: [0, 10, 0],
              rotation: [-Math.PI / 2, 0, 0], // Top-down view
              fov: 60,
              near: 0.1,
              far: 1000
            }}
            gl={{
              antialias: false, // Pixel-perfect rendering
              powerPreference: "default"
            }}
            style={{
              width: '100%',
              height: '100%',
              imageRendering: 'pixelated' // For crisp pixel art
            }}
          >
            <color attach="background" args={["#87CEEB"]} />
            
            {/* Lighting for 2D sprites */}
            <ambientLight intensity={1.0} />
            
            <Suspense fallback={null}>
              <GameCanvas />
            </Suspense>
          </Canvas>
          
          {/* Game UI overlay */}
          <GameUI />
        </KeyboardControls>
      )}
    </div>
  );
}

export default App;
