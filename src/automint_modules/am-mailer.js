/**
 * Module to send emails
 * @author ndkcha
 * @since 0.4.1
 * @version 0.5.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    //  import required modules
    const BrowserWindow = require('electron').remote.BrowserWindow;
    var google = require('googleapis');
    var gAuth = require('./oAuth/google-auth.js');
    var ipc = require('electron').remote.ipcMain;

    //  named assignments
    var mailHtml;

    //  export functions as single module
    module.exports = {
        send: send
    }

    //  function definitions

    function send(mailHtml, user, workshopname, emailsubject) {
        gAuth.authenticate(sendEmail, false, {
            message: mailHtml,
            user: user,
            workshopname: workshopname,
            emailsubject: emailsubject
        });
    }

    function sendEmail(auth, options) {
        var gmail = google.gmail('v1');
        var premailer = require('premailer-api');
        var base64url = require('base64url');
        var email_lines = [];

        var emailTemplate = options.message;

        premailer.prepare({
            html: emailTemplate
        }, function(err, email) {
            if (err) {
                console.log(err);
                return;
            }
            
            email_lines.push("To: \"" + options.user.name + "\" <" + options.user.email + ">");
            email_lines.push('Content-type: text/html;charset=iso-8859-1');
            email_lines.push('MIME-Version: 1.0');
            email_lines.push("Subject: " + ((options.emailsubject != undefined && options.emailsubject != '') ? options.emailsubject : ((options.workshopname != undefined && options.workshopname != '') ? options.workshopname + ' Invoice' : 'Invoice')));
            email_lines.push("");
            email_lines.push(email.html);

            var email = email_lines.join("\r\n").trim();

            var base64EncodedEmail = base64url(email);

            gmail.users.messages.send({
                auth: auth,
                userId: 'me',
                resource: {
                    raw: base64EncodedEmail
                }
            }, function(err, res) {
                if (err) {
                    if (err.toString().match(/invalid_request/g)) {
                        gAuth.authenticate(sendEmail, true, {
                            message: options.message,
                            user: options.user,
                            workshopname: options.workshopname,
                            emailsubject: options.emailsubject
                        });
                    } else
                        BrowserWindow.getFocusedWindow().webContents.send('am-invoice-mail-sent', false);
                    return;
                }
                BrowserWindow.getFocusedWindow().webContents.send('am-invoice-mail-sent', true);
            });
        });
    }
})();