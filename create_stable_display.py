#!/usr/bin/env python3
"""
Create a GBA ROM with stable, persistent graphics display
"""

import struct

def create_stable_display_rom():
    """Create ROM that displays stable graphics that stay on screen"""
    
    # 256KB ROM
    rom = bytearray(256 * 1024)
    
    # === GBA Header ===
    rom[0x00:0x04] = struct.pack('<I', 0xEA00002E)  # b 0xC0
    
    # Nintendo Logo
    nintendo_logo = bytes([
        0x24, 0xFF, 0xAE, 0x51, 0x69, 0x9A, 0xA2, 0x21, 0x3D, 0x84, 0x82, 0x0A,
        0x84, 0xE4, 0x09, 0xAD, 0x11, 0x24, 0x8B, 0x98, 0xC0, 0x81, 0x7F, 0x21,
        0xA3, 0x52, 0xBE, 0x19, 0x93, 0x09, 0xCE, 0x20, 0x10, 0x46, 0x4A, 0x4A,
        0xF8, 0x27, 0x31, 0xEC, 0x58, 0xC7, 0xE8, 0x33, 0x82, 0xE3, 0xCE, 0xBF,
        0x85, 0xF4, 0xDF, 0x94, 0xCE, 0x4B, 0x09, 0xC1, 0x94, 0x56, 0x8A, 0xC0,
        0x13, 0x72, 0xA7, 0xFC, 0x9F, 0x84, 0x4D, 0x73, 0xA3, 0xCA, 0x9A, 0x61,
        0x58, 0x97, 0xA3, 0x27, 0xFC, 0x03, 0x98, 0x76, 0x23, 0x1D, 0xC7, 0x61,
        0x03, 0x04, 0xAE, 0x56, 0xBF, 0x38, 0x84, 0x00, 0x40, 0xA7, 0x0E, 0xFD,
        0xFF, 0x52, 0xFE, 0x03, 0x6F, 0x95, 0x30, 0xF1, 0x97, 0xFB, 0xC0, 0x85,
        0x60, 0xD6, 0x80, 0x25, 0xA9, 0x63, 0xBE, 0x03, 0x01, 0x4E, 0x38, 0xE2,
        0xF9, 0xA2, 0x34, 0xFF, 0xBB, 0x3E, 0x03, 0x44, 0x78, 0x00, 0x90, 0xCB,
        0x88, 0x11, 0x3A, 0x94, 0x65, 0xC0, 0x7C, 0x63, 0x87, 0xF0, 0x3C, 0xAF,
        0xD6, 0x25, 0xE4, 0x8B, 0x38, 0x0A, 0xAC, 0x72, 0x21, 0xD4, 0xF8, 0x07
    ])
    rom[0x04:0x04+len(nintendo_logo)] = nintendo_logo
    
    # Game info
    rom[0xA0:0xAC] = b"DBZ STABLE\x00\x00"
    rom[0xAC:0xB0] = b"STBL" 
    rom[0xB0:0xB2] = b"01"
    rom[0xB2] = 0x96
    
    # Calculate checksum
    checksum = 0
    for i in range(0xA0, 0xBD):
        checksum -= rom[i]
    rom[0xBD] = (checksum - 0x19) & 0xFF
    
    # === ARM Code for Stable Display ===
    code = 0xC0
    
    instructions = [
        # Set up display control for Mode 3
        0xE3A00403,  # mov r0, #0x403         ; MODE_3 | BG2_ON
        0xE3A01201,  # mov r1, #0x10000000    ; 
        0xE3811102,  # orr r1, r1, #0x4000000 ; r1 = 0x04000000
        0xE1C100B0,  # strh r0, [r1]          ; REG_DISPCNT = MODE_3 | BG2_ON
        
        # Wait a bit for display to initialize
        0xE3A02C01,  # mov r2, #256           ; delay counter
        0xE2522001,  # subs r2, r2, #1        ; delay loop
        0x1AFFFFFD,  # bne delay_loop
        
        # Set up VRAM base address
        0xE3A01201,  # mov r1, #0x10000000    ;
        0xE3811106,  # orr r1, r1, #0x6000000 ; r1 = 0x06000000 (VRAM)
        
        # Fill entire screen with gradient pattern
        0xE3A02000,  # mov r2, #0             ; y counter (rows)
        0xE3A05A0F,  # mov r5, #0xF000        ; base for screen height (240)
        0xE285500F,  # add r5, r5, #15        ; r5 = 0xF00F ≈ 240*160 pixels
        
        # Outer loop: rows
        0xE3A03000,  # mov r3, #0             ; x counter (columns) 
        0xE3A040F0,  # mov r4, #0xF0          ; columns per row (240)
        
        # Inner loop: columns  
        # Create color based on position (r2=y, r3=x)
        0xE0820003,  # add r0, r2, r3         ; combine x+y for color
        0xE2000007,  # and r0, r0, #7         ; limit to 3 bits
        0xE1A00200,  # lsl r0, r0, #4         ; shift to create color pattern
        0xE3800007,  # orr r0, r0, #7         ; add some base color
        
        # Write pixel to VRAM
        0xE0816082,  # add r6, r1, r2, lsl #1 ; calculate VRAM address
        0xE0866083,  # add r6, r6, r3, lsl #1 ; (y*240 + x) * 2 bytes
        0xE1C600B0,  # strh r0, [r6]          ; write pixel
        
        # Increment x counter
        0xE2833001,  # add r3, r3, #1         ; x++
        0xE1530004,  # cmp r3, r4             ; compare x with width
        0x3AFFFFF5,  # bcc inner_loop         ; continue if x < width
        
        # Increment y counter  
        0xE2822001,  # add r2, r2, #1         ; y++
        0xE152005,   # cmp r2, r5             ; compare y with height
        0x3AFFFFF0,  # bcc outer_loop         ; continue if y < height
        
        # Draw some distinct shapes after background
        # Red rectangle in top-left
        0xE3A0001F,  # mov r0, #31            ; red color
        0xE3A02000,  # mov r2, #0             ; start at (0,0)
        0xE3A03028,  # mov r3, #40            ; width
        0xE3A04028,  # mov r4, #40            ; height
        
        # Red rectangle loop
        0xE3A05000,  # mov r5, #0             ; y counter
        0xE3A06000,  # mov r6, #0             ; x counter
        0xE0817105,  # add r7, r1, r5, lsl #2 ; VRAM + y*240*2
        0xE0877006,  # add r7, r7, r6         ; + x*2  
        0xE1C700B0,  # strh r0, [r7]          ; write red pixel
        0xE2866001,  # add r6, r6, #1         ; x++
        0xE1560003,  # cmp r6, r3             ; x < width?
        0x3AFFFFFA,  # bcc red_x_loop
        0xE3A06000,  # mov r6, #0             ; reset x
        0xE2855001,  # add r5, r5, #1         ; y++
        0xE1550004,  # cmp r5, r4             ; y < height?
        0x3AFFFFF6,  # bcc red_y_loop
        
        # Now keep refreshing the display continuously
        0xEAFFFFFE,  # b .                    ; infinite loop (but display stays)
    ]
    
    # Write instructions
    for i, instr in enumerate(instructions):
        offset = code + (i * 4) 
        rom[offset:offset+4] = struct.pack('<I', instr)
    
    # Write ROM
    with open('stable_display.gba', 'wb') as f:
        f.write(rom)
    
    print("Created stable_display.gba")
    print("This ROM should display:")
    print("- Persistent gradient background")
    print("- Red rectangle in top-left corner") 
    print("- Graphics should stay on screen permanently")
    print("- No more flashing/disappearing display")
    
    return True

if __name__ == "__main__":
    create_stable_display_rom()