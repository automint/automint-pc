/**
 * Angular Service for Login and Licensing Mechanism
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.3
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
                    url: amFactory.generateChangePwdUrl(),
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    data: $.param({
                        name: $rootScope.amGlobals.credentials.username,
                        oldpass: $rootScope.amGlobals.credentials.password,
                        newpass: newPassword
                    })
                }).then(success, failure);
            return tracker.promise;

            function success(res) {
                if (res.data && res.data.mint_code) {
                    if (res.data.mint_code == 'PA100') {
                        $rootScope.amGlobals.credentials.password = newPassword;
                        amLogin.savePassword(newPassword).then(proceed).catch(doLogin);
                        return;
                    }
                }
                failure({
                    mint_error: 300
                });
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
                        case 300:
                            vm.errorCode = -1;
                            vm.errorMessage = 'Could not change password. Please try again!';
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

        function login(isCodeUsed, code, ignoreCodeUsedError) {
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
                    })
                }).then(success, failure);
            }
            return tracker.promise;

            function activate(res) {
                if (res.data == undefined) {
                    failure();
                    return;
                }
                if ((ignoreCodeUsedError != true) &&  res.data.used) {
                    tracker.reject({
                        message: 'The code is already in use! You cannot use it again!'
                    });
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
                amLogin.saveActivationDetails(code, res.data.starts, res.data.ends).then(proceed).catch(failure);
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
                            if (Object.keys(userData.channels).length > 2) {
                                var franchannels = Object.keys(userData.channels);
                                franchannels.splice(0, 1);
                                $rootScope.amGlobals.isFranchise = true;
                                $rootScope.amGlobals.franchiseChannels = franchannels;
                                amLogin.saveLicense($rootScope.amGlobals.credentials.username, $rootScope.amGlobals.credentials.password, franchannels, licenseData.license, licenseData.cloud).then(proceed).catch(failure);
                            } else
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
                    treatment: 'treatments' + (channel ? '-' + channel : ''),
                    inventory: 'inventory' + (channel ? '-' + channel : ''),
                    workshop: 'workshop' + (channel ? '-' + channel : '')
                };

                var isDbToBeChanged = (($rootScope.amGlobals != undefined) && ($rootScope.amGlobals.creator != '') && ($rootScope.amGlobals.channel != ''));
                if ($rootScope.amGlobals.isFranchise == true)
                    isDbToBeChanged = false;

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
                tracker.reject({
                    code: code,
                    message: message
                });
            }

            function failure(err) {
                if (err)
                    console.error(err);
                tracker.reject({
                    message: 'Please check your internet connectivity!'
                });
            }
        }

        function checkLogin(isLdtbSynced, isChannelAssignBlocked) {
            var tracker = $q.defer();
            var errm = undefined;
            var today = moment().format(), isLoggedIn = false, isCloudEnabled = false, type, isCloudForceEnabled;
            if (isLdtbSynced)
                pdbLocal.get(constants.pdb_local_docs.login).then(performLogin).catch(failure);
            else
                pdbLocal.get(constants.pdb_local_docs.login).then(checkFlags).catch(failure);
            return tracker.promise;

            function performLogin(extLd) {
                if (extLd.isLoggedIn) {
                    if (extLd.username && extLd.password) {
                        loadCredentials(extLd.username, extLd.password);
                        login(false).then(furtherCheck).catch(handleError);
                    } else if (extLd.activation && extLd.activation.code)
                        login(true, extLd.activation.code, true).then(furtherCheck).catch(handleError);
                    else {
                        failure();
                    }
                } else {
                    failure({
                        mintSkipSave: true
                    });
                }

                function handleError(err) {
                    if (err.code == undefined) {
                        furtherCheck();
                        return
                    }
                    switch (err.code) {
                        case -404:
                            errm = 'License Error: Invalid Activation Code!';
                            break;
                        case -1:
                            errm = 'Your license has expired!';
                            break;
                        case 200:
                            errm = 'Your password has been changed. Please Login Again';
                            break;
                        case 300:
                            errm = 'There seems to be problem at Server! Please try again or contact Automint Care!';
                            break;
                        case 330:
                            errm = 'No Licensing Details Found for ' + $rootScope.amGlobals.credentials.username + '! Please Try Again or Contact Automint Care!';
                            break;
                    }
                    failure(err);
                }

                function furtherCheck(res) {
                    pdbLocal.get(constants.pdb_local_docs.login).then(checkFlags).catch(failure);
                }
            }

            function checkFlags(res) {
                if (!res.isLoggedIn) {
                    failure({
                        mintSkipSave: true
                    });
                }
                if (res.isCloudForceEnabled != undefined)
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
                failure(res);

                function respond(saveresponse) {
                    if (isChannelAssignBlocked != true) {
                        var currentchannel = angular.isArray(res.channel) ? res.channel[0] : res.channel;
                        if (angular.isArray(res.channel)) {
                            $rootScope.amGlobals.isFranchise = true;
                            $rootScope.amGlobals.franchiseChannels = res.channel;
                        }

                        $rootScope.amGlobals.creator = (res.username ? res.username : '');
                        $rootScope.amGlobals.channel = (currentchannel ? currentchannel : '');
                        $rootScope.amGlobals.configDocIds = {
                            settings: 'settings' + (currentchannel ? '-' + currentchannel : ''),
                            treatment: 'treatments' + (currentchannel ? '-' + currentchannel : ''),
                            inventory: 'inventory' + (currentchannel ? '-' + currentchannel : ''),
                            workshop: 'workshop' + (currentchannel ? '-' + currentchannel : '')
                        }
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
                    if ($rootScope.amGlobals.isFranchise == true)
                        amLogin.saveFranchiseNames($rootScope.amGlobals.franchiseChannels).then(respondAfterFranchise).catch(respondAfterFranchise);
                    else
                        tracker.resolve(obj);

                    function respondAfterFranchise(fresponse) {
                        tracker.resolve(obj);
                    }
                }
            }

            function failure(err) {
                if (err.mintSkipSave)
                    ro();
                else
                    amLogin.setLoginState(false).then(ro).catch(ro);
                
                function ro(rores) {
                    tracker.reject(errm);
                }
            }
        }
    }
})();