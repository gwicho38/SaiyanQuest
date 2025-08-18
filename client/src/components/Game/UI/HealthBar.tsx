import { usePlayerStore } from '../../../lib/stores/usePlayerStore';

export default function HealthBar() {
  const { health, maxHealth } = usePlayerStore();
  const healthPercentage = (health / maxHealth) * 100;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#ffffff',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <span>HP:</span>
      <div style={{
        width: '120px',
        height: '16px',
        backgroundColor: '#333333',
        border: '1px solid #ffffff',
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${healthPercentage}%`,
          height: '100%',
          backgroundColor: healthPercentage > 50 ? '#00ff00' : 
                         healthPercentage > 25 ? '#ffff00' : '#ff0000',
          transition: 'all 0.3s ease'
        }} />
      </div>
      <span>{health}/{maxHealth}</span>
    </div>
  );
}
