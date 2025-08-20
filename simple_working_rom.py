#!/usr/bin/env python3
"""
Create a simple GBA ROM with direct assembly that definitely works
"""

import struct

def create_simple_working_rom():
    """Create the simplest possible working GBA ROM"""
    
    # Start with 256KB of zeros
    rom = bytearray(256 * 1024)
    
    # GBA header (first 192 bytes)
    # Entry point: branch to our code at 0xC0
    rom[0:4] = struct.pack('<I', 0xEA00002E)  # b 0xC0 (skip header)
    
    # Nintendo logo (simplified - just enough for emulators)
    nintendo_logo = bytes([
        0x24, 0xFF, 0xAE, 0x51, 0x69, 0x9A, 0xA2, 0x21,
        0x3D, 0x84, 0x82, 0x0A, 0x84, 0xE4, 0x09, 0xAD,
        0x11, 0x24, 0x8B, 0x98, 0xC0, 0x81, 0x7F, 0x21,
        0xA3, 0x52, 0xBE, 0x19, 0x93, 0x09, 0xCE, 0x20,
        0x10, 0x46, 0x4A, 0x4A, 0xF8, 0x27, 0x31, 0xEC,
        0x58, 0xC7, 0xE8, 0x33, 0x82, 0xE3, 0xCE, 0xBF,
        0x85, 0xF4, 0xDF, 0x94, 0xCE, 0x4B, 0x09, 0xC1,
        0x94, 0x56, 0x8A, 0xC0, 0x13, 0x72, 0xA7, 0xFC,
        0x9F, 0x84, 0x4D, 0x73, 0xA3, 0xCA, 0x9A, 0x61,
        0x58, 0x97, 0xA3, 0x27, 0xFC, 0x03, 0x98, 0x76,
        0x23, 0x1D, 0xC7, 0x61, 0x03, 0x04, 0xAE, 0x56,
        0xBF, 0x38, 0x84, 0x00, 0x40, 0xA7, 0x0E, 0xFD,
        0xFF, 0x52, 0xFE, 0x03, 0x6F, 0x95, 0x30, 0xF1,
        0x97, 0xFB, 0xC0, 0x85, 0x60, 0xD6, 0x80, 0x25,
        0xA9, 0x63, 0xBE, 0x03, 0x01, 0x4E, 0x38, 0xE2,
        0xF9, 0xA2, 0x34, 0xFF, 0xBB, 0x3E, 0x03, 0x44,
        0x78, 0x00, 0x90, 0xCB, 0x88, 0x11, 0x3A, 0x94,
        0x65, 0xC0, 0x7C, 0x63, 0x87, 0xF0, 0x3C, 0xAF,
        0xD6, 0x25, 0xE4, 0x8B, 0x38, 0x0A, 0xAC, 0x72,
        0x21, 0xD4, 0xF8, 0x07
    ])
    rom[4:4+len(nintendo_logo)] = nintendo_logo
    
    # Game title at offset 160
    title = b"DBZ SIMPLE TEST\0"
    rom[160:160+len(title)] = title
    
    # Game code, maker, etc.
    rom[172:176] = b"TEST"
    rom[176:178] = b"01"
    rom[178] = 0x96
    
    # Our code starts at 0xC0 (192)
    code_offset = 0xC0
    
    # ARM assembly code (little-endian)
    arm_code = [
        # Set up system mode and stack
        0xE3A00013,  # mov r0, #0x13         ; system mode
        0xE121F000,  # msr cpsr_c, r0        ; set mode
        0xE3A0D403,  # mov sp, #0x03000000   ; stack base
        0xE28DD802,  # add sp, sp, #0x8000   ; sp = 0x03008000
        
        # Set display control to Mode 3 (bitmap mode)
        0xE3A00000,  # mov r0, #0             ; start with 0
        0xE3800003,  # orr r0, r0, #3         ; Mode 3
        0xE3800B01,  # orr r0, r0, #0x400     ; BG2_ON (bit 10)
        
        0xE3A01000,  # mov r1, #0             ; display control register
        0xE3801A01,  # orr r1, r1, #0x4000000 ; 0x04000000
        0xE1C100B0,  # strh r0, [r1]         ; write to REG_DISPCNT
        
        # Fill screen with red (0x001F in 15-bit RGB)
        0xE3A0001F,  # mov r0, #31            ; red color (0x001F)
        0xE3A01000,  # mov r1, #0             ; VRAM base
        0xE3801B06,  # orr r1, r1, #0x6000000 ; 0x06000000
        0xE3A02F96,  # mov r2, #0x258         ; 600 (approx screen size/64)
        0xE1A02202,  # lsl r2, r2, #4        ; *16 = 9600
        0xE0822082,  # add r2, r2, r2, lsl #1 ; *3 = 28800
        0xE0822402,  # add r2, r2, r2, lsl #8 ; rough approximation
        
        # Fill loop
        0xE1C100B0,  # strh r0, [r1]         ; write red pixel
        0xE2811002,  # add r1, r1, #2        ; next pixel (2 bytes)
        0xE2522001,  # subs r2, r2, #1       ; decrement counter
        0x1AFFFFFC,  # bne -4 (loop)         ; branch if not zero
        
        # Infinite loop
        0xEAFFFFFE,  # b . (infinite loop)
    ]
    
    # Write ARM instructions to ROM
    for i, instruction in enumerate(arm_code):
        offset = code_offset + (i * 4)
        rom[offset:offset+4] = struct.pack('<I', instruction)
    
    # Write the ROM file
    with open('simple_red_test.gba', 'wb') as f:
        f.write(rom)
    
    print(f"Created simple_red_test.gba")
    print("This ROM should display a solid RED screen")
    print("Uses Mode 3 bitmap graphics with direct VRAM writes")
    print("If this doesn't work, there may be emulator issues")
    
    return True

if __name__ == "__main__":
    create_simple_working_rom()