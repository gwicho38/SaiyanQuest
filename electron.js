const { app, BrowserWindow, Menu, screen, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');
const AppUpdater = require('./updater');

// Enable hardware acceleration for better game performance
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');
app.commandLine.appendSwitch('disable-frame-rate-limit');

// Game configuration
const GAME_CONFIG = {
  title: 'Dragon Ball Z: Saiyan Quest HD-2D',
  aspectRatio: 16 / 9,
  defaultWidth: 1280,
  defaultHeight: 720,
  minWidth: 960,
  minHeight: 540,
  maxWidth: 1920,
  maxHeight: 1080
};

let mainWindow = null;
let splashWindow = null;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const splashPath = isDev 
    ? path.join(__dirname, 'src', 'splash.html')
    : path.join(__dirname, 'dist', 'splash.html');
    
  if (fs.existsSync(splashPath)) {
    splashWindow.loadFile(splashPath);
  }

  return splashWindow;
}

function createWindow() {
  // Get primary display information
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;

  // Calculate optimal window size based on screen
  let windowWidth = GAME_CONFIG.defaultWidth;
  let windowHeight = GAME_CONFIG.defaultHeight;

  if (screenWidth < windowWidth || screenHeight < windowHeight) {
    windowWidth = Math.min(screenWidth * 0.9, GAME_CONFIG.maxWidth);
    windowHeight = Math.min(screenHeight * 0.9, GAME_CONFIG.maxHeight);
  }

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: GAME_CONFIG.minWidth,
    minHeight: GAME_CONFIG.minHeight,
    maxWidth: GAME_CONFIG.maxWidth,
    maxHeight: GAME_CONFIG.maxHeight,
    title: GAME_CONFIG.title,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: !isDev,
      backgroundThrottling: false,
      webgl: true,
      experimentalFeatures: true
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false,
    center: true,
    resizable: true,
    fullscreenable: true,
    autoHideMenuBar: true
  });

  // Set aspect ratio to maintain game proportions
  mainWindow.setAspectRatio(GAME_CONFIG.aspectRatio);

  // Load the game
  if (isDev) {
    mainWindow.loadURL('http://localhost:3001');
    // DevTools removed - use F12 or menu to open manually
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    if (splashWindow) {
      setTimeout(() => {
        splashWindow.close();
        splashWindow = null;
        mainWindow.show();
        mainWindow.focus();
      }, 2000);
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Optimize rendering performance
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setZoomFactor(1.0);
    mainWindow.webContents.setVisualZoomLevelLimits(1, 1);
  });

  // Handle fullscreen toggle
  mainWindow.on('enter-full-screen', () => {
    mainWindow.webContents.send('fullscreen-change', true);
  });

  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('fullscreen-change', false);
  });

  // Prevent window close during unsaved game
  mainWindow.on('close', (event) => {
    if (mainWindow.webContents.getURL().includes('game-active')) {
      event.preventDefault();
      mainWindow.webContents.send('request-save-before-quit');
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'Game',
      submenu: [
        {
          label: 'New Game',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-game');
          }
        },
        {
          label: 'Load Game',
          accelerator: 'CmdOrCtrl+L',
          click: () => {
            mainWindow.webContents.send('menu-load-game');
          }
        },
        {
          label: 'Save Game',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-game');
          }
        },
        { type: 'separator' },
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-open-settings');
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Fullscreen',
          accelerator: 'F11',
          click: () => {
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          }
        },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => {
            mainWindow.webContents.send('menu-zoom-in');
          }
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => {
            mainWindow.webContents.send('menu-zoom-out');
          }
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => {
            mainWindow.webContents.send('menu-zoom-reset');
          }
        },
        { type: 'separator' },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'F12',
          visible: isDev,
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Audio',
      submenu: [
        {
          label: 'Mute/Unmute',
          accelerator: 'M',
          click: () => {
            mainWindow.webContents.send('menu-toggle-audio');
          }
        },
        {
          label: 'Volume Up',
          accelerator: 'Up',
          click: () => {
            mainWindow.webContents.send('menu-volume-up');
          }
        },
        {
          label: 'Volume Down',
          accelerator: 'Down',
          click: () => {
            mainWindow.webContents.send('menu-volume-down');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Controls',
          click: () => {
            mainWindow.webContents.send('menu-show-controls');
          }
        },
        {
          label: 'About',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: GAME_CONFIG.title,
              detail: `Version ${app.getVersion()}\nA HD-2D remake of the classic Dragon Ball Z RPG\n\nBuilt with Phaser 3 and Electron`,
              buttons: ['OK']
            });
          }
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => {
            ipcMain.emit('check-for-updates');
          }
        },
        {
          label: 'Report Bug',
          click: () => {
            shell.openExternal('https://github.com/your-repo/issues');
          }
        }
      ]
    }
  ];

  // macOS specific menu adjustments
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { label: 'About ' + app.getName(), role: 'about' },
        { type: 'separator' },
        { label: 'Services', role: 'services', submenu: [] },
        { type: 'separator' },
        { label: 'Hide ' + app.getName(), accelerator: 'Command+H', role: 'hide' },
        { label: 'Hide Others', accelerator: 'Command+Shift+H', role: 'hideothers' },
        { label: 'Show All', role: 'unhide' },
        { type: 'separator' },
        { label: 'Quit', accelerator: 'Command+Q', click: () => app.quit() }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// IPC Communication handlers
