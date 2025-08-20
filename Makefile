DEVKITARM ?= /opt/devkitpro/devkitARM
PREFIX    := $(DEVKITARM)/bin/arm-none-eabi-

CC      := $(PREFIX)gcc
AS      := $(PREFIX)as
LD      := $(PREFIX)ld
OBJCOPY := $(PREFIX)objcopy

CFLAGS  := -mthumb -mthumb-interwork -mcpu=arm7tdmi \
           -ffast-math -fomit-frame-pointer \
           -Wall -O2

LDFLAGS := -specs=gba.specs

TARGET  := saiyan_quest
SOURCES := $(wildcard source/*.c) $(wildcard source/*/*.c)
OBJECTS := $(SOURCES:.c=.o)

.RECIPEPREFIX := >

$(TARGET).gba: $(TARGET).elf
>$(OBJCOPY) -O binary $< $@
>gbafix $@

$(TARGET).elf: $(OBJECTS)
>$(CC) $(LDFLAGS) -o $@ $^

%.o: %.c
>$(CC) $(CFLAGS) -c -o $@ $<

clean:
>rm -f $(OBJECTS) $(TARGET).elf $(TARGET).gba

.PHONY: clean
