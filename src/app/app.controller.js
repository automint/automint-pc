/*
 * Closure for root level controllers
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('appBarHeaderCtrl', HeaderbarController)
        .controller('appSideBarCtrl', SidebarController);

    HeaderbarController.$inject = ['$rootScope', '$scope', '$timeout', '$mdSidenav'];
    SidebarController.$inject = ['$state', '$mdSidenav'];

    function HeaderbarController($rootScope, $scope, $timeout, $mdSidenav) {
        var vm = this;

        //  map functions to view model
        vm.toggleSideNavbar = buildDelayedToggler('main-nav-left');
        $rootScope.setCoverPic();

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

    function SidebarController($state, $mdSidenav) {
        var vm = this;

        //  map functions to view model
        vm.openState = openState;

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
            name: 'Settings',
            icon: 'settings',
            state: 'restricted.settings'
        }];

        function openState(state) {
            $mdSidenav('main-nav-left').close()
            $state.go(state);
        }
    }
})();