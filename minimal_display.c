// Minimal GBA program that displays something visible

// GBA memory-mapped registers
#define REG_DISPCNT (*(volatile unsigned short*)0x04000000)
#define VRAM ((volatile unsigned short*)0x06000000)

// Display control flags
#define MODE_3 0x0003
#define BG2_ON 0x0400

// Screen dimensions for Mode 3
#define SCREEN_WIDTH 240
#define SCREEN_HEIGHT 160

// Basic colors (15-bit RGB: 0bbbbbgggggrrrrr)
#define RGB(r,g,b) ((r) | ((g)<<5) | ((b)<<10))
#define RED RGB(31,0,0)
#define GREEN RGB(0,31,0)
#define BLUE RGB(0,0,31)
#define YELLOW RGB(31,31,0)
#define WHITE RGB(31,31,31)
#define BLACK RGB(0,0,0)

// Draw a pixel at x,y
static inline void draw_pixel(int x, int y, unsigned short color) {
    VRAM[y * SCREEN_WIDTH + x] = color;
}

// Fill screen with a color
void fill_screen(unsigned short color) {
    for(int i = 0; i < SCREEN_WIDTH * SCREEN_HEIGHT; i++) {
        VRAM[i] = color;
    }
}

// Draw a rectangle
void draw_rect(int x, int y, int width, int height, unsigned short color) {
    for(int j = y; j < y + height && j < SCREEN_HEIGHT; j++) {
        for(int i = x; i < x + width && i < SCREEN_WIDTH; i++) {
            draw_pixel(i, j, color);
        }
    }
}

// Simple main that displays something
int main(void) {
    // Set video mode to Mode 3 (240x160, 16-bit color bitmap)
    REG_DISPCNT = MODE_3 | BG2_ON;
    
    // Fill screen with blue background
    fill_screen(BLUE);
    
    // Draw some rectangles to show it's working
    draw_rect(20, 20, 60, 40, RED);      // Red rectangle
    draw_rect(100, 50, 40, 60, GREEN);   // Green rectangle
    draw_rect(160, 30, 50, 50, YELLOW);  // Yellow square
    
    // Draw white border
    for(int x = 0; x < SCREEN_WIDTH; x++) {
        draw_pixel(x, 0, WHITE);
        draw_pixel(x, SCREEN_HEIGHT-1, WHITE);
    }
    for(int y = 0; y < SCREEN_HEIGHT; y++) {
        draw_pixel(0, y, WHITE);
        draw_pixel(SCREEN_WIDTH-1, y, WHITE);
    }
    
    // Draw a simple "DBZ" text pattern (crude pixel art)
    // D
    for(int y = 60; y < 80; y++) {
        draw_pixel(30, y, WHITE);
        draw_pixel(40, y, WHITE);
    }
    draw_rect(31, 60, 9, 2, WHITE);
    draw_rect(31, 78, 9, 2, WHITE);
    
    // B  
    for(int y = 60; y < 80; y++) {
        draw_pixel(50, y, WHITE);
    }
    draw_rect(51, 60, 8, 2, WHITE);
    draw_rect(51, 69, 8, 2, WHITE);
    draw_rect(51, 78, 8, 2, WHITE);
    draw_pixel(59, 62, WHITE);
    draw_pixel(59, 63, WHITE);
    draw_pixel(59, 71, WHITE);
    draw_pixel(59, 72, WHITE);
    
    // Z
    draw_rect(70, 60, 10, 2, WHITE);
    draw_rect(70, 78, 10, 2, WHITE);
    for(int i = 0; i < 10; i++) {
        draw_pixel(78-i, 62+i*2, WHITE);
        draw_pixel(78-i, 63+i*2, WHITE);
    }
    
    // Infinite loop
    while(1) {
        // Could add animation here
    }
    
    return 0;
}