function setupIPC() {
  // Handle save game requests
  ipcMain.handle('save-game-data', async (event, saveData) => {
    try {
      const userDataPath = app.getPath('userData');
      const savePath = path.join(userDataPath, 'saves');
      
      // Create saves directory if it doesn't exist
      if (!fs.existsSync(savePath)) {
        fs.mkdirSync(savePath, { recursive: true });
      }
      
      const fileName = `save_${Date.now()}.json`;
      const filePath = path.join(savePath, fileName);
      
      fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2));
      
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handle load game requests
  ipcMain.handle('load-game-data', async (event, saveFile) => {
    try {
      const userDataPath = app.getPath('userData');
      const filePath = path.join(userDataPath, 'saves', saveFile);
      
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return { success: true, data: JSON.parse(data) };
      } else {
        return { success: false, error: 'Save file not found' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handle getting save files list
  ipcMain.handle('get-save-files', async () => {
    try {
      const userDataPath = app.getPath('userData');
      const savePath = path.join(userDataPath, 'saves');
      
      if (!fs.existsSync(savePath)) {
        return { success: true, files: [] };
      }
      
      const files = fs.readdirSync(savePath)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const filePath = path.join(savePath, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            date: stats.mtime,
            size: stats.size
          };
        })
        .sort((a, b) => b.date - a.date);
      
      return { success: true, files };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handle screenshot requests
  ipcMain.handle('take-screenshot', async () => {
    try {
      const image = await mainWindow.webContents.capturePage();
      const buffer = image.toPNG();
      
      const screenshotPath = path.join(app.getPath('pictures'), GAME_CONFIG.title);
      if (!fs.existsSync(screenshotPath)) {
        fs.mkdirSync(screenshotPath, { recursive: true });
      }
      
      const fileName = `screenshot_${Date.now()}.png`;
      const filePath = path.join(screenshotPath, fileName);
      
      fs.writeFileSync(filePath, buffer);
      
      return { success: true, path: filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  // Handle performance monitoring
  ipcMain.on('performance-metrics', (event, metrics) => {
    if (isDev) {
      console.log('Game Performance:', metrics);
    }
  });

  // Handle game state for quit prevention
  ipcMain.on('game-state-changed', (event, state) => {
    if (mainWindow) {
      if (state === 'active') {
        mainWindow.webContents.setURL(mainWindow.webContents.getURL() + '#game-active');
      } else {
        mainWindow.webContents.setURL(mainWindow.webContents.getURL().replace('#game-active', ''));
      }
    }
  });

  // Handle save confirmation before quit
  ipcMain.on('save-confirmed', () => {
    if (mainWindow) {
      mainWindow.destroy();
    }
  });
}

// Application lifecycle
app.whenReady().then(() => {
  // Show splash screen first
  if (!isDev) {
    createSplashWindow();
  }
  
  // Create main window
  createWindow();
  
  // Setup menu
  createMenu();
  
  // Setup IPC handlers
  setupIPC();
  
  // Initialize auto-updater
  const updater = new AppUpdater();
  
  // Check for updates after 3 seconds
  setTimeout(() => {
    updater.checkForUpdates();
  }, 3000);
  
  // Add update check to menu
  ipcMain.on('check-for-updates', () => {
    updater.checkForUpdates(true);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// Handle protocol for deep linking (optional)
app.setAsDefaultProtocolClient('dbz-saiyan-quest');