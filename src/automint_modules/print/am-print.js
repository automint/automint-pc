/**
 * Print document
 * @author ndkcha
 * @since 0.5.0
 * @version 0.5.0
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    var ammSaveHtml = require('./am-save-html.js');
    const remote = require('electron').remote;
    const BrowserWindow = remote.BrowserWindow;

    module.exports = {
        doPrint: doPrint
    }

    function doPrint(previewHtml) {
        var path = ammSaveHtml.generatePreviewFile(previewHtml);
        openPrintWindow(path);
    }

    function openPrintWindow(path) {
        var win = new BrowserWindow({
            width: 800,
            height: 600
        });
        win.loadURL('file://' + path);
        setTimeout(performPrint, 600);
        
        function performPrint() {
            win.webContents.print();
        }
    }
})();