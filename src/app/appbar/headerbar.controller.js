/**
 * Controller for Header Bar
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.2
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    const ammHelp = require('./automint_modules/am-help.js');
    const ipcRenderer = require('electron').ipcRenderer;

    angular.module('automintApp').controller('amCtrlHeaderbar', HeaderBarController);

    HeaderBarController.$inject = ['$rootScope', '$scope', '$state', '$timeout', '$mdSidenav', '$amRoot', 'amAppbar', 'utils'];

    function HeaderBarController($rootScope, $scope, $state, $timeout, $mdSidenav, $amRoot, amAppbar, utils) {
        var vm = this;

        //  named assignments for view model
        vm.franchiseChannels = [];
        vm.currentFranchiseChannel = undefined;
        vm.allFrenchiseObject = {
            id: 'all',
            name: 'All'
        };

        //  temporary named assignments for this instance
        

        //  map functions to view model
        vm.toggleSideNavbar = buildDelayedToggler('main-nav-left');
        vm.openLockScreen = openLockScreen;
        vm.openHelpWindow = openHelpWindow;
        vm.addService = addService;
        vm.relaunch = relaunch;
        vm.openFranchiseOptions = openFranchiseOptions;
        vm.selectFranchiseChannel = selectFranchiseChannel;

        //  default execution steps
        $rootScope.hidePreloader = true;
        if ($rootScope.amGlobals.isFranchise == true) {
            vm.currentFranchiseChannel = utils.convertToTitleCase($rootScope.amGlobals.channel.replace('.', ' '));
            $rootScope.amGlobals.franchiseChannels.forEach(iterateFranchiseChannels);
        }
        amAppbar.getPasscode().then(gps).catch(failure);

        //  function definitions

        function selectFranchiseChannel(index) {
            if (index == -1)
                $rootScope.amGlobals.channel = vm.allFrenchiseObject.id;
            else
                $rootScope.amGlobals.channel = vm.franchiseChannels[index].id;
            vm.currentFranchiseChannel = utils.convertToTitleCase($rootScope.amGlobals.channel.replace('.', ' '));
            $rootScope.amGlobals.configDocIds = {
                settings: 'settings' + ($rootScope.amGlobals.channel ? '-' + $rootScope.amGlobals.channel : ''),
                treatment: 'treatments' + ($rootScope.amGlobals.channel ? '-' + $rootScope.amGlobals.channel : ''),
                inventory: 'inventory' + ($rootScope.amGlobals.channel ? '-' + $rootScope.amGlobals.channel : ''),
                workshop: 'workshop' + ($rootScope.amGlobals.channel ? '-' + $rootScope.amGlobals.channel : '')
            };
            if (index == -1) {
                var statename = $state.current.name;
                if ((statename.indexOf('restricted.treatments') > -1) || (statename.indexOf('restricted.inventory') > -1)) {
                    $state.go('restricted.dashboard');
                    return;
                }
            }
            $state.go($state.current, {}, {reload: true});
        }

        function iterateFranchiseChannels(fc) {
            vm.franchiseChannels.push({
                id: fc,
                name: utils.convertToTitleCase(fc.replace('.', ' '))
            });
        }

        function openFranchiseOptions($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        }

        function relaunch() {
            ipcRenderer.send('am-do-restart', true);
        }

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