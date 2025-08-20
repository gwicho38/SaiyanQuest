use super::player::PlayerCharacter;
use agb::fixnum::Num;

pub type Fixed = Num<i32, 8>;

#[derive(Default)]
pub struct CombatSystem {
    pub combo_timer: u16,
}

#[derive(Clone, Copy)]
pub struct Hitbox {
    pub x: Fixed,
    pub y: Fixed,
    pub width: Fixed,
    pub height: Fixed,
}

impl Hitbox {
    pub fn new(x: Fixed, y: Fixed, width: Fixed, height: Fixed) -> Self {
        Self { x, y, width, height }
    }
    
    pub fn intersects(&self, other: &Hitbox) -> bool {
        self.x < other.x + other.width &&
        self.x + self.width > other.x &&
        self.y < other.y + other.height &&
        self.y + self.height > other.y
    }
}

#[derive(Clone, Copy)]
pub struct EnergyAttack {
    pub ki_cost: u16,
    pub damage: u16,
    pub attack_type: EnergyAttackType,
}

#[derive(Clone, Copy)]
pub enum EnergyAttackType {
    Beam,
    Blast,
    Special,
}

impl CombatSystem {
    pub fn new() -> Self {
        Self {
            combo_timer: 0,
        }
    }
    
    // Migrated from C ProcessMeleeAttack function
    pub fn process_attack(&mut self, player: &mut PlayerCharacter) {
        // Basic punch combo system (3-hit combo)
        if self.combo_timer > 0 && player.combo_counter < 3 {
            player.combo_counter += 1;
        } else {
            player.combo_counter = 1;
        }
        
        // Create hitbox based on player position and direction
        let hitbox = self.create_attack_hitbox(player);
        
        // Calculate damage based on combo
        let base_damage = player.attack_power;
        let combo_multiplier = player.combo_counter as u16;
        let total_damage = base_damage * combo_multiplier;
        
        // Set combo window (30 frames = 0.5 seconds at 60 FPS)
        self.combo_timer = 30;
        
        // Here you would check for enemy collisions
        // For now, we'll just update the player's attack state
        player.current_attack = player.combo_counter;
    }
    
    fn create_attack_hitbox(&self, player: &PlayerCharacter) -> Hitbox {
        let offset_distance = Fixed::new(16); // Attack reach
        
        let (offset_x, offset_y) = match player.direction {
            super::player::Direction::Up => (Fixed::new(0), -offset_distance),
            super::player::Direction::UpRight => (offset_distance, -offset_distance),
            super::player::Direction::Right => (offset_distance, Fixed::new(0)),
            super::player::Direction::DownRight => (offset_distance, offset_distance),
            super::player::Direction::Down => (Fixed::new(0), offset_distance),
            super::player::Direction::DownLeft => (-offset_distance, offset_distance),
            super::player::Direction::Left => (-offset_distance, Fixed::new(0)),
            super::player::Direction::UpLeft => (-offset_distance, -offset_distance),
        };
        
        Hitbox::new(
            player.x + offset_x,
            player.y + offset_y,
            Fixed::new(24), // Hitbox width
            Fixed::new(24), // Hitbox height
        )
    }
    
    pub fn update(&mut self) {
        if self.combo_timer > 0 {
            self.combo_timer -= 1;
        }
    }
    
    // Energy attack system
    pub fn try_energy_attack(&self, player: &mut PlayerCharacter, attack: EnergyAttack) -> bool {
        if player.use_ki(attack.ki_cost) {
            // Energy attack successful
            // Here you would create projectiles, beams, etc.
            true
        } else {
            false
        }
    }
    
    // Predefined energy attacks matching CLAUDE.md specifications
    pub fn get_kamehameha() -> EnergyAttack {
        EnergyAttack {
            ki_cost: 30,
            damage: 150,
            attack_type: EnergyAttackType::Beam,
        }
    }
    
    pub fn get_energy_blast() -> EnergyAttack {
        EnergyAttack {
            ki_cost: 10,
            damage: 50,
            attack_type: EnergyAttackType::Blast,
        }
    }
    
    pub fn get_solar_flare() -> EnergyAttack {
        EnergyAttack {
            ki_cost: 20,
            damage: 0, // Stun attack
            attack_type: EnergyAttackType::Special,
        }
    }
    
    pub fn check_collision(&self, player_hitbox: &Hitbox, enemy_hitbox: &Hitbox) -> bool {
        player_hitbox.intersects(enemy_hitbox)
    }
}