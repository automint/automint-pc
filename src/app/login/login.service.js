/**
 * Angular Service for Login and Licensing Mechanism
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.0
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').service('$amLicense', LicenseService);

    LicenseService.$inject = ['$rootScope', '$q', '$http', 'utils', 'amLogin', 'pdbLocal', 'constants', 'amFactory'];

    function LicenseService($rootScope, $q, $http, utils, amLogin, pdbLocal, constants, amFactory) {
        //  initialize view model for Service
        var vm = this;

        //  temporary assignments for instance
        //  no such assignments

        //  named assignments to view model
        //  no such assignments

        //  function mappings to view model
        vm.loadCredentials = loadCredentials;
        vm.checkLogin = checkLogin;
        vm.login = login;
        vm.changePassword = changePassword;

        //  function definitions

        function changePassword(username, newPassword) {
            var tracker = $q.defer();
            if (($rootScope.amGlobals == undefined) || ($rootScope.amGlobals.channel == undefined) || ($rootScope.amGlobals.channel == '')) {
                failure({
                    mint_error: 401
                });
                return;
            }
            var adminChannels = [];
            adminChannels.push($rootScope.amGlobals.channel);
            $http({
                method: 'PUT',
                url: amFactory.generateChangePwdUrl($rootScope.amGlobals.credentials.username),
                headers: {
                    'Content-Type': 'application/json'
                },
                data: {
                    admin_channels: adminChannels,
                    password: newPassword
                },
                timeout: 2000
            }).then(success).catch(failure);
            return tracker.promise;

            function success(res) {
                $rootScope.amGlobals.credentials.password = newPassword;
                amLogin.savePassword(newPassword).then(proceed).catch(doLogin);
            }

            function proceed(pres) {
                tracker.resolve(pres);
            }

            function doLogin(err) {
                amLogin.setLoginState(false).then(dl1).catch(dl1);

                function dl1(dl1res) {
                    failure({
                        mint_error: 400
                    });
                }
            }

            function failure(err) {
                var errorCode = -1;
                var errorMessage = 'Please check your internet connectivity';
                if (err.mint_error) {
                    switch (err.mint_error) {
                        case 400:
                            vm.errorCode = 1;
                            vm.errorMessage = 'Cloud not save password! Please login again with new password!';
                            break;
                        case 401:
                            vm.errorCode = 1;
                            vm.errorMessage = 'Automint could not collect license details. Please login again!';
                            break;
                    }
                }

                tracker.reject({
                    error_code: errorCode,
                    error_message: errorMessage
                });
            }
        }

        function loadCredentials(username, password) {
            if (!$rootScope.amGlobals)
                $rootScope.amGlobals = {};
            $rootScope.amGlobals.credentials = {
                username: username,
                password: password
            }
        }

        function login(isCodeUsed, code) {
            var today = moment().format(), isLoggedIn = false, channel, isSyncableDb = false;
            var tracker = $q.defer();
            if (isCodeUsed)
                $http.get(amFactory.generateActivationUrl(code)).then(activate, failure);
            else {
                $http({
                    method: 'POST',
                    url: amFactory.generateAuthUrl(),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: $.param({
                        name: $rootScope.amGlobals.credentials.username,
                        password: $rootScope.amGlobals.credentials.password
                    }),
                    timeout: 2000
                }).then(success, failure);
            }
            return tracker.promise;

            function activate(res) {
                if (res.data == undefined) {
                    failure();
                    return;
                }
                if (res.data.used) {
                    tracker.reject('The code is already in use! You cannot use it again!');
                    return;
                }
                var startdate = moment(res.data.starts, 'YYYY-MM-DD').format();
                var enddate = moment(res.data.ends, 'YYYY-MM-DD').format();
                if ((res.data.ends == 0) || (res.data.ends == '0'))
                    isLoggedIn = true;
                if ((startdate.localeCompare(today) < 0) && (enddate.localeCompare(today) > 0))
                    isLoggedIn = true;
                if ((res.data.code != undefined) && (res.data.code == 13))
                    processMintCode(-404);
                amLogin.saveActivationDetails(vm.code, res.data.starts, res.data.ends).then(proceed).catch(failure);
            }

            function success(res) {
                if (res.data && res.data.mint_code) {
                    switch (res.data.mint_code) {
                        case "AU100":
                            processLicense(res.data.userCtx, res.data.license);
                            break;
                        case "AU200":
                            processMintCode(200);
                            break;
                        case "AU321":
                        case "AU322":
                            processMintCode(300);
                            break;
                        case "AU330":
                            processMintCode(330);
                            break;
                    }
                } else
                    failure();

                function processLicense(userData, licenseData) {
                    if (userData && (userData.name != null) && userData.channels && (Object.keys(userData.channels).length > 1))
                        channel = Object.keys(userData.channels)[1];
                    checkLicense();
                    
                    function checkLicense() {
                        if (licenseData) {
                            var licensestartdate = moment(licenseData.license.starts, 'YYYY-MM-DD').format(), licenseenddate;
                            if ((licenseData.license.ends == '0') || (licenseData.license.ends == 0))
                                isLoggedIn = true;
                            else {
                                licenseenddate = moment(licenseData.license.ends, 'YYYY-MM-DD').format();
                                if ((licensestartdate.localeCompare(today) < 0) && (licenseenddate.localeCompare(today) > 0))
                                    isLoggedIn = true;
                            }
                            amLogin.saveLicense($rootScope.amGlobals.credentials.username, $rootScope.amGlobals.credentials.password, channel, licenseData.license, licenseData.cloud).then(proceed).catch(failure);
                        } else
                            processMintCode(330);
                    }
                }
            }

            function proceed(res) {
                if (!isLoggedIn) {
                    processMintCode(-1);
                    return;
                }
                $rootScope.amGlobals.configDocIds = {
                    settings: 'settings' + (channel ? '-' + channel : ''),
                    treatment: 'treatment' + (channel ? '-' + channel : ''),
                    inventory: 'inventory' + (channel ? '-' + channel : ''),
                    workshop: 'workshop' + (channel ? '-' + channel : '')
                };

                var isDbToBeChanged = (($rootScope.amGlobals != undefined) && ($rootScope.amGlobals.creator != '') && ($rootScope.amGlobals.channel != ''));

                if (isDbToBeChanged)
                    amLogin.changeExistingDocs().then(finalize).catch(finalize);
                else
                    finalize();

                function finalize(fres) {
                    isSyncableDb = (($rootScope.amGlobals != undefined) && ($rootScope.amGlobals.credentials != undefined) && ($rootScope.amGlobals.credentials.username != undefined) && ($rootScope.amGlobals.credentials.username != '') && ($rootScope.amGlobals.credentials.password != undefined) && ($rootScope.amGlobals.credentials.password != ''));
                    if (($rootScope.amGlobals == undefined) || ($rootScope.amGlobals.validity == undefined) || ($rootScope.amGlobals.validity.cloud == undefined) || !isSyncableDb)
                        isSyncableDb = false;
                    else {
                        var cloudstartdate = moment($rootScope.amGlobals.validity.cloud.starts, 'YYYY-MM-DD').format();
                        var cloudenddate = moment($rootScope.amGlobals.validity.cloud.ends, 'YYYY-MM-DD').format();
                        isSyncableDb = ((cloudstartdate.localeCompare(today) < 0) && (cloudenddate.localeCompare(today) > 0));
                        if (($rootScope.amGlobals.validity.cloud.ends == 0) || ($rootScope.amGlobals.validity.cloud.ends == '0'))
                            isSyncableDb = true;
                        if (!isSyncableDb)
                            utils.showSimpleToast('Your cloud services have expired! Please contact Automint Care!');
                    }
                    amLogin.setLoginState(isLoggedIn).then(finallyrespond).catch(finallyrespond);

                    function finallyrespond(idk) {
                        tracker.resolve({
                            isLoggedIn: isLoggedIn,
                            isSyncableDb: isSyncableDb
                        });
                    }
                }
            }

            function processMintCode(code) {
                var message;
                switch (code) {
                    case -1:
                        message = 'Your license has expired!';
                        break;
                    case 200:
                        message = 'Incorrect Username or Password';
                        break;
                    case 300:
                        message = 'There seems to be problem at Server! Please try again or contact Automint Care!';
                        break;
                    case 330:
                        message = 'No Licensing Details Found for ' + $rootScope.amGlobals.credentials.username + '! Please Try Again or Contact Automint Care!';
                        break;
                    case -404:
                        message = 'Invalid Activation Code!';
                        break;
                }
                tracker.reject(message);
            }

            function failure(err) {
                if (err)
                    console.error(err);
                tracker.reject('Please check your internet connectivity!');
            }
        } 

        function checkLogin() {
            var tracker = $q.defer();
            var today = moment().format(), isLoggedIn = false, isCloudEnabled = false, type, isCloudForceEnabled;
            pdbLocal.get(constants.pdb_local_docs.login).then(checkFlags).catch(failure);
            return tracker.promise;

            function checkFlags(res) {
                if (!res.isLoggedIn) {
                    failure({
                        mintSkipSave: true
                    });
                }
                if (res.isCloudForceEnabled)
                    isCloudForceEnabled = res.isCloudForceEnabled;
                if (res.username && res.password) {
                    loadCredentials(res.username, res.password);
                    if (res.license) {
                        var licensestartdate = moment(res.license.starts, 'YYYY-MM-DD').format();
                        var licenseenddate = moment(res.license.ends, 'YYYY-MM-DD').format();
                        if ((res.license.ends == 0) || (res.license.ends == '0'))
                            isLoggedIn = true;
                        if ((licensestartdate.localeCompare(today) < 0) && (licenseenddate.localeCompare(today) > 0))
                            isLoggedIn = true;
                    }
                    if (isLoggedIn && res.cloud) {
                        var cloudstartdate = moment(res.cloud.starts, 'YYYY-MM-DD').format();
                        var cloudenddate = moment(res.cloud.ends, 'YYYY-MM-DD').format();
                        if ((res.cloud.ends == 0) || (res.cloud.ends == '0'))
                            isCloudEnabled = true;
                        if ((cloudstartdate.localeCompare(today) < 0) && (cloudenddate.localeCompare(today) > 0))
                            isCloudEnabled = true;
                    }
                    if (isLoggedIn) {
                        type = "license";
                        loadCredentials(res.username, res.password);
                        if (res.isLoggedIn != isLoggedIn)
                            amLogin.setLoginState(isLoggedIn).then(respond).catch(failure);
                        else
                            respond();
                        return;
                    }
                }
                if (res.activation) {
                    if ((res.activation.startdate != undefined) && (res.activation.enddate != undefined)) {
                        var activationstartdate = moment(res.activation.startdate, 'YYYY-MM-DD').format();
                        var activationenddate = moment(res.activation.enddate, 'YYYY-MM-DD').format();
                        if ((res.activation.enddate == 0) || (res.activation.enddate == '0'))
                            isLoggedIn = true;
                        if ((activationstartdate.localeCompare(today) < 0) && (activationenddate.localeCompare(today) > 0))
                            isLoggedIn = true;
                        if (isLoggedIn) {
                            type = "activation";
                            if (res.isLoggedIn != isLoggedIn)
                                amLogin.setLoginState(isLoggedIn).then(respond).catch(failure);
                            else
                                respond();
                            return;
                        }
                    }
                }
                failure();

                function respond(saveresponse) {
                    $rootScope.amGlobals.creator = (res.username ? res.username : '');
                    $rootScope.amGlobals.channel = (res.channel ? res.channel : '');
                    $rootScope.amGlobals.configDocIds = {
                        settings: 'settings' + (res.channel ? '-' + res.channel : ''),
                        treatment: 'treatments' + (res.channel ? '-' + res.channel : ''),
                        inventory: 'inventory' + (res.channel ? '-' + res.channel : ''),
                        workshop: 'workshop' + (res.channel ? '-' + res.channel : '')
                    }
                    var obj = {
                        isCloudForceEnabled: isCloudForceEnabled,
                        isLoggedIn: isLoggedIn,
                        isCloudEnabled: isCloudEnabled,
                        type: type,
                    }
                    switch (type) {
                        case "license":
                            obj.credentials = {
                                username: res.username,
                                password: res.password
                            };
                            if (isCloudEnabled)
                                obj.cloudenddate = moment(res.cloud.ends, 'YYYY-MM-DD').format();
                            break;
                        case "activation":
                            obj.enddate = res.activation.enddate;
                            break;
                    }
                    tracker.resolve(obj);
                }
            }

            function failure(err) {
                if (err.mintSkipSave)
                    ro();
                else
                    amLogin.setLoginState(false).then(ro).catch(ro);
                
                function ro(rores) {
                    tracker.reject(err);
                }
            }
        }
    }
})();