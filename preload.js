const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Game save/load functionality
  saveGame: (saveData) => ipcRenderer.invoke('save-game-data', saveData),
  loadGame: (saveFile) => ipcRenderer.invoke('load-game-data', saveFile),
  getSaveFiles: () => ipcRenderer.invoke('get-save-files'),
  
  // Screenshot functionality
  takeScreenshot: () => ipcRenderer.invoke('take-screenshot'),
  
  // Performance monitoring
  sendPerformanceMetrics: (metrics) => ipcRenderer.send('performance-metrics', metrics),
  
  // Game state management
  notifyGameStateChange: (state) => ipcRenderer.send('game-state-changed', state),
  confirmSave: () => ipcRenderer.send('save-confirmed'),
  
  // Menu event listeners
  onMenuAction: (callback) => {
    const events = [
      'menu-new-game',
      'menu-load-game',
      'menu-save-game',
      'menu-open-settings',
      'menu-zoom-in',
      'menu-zoom-out',
      'menu-zoom-reset',
      'menu-toggle-audio',
      'menu-volume-up',
      'menu-volume-down',
      'menu-show-controls'
    ];
    
    events.forEach(event => {
      ipcRenderer.on(event, (_, data) => callback(event, data));
    });
  },
  
  // Fullscreen events
  onFullscreenChange: (callback) => {
    ipcRenderer.on('fullscreen-change', (_, isFullscreen) => callback(isFullscreen));
  },
  
  // Quit prevention
  onRequestSaveBeforeQuit: (callback) => {
    ipcRenderer.on('request-save-before-quit', callback);
  },
  
  // Platform information
  platform: process.platform,
  version: process.versions.electron,
  
  // System information for performance optimization
  getSystemInfo: () => ({
    platform: process.platform,
    arch: process.arch,
    version: process.versions,
    memory: process.memoryUsage()
  }),
  
  // Remove all listeners (cleanup)
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners();
  }
});

// Game-specific API for HD-2D features
contextBridge.exposeInMainWorld('gameAPI', {
  // Graphics settings
  getDisplayInfo: async () => {
    const displays = await ipcRenderer.invoke('get-display-info');
    return displays;
  },
  
  // Audio context fix for Chrome/Electron
  resumeAudioContext: () => {
    if (window.AudioContext || window.webkitAudioContext) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    }
  },
  
  // Local storage wrapper with better performance
  storage: {
    get: (key) => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.error('Error reading from storage:', e);
        return null;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('Error writing to storage:', e);
        return false;
      }
    },
    remove: (key) => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.error('Error removing from storage:', e);
        return false;
      }
    },
    clear: () => {
      try {
        localStorage.clear();
        return true;
      } catch (e) {
        console.error('Error clearing storage:', e);
        return false;
      }
    }
  },
  
  // Performance optimization helpers
  requestIdleCallback: (callback) => {
    if ('requestIdleCallback' in window) {
      return window.requestIdleCallback(callback);
    } else {
      return setTimeout(callback, 1);
    }
  },
  
  cancelIdleCallback: (id) => {
    if ('cancelIdleCallback' in window) {
      window.cancelIdleCallback(id);
    } else {
      clearTimeout(id);
    }
  }
});

// Debug API (only in development)
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('debugAPI', {
    log: (...args) => console.log('[DEBUG]', ...args),
    warn: (...args) => console.warn('[DEBUG]', ...args),
    error: (...args) => console.error('[DEBUG]', ...args),
    
    // Performance profiling
    startProfiling: (label) => console.time(label),
    endProfiling: (label) => console.timeEnd(label),
    
    // Memory usage
    getMemoryUsage: () => {
      if (performance.memory) {
        return {
          used: Math.round(performance.memory.usedJSHeapSize / 1048576),
          total: Math.round(performance.memory.totalJSHeapSize / 1048576),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        };
      }
      return null;
    },
    
    // FPS counter
    getFPS: () => {
      let lastTime = performance.now();
      let frames = 0;
      let fps = 0;
      
      const calculateFPS = () => {
        frames++;
        const currentTime = performance.now();
        if (currentTime >= lastTime + 1000) {
          fps = Math.round((frames * 1000) / (currentTime - lastTime));
          frames = 0;
          lastTime = currentTime;
        }
        return fps;
      };
      
      return calculateFPS;
    }
  });
}

// Initialize
console.log('Dragon Ball Z: Saiyan Quest HD-2D - Preload script initialized');