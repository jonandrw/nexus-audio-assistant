const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const next = require('next');
const http = require('http');

// Optimizaciones extremas de hardware
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('force-gpu-selection', 'high');

let mainWindow;
const dev = !app.isPackaged;
const dir = app.getAppPath();

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false, // Diseño sin bordes
    backgroundColor: '#000000', // Respetar la estética oscura de Nexus
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.on('maximize', () => mainWindow.webContents.send('window-maximized', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-maximized', false));

  await mainWindow.loadURL('http://localhost:3000');
}

app.whenReady().then(async () => {
  try {
    console.log("Iniciando motor de Next.js internamente...");
    
    // Iniciar Next.js de manera programática en lugar de usar procesos de shell
    const nextApp = next({ dev, dir });
    const handle = nextApp.getRequestHandler();
    
    await nextApp.prepare();

    const server = http.createServer((req, res) => {
      handle(req, res);
    });

    server.listen(3000, (err) => {
      if (err) throw err;
      console.log("Next.js listo en puerto 3000. Abriendo UI...");
      createWindow();
    });

  } catch (err) {
    console.error("Error crítico arrancando Next.js:", err);
    app.quit();
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// -- IPC HANDLERS --
ipcMain.on('window-control', (event, action) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;
  
  if (action === 'minimize') {
    win.minimize();
  } else if (action === 'maximize') {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  } else if (action === 'fullscreen') {
    win.setFullScreen(!win.isFullScreen());
  } else if (action === 'close') {
    win.close();
  }
});

// Broadcast sync state
ipcMain.on('sync-state', (event, payload) => {
  const senderId = event.sender.id;
  BrowserWindow.getAllWindows().forEach(win => {
    if (win.webContents.id !== senderId) {
      win.webContents.send('sync-state', payload);
    }
  });
});

ipcMain.on('popout-panel', (event, { panelName, channelId }) => {
  const popoutWin = new BrowserWindow({
    width: 600,
    height: 800,
    frame: false,
    backgroundColor: '#000000',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const url = `http://localhost:3000/popout/${panelName}?channel=${channelId || '01'}`;
  popoutWin.loadURL(url);

  popoutWin.on('maximize', () => popoutWin.webContents.send('window-maximized', true));
  popoutWin.on('unmaximize', () => popoutWin.webContents.send('window-maximized', false));
});
