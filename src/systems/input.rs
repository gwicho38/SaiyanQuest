use agb::input::{ButtonController, Button};

pub struct InputSystem {
    previous_input: u16,
    current_input: u16,
}

impl InputSystem {
    pub fn new() -> Self {
        Self {
            previous_input: 0,
            current_input: 0,
        }
    }
    
    // Migrated from C InitInput function - AGB handles this automatically
    pub fn init_input() {
        // Input initialization is handled by AGB framework
    }
    
    pub fn update(&mut self, input: &ButtonController) {
        self.previous_input = self.current_input;
        self.current_input = self.buttons_to_u16(input);
    }
    
    fn buttons_to_u16(&self, input: &ButtonController) -> u16 {
        let mut result = 0u16;
        
        if input.held(Button::A) { result |= 1 << 0; }
        if input.held(Button::B) { result |= 1 << 1; }
        if input.held(Button::SELECT) { result |= 1 << 2; }
        if input.held(Button::START) { result |= 1 << 3; }
        if input.held(Button::RIGHT) { result |= 1 << 4; }
        if input.held(Button::LEFT) { result |= 1 << 5; }
        if input.held(Button::UP) { result |= 1 << 6; }
        if input.held(Button::DOWN) { result |= 1 << 7; }
        if input.held(Button::R) { result |= 1 << 8; }
        if input.held(Button::L) { result |= 1 << 9; }
        
        result
    }
    
    pub fn just_pressed(&self, button: Button) -> bool {
        let button_bit = match button {
            Button::A => 1 << 0,
            Button::B => 1 << 1,
            Button::SELECT => 1 << 2,
            Button::START => 1 << 3,
            Button::RIGHT => 1 << 4,
            Button::LEFT => 1 << 5,
            Button::UP => 1 << 6,
            Button::DOWN => 1 << 7,
            Button::R => 1 << 8,
            Button::L => 1 << 9,
        };
        
        (self.current_input & button_bit) != 0 && (self.previous_input & button_bit) == 0
    }
}