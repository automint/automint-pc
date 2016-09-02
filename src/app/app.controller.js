/*
 * Closure for root level controllers
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {

    angular.module('automintApp').controller('amCtrl', HomeController).controller('amUpdatePwdCtrl', UpdatePasswordController);

    HomeController.$inject = ['$rootScope', '$state', '$amRoot', '$amLicense', 'utils'];
    UpdatePasswordController.$inject = ['$mdDialog', '$rootScope', '$amLicense', '$amRoot'];

    function HomeController($rootScope, $state, $amRoot, $amLicense, utils) {
        //  initialize view model
        var vm = this;

        //  default execution steps
        $rootScope.isFirstLoad = true;
        $amLicense.checkLogin(true).then(success).catch(failure);

        //  function definitions

        function success(res) {
            if (res.isLoggedIn) {
                if (res.isCloudEnabled) {
                    if (res.isCloudForceEnabled != false)
                        $amRoot.syncDb();
                }
                $amRoot.dbAfterLogin(false);
            } else
                failure();
        }

        function failure(err) {
            if (err != undefined)
                utils.showSimpleToast(err);
            $rootScope.hidePreloader = true;
            $state.go('login');
        }
    }

    function UpdatePasswordController($mdDialog, $rootScope, $amLicense, $amRoot) {
        //  initialize view model
        var vm = this;

        //  temporary assignments for the instance
        //  no such assignments for now

        //  named assignments to view model
        vm.password = '';

        //  function mappings to view model
        vm.OnKeyDown = OnKeyDown;
        vm.submit = submit;

        //  default execution steps
        setTimeout(focusPassword, 300);

        //  function definitions

        function focusPassword() {
            $('#ami-password').focus();
        }

        function OnKeyDown(event) {
            if (event.keyCode == 13)
                submit();
        }

        function submit() {
            $rootScope.busyApp.show = true;
            $rootScope.busyApp.message = 'Loging In. Please Wait..';
            $amLicense.loadCredentials($rootScope.amGlobals.credentials.username, vm.password);
            $amLicense.login(false).then(success).catch(failure);

            function success(res) {
                $rootScope.busyApp.show = false;
                if (res.isLoggedIn) {
                    if (res.isSyncableDb) {
                        if ($rootScope.amDbSync)
                            $rootScope.amDbSync.cancel();
                        $amRoot.syncDb();
                    }
                    $mdDialog.hide();
                } else {
                    utils.showSimpleToast('Your license has expired!');
                    $state.go('login');
                }
            }

            function failure(err) {
                $rootScope.busyApp.show = false;
                vm.message = err.message;
            }
        }
    }
})();