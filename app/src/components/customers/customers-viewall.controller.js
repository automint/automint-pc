/**
 * Controller for View all Customers component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.4.1
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlCuRA', CustomersViewAll);

    CustomersViewAll.$inject = ['$scope', '$state', 'utils', 'amCustomers'];

    function CustomersViewAll($scope, $state, utils, amCustomers) {
        //  initialize view model
        var vm = this;
        
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
        
        //  default execution steps
        getCustomers();
        
        //  function definitions
        
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
                vm.query.total = res.total;
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
        function deleteCustomer(cId) {
            amCustomers.deleteCustomer(cId).then(success);
            
            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast('Customer has been deleted!');
                    getCustomers();
                }
            }
        }
    }
})();