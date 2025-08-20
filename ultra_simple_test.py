#!/usr/bin/env python3
"""
Ultra-simple GBA ROM test - the absolute minimum to display something
"""

import struct

def create_ultra_simple_rom():
    """Create the most basic possible ROM that just changes display mode"""
    
    rom = bytearray(32 * 1024)  # Just 32KB
    
    # Basic GBA header - absolute minimum
    rom[0:4] = struct.pack('<I', 0xEA000006)  # branch to 0x20 (skip minimal header)
    
    # Skip most header, just put title at 160
    title = b"ULTRA TEST\0"
    if len(rom) > 160:
        rom[160:160+len(title)] = title
    
    # Put very simple code at 0x20
    code_start = 0x20
    
    # Just set Mode 3 and write one red pixel
    simple_code = [
        # Mode 3 setup - write 0x0403 to 0x04000000
        0xE3A00403,  # mov r0, #0x403 (MODE_3 | BG2_ON)  
        0xE3A01000,  # mov r1, #0
        0xE3801000 | (0x400 << 4),  # orr r1, r1, #0x4000000 ; construct 0x04000000
        0xE5C10000,  # strb r0, [r1]  ; write to display control
        
        # Write red pixel to VRAM (0x06000000)
        0xE3A0001F,  # mov r0, #31   ; red color
        0xE3A01000,  # mov r1, #0
        0xE3801000 | (0x600 << 4),  # orr r1, r1, #0x6000000 ; construct 0x06000000
        0xE1C100B0,  # strh r0, [r1] ; write red pixel
        
        # Fill a small area with red
        0xE3A02020,  # mov r2, #32   ; counter
        # Loop:
        0xE1C100B0,  # strh r0, [r1] ; write pixel
        0xE2811002,  # add r1, r1, #2 ; next pixel
        0xE2522001,  # subs r2, r2, #1 ; decrement
        0x1AFFFFFC,  # bne loop
        
        # Infinite loop
        0xEAFFFFFE,  # b . 
    ]
    
    # Write code to ROM
    for i, instruction in enumerate(simple_code):
        offset = code_start + (i * 4)
        if offset + 4 <= len(rom):
            rom[offset:offset+4] = struct.pack('<I', instruction)
    
    # Write file
    with open('ultra_simple.gba', 'wb') as f:
        f.write(rom)
    
    print("Created ultra_simple.gba (32KB)")
    print("This is the absolute minimal ROM test")
    print("Should show at least one red pixel in top-left")
    
    return True

if __name__ == "__main__":
    create_ultra_simple_rom()