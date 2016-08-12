/**
 * Controller for lockscreen
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.0
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlLock', LockscreenController);

    LockscreenController.$inject = ['$rootScope', '$state', '$window', 'amAppbar', 'utils'];

    function LockscreenController($rootScope, $state, $window, amAppbar, utils) {
        //  initialize view model and temporary assignments
        var vm = this, passcode, skip = true;
        var pageTitle = $rootScope.page_title;
        $rootScope.page_title = "Automint";

        //  named assignments and function mappings to view model
        vm.isMessage = false;
        vm.unlock = unlock;
        vm.addService = addService;
        vm.changePasscode = changePasscode;

        //  default execution steps
        if ($rootScope.isAmDbLoaded)
            lockDefaults(true, false);
        else
            $rootScope.$watch('isAmDbLoaded', lockDefaults);

        //  function definitions

        function lockDefaults(newValue, oldValue) {
            if (newValue) {
                amAppbar.getPasscode().then(gps).catch(unlock);
            }
        }

        function changePasscode() {
            vm.isMessage = false;
        }

        function addService() {
            $rootScope.isAutomintLocked = false;
            $state.go('restricted.services.add', {
                fromState: 'locked'
            });
        }

        function gps(res) {
            passcode = res.code;
        }

        function unlock() {
            $rootScope.page_title = pageTitle;
            if (vm.passcode != passcode) {
                vm.message = "Wrong Passcode!!!";
                vm.isMessage = true;
                return;
            }
            $rootScope.isAutomintLocked = false;
        }
    }
})();