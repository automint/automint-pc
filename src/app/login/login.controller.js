/**
 * Controller for Login Compoenent
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.0
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    var base64url = require('base64url');

    angular.module('automintApp').controller('amLoginCtrl', LoginController);

    LoginController.$inject = ['$rootScope', '$amRoot', '$location', 'amLogin'];

    function LoginController($rootScope, $amRoot, $location, amLogin) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var channel = undefined, license = undefined, cloud = undefined, isLoggedIn = false;

        //  named assignments for view model
        vm.isLogingIn = false;
        vm.username = '';
        vm.password = '';
        vm.code = '';
        vm.message = undefined;

        //  named assignments for other scopes
        $rootScope.hidePreloader = true;

        //  function mappings
        vm.changeCode = changeCode;
        vm.changeUserDetails = changeUserDetails;
        vm.submit = submit;
        vm.OnKeyDown = OnKeyDown;
        vm.convertToCodeToUppercase = convertToCodeToUppercase;

        //  default execution steps
        setTimeout(focusUsername, 300);

        //  function definitions

        function convertToCodeToUppercase() {
            vm.code = vm.code.toUpperCase();
            changeCode();
        }

        function focusUsername() {
            $('#ami-username').focus();
        }

        function focusPassword() {
            $('#ami-password').focus();
        }

        function focusCode() {
            $('#ami-code').focus();
        }

        function changeCode() {
            vm.password = ''; 
            vm.message = undefined;
        }

        function changeUserDetails() {
            vm.code = '';
            vm.message = undefined;
        }

        function OnKeyDown(event) {
            if (event.keyCode == 13)
                submit();
        }

        function submit() {
            vm.message = undefined;
            if ((vm.username == '') && (vm.password == '') && (vm.code == '')) {
                vm.message = 'Please Enter Username and Password, or Code!';
                return;
            }
            if (((vm.username != '') && (vm.password == '')) && (vm.code == '')) {
                vm.message = 'Please Enter Password!';
                return;
            }
            if (((vm.password != '') && (vm.username == '')) && (vm.code == '')) {
                vm.message = 'Please Enter Username!';
                return;
            }
            vm.isLogingIn = true;
            if ((vm.username != undefined) && (vm.username != '') && (vm.password != undefined) && (vm.password != '')) {
                amLogin.loadCredentials(vm.username, vm.password);
                amLogin.login(success, failure);
            } else if ((vm.code != undefined) && (vm.code != '')) {
                amLogin.activate(vm.code, activate, failure)
            }

            function activate(res) {
                if (res.data == undefined) {
                    failure();
                    return;
                }
                if (res.data.used) {
                    vm.message = "The code is already in use! You cannot use it again!";
                    vm.isLogingIn = false;
                    return;
                }
                var startdate = moment(res.data.starts, 'YYYY-MM-DD').format();
                var enddate = moment(res.data.ends, 'YYYY-MM-DD').format();
                var curdate = moment().format();
                if ((startdate.localeCompare(curdate) < 0) && (enddate.localeCompare(curdate) > 0))
                    isLoggedIn = true;
                amLogin.saveActivationDetails(isLoggedIn, vm.code, res.data.starts, res.data.ends).then(proceed).catch(docNotSaved);
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
                    if (userData && (userData.name != null) && userData.channels && (Object.keys(userData.channels).length > 1)) {
                        channel = Object.keys(userData.channels)[1];
                        amLogin.saveLoginCredentials($rootScope.amGlobals.credentials.username, $rootScope.amGlobals.credentials.password, channel).then(checkLicense).catch(docNotSaved);
                    } else
                        checkLicense();

                    function checkLicense() {
                        if (licenseData) {
                            var startdate = moment(licenseData.license.starts, 'YYYY-MM-DD').format();
                            var enddate = moment(licenseData.license.ends, 'YYYY-MM-DD').format();
                            var curdate = moment().format();
                            if ((startdate.localeCompare(curdate) < 0) && (enddate.localeCompare(curdate) > 0))
                                isLoggedIn = true;
                            amLogin.saveLicenseDetails(isLoggedIn, licenseData.license, licenseData.cloud).then(proceed).catch(docNotSaved);
                        } else
                            processMintCode(330);
                    }
                }
            }

            function docNotSaved(err) {
                console.error(err);
                failure();
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
                }

                var isDbToBeChanged = (($rootScope.amGlobals != undefined) && ($rootScope.amGlobals.credentials != undefined) && ($rootScope.amGlobals.credentials.username != undefined) && ($rootScope.amGlobals.credentials.username != '') && ($rootScope.amGlobals.credentials.password != undefined) && ($rootScope.amGlobals.credentials.password != '')); 
                if (isDbToBeChanged)
                    amLogin.changeExistingDocs().then(p1).catch(p1);
                else
                    p1();

                function p1(res) {
                    var isSyncableDb = (($rootScope.amGlobals != undefined) && ($rootScope.amGlobals.credentials != undefined) && ($rootScope.amGlobals.credentials.username != undefined) && ($rootScope.amGlobals.credentials.username != '') && ($rootScope.amGlobals.credentials.password != undefined) && ($rootScope.amGlobals.credentials.password != ''));
                    if (($rootScope.amGlobals == undefined) || ($rootScope.amGlobals.validity == undefined) || ($rootScope.amGlobals.validity.cloud == undefined))
                        isSyncableDb = false;
                    else {
                        var cloudstart = moment($rootScope.amGlobals.validity.cloud.starts, 'YYYY-MM-DD').format();
                        var cloudend = moment($rootScope.amGlobals.validity.cloud.ends, 'YYYY-MM-DD').format();
                        var curdate = moment().format();
                        isSyncableDb = ((cloudstart.localeCompare(curdate) < 0) && (cloudend.localeCompare(curdate) > 0));
                        if (!isSyncableDb)
                            utils.showSimpleToast('Your cloud services have expired! Please Contact Automint Care!');
                    }
                    if (isSyncableDb)
                        $rootScope.amDbSync = $amRoot.syncDb($rootScope.amGlobals.credentials.username, $rootScope.amGlobals.credentials.password);
                    $amRoot.dbAfterLogin();
                    $location.path('/dashboard');
                }
            }

            function processMintCode(code) {
                switch (code) {
                    case -1:
                        vm.message = "Your license has expired!";
                        break; 
                    case 200:
                        vm.message = "Incorrect Username or Password";
                        break;
                    case 300:
                        vm.message = "There seems to be problem at Server! Please try again or contact Automint Care!";
                        break;
                    case 330:
                        vm.message = "No Licensing Details Found for " + $rootScope.amGlobals.credentials.username + "! Please Try Again or Contact Automint Care!";
                        break;
                }
                vm.isLogingIn = false;
            }

            function failure(err) {
                vm.message = "Please check your internet connectivity!";
                vm.isLogingIn = false;
                console.error(err);
            }
        }
    }
})();