export interface Move {
	id: string;
	name: string;
	power: number; // base power
	costKi?: number;
	type?: 'physical' | 'ki';
}

export interface FighterStats {
	name: string;
	maxHp: number;
	hp: number;
	attack: number;
	defense: number;
	ki: number;
	maxKi: number;
	moves: Move[];
}

export interface CombatConfig {
	player: FighterStats;
	enemy: FighterStats;
}

export function calculateDamage(attacker: FighterStats, defender: FighterStats, move: Move): number {
	const atk = attacker.attack + (move.type === 'ki' ? Math.floor(attacker.ki * 0.1) : 0);
	const def = Math.max(1, defender.defense);
	const base = Math.max(1, Math.floor((atk * move.power) / (def * 5)));
	// Small random variance ±10%
	const variance = 0.9 + Math.random() * 0.2;
	return Math.max(1, Math.floor(base * variance));
}

