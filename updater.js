const { autoUpdater } = require('electron-updater');
const { dialog, BrowserWindow, app } = require('electron');
const isDev = process.env.NODE_ENV === 'development';

class AppUpdater {
  constructor() {
    // Disable auto download
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    
    // Configure update feed URL (GitHub releases)
    if (!isDev) {
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: 'your-username',
        repo: 'dbz-saiyan-quest'
      });
    }
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Check for updates automatically
    autoUpdater.on('checking-for-update', () => {
      this.log('Checking for updates...');
    });

    // Update available
    autoUpdater.on('update-available', (info) => {
      this.log('Update available:', info.version);
      
      dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        type: 'info',
        title: 'Update Available',
        message: `A new version (${info.version}) is available!`,
        detail: 'Would you like to download it now?',
        buttons: ['Download', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then(result => {
        if (result.response === 0) {
          autoUpdater.downloadUpdate();
          this.showDownloadProgress();
        }
      });
    });

    // No update available
    autoUpdater.on('update-not-available', (info) => {
      this.log('No updates available');
      
      if (this.manualCheck) {
        dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
          type: 'info',
          title: 'No Updates',
          message: 'You are running the latest version!',
          detail: `Current version: ${app.getVersion()}`,
          buttons: ['OK']
        });
        this.manualCheck = false;
      }
    });

    // Download progress
    autoUpdater.on('download-progress', (progressObj) => {
      let message = `Downloaded ${Math.round(progressObj.percent)}%`;
      message += ` (${this.formatBytes(progressObj.transferred)} / ${this.formatBytes(progressObj.total)})`;
      message += ` @ ${this.formatBytes(progressObj.bytesPerSecond)}/s`;
      
      this.log(message);
      
      // Send progress to renderer
      const mainWindow = BrowserWindow.getFocusedWindow();
      if (mainWindow) {
        mainWindow.webContents.send('update-download-progress', {
          percent: progressObj.percent,
          transferred: progressObj.transferred,
          total: progressObj.total,
          bytesPerSecond: progressObj.bytesPerSecond
        });
      }
      
      // Update progress window if exists
      if (this.progressWindow && !this.progressWindow.isDestroyed()) {
        this.progressWindow.webContents.send('download-progress', progressObj);
      }
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      this.log('Update downloaded:', info.version);
      
      // Close progress window
      if (this.progressWindow && !this.progressWindow.isDestroyed()) {
        this.progressWindow.close();
      }
      
      dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
        type: 'info',
        title: 'Update Ready',
        message: 'Update downloaded successfully!',
        detail: 'The application will restart to apply the update.',
        buttons: ['Restart Now', 'Later'],
        defaultId: 0,
        cancelId: 1
      }).then(result => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall(false, true);
        }
      });
    });

    // Error handling
    autoUpdater.on('error', (error) => {
      this.log('Update error:', error);
      
      dialog.showErrorBox(
        'Update Error',
        `Failed to update: ${error.message}\n\nPlease try again later or download manually from the website.`
      );
      
      // Close progress window if exists
      if (this.progressWindow && !this.progressWindow.isDestroyed()) {
        this.progressWindow.close();
      }
    });
  }

  checkForUpdates(manual = false) {
    if (isDev) {
      this.log('Skipping update check in development mode');
      return;
    }
    
    this.manualCheck = manual;
    autoUpdater.checkForUpdates().catch(err => {
      this.log('Failed to check for updates:', err);
    });
  }

  showDownloadProgress() {
    if (this.progressWindow && !this.progressWindow.isDestroyed()) {
      this.progressWindow.focus();
      return;
    }

    this.progressWindow = new BrowserWindow({
      width: 400,
      height: 150,
      resizable: false,
      minimizable: false,
      maximizable: false,
      fullscreenable: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
      }
    });

    // Create inline HTML for progress window
    const progressHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 10px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            color: white;
            user-select: none;
          }
          h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: 500;
          }
          .progress-bar {
            width: 100%;
            height: 20px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            overflow: hidden;
          }
          .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            border-radius: 10px;
            transition: width 0.3s ease;
            width: 0%;
          }
          .progress-text {
            margin-top: 10px;
            font-size: 12px;
            opacity: 0.9;
          }
        </style>
      </head>
      <body>
        <h3>Downloading Update...</h3>
        <div class="progress-bar">
          <div class="progress-fill" id="progress"></div>
        </div>
        <div class="progress-text" id="progressText">Preparing...</div>
        <script>
          const { ipcRenderer } = require('electron');
          
          ipcRenderer.on('download-progress', (event, progress) => {
            document.getElementById('progress').style.width = progress.percent + '%';
            document.getElementById('progressText').textContent = 
              Math.round(progress.percent) + '% - ' + 
              (progress.bytesPerSecond / 1024 / 1024).toFixed(1) + ' MB/s';
          });
        </script>
      </body>
      </html>
    `;

    this.progressWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(progressHTML)}`);

    this.progressWindow.on('closed', () => {
      this.progressWindow = null;
    });
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  log(...args) {
    console.log('[AutoUpdater]', ...args);
  }
}

module.exports = AppUpdater;