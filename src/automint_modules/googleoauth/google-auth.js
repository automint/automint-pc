/**
 * Module to authenticate user to Google Server
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    //  import required modules
    var fs = require('fs');
    var google = require('googleapis');
    var googleAuth = require('google-auth-library');
    var electron = require('electron');
    
    //  initialize electron modules
    var remote = electron.remote;
    var BrowserWindow = remote.BrowserWindow;
    
    //  initialize essential params for Google && Gmail API
    var SCOPE = ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'];
    var TOKEN_DIR = __dirname + "/../../../app.asar.unpacked/";
    var TOKEN_PATH = TOKEN_DIR + 'google-cred.json';
    
    //  declare callback function and boolean for requesting new token
    var cbFn, requestNewToken, cbArgs;
    
    //  export functions as single module
    module.exports = {
        authenticate: authenticate
    }
    
    //  authenticate to Google Server using Client Secret Provided from Google Developer Console
    function authenticate(callback, requestNToken, callbackArgs) {
        cbFn = callback;
        cbArgs = callbackArgs;
        requestNewToken = requestNToken;
        fs.readFile(__dirname + '/google_client_secret.json', processClientSecrets);
    }
    
    //  process file containing client secrets and extract its contents for authorization
    function processClientSecrets(err, content) {
        if (err) {
            console.error('Error loading content: ' + err);
            return;
        }
        authorize(JSON.parse(content), cbFn);
    }
    
    //  authorize using credentials provided in client secret files and execute callback function on success
    function authorize(credentials, callback) {
        var auth = new googleAuth();
        var oAuth2Client = new auth.OAuth2(credentials.web.client_id, credentials.web.client_secret, credentials.web.redirect_uris[0]);
        fs.readFile(TOKEN_PATH, readCredentails);
        
        //  validate existing credentials present in local storage
        function readCredentails(err, token) {
            if (err || requestNewToken) {
                getNewToken(oAuth2Client, callback);
            } else {
                oAuth2Client.credentials = JSON.parse(token);
                callback(oAuth2Client, cbArgs);
            }
        }
    }
    
    //  get new token from Google Server, ask for user permissions when neccessary
    function getNewToken(oAuth2Client, callback) {
        var authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPE
        });
        
        //  create new browser window and display it to allow user to authorize automint app
        var authWindow = new BrowserWindow({
            width: 800,
            height: 600,
            show: true,
            'webPreferences': {
                'nodeIntegration': false
            }
        });
        
        authWindow.loadURL(authUrl);
        
        authWindow.webContents.on('did-get-redirect-request', function (event, oldUrl, newUrl) {
            handleAuthCallback(newUrl);
        })
        
        //  fetch authorization code from redirected url
        function handleAuthCallback(url) {
            var raw_code = /code=([^&]*)/.exec(url) || null;
            var code = (raw_code && raw_code.length > 1) ? raw_code[1] : null;
            var error = /\?error=(.+)$/.exec(url);

            if (code || error) {
                // Close the browser if code found or error
                authWindow.destroy();
                handleAnswer(code);
            }
            
        }
        
        //  store new token and proceed further after code is validated 
        function handleAnswer(code) {
            oAuth2Client.getToken(code, handleToken);
            
            function handleToken(err, token) {
                if (err) {
                    console.error('Error while trying to retrieve access token', err);
                    return;
                }
                oAuth2Client.credentials = token;
                storeToken(token);
                callback(oAuth2Client, cbArgs);
            }
        }
    }
    
    //  store token in local storage
    function storeToken(token) {
        try {
            fs.mkdirSync(TOKEN_DIR);
        } catch(err) {
            if (err.code != 'EEXIST')
                throw err;
        }
        fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    }
})();