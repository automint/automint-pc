/**
 * Entrance file for Atom Electron App
 * @author ndkcha
 * @since 0.1.0
 * @version 0.7.0
 */

'use strict';

(function() {
    const electron = require('electron');
    // Module to control application life.
    const app = electron.app;
    const dialog = electron.dialog;
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
    // Module to check preferences
    const ammPreferences = require('./automint_modules/am-preferences.js');
    const fs = require('fs');
    // Keep track of path whether it exists
    var isUserDataPathExists = true;

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

    // setUserDataPath();
    var amUserDataPath = ammPreferences.getUserData();
    if ((typeof amUserDataPath) == "string") {
        try {
            fs.accessSync(amUserDataPath);
            app.setPath('userData', amUserDataPath);
            isUserDataPathExists = true;
        } catch(e) {
            isUserDataPathExists = false;
        }
    }


    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    app.on('ready', OnAppReady);

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

    ipcMain.on('am-quit-update', updateAndRestartApp);

    ipcMain.on('am-do-restart', restartApp);

    function restartApp(event, args) {
        app.relaunch({args: process.argv.slice(1).concat('--relaunch')});
        app.quit();
    }

    function updateAndRestartApp(event, args) {
        autoUpdater.quitAndInstall();
    }

    function OnAutomintUpdated(event, releaseNotes, releaseName, releaseDate, updateURL) {
        if (mainWindow && mainWindow.webContents)
            mainWindow.webContents.send('automint-updated', true);
    }

    function OnAppReady() {
        if (isUserDataPathExists)
            createWindow();
        else {
            var msgbox = dialog.showMessageBox({
                type: 'info',
                message: 'Select Path of User Data',
                buttons: ['OK'],
                defaultId: 0,
                icon: undefined
            }, openCorrectFileUrl);
        }

        function openCorrectFileUrl() {
            var newPath = dialog.showOpenDialog({properties: ['openDirectory']});
            if (newPath) {
                ammPreferences.storePreference('automint.userDataPath', newPath[0]);
                restartApp();
            } else
                app.exit(0);
        }
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

        // mainWindow.webContents.openDevTools();

        fs.watchFile(app.getPath('userData'), (curr, prev) => {
            if (curr.ino == 0) {
                fs.unwatchFile(app.getPath('userData'));
                restartApp();
            }
        });

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