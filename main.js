const {app, BrowserWindow, ipcMain, dialog, Menu, Tray} = require('electron')

app.disableHardwareAcceleration();

const path = require('node:path');
const fs = require('node:fs');
const { type } = require('node:os');
const { FILE } = require('node:dns');
let win;
const notesFilePath = path.join(app.getPath('userData'), 'notes.json')
console.log(notesFilePath);;

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });
    win.loadFile('index.html');

    win.on('close', (event) => {
        event.preventDefault();  // stop the window from closing immediately
        win.hide(); // hide the window instead of closing it
    });
    return win;
}
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Save Note Handler 
ipcMain.handle('save-note', async (event, text, filePath) => {
    const targetPath = filePath || path.join(app.getPath('documents'), 'quicknote.txt');
    fs.writeFileSync(targetPath, text, 'utf-8');
    return { success: true, filePath: targetPath};
});

// Load Note Handler 
ipcMain.handle('load-note', async () => {
    const filePath = path.join(app.getPath('documents'), 'quicknote.txt');
    if (fs.existsSync(filePath)){
        return fs.readFileSync(filePath, 'utf-8');
    }
    return '';
});

// Delete button 
ipcMain.handle('delete-note', async() => {
    const filePath = path.join(app.getPath('documents'), 'quicknote.txt');
    if(fs.existsSync(filePath)){
        fs.unlinkSync(filePath);
    }
    return { success: true };
});


// Save As handler
ipcMain.handle('save-as', async (event, text) => {
    const result = await dialog.showSaveDialog({
        defaultPath: 'mynote.txt',
        filters: [{ name: 'Text Files', extensions: ['txt'] }]
    });
    if (result.canceled){
        return {success:false};
    }
    fs.writeFileSync(result.filePath, text, 'utf-8');
    return{success: true, filePath: result.filePath};
});

// // Updated Smart Save handler 
//     ipcMain.handle('smart-save', async (event, textarea, filePath) =>{
//         const targetPath = filePath || path.join(app.getPath('documents'), 'quicknote.txt');
//         fs.writeFileSync(targetPath, text, 'utf-8');
//         return {success: true, filePath: targetPath};
//     });


// New note handler 
ipcMain.handle('new-note', async (event, text) => {
    const result = await dialog.showMessageBox({
        type: 'warning',
        buttons: ['Discard Changes', 'Cancel'],
        defaultId: 0,
        message: 'You have unsaved changes. start a new note anyway?'
    });
    // result.response === 0 means user clicked 'duscard changes'
    return { confirmed: result.response === 0 };
});

// Open file handler 
ipcMain.handle('open-file', async (event) =>{
    const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [{ name: 'Text Files', extensions: ['txt']}]
    });

    if(result.canceled){
        return {success: false};
    }
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    return{ success: true, content, filePath};
});

// App Menu 

const menuTemplate = [
    {
        label: 'File',
        submenu: [
            { 
                label: 'New Note',
                accelerator: 'CmdOrCtrl+N',
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.send('menu-new-note');
                }
            },
            {
                label: 'Open Note',
                accelerator: 'CmdOrCtrl+O',
                click: () => {  
                    BrowserWindow.getFocusedWindow().webContents.send('menu-open-note');
                }
            },
            {
                label: 'Save',
                accelerator: 'CmdOrCtrl+S',
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.send('menu-save');
                }
            },
            {
                label: 'Save As',
                accelerator: 'CmdOrCtrl+Shift+S',
                click: () => {
                    BrowserWindow.getFocusedWindow().webContents.send('menu-save-as');
                }
            },
            {
                type: 'separator',
            },
            {
                label: 'Quit',
                accelerator: 'CmdOrCtrl+Q',
                click: () => {
                    app.quit();
                }
            }
        ]
    }
];

const menu = Menu.buildFromTemplate(menuTemplate);
Menu.setApplicationMenu(menu);

// System tray ===================================

let tray = null;

app.whenReady().then(() => {
    createWindow();
    // create tray icon 
    tray = new Tray(path.join(__dirname, 'img', 'tray.png'));

    tray.on('click', () => {
        console.log('Tray icon clicked');
    });

    // Tray context menu 
    const trayMenu = Menu.buildFromTemplate([
        {
            label: 'Show App',
            click: () => {
                BrowserWindow.getAllWindows()[0].show();
            }
        },
        {
            label: 'Quit',
            click: () => {
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Quick Note Taker');
    tray.setContextMenu(trayMenu);


// Double -click tray icon to show window 
    tray.on('double-click', () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win.isVisible()){
            win.hide();
        }else{
            win.show();
        }
    });
});


// SAVE IT IN JSON FILE 

// Read all Notes from Json File 
function readNotes(){
    if(!fs.existsSync(notesFilePath)){
        return [];  // If file doesn't exist, return empty array
    }
    const raw = fs.readFileSync(notesFilePath, 'utf-8');
    return JSON.parse(raw);
}

// Writes all notes to Json file
function writeNotes(notes){
    fs.writeFileSync(
        notesFilePath,
        JSON.stringify(notes, null, 2),
        'utf-8'
    );
}


// Get all notes handler
ipcMain.handle('get-notes', async () => {
    return readNotes();
})


// Save a note (Update or Create) handler
ipcMain.handle('save-note-json', async (event, note) => {
    const notes = readNotes();
    const index = notes.findIndex(n => n.id === note.id);
    const now = new Date().toISOString();
    
    if (index === -1){
        notes.push({
            ...note,
            createdAt: now,
            updatedAt: now
        });  // note doesnot exist yet - create it
    }else{
        notes[index] = {
            ...notes[index],
            ...note,
            updatedAt: now
        }; // note exists - update it
    }

    writeNotes(notes);
    return{success: true};
});

// Delete all notes handler
ipcMain.handle('delete-notes', async (event, id) => {
    const notes = readNotes();
    const filtered = notes.filter(n => n.id !== id);
    writeNotes(filtered);
    return { success: true };
})



