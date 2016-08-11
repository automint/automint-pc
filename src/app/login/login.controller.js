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
        var channel = undefined;

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

        //  default execution steps
        setTimeout(focusUsername, 300);

        //  function definitions

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
            amLogin.loadCredentials(vm.username, vm.password);
            amLogin.login(success, failure);

            function success(res) {
                if (res.data && (res.statusText == "OK")) {
                    if (res.data.userCtx && (res.data.userCtx.name != null) && res.data.userCtx.channels && (Object.keys(res.data.userCtx.channels).length > 0)) {
                        if (res.data.userCtx.channels.length <= 1) {
                            failure();
                            return;
                        }
                        channel = Object.keys(res.data.userCtx.channels)[1];
                        amLogin.saveLoginCredentials(true, vm.username, vm.password, Object.keys(res.data.userCtx.channels)[1]).then(proceed).catch(docNotSaved);
                    }
                }

                function proceed(res) {
                    $rootScope.amGlobals.configDocIds = {
                        settings: 'settings' + (channel ? '-' + channel : ''),
                        treatment: 'treatments' + (channel ? '-' + channel : ''),
                        inventory: 'inventory' + (channel ? '-' + channel : ''),
                        workshop: 'workshop' + (channel ? '-' + channel : '')
                    }
                    $amRoot.dbAfterLogin();
                    $location.path('/dashboard');
                }

                function docNotSaved(err) {
                    console.error(err);
                    failure();
                }
            }

            function failure(err) {
                if (!err) {
                    vm.message = "Something went wrong! Please contact Automint Care!";
                    vm.isLogingIn = false;
                    return;
                }
                switch (err.status) {
                    case 401:
                        vm.message = "Invalid Username/Password!";
                        break;
                    default:
                        vm.message = "Please check your internet connectivity!";
                        break;
                }
                vm.isLogingIn = false;
                console.error(err);
            }
        }
    }
})();