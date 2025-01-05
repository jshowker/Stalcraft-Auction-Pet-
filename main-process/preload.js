const { contextBridge, ipcRenderer } = require("electron");

// Связываем основной процесс с рендерером через API
contextBridge.exposeInMainWorld("electronAPI", {
    minimizeWindow: () => ipcRenderer.send("window-minimize"),
    maximizeWindow: () => ipcRenderer.send("window-maximize"),
    unmaximizeWindow: () => ipcRenderer.send("window-unmaximize"),
    closeWindow: () => ipcRenderer.send("window-close"),
    onMaximizeStateChange: (callback) => ipcRenderer.on("window-maximize-state-changed", (_, isMaximized) => callback(isMaximized)),
});
