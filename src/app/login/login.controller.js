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

    LoginController.$inject = ['$rootScope', '$amRoot', '$location', '$amLicense', 'amLogin'];

    function LoginController($rootScope, $amRoot, $location, $amLicense, amLogin) {
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
                $amLicense.loadCredentials(vm.username, vm.password);
                $amLicense.login(false).then(success).catch(failure);
            } else if ((vm.code != undefined) && (vm.code != ''))
                $amLicense.login(true, vm.code).then(success).catch(failure);

            function success(res) {
                if (res.isLoggedIn) {
                    if (res.isSyncableDb) {
                        $rootScope.isOnChangeMainDbBlocked = true;
                        $amRoot.syncDb();
                    }
                    vm.message = "Preparing Dashboard..";
                    $amRoot.dbAfterLogin(true);
                } else
                    failure('Your license has expired!');
            }

            function failure(err) {
                vm.isLogingIn = false;
                vm.message = err;
            }
        }
    }
})();