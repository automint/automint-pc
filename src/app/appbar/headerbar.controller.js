/**
 * Controller for Header Bar
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.3
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    const ammHelp = require('./automint_modules/am-help.js');
    const ipcRenderer = require('electron').ipcRenderer;

    angular.module('automintApp').controller('amCtrlHeaderbar', HeaderBarController);

    HeaderBarController.$inject = ['$rootScope', '$scope', '$state', '$timeout', '$mdSidenav', '$amRoot', '$filter', 'amAppbar', 'utils'];

    function HeaderBarController($rootScope, $scope, $state, $timeout, $mdSidenav, $amRoot, $filter, amAppbar, utils) {
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
        vm.IsPasscodeEnabled = IsPasscodeEnabled;
        $rootScope.loadChannelValues = loadChannelValues;

        //  default execution steps
        $rootScope.hidePreloader = true;
        loadChannelValues();
        amAppbar.getPasscode().then(gps).catch(failure);

        //  function definitions

        function loadChannelValues() {
            if ($rootScope.amGlobals.isFranchise == true) {
                vm.currentFranchiseChannel = utils.convertToTitleCase($rootScope.amGlobals.channel.replace('.', ' '));
                amAppbar.getCloudChannelNames().then(success).catch(failure);
            }

            function success(res) {
                vm.franchiseChannels = [];
                Object.keys(res.channels).forEach(iterateMaps);
                var cfound = $filter('filter')(vm.franchiseChannels, {
                    id: $rootScope.amGlobals.channel
                }, true);
                if ((res.default != undefined) && $rootScope.firstTimers && ($rootScope.firstTimers.isFranchise == true)) {
                    $rootScope.busyApp.show = true;
                    $rootScope.firstTimers.isFranchise = false;
                    $rootScope.busyApp.message = "Loading Franchise...";
                    setTimeout(loadDefaultFranchise, 1000);

                    function loadDefaultFranchise() {
                        var ffound = $filter('filter')(vm.franchiseChannels, {
                            id: res.default
                        }, true);

                        if (ffound.length == 1) {
                            var inx = vm.franchiseChannels.indexOf(ffound[0]);
                            if (inx > -1)
                                selectFranchiseChannel(inx);
                            $rootScope.busyApp.show = false;
                        } else
                            $rootScope.busyApp.show = false;
                    }
                }

                if (cfound.length == 1)
                    vm.currentFranchiseChannel = cfound[0].name;

                function iterateMaps(m) {
                    vm.franchiseChannels.push({
                        id: m,
                        name: res.channels[m]
                    });
                }
            }

            function failure(err) {
                vm.franchiseChannels = [];
                $rootScope.amGlobals.franchiseChannels.forEach(iterateFranchiseChannels);

                function iterateFranchiseChannels(fc) {
                    vm.franchiseChannels.push({
                        id: fc,
                        name: utils.convertToTitleCase(fc.replace('.', ' '))
                    });
                }
            }
        }

        function selectFranchiseChannel(index) {
            if (index == -1)
                $rootScope.amGlobals.channel = vm.allFrenchiseObject.id;
            else
                $rootScope.amGlobals.channel = vm.franchiseChannels[index].id;
            var cfound = $filter('filter')(vm.franchiseChannels, {
                id: $rootScope.amGlobals.channel
            }, true);

            vm.currentFranchiseChannel = (cfound.length == 1) ? cfound[0].name : utils.convertToTitleCase($rootScope.amGlobals.channel.replace('.', ' '));
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

        function IsPasscodeEnabled() {
            if ($rootScope.isFranchise == true)
                return false;
            return ($rootScope.isPasscodeEnabled);
        }

        function gps(res) {
            if (($rootScope.amGlobals.isFranchise == true) || (res == undefined))
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