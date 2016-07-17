/**
 * Entrance file for Atom Electron App
 * @author ndkcha
 * @since 0.1.0
 * @version 0.6.4 by @vrlkacha
 */

'use strict';

(function() {
    const electron = require('electron');
    // Module to control application life.
    const app = electron.app;
    // Module to create native browser window.
    const BrowserWindow = electron.BrowserWindow;
    // Module for IPC
    const ipcMain = electron.ipcMain;
    // Importing Eelctron Squirrel Startup 
    if(require('electron-squirrel-startup')) return;
    // Module to Auto Update app
    var autoUpdater = electron.autoUpdater;  
    var os = require('os');  
    // var feedURL = 'http://updates.automint.in/releases/' + (os.platform()) + '/' + (os.arch());
    var feedURL = 'http://updates.automint.in/releases/win32/ia32';

    autoUpdater.addListener("error", function(error) {});

    autoUpdater.addListener("update-downloaded", OnAutomintUpdated);

    autoUpdater.setFeedURL(feedURL);
    if (process.argv[1] == '--squirrel-firstrun') {
        setTimeout(()=> {
            autoUpdater.checkForUpdates();
        }, 180000)
    } else {
        autoUpdater.checkForUpdates();
    }

    // Keep a global reference of the window object, if you don't, the window will
    // be closed automatically when the JavaScript object is garbage collected.
    let mainWindow;

    var shouldQuit = app.makeSingleInstance(msiCallback);

    if (shouldQuit) {
        app.quit();
        return;
    }

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    app.on('ready', createWindow);

    // Quit when all windows are closed.
    app.on('window-all-closed', function() {
        // On OS X it is common for applications and their menu bar
        // to stay active until the user quits explicitly with Cmd + Q
        if (process.platform !== 'darwin') {
            app.quit();
        }
    });

    app.on('activate', function() {
        // On OS X it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (mainWindow === null) {
            createWindow();
        }
    });

    function OnAutomintUpdated(event, releaseNotes, releaseName, releaseDate, updateURL) {
        mainWindow.webContents.send('automint-updated', true);
    }

    function createWindow() {
        // Create the browser window.
        mainWindow = new BrowserWindow({
            width: 800,
            height: 600
        });
        mainWindow.maximize();
        // and load the index.html of the app.

        mainWindow.loadURL('file://' + __dirname + '/index.html');

        // Emitted when the window is closed.
        mainWindow.on('closed', function() {
            // Dereference the window object, usually you would store windows
            // in an array if your app supports multi windows, this is the time
            // when you should delete the corresponding element.
            mainWindow = null;
        });
    }

    // Someone tried to run a second instance, we should focus our window.
    function msiCallback(commandLine, workingDirectory) {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    }
})();