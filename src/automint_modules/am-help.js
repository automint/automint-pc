/**
 * Module to open help guide for Automint
 * @author ndkcha
 * @since 0.6.1
 * @version 0.6.1
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    //  import electron modules
    const BrowserWindow = require('electron').remote.BrowserWindow;

    //  export functions as single module
    module.exports = {
        openHelpWindow: openHelpWindow
    }

    //  function definitions

    function openHelpWindow() {
        var helpWindow = new BrowserWindow({
            width: 800,
            height: 600,
            show: true,
            'webPreferences': {
                'nodeIntegration': false
            }
        });
        helpWindow.maximize();
        helpWindow.loadURL('https://docs.google.com/document/d/1Xt5TjN6tfjFGWDdBZc0cZkwwoftyetihC-YGuzicots/edit');
    }
})();