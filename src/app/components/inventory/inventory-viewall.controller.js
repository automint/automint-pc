/**
 * Controller for View All Inventories component
 * @author ndkcha
 * @since 0.6.1
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlInRA', ViewAllInventoryController);

    ViewAllInventoryController.$inject = ['$rootScope', '$state', 'utils', 'amInventory'];

    function ViewAllInventoryController($rootScope, $state, utils, amInventory) {
        //  Initialize view model
        var vm = this;

        //  named assignments
        vm.query = {
            limit: 10,
            page: 1,
            total: 0
        };
        vm.inventories = [];

        //  function mappings
        vm.addInventory = addInventory;
        vm.editInventory = editInventory;
        vm.deleteInventory = deleteInventory;
        vm.changeDisplayAsList = changeDisplayAsList;

        //  default execution steps
        if ($rootScope.isAmDbLoaded)
            defaultExecutionSteps(true, false);
        else
            $rootScope.$watch('isAmDbLoaded', defaultExecutionSteps);

        //  function definitions

        function defaultExecutionSteps(newValue, oldValue) {
            if (newValue) {
                getInventories();
                getDisplayAsList();
            }
        }

        function getDisplayAsList() {
            amInventory.getDisplayAsList().then(success).catch(failure);

            function success(res) {
                vm.stgDisplayAsList = res;
            }

            function failure(err) {
                vm.stgDisplayAsList = false;
            }
        }

        function changeDisplayAsList() {
            amInventory.changeDisplayAsList(vm.stgDisplayAsList).then(success).catch(failure);

            function success(res) {
                if (res.ok)
                    utils.showSimpleToast('Settings Saved!');
                else
                    failure();
            } 
            function failure(err) {
                vm.stgDisplayAsList = !vm.stgDisplayAsList;
                utils.showSimpleToast('Could not save settings at moment. Please Try Again!');
            }
        }

        function deleteInventory(name) {
            amInventory.deleteInventory(name).then(success).catch(failure);

            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast('Inventory has been deleted!');
                    getInventories();
                } else
                    failure();
            }

            function failure(err) {
                utils.showSimpleToast('Inventory can not be deleted at moment. Please Try Again!');
            }
        }

        function editInventory(name) {
            $state.go('restricted.inventory.edit', {
                name: name
            });
        }

        function getInventories() {
            if ($rootScope.isAmDbLoaded)
                vm.promise = amInventory.getInventories().then(success).catch(failure);

            function success(res) {
                vm.inventories = res;
                vm.query.total = res.length;
            }

            function failure(err) {
                vm.inventories = [];
            }
        }

        function addInventory() {
            $state.go('restricted.inventory.add');
        }
    }
})();