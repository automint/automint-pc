/**
 * Controller for Header Bar
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.0
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    const ammHelp = require('./automint_modules/am-help.js');

    angular.module('automintApp').controller('amCtrlHeaderbar', HeaderBarController);

    HeaderBarController.$inject = ['$rootScope', '$scope', '$state', '$timeout', '$mdSidenav', 'amAppbar'];

    function HeaderBarController($rootScope, $scope, $state, $timeout, $mdSidenav, amAppbar) {
        var vm = this;

        //  map functions to view model
        vm.toggleSideNavbar = buildDelayedToggler('main-nav-left');
        vm.openLockScreen = openLockScreen;
        vm.openHelpWindow = openHelpWindow;
        vm.addService = addService;

        //  default execution steps
        $rootScope.hidePreloader = true;
        amAppbar.getPasscode().then(gps).catch(failure);

        //  function definitions

        function addService() {
            $state.go('restricted.services.add');
        }

        function openHelpWindow() {
            ammHelp.openHelpWindow();
        }

        function gps(res) {
            if (res == undefined)
                return;
            $rootScope.isPasscodeEnabled = res.enabled;
            $rootScope.isAutomintLocked = res.enabled;
        }

        function failure(err) {
            $rootScope.isPasscodeEnabled = false;
        }

        function openLockScreen() {
            $rootScope.isAutomintLocked = true;
        }

        //  Supplies a function that will continue to operate until the time is up.
        function debounce(func, wait, context) {
            var timer;
            return function debounced() {
                var context = $scope,
                    args = Array.prototype.slice.call(arguments);
                $timeout.cancel(timer);
                timer = $timeout(function() {
                    timer = undefined;
                    func.apply(context, args);
                }, wait || 10);
            };
        }

        //  Build handler to open/close a SideNav; when animation finishes report completion in console
        function buildDelayedToggler(navID) {
            return debounce(function() {
                $mdSidenav(navID).toggle();
            }, 200);
        }
    }
})();