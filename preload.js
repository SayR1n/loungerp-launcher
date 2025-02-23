const { contextBridge, ipcRenderer } = require('electron')

console.log('preload loaded')

contextBridge.exposeInMainWorld(
    'windowControl', {
        minimize: () => ipcRenderer.send('window:minimize'),
        retry: () => ipcRenderer.send('window:reload')
    }
)

contextBridge.exposeInMainWorld(
    'game', {
        launch: (address) => ipcRenderer.send('game:btnPlay', address),
        install: () => ipcRenderer.send('game:install'),
        isLaunched: () => ipcRenderer.send('game:isLaunched'),
        close: () => ipcRenderer.send('ipc.close'),
        receive: (channel, callback) => {
            ipcRenderer.on(channel, (event, ...args) => callback(...args));
        },
        openExternal: (url) => ipcRenderer.send('open-external', url)
    }
)
