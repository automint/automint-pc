/**
 * Controller for View all Customers component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.2
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlCuRA', CustomersViewAll);

    CustomersViewAll.$inject = ['$rootScope', '$scope', '$state', '$timeout', '$mdDialog', 'utils', 'amCustomers'];

    function CustomersViewAll($rootScope, $scope, $state, $timeout, $mdDialog, utils, amCustomers) {
        //  initialize view model
        var vm = this, queryChangedPromise, isFirstTime = true, configCount = 0;
        
        //  named assginments for tracking UI elements
        vm.selectedCustomers = [];
        vm.query = {
            limit: 10,
            page: 1,
            total: 0
        };
        vm.displayItemPage = 1;
        vm.customers = [];
        vm.customerQuery = '';
        vm.showPaginationBar = true;
        vm.isQueryMode = false;
        
        //  function-maps
        vm.addCustomer = addCustomer;
        vm.getCustomers = getCustomers;
        vm.deleteCustomer = deleteCustomer;
        vm.editCustomer = editCustomer;
        vm.changeQueryMode = changeQueryMode;
        vm.IsVehicleAnonymous = IsVehicleAnonymous;
        
        //  default watchers
        $rootScope.isCUSection = false;
        $scope.$watch('vm.customerQuery', watchCustomerQuery);
        amCustomers.countConfigDocs().then(countConfigDocs).catch(countConfigDocs);
        
        //  function definitions

        function countConfigDocs(res) {
            configCount = res;
            getCustomers();
        }

        function IsVehicleAnonymous(vehicle) {
            return (vehicle.reg == 'Vehicle');
        }
        
        function watchCustomerQuery(newValue, oldValue) {
            if (isFirstTime == true) {
                isFirstTime = false;
                return;
            } 
            if(queryChangedPromise){
                $timeout.cancel(queryChangedPromise);
            }
            queryChangedPromise = $timeout(getCustomers, 800);
        }
        
        function changeQueryMode(bool) {
            vm.isQueryMode = bool;
            if (vm.isQueryMode)
                setTimeout(focusOnSearchbox, 300);
            else {
                vm.customerQuery = '';
                getCustomers();
            }
                
            function focusOnSearchbox() {
                $('#am-query-search').focus();
            }
        }
        
        //  fetch relevant customers from database
        function getCustomers() {
            vm.showPaginationBar = (vm.customerQuery == '');
            vm.promise = amCustomers.getCustomers(vm.query.page, vm.query.limit, vm.customerQuery).then(success).catch(failure);
            
            function success(res) {
                vm.displayItemPage = 1;
                vm.customers = res.customers;
                vm.query.total = res.total - configCount;
            }
            
            function failure(error) {
                vm.customers = [];
                vm.query.total = 0;
            }
        }
        
        //  edit customer
        function editCustomer(cId) {
            $state.go('restricted.customers.edit', {
                id: cId
            });
        }
        
        //  go to add customer state
        function addCustomer() {
            $state.go('restricted.customers.add');
        }
        
        //  delete particular customer
        function deleteCustomer(customer, ev) {
            var confirm = $mdDialog.confirm()
                .title('Are you sure you want to delete ?')
                .textContent('All the services of ' + customer.name + ' will be deleted')
                .ariaLabel('Delete Customer')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');
            
            $mdDialog.show(confirm).then(performDelete, ignoreDelete);
            
            function performDelete() {
                amCustomers.deleteCustomer(customer.id).then(success);
            }
            
            function ignoreDelete() {
                //  do nothing
            }
            
            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast('Customer has been deleted!');
                    getCustomers();
                }
            }
        }
    }
})();