use agb::{input::{ButtonController, Button}, fixnum::Num};

pub type Fixed = Num<i32, 8>;

#[derive(Clone, Copy)]
pub enum Direction {
    Up = 0,
    UpRight = 1,
    Right = 2,
    DownRight = 3,
    Down = 4,
    DownLeft = 5,
    Left = 6,
    UpLeft = 7,
}

impl Default for Direction {
    fn default() -> Self {
        Direction::Down
    }
}

#[derive(Default)]
pub struct PlayerCharacter {
    // Core stats - migrated from C PlayerCharacter struct
    pub level: u16,
    pub experience: u32,
    pub max_hp: u16,
    pub current_hp: u16,
    pub max_ki: u16,
    pub current_ki: u16,
    pub attack_power: u16,
    pub defense: u16,
    pub speed: u16,
    
    // Position and movement - using fixed-point math
    pub x: Fixed,
    pub y: Fixed,
    pub velocity_x: Fixed,
    pub velocity_y: Fixed,
    pub direction: Direction,
    pub animation_frame: u8,
    
    // Combat state
    pub current_attack: u8,
    pub combo_counter: u8,
    pub invulnerability_timer: u16,
    
    // Abilities - simplified for now
    pub abilities: [u16; 16],
    pub transformation_level: u8,
}

impl PlayerCharacter {
    pub fn new() -> Self {
        Self {
            level: 1,
            max_hp: 100,
            current_hp: 100,
            max_ki: 50,
            current_ki: 50,
            attack_power: 10,
            defense: 5,
            speed: 1,
            x: Fixed::from_raw(120 << 8), // Center screen
            y: Fixed::from_raw(80 << 8),
            ..Default::default()
        }
    }
    
    pub fn update(&mut self, input: &ButtonController) {
        // Movement - migrated from C UpdatePlayer function
        let movement_speed = Fixed::from_raw(self.speed as i32 << 8);
        
        self.velocity_x = Fixed::new(0);
        self.velocity_y = Fixed::new(0);
        
        if input.held(Button::UP) {
            self.velocity_y = -movement_speed;
            self.direction = Direction::Up;
        }
        if input.held(Button::DOWN) {
            self.velocity_y = movement_speed;
            self.direction = Direction::Down;
        }
        if input.held(Button::LEFT) {
            self.velocity_x = -movement_speed;
            self.direction = Direction::Left;
        }
        if input.held(Button::RIGHT) {
            self.velocity_x = movement_speed;
            self.direction = Direction::Right;
        }
        
        // Diagonal movement
        if input.held(Button::UP) && input.held(Button::RIGHT) {
            self.direction = Direction::UpRight;
        } else if input.held(Button::UP) && input.held(Button::LEFT) {
            self.direction = Direction::UpLeft;
        } else if input.held(Button::DOWN) && input.held(Button::RIGHT) {
            self.direction = Direction::DownRight;
        } else if input.held(Button::DOWN) && input.held(Button::LEFT) {
            self.direction = Direction::DownLeft;
        }
        
        // Apply movement
        self.x += self.velocity_x;
        self.y += self.velocity_y;
        
        // Boundary checking
        const SCREEN_WIDTH: i32 = 240;
        const SCREEN_HEIGHT: i32 = 160;
        const SPRITE_SIZE: i32 = 16;
        
        if self.x < Fixed::new(0) {
            self.x = Fixed::new(0);
        }
        if self.y < Fixed::new(0) {
            self.y = Fixed::new(0);
        }
        if self.x > Fixed::new(SCREEN_WIDTH - SPRITE_SIZE) {
            self.x = Fixed::new(SCREEN_WIDTH - SPRITE_SIZE);
        }
        if self.y > Fixed::new(SCREEN_HEIGHT - SPRITE_SIZE) {
            self.y = Fixed::new(SCREEN_HEIGHT - SPRITE_SIZE);
        }
        
        // Update animation frame
        if self.velocity_x != Fixed::new(0) || self.velocity_y != Fixed::new(0) {
            self.animation_frame = (self.animation_frame + 1) % 4;
        }
        
        // Update invulnerability timer
        if self.invulnerability_timer > 0 {
            self.invulnerability_timer -= 1;
        }
    }
    
    pub fn is_alive(&self) -> bool {
        self.current_hp > 0
    }
    
    pub fn take_damage(&mut self, damage: u16) {
        if self.invulnerability_timer > 0 {
            return;
        }
        
        let actual_damage = if damage > self.defense {
            damage - self.defense
        } else {
            1 // Minimum damage
        };
        
        if actual_damage >= self.current_hp {
            self.current_hp = 0;
        } else {
            self.current_hp -= actual_damage;
        }
        
        // Set invulnerability frames
        self.invulnerability_timer = 60; // 1 second at 60 FPS
    }
    
    pub fn heal(&mut self, amount: u16) {
        self.current_hp = (self.current_hp + amount).min(self.max_hp);
    }
    
    pub fn use_ki(&mut self, amount: u16) -> bool {
        if self.current_ki >= amount {
            self.current_ki -= amount;
            true
        } else {
            false
        }
    }
    
    pub fn restore_ki(&mut self, amount: u16) {
        self.current_ki = (self.current_ki + amount).min(self.max_ki);
    }
}