# Dragon Ball Z: Legacy of Goku - Web RPG Game Makefile
# Complete build system for TypeScript/Phaser 3 web development

# Set default target to show available commands
.DEFAULT_GOAL := default

# Project configuration
PROJECT_NAME := dragon-ball-z-legacy-of-goku
BUILD_DIR := dist
SRC_DIR := src
NODE_MODULES := node_modules

# Check if npm/node are available
HAS_NPM := $(shell which npm >/dev/null 2>&1 && echo "yes" || echo "no")
HAS_NODE := $(shell which node >/dev/null 2>&1 && echo "yes" || echo "no")

# Check if dependencies are installed
DEPS_INSTALLED := $(shell test -d "$(NODE_MODULES)" && echo "yes" || echo "no")

# Show available make commands on default
default:
	@echo "=== Dragon Ball Z: Legacy of Goku - Web RPG Game ==="
	@echo "Available make commands:"
	@echo ""
	@echo "🎮 Game Commands:"
	@echo "  make dev      - Start development server"
	@echo "  make build    - Build production version"
	@echo "  make prod     - Build and serve production version"
	@echo "  make serve    - Serve built files locally"
	@echo ""
	@echo "🔧 Development Commands:"
	@echo "  make clean    - Clean build files"
	@echo "  make lint     - Run TypeScript linter"
	@echo "  make lint-fix - Fix auto-fixable lint issues"
	@echo "  make format   - Format TypeScript code"
	@echo ""
	@echo "📦 Setup Commands:"
	@echo "  make install  - Install dependencies"
	@echo "  make info     - Show project information"
	@echo "  make help     - Show detailed help"
	@echo ""
	@if [ "$(DEPS_INSTALLED)" = "yes" ]; then \
		if [ -d "$(BUILD_DIR)" ]; then \
			echo "Status: ✅ Built ($$(du -sh "$(BUILD_DIR)" | cut -f1))"; \
		else \
			echo "Status: 🔧 Dependencies installed, ready to build"; \
		fi; \
	else \
		echo "Status: ❌ Dependencies not installed (run 'make install')"; \
	fi

# Build targets for web development
.PHONY: dev build prod serve clean lint lint-fix format install info help

# Check dependencies before running commands
check-deps:
	@if [ "$(HAS_NODE)" = "no" ]; then \
		echo "❌ Node.js not found. Please install Node.js 18+"; \
		exit 1; \
	fi
	@if [ "$(HAS_NPM)" = "no" ]; then \
		echo "❌ npm not found. Please install npm"; \
		exit 1; \
	fi
	@if [ "$(DEPS_INSTALLED)" = "no" ]; then \
		echo "❌ Dependencies not installed. Run 'make install' first"; \
		exit 1; \
	fi

# Install dependencies
install:
	@echo "Installing dependencies..."
	@if [ "$(HAS_NPM)" = "no" ]; then \
		echo "❌ npm not found. Please install Node.js and npm first"; \
		exit 1; \
	fi
	npm install
	@echo "✅ Dependencies installed"

# Start development server
dev: check-deps
	@echo "Starting development server..."
	npm run dev

# Build production version
build: check-deps
	@echo "Building production version..."
	npm run build
	@echo "✅ Production build complete"

# Build and serve production version
prod: check-deps
	@echo "Building and serving production version..."
	npm run prod

# Serve built files locally (requires build first)
serve:
	@if [ ! -d "$(BUILD_DIR)" ]; then \
		echo "Build directory not found. Run 'make build' first"; \
		exit 1; \
	fi
	@echo "Serving built files locally..."
	npx http-server $(BUILD_DIR) -p 8080 -o

# Clean build files
clean:
	@echo "Cleaning build files..."
	npm run clean 2>/dev/null || rm -rf $(BUILD_DIR)
	@echo "✅ Clean complete"

# Lint TypeScript code
lint: check-deps
	@echo "Running TypeScript linter..."
	npm run lint

# Fix auto-fixable lint issues
lint-fix: check-deps
	@echo "Fixing auto-fixable lint issues..."
	npm run lint:fix

# Format TypeScript code
format: check-deps
	@echo "Formatting TypeScript code..."
	npm run format

# Show build information
info:
	@echo "=== Project Information ==="
	@echo "Project: Dragon Ball Z Legacy of Goku (Web)"
	@echo "Framework: Phaser 3 + TypeScript"
	@echo "Source: $(SRC_DIR)/"
	@echo "Build: $(BUILD_DIR)/"
	@echo ""
	@echo "🟢 Environment:"
	@if [ "$(HAS_NODE)" = "yes" ]; then \
		echo "✅ Node.js: $$(node --version)"; \
	else \
		echo "❌ Node.js: Not installed"; \
	fi
	@if [ "$(HAS_NPM)" = "yes" ]; then \
		echo "✅ npm: $$(npm --version)"; \
	else \
		echo "❌ npm: Not installed"; \
	fi
	@echo ""
	@echo "📦 Dependencies:"
	@if [ "$(DEPS_INSTALLED)" = "yes" ]; then \
		echo "✅ Status: Installed ($$(du -sh "$(NODE_MODULES)" | cut -f1))"; \
	else \
		echo "❌ Status: Not installed"; \
	fi
	@echo ""
	@echo "🏗️ Build Status:"
	@if [ -d "$(BUILD_DIR)" ]; then \
		echo "✅ Build: Complete ($$(du -sh "$(BUILD_DIR)" | cut -f1))"; \
	else \
		echo "❌ Build: Not built yet"; \
	fi

# Detailed help
help:
	@echo "=== Dragon Ball Z: Legacy of Goku - Web Development ==="
	@echo ""
	@echo "This is a TypeScript/Phaser 3 web implementation of Dragon Ball Z RPG."
	@echo "The game runs in web browsers using modern web technologies."
	@echo ""
	@echo "🚀 Quick Start:"
	@echo "  make install  - Install all dependencies"
	@echo "  make dev      - Start development server"
	@echo "  make build    - Build for production"
	@echo ""
	@echo "🔧 Development Workflow:"
	@echo "  make dev      - Hot-reload development server"
	@echo "  make lint     - Check code quality"
	@echo "  make format   - Auto-format code"
	@echo "  make build    - Create production build"
	@echo "  make serve    - Test production build locally"
	@echo ""
	@echo "🎮 Game Features:"
	@echo "  • Web-based Dragon Ball Z RPG experience"
	@echo "  • TypeScript for type safety"
	@echo "  • Phaser 3 game engine"
	@echo "  • Webpack build system"
	@echo "  • Modern ES modules"
	@echo ""
	@echo "📁 Project Structure:"
	@echo "  src/scenes/   - Game scenes (Menu, Game, UI)"
	@echo "  src/entities/ - Game entities (Player, Enemy)"
	@echo "  src/config/   - Game configuration"
	@echo "  public/       - Static assets"
	@echo "  dist/         - Built output"
	@echo ""
	@echo "For more help: https://phaser.io/learn"

# Quick shorthand commands
d: dev
b: build
c: clean
i: info
s: serve