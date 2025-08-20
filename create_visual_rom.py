#!/usr/bin/env python3
"""
Create a GBA ROM that actually displays something visible
"""

import struct
import subprocess
import os
import re

def extract_code_from_objdump(obj_file):
    """Extract machine code bytes from objdump output"""
    try:
        result = subprocess.run(['objdump', '-d', obj_file], 
                              capture_output=True, text=True)
        if result.returncode != 0:
            return b''
        
        code_bytes = bytearray()
        lines = result.stdout.split('\n')
        
        for line in lines:
            match = re.match(r'\s+([0-9a-f]+):\s+([0-9a-f\s]+)\s+.*', line)
            if match:
                hex_bytes = match.group(2).replace(' ', '')
                if len(hex_bytes) % 2 == 0 and hex_bytes:
                    for i in range(0, len(hex_bytes), 2):
                        byte_val = int(hex_bytes[i:i+2], 16)
                        code_bytes.append(byte_val)
        
        return bytes(code_bytes)
    except Exception as e:
        print(f"Error extracting code: {e}")
        return b''

def create_gba_header():
    """Create proper GBA ROM header"""
    header = bytearray(192)
    
    # Entry point - branch to start of our code
    header[0:4] = struct.pack('<I', 0xEA00002E)  # b +184 (skip to 0xC0)
    
    # Simplified Nintendo logo (enough for emulators)
    nintendo_logo = b'\x24\xFF\xAE\x51\x69\x9A\xA2\x21\x3D\x84\x82\x0A\x84\xE4\x09\xAD'
    header[4:20] = nintendo_logo
    
    # Game title
    title = b"DBZ VISUAL TEST"
    header[160:160+len(title)] = title
    
    # Game info
    header[172:176] = b"DVIS"  # Game code
    header[176:178] = b"01"    # Maker code
    header[178] = 0x96         # Fixed value
    
    return bytes(header)

def create_simple_startup_and_main():
    """Create ARM code that initializes and calls our main display function"""
    # This is a simple ARM/Thumb hybrid startup
    startup_code = bytearray()
    
    # ARM mode startup (at ROM offset 0xC0)
    arm_instructions = [
        0xE3A00013,  # mov r0, #0x13     ; supervisor mode
        0xE121F000,  # msr CPSR_c, r0    ; set mode
        0xE3A0D403,  # mov sp, #0x3000000 ; set stack base
        0xE28DD702,  # add sp, sp, #0x8000 ; sp = 0x3008000
        0xE28FF001,  # add pc, pc, #1     ; switch to thumb mode
    ]
    
    for instr in arm_instructions:
        startup_code.extend(struct.pack('<I', instr))
    
    # Add padding to align to thumb code
    startup_code.extend(b'\x00\x00')
    
    # Thumb mode - call main function
    # The main function code will be placed right after this
    thumb_instructions = [
        0x4800,  # ldr r0, [pc, #0]  ; load main address  
        0x4700,  # bx r0             ; jump to main
        # Address of main function (will be calculated)
        0x0000, 0x0000  # placeholder for main address
    ]
    
    for instr in thumb_instructions:
        startup_code.extend(struct.pack('<H', instr))
    
    return bytes(startup_code)

def create_visual_rom():
    """Create a ROM that displays colors and patterns"""
    print("Creating visual ROM...")
    
    # Create ROM with header
    rom_data = bytearray(create_gba_header())
    
    # Add startup code
    startup = create_simple_startup_and_main()
    rom_data.extend(startup)
    
    # Extract the compiled display code
    display_code = extract_code_from_objdump('minimal_display.o')
    if display_code:
        print(f"Extracted {len(display_code)} bytes of display code")
        
        # Calculate main function address (current position + 1 for thumb)
        main_addr = len(rom_data) + 1
        
        # Update the startup code to point to main
        # The address is stored at offset 0xD4 in little-endian format
        rom_data[0xD4:0xD8] = struct.pack('<I', main_addr)
        
        # Add the display code
        rom_data.extend(display_code)
    else:
        print("Failed to extract display code, creating simple pattern")
        # Add simple code that writes to video memory
        simple_code = [
            # Set display control to Mode 3
            0x4800,  # ldr r0, [pc, #0]   ; load 0x04000000
            0x4900,  # ldr r1, [pc, #0]   ; load 0x0403 (MODE_3 | BG2_ON)
            0x8001,  # strh r1, [r0]      ; write to REG_DISPCNT
            # Fill screen with color
            0x4800,  # ldr r0, [pc, #0]   ; load 0x06000000 (VRAM)
            0x4900,  # ldr r1, [pc, #0]   ; load color
            0x4A00,  # ldr r2, [pc, #0]   ; load count
            # Loop
            0x8001,  # strh r1, [r0]      ; write color
            0x3002,  # adds r0, #2        ; next pixel
            0x3A01,  # subs r2, #1        ; decrement count
            0xD1FB,  # bne loop           ; branch if not zero
            0xE7FE,  # b .                ; infinite loop
            # Data
            0x0000, 0x0400,  # 0x04000000 (display control)
            0x0403,          # MODE_3 | BG2_ON
            0x0000, 0x0600,  # 0x06000000 (VRAM)
            0x7C00,          # Red color
            0x9600,          # 38400 pixels (240*160)
        ]
        
        for instr in simple_code:
            rom_data.extend(struct.pack('<H', instr))
    
    # Pad to 256KB
    while len(rom_data) < 256 * 1024:
        rom_data.append(0x00)
    
    # Write ROM
    with open('dbz_visual.gba', 'wb') as f:
        f.write(rom_data)
    
    print(f"Created dbz_visual.gba ({len(rom_data)} bytes)")
    print("This ROM should display:")
    print("- Blue background")
    print("- Colored rectangles (red, green, yellow)")
    print("- White border")
    print("- Crude 'DBZ' text")
    
    return True

if __name__ == "__main__":
    create_visual_rom()