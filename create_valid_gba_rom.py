#!/usr/bin/env python3
"""
Create a properly formatted, valid GBA ROM that passes emulator validation
"""

import struct
import hashlib

def create_valid_gba_rom():
    """Create a valid GBA ROM with proper header, checksum, and structure"""
    
    # Start with 256KB ROM
    rom = bytearray(256 * 1024)
    
    # === GBA ROM Header (192 bytes) ===
    
    # 1. Entry point (4 bytes) - branch to our code at 0xC0 
    rom[0x00:0x04] = struct.pack('<I', 0xEA00002E)  # b 0xC0
    
    # 2. Nintendo Logo (156 bytes at 0x04-0x9F) - REQUIRED for validation
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
    
    # 3. Game Title (12 bytes at 0xA0-0xAB)
    game_title = b"DBZ RED TEST"
    rom[0xA0:0xA0+len(game_title)] = game_title
    
    # 4. Game Code (4 bytes at 0xAC-0xAF) 
    rom[0xAC:0xB0] = b"ARED"
    
    # 5. Maker Code (2 bytes at 0xB0-0xB1)
    rom[0xB0:0xB2] = b"01"
    
    # 6. Fixed Value (1 byte at 0xB2)
    rom[0xB2] = 0x96
    
    # 7. Main Unit Code (1 byte at 0xB3)
    rom[0xB3] = 0x00
    
    # 8. Device Type (1 byte at 0xB4) 
    rom[0xB4] = 0x00
    
    # 9. Reserved (7 bytes at 0xB5-0xBB)
    # Already zero
    
    # 10. Software Version (1 byte at 0xBC)
    rom[0xBC] = 0x00
    
    # 11. Header Checksum (1 byte at 0xBD) - calculated later
    
    # 12. Reserved (2 bytes at 0xBE-0xBF)
    # Already zero
    
    # === Calculate Header Checksum ===
    checksum = 0
    for i in range(0xA0, 0xBD):  # Sum bytes from 0xA0 to 0xBC
        checksum -= rom[i]
    
    # The checksum formula: (0-(sum of 0xA0-0xBC))-0x19
    checksum = (checksum - 0x19) & 0xFF
    rom[0xBD] = checksum
    
    print(f"Header checksum: 0x{checksum:02X}")
    
    # === ARM Code at 0xC0 ===
    code_offset = 0xC0
    
    # Simple ARM assembly to display red screen
    arm_code = [
        # Set system mode
        0xE3A00013,  # mov r0, #0x13
        0xE121F000,  # msr cpsr_c, r0
        
        # Set stack
        0xE3A0D403,  # mov sp, #0x03000000
        0xE28DD802,  # add sp, sp, #0x8000
        
        # Set Mode 3 display (bitmap mode)
        0xE59F0024,  # ldr r0, [pc, #36]    ; load 0x04000000
        0xE3A01403,  # mov r1, #0x403       ; MODE_3 | BG2_ON  
        0xE1C010B0,  # strh r1, [r0]       ; REG_DISPCNT = 0x403
        
        # Fill VRAM with red
        0xE59F0018,  # ldr r0, [pc, #24]    ; load 0x06000000 (VRAM)
        0xE3A0101F,  # mov r1, #31          ; red color (0x001F)
        0xE3A02F96,  # mov r2, #600         ; rough pixel count
        0xE1A02202,  # lsl r2, r2, #4       ; *16
        0xE0822082,  # add r2, r2, r2, lsl #1 ; *3
        
        # Fill loop
        0xE1C010B0,  # strh r1, [r0]        ; write red pixel
        0xE2800002,  # add r0, r0, #2       ; next pixel
        0xE2522001,  # subs r2, r2, #1      ; decrement
        0x1AFFFFFC,  # bne loop             ; branch if not zero
        
        # Infinite loop  
        0xEAFFFFFE,  # b .
        
        # Data
        0x04000000,  # Display control register
        0x06000000,  # VRAM base address
    ]
    
    # Write ARM code
    for i, instruction in enumerate(arm_code):
        offset = code_offset + (i * 4)
        rom[offset:offset+4] = struct.pack('<I', instruction)
    
    # === Write ROM File ===
    with open('valid_red_test.gba', 'wb') as f:
        f.write(rom)
    
    print(f"Created valid_red_test.gba ({len(rom)} bytes)")
    print("ROM includes:")
    print("- Proper GBA header with Nintendo logo")
    print("- Correct header checksum")
    print("- Valid game code and maker code") 
    print("- ARM code for red screen display")
    print("- Should pass emulator validation")
    
    # Verify checksum
    verify_checksum = 0
    for i in range(0xA0, 0xBD):
        verify_checksum -= rom[i]
    verify_checksum = (verify_checksum - 0x19) & 0xFF
    print(f"Checksum verification: 0x{verify_checksum:02X} == 0x{rom[0xBD]:02X}")
    
    return True

if __name__ == "__main__":
    create_valid_gba_rom()