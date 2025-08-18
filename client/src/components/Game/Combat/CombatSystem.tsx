import { useCombatStore } from '../../../lib/stores/useCombatStore';
import KiBlast from './KiBlast';

export default function CombatSystem() {
  const { kiBlasts } = useCombatStore();

  return (
    <group>
      {/* Render all active ki blasts */}
      {kiBlasts.map((blast) => (
        <KiBlast
          key={blast.id}
          id={blast.id}
          position={blast.position}
          direction={blast.direction}
          speed={blast.speed}
        />
      ))}
    </group>
  );
}
