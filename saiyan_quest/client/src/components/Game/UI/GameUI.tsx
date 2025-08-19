import { usePlayerStore } from '../../../lib/stores/usePlayerStore';
import { useGameStore } from '../../../lib/stores/useGameStore';
import HealthBar from './HealthBar';
import EnergyBar from './EnergyBar';
import DialogueBox from './DialogueBox';

export default function GameUI() {
  const { level, experience, nextLevelExp } = usePlayerStore();
  const { gamePhase, showDialogue, dialogueText, dialogueCharacter } = useGameStore();

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1000
    }}>
      {/* Top HUD */}
      <div style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        right: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        pointerEvents: 'auto'
      }}>
        {/* Left side - Health and Energy */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '10px',
          borderRadius: '5px',
          border: '2px solid #ffff00'
        }}>
          <HealthBar />
          <EnergyBar />
        </div>
        
        {/* Right side - Level and EXP */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          padding: '10px',
          borderRadius: '5px',
          border: '2px solid #ffff00',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '12px',
          textAlign: 'right'
        }}>
          <div>Level: {level}</div>
          <div>EXP: {experience}/{nextLevelExp}</div>
        </div>
      </div>
      
      {/* Controls hint */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        border: '1px solid #ffffff',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontSize: '10px',
        pointerEvents: 'auto'
      }}>
        <div>WASD/Arrows: Move</div>
        <div>Z: Punch (A)</div>
        <div>X: Ki Blast (B)</div>
        <div>C: Cycle Attack (L)</div>
        <div>Shift: Flight (Select)</div>
        <div>Enter: Menu (Start)</div>
      </div>
      
      {/* Dialogue Box */}
      {showDialogue && (
        <DialogueBox 
          text={dialogueText}
          character={dialogueCharacter}
        />
      )}
      
      {/* Game Over Screen */}
      {gamePhase === 'gameOver' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          padding: '40px',
          borderRadius: '10px',
          border: '3px solid #ff0000',
          color: '#ffffff',
          fontFamily: 'monospace',
          fontSize: '24px',
          textAlign: 'center',
          pointerEvents: 'auto'
        }}>
          <div style={{ marginBottom: '20px' }}>GAME OVER</div>
          <div style={{ fontSize: '12px' }}>Press R to restart</div>
        </div>
      )}
    </div>
  );
}
