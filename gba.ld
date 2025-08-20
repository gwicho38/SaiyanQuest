/* GBA Linker Script */
OUTPUT_FORMAT("elf32-littlearm", "elf32-bigarm", "elf32-littlearm")
OUTPUT_ARCH(arm)
ENTRY(_start)

MEMORY {
    rom (rx) : ORIGIN = 0x08000000, LENGTH = 32M
    iwram (rwx) : ORIGIN = 0x03000000, LENGTH = 32K
    ewram (rwx) : ORIGIN = 0x02000000, LENGTH = 256K
}

SECTIONS {
    . = 0x08000000;
    
    .text : {
        *(.init)
        *(.text)
        *(.rodata)
        . = ALIGN(4);
    } > rom
    
    .data : {
        __data_start = .;
        *(.data)
        . = ALIGN(4);
        __data_end = .;
    } > iwram AT > rom
    
    .bss : {
        __bss_start = .;
        *(.bss)
        *(COMMON)
        . = ALIGN(4);
        __bss_end = .;
    } > iwram
    
    /* Stack */
    __stack_top = ORIGIN(iwram) + LENGTH(iwram);
}