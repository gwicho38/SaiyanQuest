#![no_std]
#![no_main]

mod game;
mod systems;
mod assets;

use agb::{entry, Gba};
use game::GameState;

#[entry]
fn main(mut gba: Gba) -> ! {
    let mut game_state = GameState::new(&mut gba);
    
    loop {
        game_state.update(&mut gba);
        gba.display.wait_for_vblank();
    }
}