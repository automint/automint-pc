/**
 * Save as HTML file before opening print preview
 * @author ndkcha
 * @since 0.5.0
 * @version 0.5.0
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    //  import dependencies
    var fs = require('fs');
    
    //  constants used for the module (but not exported)
    var PREVIEW_DIR = __dirname + "/../../../app.asar.unpacked/";
    var PREVIEW_PATH = PREVIEW_DIR + "print-preview.html";
    
    //  export relevant function as indevidual module
    module.exports = {
        generatePreviewFile: generatePreviewFile
    }
    
    //  functino definitions
    
    //  write to file
    function saveToFile(privewHtml) {
        try {
            fs.mkdirSync(PREVIEW_DIR);
        } catch(err) {
            if (err.code != 'EEXIST')
                throw err;
        }
        fs.writeFile(PREVIEW_PATH, privewHtml);
    }
    
    //  call saveToFile and return path of the preview file (to be printed)
    function generatePreviewFile(previewHtml) {
        saveToFile(previewHtml);
        return PREVIEW_PATH;
    }
})();