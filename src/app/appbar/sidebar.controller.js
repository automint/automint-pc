/**
 * Controller for Sidebar
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.2
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    const electron = require('electron').remote;
    const ipcRenderer = require("electron").ipcRenderer;
    const amApp = electron.app;

    angular.module('automintApp').controller('amCtrlSidebar', SidebarController);

    SidebarController.$inject = ['$rootScope', '$scope', '$state', '$http', '$mdSidenav'];

    function SidebarController($rootScope, $scope, $state, $http, $mdSidenav) {
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
        vm.IsNotInclFranchise = IsNotInclFranchise;

        //  default execution steps
        ipcRenderer.on('automint-updated', listenToAutomintUpdates);
        getPackageFile();
        setCoverPic();

        //  function definitions

        function IsNotInclFranchise(item) {
            if ($rootScope.isAllFranchiseOSelected() != true)
                return false;
            var isDisabled = false;
            switch (item.name) {
                case "Treatments":
                    isDisabled = true;
                    break;
                case "Inventory":
                    isDisabled = true;
                    break;
            }
            return isDisabled;
        }

        function setCoverPic() {
            var source = localStorage.getItem('cover-pic');
            $('#am-cover-pic').attr('src', (source) ? source : 'assets/img/logo-250x125px.png').width(250).height(125);
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