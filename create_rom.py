#!/usr/bin/env python3
"""
Simple GBA ROM creator - combines object files into a basic ROM
"""

import struct
import os

def create_gba_header():
    """Create basic GBA ROM header"""
    header = bytearray(192)  # GBA header is 192 bytes
    
    # Entry point - branch instruction (b +0)
    header[0:4] = struct.pack('<I', 0xEA000006)  # b +6 (skip header)
    
    # Nintendo logo placeholder (156 bytes at offset 4)
    # Skip for now - emulators often don't require it
    
    # Game title (12 bytes at offset 160)
    title = b"SAIYANQUEST"
    header[160:160+len(title)] = title
    
    # Game code (4 bytes at offset 172)
    header[172:176] = b"SQST"
    
    # Maker code (2 bytes at offset 176)  
    header[176:178] = b"01"
    
    # Fixed value (1 byte at offset 178)
    header[178] = 0x96
    
    # Unit code (1 byte at offset 179)
    header[179] = 0x00
    
    # Device type (1 byte at offset 180)
    header[180] = 0x00
    
    # Software version (1 byte at offset 187)
    header[187] = 0x00
    
    return bytes(header)

def create_simple_rom():
    """Create a simple GBA ROM"""
    print("Creating simple GBA ROM...")
    
    # Create ROM with header
    rom_data = bytearray()
    
    # Add GBA header
    header = create_gba_header()
    rom_data.extend(header)
    
    # Add simple ARM code that sets up and calls main
    # This is a basic bootstrap
    arm_code = [
        0xE3A00C13,  # mov r0, #0x1F00
        0xE380001F,  # orr r0, r0, #0x1F    ; system mode
        0xE121F000,  # msr CPSR_c, r0
        0xE3A0D803,  # mov sp, #0x3000000   ; set stack
        0xE28DD002,  # add sp, sp, #0x8000  ; sp = 0x3008000
        0xEB000000,  # bl main (placeholder - will need fixing)
        0xEAFFFFFE,  # loop: b loop
    ]
    
    # Convert to bytes and add to ROM
    for instruction in arm_code:
        rom_data.extend(struct.pack('<I', instruction))
    
    # Pad to minimum ROM size (typically 256KB)
    while len(rom_data) < 256 * 1024:
        rom_data.append(0x00)
    
    # Write ROM file
    with open('saiyan_quest.gba', 'wb') as f:
        f.write(rom_data)
    
    print(f"Created saiyan_quest.gba ({len(rom_data)} bytes)")
    return True

if __name__ == "__main__":
    create_simple_rom()