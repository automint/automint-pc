/**
 * Factories for Login Mechanism
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.3
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amLogin', LoginFactory).factory('amLoginBase64', LoginBase64Factory);

    LoginBase64Factory.$inject = [];
    LoginFactory.$inject = ['$rootScope', '$http', '$q', 'utils', 'amLoginBase64', 'amFactory', 'constants', 'pdbLocal', 'pdbMain'];

    /*
        === NOTE ===
        Do not include $amRoot as dependency as this module is used in it. 
    */

    function LoginFactory($rootScope, $http, $q, utils, amLoginBase64, amFactory, constants, pdbLocal, pdbMain) {
        //  initialize factory and functino mappings
        var factory = {
            saveLicense: saveLicense,
            changeExistingDocs: changeExistingDocs,
            saveActivationDetails: saveActivationDetails,
            setLoginState: setLoginState,
            savePassword: savePassword,
            cloudForceEnabled: cloudForceEnabled,
            saveFranchiseNames: saveFranchiseNames
        }

        return factory;

        //  function definitions

        function saveFranchiseNames(channels) {
            var tracker = $q.defer();
            pdbLocal.get(constants.pdb_local_docs.login).then(getLoginDoc).catch(failure);
            return tracker.promise;

            function getLoginDoc(res) {
                if (res.localchannelmaps == undefined)
                    res.localchannelmaps = {};
                channels.forEach(iterateChannels);
                pdbLocal.save(res).then(success).catch(failure);

                function iterateChannels(channel) {
                    if (res.localchannelmaps[channel] == undefined)
                        res.localchannelmaps[channel] = utils.convertToTitleCase(channel.replace('.', ' '))
                }
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function cloudForceEnabled(force) {
            var tracker = $q.defer();
            pdbLocal.get(constants.pdb_local_docs.login).then(getLoginDoc).catch(failure);
            return tracker.promise;

            function getLoginDoc(res) {
                res.isCloudForceEnabled = force;
                pdbLocal.save(res).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function savePassword(password) {
            var tracker = $q.defer();
            pdbLocal.get(constants.pdb_local_docs.login).then(getLoginDoc).catch(failure);
            return tracker.promise;

            function getLoginDoc(res) {
                res.password = password;
                pdbLocal.save(res).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function saveActivationDetails(code, startdate, enddate) {
            var tracker = $q.defer();
            pdbLocal.get(constants.pdb_local_docs.login).then(getLoginDoc).catch(writeLoginDoc);
            return tracker.promise;

            function getLoginDoc(res) {
                res.activation = {
                    code: code,
                    startdate: startdate,
                    enddate: enddate
                }
                pdbLocal.save(res).then(success).catch(failure);
            }

            function writeLoginDoc(err) {
                var doc = {
                    _id: constants.pdb_local_docs.login,
                    activation: {
                        code: code,
                        startdate: startdate,
                        enddate: enddate
                    }
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

        function setLoginState(isLoggedIn) {
            var tracker = $q.defer();
            pdbLocal.get(constants.pdb_local_docs.login).then(getLoginDoc).catch(writeLoginDoc);
            return tracker.promise;

            function getLoginDoc(res) {
                res.isLoggedIn = isLoggedIn;
                pdbLocal.save(res).then(success).catch(failure);
            }

            function writeLoginDoc(err) {
                var doc = {
                    _id: constants.pdb_local_docs.login,
                    isLoggedIn: isLoggedIn
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

        function saveLicense(username, password, channel, license, cloud) {
            var tracker = $q.defer();
            if ($rootScope.amGlobals == undefined)
                $rootScope.amGlobals = {};
            $rootScope.amGlobals.creator = username;
            var currentchannel = angular.isArray(channel) ? channel[0] : channel;
            $rootScope.amGlobals.channel = currentchannel;
            if ($rootScope.amGlobals.validity == undefined)
                $rootScope.amGlobals.validity = {};
            $rootScope.amGlobals.validity.license = license;
            $rootScope.amGlobals.validity.cloud = cloud;
            pdbLocal.get(constants.pdb_local_docs.login).then(getLoginDoc).catch(writeLoginDoc);
            return tracker.promise;

            function getLoginDoc(res) {
                res.username = username;
                res.password = password;
                res.channel = channel;
                res.license = license;
                res.cloud = cloud;
                pdbLocal.save(res).then(success).catch(failure);
            }

            function writeLoginDoc(err) {
                var doc = {
                    _id: constants.pdb_local_docs.login,
                    username : username,
                    password: password,
                    channel: channel,
                    license: license,
                    cloud: cloud
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
            var tracker = $q.defer();
            if (!$rootScope.amGlobals || ($rootScope.amGlobals && !$rootScope.amGlobals.creator) || ($rootScope.amGlobals && !$rootScope.amGlobals.channel))
                return 404;
            pdbMain.getAll().then(getAllDocs).catch(failure);
            return tracker.promise;

            function getAllDocs(res) {
                var docsToSave = [];
                res.rows.forEach(iterateRows);
                pdbMain.saveAll(docsToSave).then(success).catch(failure);

                function iterateRows(row) {
                    switch (row.id) {
                        case 'settings':
                            convertSettingsDoc(row);
                            break;
                        case 'treatments':
                            convertTreatmentDoc(row);
                            break;
                        case 'workshop':
                            convertWorkshopDoc(row);
                            break;
                        case 'inventory':
                            convertInventoryDoc(row);
                            break;
                        default:
                            convertUserDoc(row);
                            break;
                    }

                    function convertUserDoc(row) {
                        row.doc.channel = $rootScope.amGlobals.channel;
                        row.doc.creator = $rootScope.amGlobals.creator;
                        docsToSave.push(row.doc);
                    }

                    function convertSettingsDoc(row) {
                        var sdoc = $.extend({}, row.doc);
                        row.doc._deleted = true;
                        delete sdoc._rev
                        sdoc._id = $rootScope.amGlobals.configDocIds.settings;
                        sdoc.creator = $rootScope.amGlobals.creator;
                        sdoc.channel = $rootScope.amGlobals.channel;
                        docsToSave.push(row.doc);
                        docsToSave.push(sdoc);
                    }

                    function convertTreatmentDoc(row) {
                        var tdoc = $.extend({}, row.doc);
                        row.doc._deleted = true;
                        delete tdoc._rev;
                        tdoc._id = $rootScope.amGlobals.configDocIds.treatment;
                        tdoc.creator = $rootScope.amGlobals.creator;
                        tdoc.channel = $rootScope.amGlobals.channel;
                        docsToSave.push(row.doc);
                        docsToSave.push(tdoc);
                    }

                    function convertWorkshopDoc(row) {
                        var wdoc = $.extend({}, row.doc);
                        row.doc._deleted = true;
                        delete wdoc._rev;
                        wdoc._id = $rootScope.amGlobals.configDocIds.workshop;
                        wdoc.creator = $rootScope.amGlobals.creator;
                        wdoc.channel = $rootScope.amGlobals.channel;
                        docsToSave.push(row.doc);
                        docsToSave.push(wdoc);
                    }

                    function convertInventoryDoc(row) {
                        var idoc = $.extend({}, row.doc);
                        row.doc._deleted = true;
                        delete idoc._rev;
                        idoc._id = $rootScope.amGlobals.configDocIds.inventory;
                        idoc.creator = $rootScope.amGlobals.creator;
                        idoc.channel = $rootScope.amGlobals.channel;
                        docsToSave.push(row.doc);
                        docsToSave.push(idoc);
                    }
                }
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                console.error(err);
                tracker.reject(err);
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