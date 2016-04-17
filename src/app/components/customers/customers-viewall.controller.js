/**
 * Controller for View all Customers component
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlCuRA', CustomersViewAll);

    CustomersViewAll.$inject = ['$state', 'utils', 'amCustomers'];

    function CustomersViewAll($state, utils, amCustomers) {
        //  initialize view model
        var vm = this;
        
        //  named assginments for tracking UI elements
        vm.selectedCustomers = [];
        vm.query = {
            limit: 5,
            page: 1,
            total: 0
        };
        vm.customers = [];
        
        //  function-maps
        vm.addCustomer = addCustomer;
        vm.getCustomers = getCustomers;
        vm.deleteCustomer = deleteCustomer;
        vm.editCustomer = editCustomer;
        
        //  default execution steps
        getCustomers();
        
        //  function definitions
        
        //  fetch relevant customers from database
        function getCustomers() {
            vm.promise = amCustomers.getCustomers;
            vm.promise(vm.query.page, vm.query.limit).then(success).catch(failure);
            
            function success(res) {
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