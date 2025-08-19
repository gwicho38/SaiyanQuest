import { usePlayerStore } from '../../../lib/stores/usePlayerStore';

export default function EnergyBar() {
  const { energy, maxEnergy } = usePlayerStore();
  const energyPercentage = (energy / maxEnergy) * 100;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <span>KI:</span>
      <div style={{
        width: '120px',
        height: '16px',
        backgroundColor: '#333333',
        border: '1px solid #ffffff',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${energyPercentage}%`,
          height: '100%',
          backgroundColor: '#00bfff',
          transition: 'all 0.3s ease'
        }} />
      </div>
      <span>{Math.floor(energy)}/{maxEnergy}</span>
    </div>
  );
}
