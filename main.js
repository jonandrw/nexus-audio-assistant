const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const waitOn = require('wait-on');

// Optimizaciones extremas de hardware
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
// Obligar a Windows a usar la GPU de alto rendimiento
app.commandLine.appendSwitch('force-gpu-selection', 'high');

let mainWindow;
let nextProcess;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    frame: false, // Diseño sin bordes
    backgroundColor: '#000000', // Respetar la estética oscura de Nexus
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  await mainWindow.loadURL('http://localhost:3000');
}

app.whenReady().then(async () => {
  // Iniciar servidor Next.js
  nextProcess = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['run', 'start'], {
    shell: true,
    stdio: 'inherit' // Permite ver los logs del OSC server si es que están ahí
  });

  // Esperar hasta que el puerto esté activo usando wait-on
  try {
    console.log("Esperando a que Next.js inicie en el puerto 3000...");
    await waitOn({
      resources: ['http://localhost:3000'],
      timeout: 30000,
    });
    console.log("Next.js detectado. Abriendo ventana principal...");
    createWindow();
  } catch (err) {
    console.error("Error al conectar con Next.js:", err);
    app.quit();
  }

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Limpieza crítica de procesos hijos (Next.js y el backend de OSC)
app.on('before-quit', () => {
  if (nextProcess) {
    console.log("Deteniendo servidor Next.js...");
    // Intentar cerrar el proceso en Windows de forma recursiva
    if (/^win/.test(process.platform)) {
        spawn("taskkill", ["/pid", nextProcess.pid, '/f', '/t']);
    } else {
        nextProcess.kill('SIGTERM');
    }
  }
});
