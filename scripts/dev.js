#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}🎮 Starting Dragon Ball Z: Saiyan Quest Development Environment${colors.reset}\n`);

// Start webpack dev server
console.log(`${colors.yellow}📦 Starting Webpack Dev Server...${colors.reset}`);
const webpack = spawn('npm', ['run', 'dev'], {
  shell: true,
  stdio: 'pipe'
});

let webpackReady = false;
let electronStarted = false;

webpack.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Prefix webpack output
  output.split('\n').forEach(line => {
    if (line.trim()) {
      console.log(`${colors.blue}[Webpack]${colors.reset} ${line}`);
    }
  });
  
  // Check if webpack is ready
  if (!webpackReady && output.includes('webpack compiled successfully')) {
    webpackReady = true;
    console.log(`${colors.green}✓ Webpack Dev Server is ready!${colors.reset}\n`);
    
    // Start Electron after a short delay
    if (!electronStarted) {
      electronStarted = true;
      setTimeout(startElectron, 1000);
    }
  }
});

webpack.stderr.on('data', (data) => {
  const output = data.toString();
  
  // Filter out npm warnings
  if (!output.includes('npm warn')) {
    output.split('\n').forEach(line => {
      if (line.trim() && !line.includes('[webpack-dev-server]')) {
        console.log(`${colors.blue}[Webpack]${colors.reset} ${line}`);
      }
    });
  }
});

webpack.on('error', (error) => {
  console.error(`${colors.bright}${colors.red}❌ Failed to start Webpack: ${error}${colors.reset}`);
  process.exit(1);
});

function startElectron() {
  console.log(`${colors.magenta}🚀 Starting Electron...${colors.reset}\n`);
  
  const electron = spawn('electron', ['.', '--dev'], {
    shell: true,
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'development' }
  });
  
  electron.stdout.on('data', (data) => {
    const output = data.toString();
    output.split('\n').forEach(line => {
      if (line.trim()) {
        console.log(`${colors.cyan}[Electron]${colors.reset} ${line}`);
      }
    });
  });
  
  electron.stderr.on('data', (data) => {
    const output = data.toString();
    
    // Filter out known harmless errors
    if (!output.includes('Autofill.enable') && 
        !output.includes('Autofill.setAddresses') &&
        !output.includes('npm warn')) {
      output.split('\n').forEach(line => {
        if (line.trim()) {
          console.log(`${colors.cyan}[Electron]${colors.reset} ${line}`);
        }
      });
    }
  });
  
  electron.on('close', (code) => {
    console.log(`\n${colors.yellow}👋 Electron closed${colors.reset}`);
    
    // Kill webpack dev server
    console.log(`${colors.yellow}Stopping Webpack Dev Server...${colors.reset}`);
    webpack.kill();
    
    setTimeout(() => {
      process.exit(code);
    }, 500);
  });
  
  electron.on('error', (error) => {
    console.error(`${colors.bright}${colors.red}❌ Failed to start Electron: ${error}${colors.reset}`);
    webpack.kill();
    process.exit(1);
  });
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log(`\n${colors.yellow}🛑 Shutting down development environment...${colors.reset}`);
  
  if (webpack && !webpack.killed) {
    webpack.kill();
  }
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
});

// Handle other termination signals
process.on('SIGTERM', () => {
  if (webpack && !webpack.killed) {
    webpack.kill();
  }
  process.exit(0);
});