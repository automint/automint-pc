/*
 * Closure for root level controllers
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    const electron = require('electron').remote;
    const ammHelp = require('./automint_modules/am-help.js');
    const ipcRenderer = require("electron").ipcRenderer;
    const amApp = electron.app;
    const BrowserWindow = electron.BrowserWindow;

    angular.module('automintApp')
        .controller('lockScreenCtrl', LockScreenController)
        .controller('appBarHeaderCtrl', HeaderbarController)
        .controller('appSideBarCtrl', SidebarController);

    HeaderbarController.$inject = ['$rootScope', '$scope', '$state', '$timeout', '$mdSidenav', 'amRootFactory'];
    SidebarController.$inject = ['$rootScope', '$scope', '$state', '$http', '$mdSidenav', 'amRootFactory'];
    LockScreenController.$inject = ['$rootScope', '$state', '$window', 'amRootFactory', 'utils'];

    function LockScreenController($rootScope, $state, $window, amRootFactory, utils) {
        var vm = this, passcode, skip = true;

        $rootScope.cRootLock = 'active';

        vm.unlock = unlock;
        vm.isMessage = false;
        vm.addService = addService;
        
        var source = localStorage.getItem('cover-pic');
        $('#am-lockscreen-img').attr('src', (source) ? source : 'assets/img/logo-250x125px.png').width(250).height(125);
        amRootFactory.getPasscode().then(gps).catch(unlock);

        function addService() {
            $rootScope.cRootLock = '';
            $state.go('restricted.services.add', {
                fromState: 'locked'
            });
        }

        function gps(res) {
            if (!res || res.enabled == false) {
                unlock();
                skip = true;
                return;
            }
            skip = false;
            passcode = res.code;
        }

        function unlock() {
            var transitState = 'restricted.dashboard';
            if (skip == false) {
                if (vm.passcode != passcode) {
                    vm.message = "Wrong Passcode!!!";
                    vm.isMessage = true;
                    return;
                }
            }
            $rootScope.isAutomintLocked = false;
            $rootScope.cRootLock = '';
            if ($state.params.fromState != undefined)
                transitState = $state.params.fromState;
            $state.go(transitState);
        }
    }

    function HeaderbarController($rootScope, $scope, $state, $timeout, $mdSidenav, amRootFactory) {
        var vm = this;

        //  map functions to view model
        vm.toggleSideNavbar = buildDelayedToggler('main-nav-left');
        vm.openLockScreen = openLockScreen;
        vm.openHelpWindow = openHelpWindow;
        vm.addService = addService;

        //  default execution steps
        setCoverPic();
        amRootFactory.getPasscode().then(gps).catch(failure);

        //  function definitions

        function setCoverPic() {
            var source = localStorage.getItem('cover-pic');
            $('#am-cover-pic').attr('src', (source) ? source : 'assets/img/logo-250x125px.png').width(250).height(125);
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
        }

        function failure(err) {
            $rootScope.isPasscodeEnabled = false;
        }

        function openLockScreen() {
            $rootScope.isAutomintLocked = true;
            $state.go('locked', {
                fromState: $state.current.name
            });
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

    function SidebarController($rootScope, $scope, $state, $http, $mdSidenav, amRootFactory) {
        var vm = this;

        //  objects passed to view model
        vm.items = [{
            name: 'Dashboard',
            icon: 'dashboard',
            state: 'restricted.dashboard'
        }, {
            name: 'Customers',
            icon: 'group',
            state: 'restricted.customers.all'
        }, {
            name: 'Treatments',
            icon: 'local_car_wash',
            state: 'restricted.treatments.master'
        }, {
            name: 'Inventory',
            icon: 'build',
            state: 'restricted.inventory.all'
        }, {
            name: 'Settings',
            icon: 'settings',
            state: 'restricted.settings'
        }];
        vm.isAutomintUpdateAvailable = undefined;
        
        //  map functions to view model
        vm.openState = openState;
        vm.doUpdate = doUpdate;
        vm.isSelected = isSelected;
        vm.goToDashboard = goToDashboard;

        //  default execution steps
        ipcRenderer.on('automint-updated', listenToAutomintUpdates);
        getPackageFile();
        $rootScope.hidePreloader = true;
        amRootFactory.getPasscode().then(gps).catch(unlock);

        //  function definitions

        function gps(res) {
            if ($rootScope.isAutomintLocked == false)
                return;
            if (!res || res.enabled == false) {
                unlock();
                return;
            }
            if (res.enabled == true) {
                $state.go('locked');
            }
        }

        function unlock() {
            console.info('unlocked');
        }

        function goToDashboard() {
            $mdSidenav('main-nav-left').close()
            $state.go(vm.items[0].state);
        }

        function isSelected(index) {
            return ($rootScope.sidebarItemIndex == index);
        }

        function listenToAutomintUpdates(event, arg) {
            vm.isAutomintUpdateAvailable = arg;
            $scope.$apply();
        }

        function doUpdate() {
            ipcRenderer.send('am-quit-update', true);
        }

        function getPackageFile() {
            vm.automintVersion = amApp.getVersion();
        }

        function openState(state) {
            $mdSidenav('main-nav-left').close()
            $state.go(state);
        }
    }
})();