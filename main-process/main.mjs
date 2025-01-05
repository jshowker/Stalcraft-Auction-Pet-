import { app, BrowserWindow, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url"; // Убедитесь, что функция импортируется правильно

// Создаём эквивалент __dirname
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

    // Отправляем состояние окна (максимизировано/восстановлено) в рендерер
    mainWindow.on("maximize", () => {
        mainWindow.webContents.send("window-maximize-state-changed", true);
    });
    mainWindow.on("unmaximize", () => {
        mainWindow.webContents.send("window-maximize-state-changed", false);
    });
}

// IPC обработчики для управления окном
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

// Запуск приложения
app.on("ready", createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (!mainWindow) createWindow();
});
