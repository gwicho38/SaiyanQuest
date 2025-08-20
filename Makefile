# Dragon Ball Z: Legacy of Goku - Rust GBA Game Makefile
# Complete build system for Rust source to playable GBA ROM

# Set default target to show available commands
.DEFAULT_GOAL := default

# Override default settings for our project
TARGET := saiyan_quest
RUST_TARGET := thumbv4t-none-eabi

# Use cargo from the rust-toolchain.toml specified version
CARGO := cargo
RUSTC := rustc

# Show available make commands on default
default:
	@echo "=== Dragon Ball Z: Legacy of Goku - Rust GBA Game ==="
	@echo "Available make commands:"
	@echo ""
	@echo "🎮 Game Commands:"
	@echo "  make build    - Build Rust GBA ROM"
	@echo "  make run      - Build and run in emulator"
	@echo "  make release  - Build optimized release ROM"
	@echo "  make play     - Launch game if ROM exists"
	@echo ""
	@echo "🔧 Development Commands:"
	@echo "  make clean    - Clean all build files"
	@echo "  make check    - Run cargo check"
	@echo "  make clippy   - Run clippy lints"
	@echo "  make fmt      - Format Rust code"
	@echo ""
	@echo "📦 Utility Commands:"
	@echo "  make info     - Show build information"
	@echo "  make deps     - Install Rust dependencies"
	@echo "  make help     - Show detailed help"
	@echo ""
	@echo "Current ROM: target/$(RUST_TARGET)/release/$(TARGET).gba"
	@if [ -f target/$(RUST_TARGET)/release/$(TARGET).gba ]; then \
		echo "Status: ✅ ROM exists ($$(du -h target/$(RUST_TARGET)/release/$(TARGET).gba | cut -f1))"; \
	else \
		echo "Status: ❌ ROM not built yet"; \
	fi

# Rust build targets
.PHONY: build run release play clean check clippy fmt deps info help

# Build debug ROM
build:
	@echo "Building Rust GBA ROM..."
	$(CARGO) build -Z build-std=core,alloc
	@echo "✅ Debug ROM built"

# Build and run in emulator
run:
	@echo "Building and running Rust GBA ROM..."
	$(CARGO) run -Z build-std=core,alloc

# Build optimized release ROM
release:
	@echo "Building optimized release ROM..."
	$(CARGO) build --release -Z build-std=core,alloc
	@echo "✅ Release ROM built at: target/$(RUST_TARGET)/release/$(TARGET).gba"

# Just play if ROM exists
play: 
	@if [ -f target/$(RUST_TARGET)/release/$(TARGET).gba ]; then \
		if [ -d "/Applications/mGBA.app" ]; then \
			open -a "mGBA" target/$(RUST_TARGET)/release/$(TARGET).gba; \
		else \
			echo "❌ mGBA not found. Install mGBA emulator"; \
			echo "Or manually open: target/$(RUST_TARGET)/release/$(TARGET).gba"; \
		fi; \
	else \
		echo "ROM not found. Building first..."; \
		$(MAKE) release && $(MAKE) play; \
	fi

# Development commands
clean:
	@echo "Cleaning build files..."
	$(CARGO) clean
	@echo "✅ Clean complete"

check:
	@echo "Running cargo check..."
	$(CARGO) check --target $(RUST_TARGET)

clippy:
	@echo "Running clippy lints..."
	$(CARGO) clippy --target $(RUST_TARGET)

fmt:
	@echo "Formatting Rust code..."
	$(CARGO) fmt

# Install dependencies
deps:
	@echo "Installing Rust dependencies..."
	rustup toolchain install nightly
	rustup component add rust-src --toolchain nightly
	@echo "✅ Dependencies installed"

# Show build information
info:
	@echo "=== Build Information ==="
	@echo "Target: $(RUST_TARGET)"
	@echo "Binary: $(TARGET)"
	@echo "Rust version: $$(rustc --version)"
	@echo "Cargo version: $$(cargo --version)"
	@if [ -f target/$(RUST_TARGET)/release/$(TARGET).gba ]; then \
		echo "Release ROM: ✅ ($$(du -h target/$(RUST_TARGET)/release/$(TARGET).gba | cut -f1))"; \
	else \
		echo "Release ROM: ❌ Not built"; \
	fi

# Detailed help
help:
	@echo "=== Dragon Ball Z: Legacy of Goku - Rust GBA Development ==="
	@echo ""
	@echo "This project is now fully migrated to Rust using the AGB framework."
	@echo "All C code has been converted to equivalent Rust implementations."
	@echo ""
	@echo "Quick Start:"
	@echo "  make deps     - Install Rust target"
	@echo "  make release  - Build optimized ROM"
	@echo "  make play     - Launch in emulator"
	@echo ""
	@echo "Development:"
	@echo "  make run      - Build and run with live reload"
	@echo "  make check    - Quick syntax check"
	@echo "  make clippy   - Code quality checks"
	@echo ""
# Legacy build targets (deprecated - use main Rust build instead)
rust-legacy:
	@echo "⚠️  Legacy rust/ directory build deprecated"
	@echo "Use 'make build' or 'make release' for main Rust build"

agb-legacy:
	@echo "⚠️  Legacy agb_game/ directory build deprecated" 
	@echo "Use 'make build' or 'make release' for main Rust build"
