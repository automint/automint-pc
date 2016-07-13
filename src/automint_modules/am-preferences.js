/**
 * Module for storing local usage preferences
 * @author ndkcha
 * @since 0.6.4
 * @version 0.6.4
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    //  imported modules
    var fs = require('fs');
    var Promise = require('promise');

    //  named assignments
    var PREF_DIR = __dirname + "/../../app.asar.unpacked/";
    var PREF_FILE = PREF_DIR + 'automint-preferences.json';
    var e404 = {
        success: false,
        status: 404,
        message: 'Preference not found!'
    }

    //  export as module
    module.exports = {
        storePreference: storePreference,
        getPreference: getPreference,
        getAllPreferences: getAllPreferences
    }

    //  function definitions

    function storePreference(key, value) {
        fs.readFile(PREF_FILE, changePreferences);

        function changePreferences(err, content) {
            var prefJson = (content == undefined) ? {} : JSON.parse(content);
            prefJson[key] = value;
            try {
                fs.mkdirSync(PREF_DIR);
            } catch(err) {
                if (err.code != 'EEXIST')
                    throw err;
            }
            fs.writeFile(PREF_FILE, JSON.stringify(prefJson));
        }    
    }

    function getPreference(key) {
        return (new Promise(readPromise));

        function readPromise(fulfill, reject) {
            fs.readFile(PREF_FILE, readPreferences);

            function readPreferences(err, content) {
                var prefJson = (content == undefined) ? {} : JSON.parse(content);
                if (prefJson[key])
                    fulfill(prefJson[key]);
                else
                    reject(e404);
            }
        }
    }

    function getAllPreferences(key) {
        return (new Promise(readPromise));

        function readPromise(fulfill, reject) {
            fs.readFile(PREF_FILE, readPreferences);

            function readPreferences(err, content) {
                var prefJson = (content == undefined) ? {} : JSON.parse(content);
                var z = Object.keys(prefJson).filter(filterFunc).reduce(reduceFunc, {});

                if (Object.keys(z).length === 0)
                    reject(e404);
                else
                    fulfill(z);

                function filterFunc(k) {
                    return (k.indexOf(key) == 0);
                }

                function reduceFunc(newData, k) {
                    newData[k] = prefJson[k];
                    return newData;
                }
            }
        }
    }
})();