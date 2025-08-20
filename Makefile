# Dragon Ball Z: Legacy of Goku - GBA Game Makefile
# Complete build system for C source to playable GBA ROM

# Use the comprehensive Makefile for actual building
include Makefile.complete

# Set default target to show available commands
.DEFAULT_GOAL := default

# Override default settings for our project
TARGET := valid_red_test
ROM_BUILDER := create_valid_gba_rom.py

# Show available make commands on default
default:
	@echo "=== Dragon Ball Z: Legacy of Goku - GBA Game ==="
	@echo "Available make commands:"
	@echo ""
	@echo "🎮 Game Commands:"
	@echo "  make all      - Build complete ROM"
	@echo "  make game     - Build and play immediately"
	@echo "  make play     - Launch game if ROM exists"
	@echo "  make test     - Build and launch in emulator"
	@echo ""
	@echo "🔧 Development Commands:"
	@echo "  make clean    - Clean all build files"
	@echo "  make debug    - Build with debug information"
	@echo "  make rebuild  - Clean and rebuild"
	@echo "  make dev      - Quick development cycle"
	@echo ""
	@echo "📦 Utility Commands:"
	@echo "  make info     - Show build information"
	@echo "  make check    - Check build environment"
	@echo "  make install-deps - Install dependencies"
	@echo "  make help     - Show detailed help"
	@echo ""
	@echo "Current ROM: $(TARGET).gba"
	@if [ -f $(TARGET).gba ]; then \
		echo "Status: ✅ ROM exists ($$(du -h $(TARGET).gba | cut -f1))"; \
	else \
		echo "Status: ❌ ROM not built yet"; \
	fi

# Quick aliases for common tasks
.PHONY: game play

# Build and play the game immediately
game: all test

# Just play if ROM exists
play: 
	@if [ -f $(TARGET).gba ]; then \
		if [ -d "/Applications/mGBA.app" ]; then \
			open -a "mGBA" $(TARGET).gba; \
		else \
			echo "❌ mGBA not found. Install with: make install-deps"; \
			echo "Or manually open: $(TARGET).gba"; \
		fi; \
	else \
		echo "ROM not found. Building first..."; \
		$(MAKE) all test; \
	fi

# Show what the original simple Makefile used to do
original:
	@echo "Original Makefile tried to use devkitARM (not installed)"
	@echo "This new Makefile uses clang + Python ROM builder instead"
	@echo "Run: make all     (to build complete ROM)"
	@echo "Run: make test    (to build and play)"
	@echo "Run: make help    (for all options)"

# --- Rust GBA helpers ---
RUST_DIR := rust
RUST_TARGET := armv4t-none-eabi
RUST_ELF := $(RUST_DIR)/target/$(RUST_TARGET)/release/saiyan_quest_rust
RUST_GBA := $(RUST_ELF).gba

.PHONY: rust-init rust-build rust-run rust-clean

rust-init:
	@echo "Initializing Rust GBA toolchain..."
	@brew list rustup >/dev/null 2>&1 || brew install rustup-init >/dev/null 2>&1 || true
	@export PATH="/opt/homebrew/opt/rustup/bin:$$PATH"; rustup toolchain install nightly >/dev/null 2>&1 || true
	@export PATH="/opt/homebrew/opt/rustup/bin:$$PATH"; rustup default nightly >/dev/null 2>&1 || true
	@brew list arm-none-eabi-binutils >/dev/null 2>&1 || brew install arm-none-eabi-binutils >/dev/null 2>&1 || true
	@echo "✅ Rust GBA toolchain ready"

rust-build: rust-init
	@echo "Generating sprites (uv)..."
	@uv run --with pillow python3 tools/sprite_converter.py | cat
	@echo "Building Rust GBA crate (nightly)..."
	@export PATH="/opt/homebrew/opt/rustup/bin:$$PATH"; cd $(RUST_DIR) && cargo +nightly build --release | cat
	@echo "Converting ELF -> raw BIN..."
	@arm-none-eabi-objcopy -O binary $(RUST_ELF) $(RUST_ELF).bin
	@echo "Packing valid GBA header..."
	@python3 pack_rust_gba.py $(RUST_ELF).bin $(RUST_GBA)
	@echo "GBA ROM: $(RUST_GBA)"
	@echo "✅ Rust ROM built at: $(RUST_GBA)"

rust-run: rust-build
	@echo "Launching Rust ROM in mGBA..."
	@if [ -x "/Applications/mGBA.app/Contents/MacOS/mGBA" ]; then \
		"/Applications/mGBA.app/Contents/MacOS/mGBA" $(RUST_GBA) &>/dev/null & \
	else \
		open -a "mGBA" --args $(RUST_GBA); \
	fi

rust-clean:
	@cd $(RUST_DIR) && cargo clean || true

# --- AGB game helpers ---
AGB_DIR := agb_game
AGB_TARGET := thumbv4t-none-eabi
AGB_ELF := $(AGB_DIR)/target/$(AGB_TARGET)/release/agb_game
AGB_GBA := $(AGB_ELF).gba

.PHONY: agb-build agb-run

agb-build:
	@echo "Building agb game (release)..."
	@cd $(AGB_DIR) && cargo build --release | cat || true
	@echo "Packing to GBA..."
	@arm-none-eabi-objcopy -O binary $(AGB_ELF) $(AGB_ELF).bin || true
	@python3 pack_rust_gba.py $(AGB_ELF).bin $(AGB_GBA) || true
	@echo "AGB ROM: $(AGB_GBA)"

agb-run: agb-build
	@echo "Launching AGB ROM..."
	@if [ -x "/Applications/mGBA.app/Contents/MacOS/mGBA" ]; then \
		"/Applications/mGBA.app/Contents/MacOS/mGBA" $(AGB_GBA) &>/dev/null & \
	else \
		open -a "mGBA" --args $(AGB_GBA); \
	fi
