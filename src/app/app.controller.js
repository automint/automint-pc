/*
 * Closure for root level controllers
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('appBarHeaderCtrl', HeaderbarController)
        .controller('appSideBarCtrl', SidebarController);

    HeaderbarController.$inject = ['$scope', '$timeout', '$mdSidenav'];
    SidebarController.$inject = ['$state', '$mdSidenav'];

    function HeaderbarController($scope, $timeout, $mdSidenav) {
        var vm = this;
        
        //  map functions to view model
        vm.toggleSideNavbar = buildDelayedToggler('main-nav-left');
        
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
        vm.items = [
            {
                name: 'Services',
                icon: 'build',
                state: 'restricted.services.all'
            },
            {
                name: 'Customers',
                icon: 'group',
                state: 'restricted.customers.all'
            },
            {
                name: 'Treatments',
                icon: 'local_car_wash',
                state: 'restricted.treatments.all'
            }
        ];
        
        function openState(state) {
            $mdSidenav('main-nav-left').close()
            $state.go(state);
        }
    }
})();