import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        frame: false,
        backgroundColor: "#FFF",
        webPreferences: {
            preload: path.join(__dirname, "../main-process/preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, "../public/index.html"));

    mainWindow.on("closed", () => {
        mainWindow = null;
    });

    mainWindow.on("maximize", () => {
        mainWindow.webContents.send("window-maximize-state-changed", true);
    });
    mainWindow.on("unmaximize", () => {
        mainWindow.webContents.send("window-maximize-state-changed", false);
    });
}

ipcMain.on("window-minimize", () => {
    if (mainWindow) mainWindow.minimize();
});

ipcMain.on("window-maximize", () => {
    if (mainWindow && !mainWindow.isMaximized()) mainWindow.maximize();
});

ipcMain.on("window-unmaximize", () => {
    if (mainWindow && mainWindow.isMaximized()) mainWindow.unmaximize();
});

ipcMain.on("window-close", () => {
    if (mainWindow) mainWindow.close();
});

app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (!mainWindow) createWindow();
});
