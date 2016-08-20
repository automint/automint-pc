/**
 * Controller for Change Password Dialog box
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    const ipcRenderer = require('electron').ipcRenderer;

    angular.module('automintApp').controller('amCtrlSeChPwd', ChangePasswordController);

    ChangePasswordController.$inject = ['$rootScope', '$amLicense', '$mdDialog', '$amRoot'];

    function ChangePasswordController($rootScope, $amLicense, $mdDialog, $amRoot) {
        //  initialize view model
        var vm = this;

        //  temporary assignments for the instance
        //  no such assignments for now

        //  named assignments to view model
        vm.oldPassword = '';
        vm.newPassword = '';

        //  function mappings to view model
        vm.OnKeyDown = OnKeyDown;
        vm.submit = submit;
        vm.OnChangePasswords = OnChangePasswords;

        //  default execution steps
        setTimeout(focusCurrentPassword, 300);

        //  function definitions

        function OnChangePasswords() {
            vm.message = undefined;
        }

        function OnKeyDown(event) {
            if (event.keyCode == 13)
                submit();
        }

        function focusCurrentPassword() {
            $('#ami-cur-password').focus();
        }

        function focusNewPassword() {
            $('#ami-new-password').focus();
        }

        function submit() {
            if (vm.oldPassword == '') {
                vm.message = 'Please enter current password';
                setTimeout(focusCurrentPassword, 300);
                return;
            }
            if (vm.newPassword == '') {
                vm.message = 'Please enter new password';
                setTimeout(focusNewPassword, 300);
                return;
            }
            if (vm.oldPassword != $rootScope.amGlobals.credentials.password) {
                vm.message = 'Incorrect current password';
                setTimeout(focusCurrentPassword, 300);
                return;
            }
            $rootScope.busyApp.show = true;
            $rootScope.busyApp.message = 'Changing Password. Please Wait..';
            $amLicense.changePassword($rootScope.amGlobals.credentials.username, vm.newPassword).then(success).catch(failure);

            function success(res) {
                $rootScope.busyApp.show = false;
                $mdDialog.hide(true);
            }

            function failure(err) {
                $rootScope.busyApp.show = false;
                if (err.error_code == 1) {
                    doLogin(err.error_message);
                    return;
                }
                vm.message = err.error_message;
            }

            function doLogin(message) {
                $mdDialog.show(
                    $mdDialog.alert()
                        .parent(document.body)
                        .clickOutsideToClose(false)
                        .title('License Error!')
                        .textContent(message)
                        .ariaLabel('License Error')
                        .ok('Got it!')
                ).then(restartApp).catch(restartApp);

                function restartApp(res) {
                    $rootScope.busyApp.show = true;
                    $rootScope.busyApp.message = 'Restarting App due to License Error. Please Wait..';
                    ipcRenderer.send('am-do-restart', true);
                }
            }
        }
    }
})();