/**
 * Factories for Login Mechanism
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.0
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amLogin', LoginFactory).factory('amLoginBase64', LoginBase64Factory);

    LoginBase64Factory.$inject = [];
    LoginFactory.$inject = ['$rootScope', '$http', '$q', 'amLoginBase64', 'amFactory', 'constants', 'pdbLocal', 'pdbMain'];

    /*
        === NOTE ===
        Do not include $amRoot as dependency as this module is used in it. 
    */

    function LoginFactory($rootScope, $http, $q, amLoginBase64, amFactory, constants, pdbLocal, pdbMain) {
        //  initialize factory and functino mappings
        var factory = {
            loadCredentials: loadCredentials,
            login: login,
            saveLoginCredentials: saveLoginCredentials
        }

        return factory;

        //  function definitions

        function loadCredentials(username, password) {
            if (!$rootScope.amGlobals)
                $rootScope.amGlobals = {};
            $rootScope.amGlobals.authHeaderData = amLoginBase64.encode(username + ':' + password);
        }

        function login(success, failure) {
            $http.defaults.headers.common['Authorization'] = 'Basic ' + $rootScope.amGlobals.authHeaderData;
            $http.get(amFactory.generateAuthUrl(constants.sgw_w_main)).then(success, failure);
        }

        function saveLoginCredentials(isLoggedIn, username, password, channel) {
            var tracker = $q.defer();
            if ($rootScope.amGlobals == undefined)
                $rootScope.amGlobals = {};
            $rootScope.amGlobals.creator = username;
            $rootScope.amGlobals.channel = channel;
            pdbLocal.get(constants.pdb_local_docs.login).then(getLoginDoc).catch(writeLoginDoc);
            return tracker.promise;

            function getLoginDoc(res) {
                res.isLoggedIn = isLoggedIn;
                res.username = username;
                res.password = password;
                res.channel = channel;
                pdbLocal.save(res).then(success).catch(failure);
            }

            function writeLoginDoc(err) {
                var doc = {
                    _id: constants.pdb_local_docs.login,
                    isLoggedIn: isLoggedIn,
                    username : username,
                    password: password,
                    channel: channel
                }
                pdbLocal.save(doc).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function changeExistingDocs() {
            var tracker = $q.defer()
            if (!$rootScope.amGlobals || ($rootScope.amGlobals && !$rootScope.amGlobals.creator) || ($rootScope.amGlobals && $rootScope.amGlobals.channel))
                return 404;
            pdbMain.getAll().then(getAllDocs).catch(failure);
            return tracker.promise;

            function getAllDocs(res) {
                var docsToSave = [];
                res.rows.forEach(iterateRows);

                function iterateRows(row) {
                    switch (row.id) {
                        case 'settings':
                            convertSettingsDoc(row);
                            break;
                        default:
                            convertUserDoc(row);
                            break;
                    }

                    function convertUserDoc(row) {
                        console.log(row);
                    }
                }
            }

            function failure(err) {
                console.error(err);
            }
        }
    }

    function LoginBase64Factory() {
        //  named assignments
        var keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

        //  factory object and function mappings
        var factory = {
            encode: encode,
            decode: decode
        }

        return factory;

        //  function definitions

        function encode(input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            do {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output +
                        keyStr.charAt(enc1) +
                        keyStr.charAt(enc2) +
                        keyStr.charAt(enc3) +
                        keyStr.charAt(enc4);
                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";
            } while (i < input.length);

            return output;
        }

        function decode(input) {
            var output = "";
            var chr1, chr2, chr3 = "";
            var enc1, enc2, enc3, enc4 = "";
            var i = 0;

            // remove all characters that are not A-Z, a-z, 0-9, +, /, or =
            var base64test = /[^A-Za-z0-9\+\/\=]/g;
            if (base64test.exec(input)) {
                alert("There were invalid base64 characters in the input text.\n" +
                        "Valid base64 characters are A-Z, a-z, 0-9, '+', '/',and '='\n" +
                        "Expect errors in decoding.");
            }
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            do {
                enc1 = keyStr.indexOf(input.charAt(i++));
                enc2 = keyStr.indexOf(input.charAt(i++));
                enc3 = keyStr.indexOf(input.charAt(i++));
                enc4 = keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

                chr1 = chr2 = chr3 = "";
                enc1 = enc2 = enc3 = enc4 = "";

            } while (i < input.length);

            return output;
        }
    }
})();