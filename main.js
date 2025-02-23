const path = require('path');
const process = require('node:process');
const url = require('url');
const {app, BrowserWindow, ipcMain, shell} = require('electron');
//const http = require("node:https");
const http = require("https");
const fs = require("fs");
const cp = require("child_process");
const AdmZip = require('adm-zip');
var spawn = require("child_process").spawn,child;

let win;
let skinUrl = 'https://my.alt-mp.com/api/tokens/WeFhzZZ/skin';
let skinDestination = `${app.getPath('home')}\\AppData\\Local\\altv\\cache\\skin.bin`;

function createWindow() {
    win = new BrowserWindow({
        width: 1250,
        height: 891,
        icon: path.join(__dirname, 'icon.ico'),
        transparent: true,
        //title: config.settings.name,
        backgroundColor: '#00000000',
        frame: false,
        center: true,
        resizable: false,
        fullscreenable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            preload: path.join(app.getAppPath(), 'preload.js')
        }
    });

    console.log(`asdl;jkalskdja`);
    console.log(path.join(__dirname, 'icon.ico'));

    win.loadURL(url.format({
        pathname: path.join(__dirname + '/UI/index.html'),
        protocol: 'file:',
        slashes: true
    }));

    //DEV MODE
    // win.loadURL('http://localhost:3000');
    // win.webContents.openDevTools();

    win.on('closed', () => {
        win = null;
    })
}

const downloadSkin = () =>{
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(skinDestination);
        http.get(skinUrl, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Ошибка загрузки: ${res.statusCode}`));
            }

            res.pipe(file);

            file.on("finish", () => {
                file.close(() => resolve());
            });

            res.on("error", (err) => {
                fs.unlink(destination, () => reject(err));
            });

            file.on("error", (err) => {
                fs.unlink(destination, () => reject(err));
            });
        });
    });
}

ipcMain.on('open-external', (event, url) => {
    shell.openExternal(url);
});

ipcMain.on('window:minimize', () => {
    win.minimize();
})

ipcMain.on('window:reload', () => {
    win.reload();
})

ipcMain.on('game:btnPlay', async (res, address) => {
    fs.stat(skinDestination, async (err) => {
        if (err) {
            await downloadSkin();
        }
    })

    fs.stat(`${app.getPath('home')}\\AppData\\Local\\altv`, (err) => {
        if (!err) {
            fs.stat(`${app.getPath('home')}\\AppData\\Local\\altv\\altv.exe`, (error) => {
                if (!error) {
					spawn("powershell.exe",[`${app.getPath('home')}\\AppData\\Local\\altv\\altv.exe -connecturl altv://connect/${address} -skipprocessconfirmation -forceapplylauncherskin`]);
                    //cp.exec(`cmd ${app.getPath('home')}\\AppData\\Local\\altv\\altv.exe -connecturl altv://connect/${data.ip}:${data.port}`);
                }
            })
        }
    })
})

ipcMain.on('game:install', (event) => {
    console.log('game install');
    fs.stat(`${app.getPath('home')}\\AppData\\Local\\altv`, (err) => {
        console.log(err);

        if (!err) {
            console.log('!err');

            fs.stat(`${app.getPath('home')}\\AppData\\Local\\altv\\altv.exe`, (error) => {
                if (!error) {
                    console.log('!error');
                    event.reply('updateCheckGame', 'ready');
                }
            })
        } else {
            console.log('err');

            fs.mkdirSync(`${app.getPath('home')}\\AppData\\Local\\altv`);
            event.reply('updateCheckGame', 'install');
            install(event)

        }
    })
})

const downloadUrl = "https://cdn.alt-mp.com/launcher/release/x64_win32/altv.zip";
const zipPath = `${app.getPath("home")}\\AppData\\Local\\altv\\altv.zip`;
const extractPath = `${app.getPath("home")}\\AppData\\Local\\altv\\`;

function downloadFile(url, destination, event) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destination);
        http.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Ошибка загрузки: ${res.statusCode}`));
            }

            const totalSize = parseInt(res.headers["content-length"], 10);
            let downloadedSize = 0;

            res.pipe(file);

            res.on("data", (chunk) => {
                downloadedSize += chunk.length;
                const percent = Math.floor((downloadedSize / totalSize) * 100);
                if (event) event.reply("updateProgress", percent); // Отправляем прогресс в UI
            });

            file.on("finish", () => {
                file.close(() => resolve());
            });

            res.on("error", (err) => {
                fs.unlink(destination, () => reject(err));
            });

            file.on("error", (err) => {
                fs.unlink(destination, () => reject(err));
            });
        });
    });
}

async function install(event) {
    try {
        console.log("Start downloading");
        await downloadFile(downloadUrl, zipPath, event);
        console.log("File downloaded");

        // Распаковка
        console.log("Unzip...");
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(extractPath, true);
        console.log("Unzip done");
        event.reply("updateCheckGame", 'ready');

        // Удаление zip-файла через 5 секунд
        setTimeout(() => {
            fs.unlink(zipPath, (err) => {
                if (!err) console.log("File deleted");
            });
        }, 5000);
    } catch (error) {
        console.error("Error:", error);
    }
}


//
// async function install (event) {
//         await http.get('https://cdn.alt-mp.com/launcher/release/x64_win32/altv.zip', (res) => {
//             const totalSize = parseInt(res.headers['content-length'], 10); // Размер файла
//             let downloadedSize = 0;
//             res.pipe(fs.createWriteStream(`${app.getPath('home')}\\AppData\\Local\\altv\\altv.zip`));
//
//             res.on('data', (chunk) => {
//                 downloadedSize += chunk.length;
//                 const percent = Math.floor((downloadedSize / totalSize) * 100);
//                 event.reply('updateProgress', percent);
//             });
//         })
//         try {
//             await setTimeout(() => {
//                 var zip = new AdmZip(`${app.getPath('home')}\\AppData\\Local\\altv\\altv.zip`);
//                 zip.extractAllTo(`${app.getPath('home')}\\AppData\\Local\\altv\\`, true);
//                 setTimeout(() => {
//                     fs.unlink(`${app.getPath('home')}\\AppData\\Local\\altv\\altv.zip`, (err) => {
//                         console.log('altv.zip deleted')
//                     })
//                 }, 5000)
//             }, 5000)
//         } catch (err) {
//             console.log(err)
//         }
// }

const isLaunched = (query, cb) => {
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32' : cmd = `tasklist`; break;
        case 'darwin' : cmd = `ps -ax | grep ${query}`; break;
        case 'linux' : cmd = `ps -A`; break;
        default: break;
    }
    cp.exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
    });
}

ipcMain.on('game:isLaunched', () => {
    isLaunched('GTA5.exe', (response) => {
        return response;
    })
})

app.on('ready', () => {
    createWindow();
});

app.on('window-all-closed', () => {
    app.quit();
});

ipcMain.on('ipc.close', () => {
    app.quit();
})

