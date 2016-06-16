/**
 * Controller for Add Inventory component
 * @author ndkcha
 * @since 0.6.1
 * @version 0.6.1
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlInCI', AddInventoryController);

    AddInventoryController.$inject = ['$state', 'utils', 'amInventory'];

    function AddInventoryController($state, utils, amInventory) {
        //  Initialize view model
        var vm = this;

        //  named assignments to keep track of UI elements
        vm.label_name = 'Enter Part Name:';
        vm.label_rate = 'Enter Part Rate:';
        vm.inventory = {
            name: '',
            rate: ''
        };
        vm.operationMode = 'add';

        //  function-maps
        vm.goBack = goBack;
        vm.changeNameLabel = changeNameLabel;
        vm.changeRateLabel = changeRateLabel;
        vm.isAddOperation = isAddOperation;
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.save = save;

        //  function definitions
        
        function goBack() {
            $state.go('restricted.inventory.all');
        }
        
        function isAddOperation() {
            return (vm.operationMode == 'add');
        }
        
        function convertVtToTitleCase(rate) {
            rate.type = utils.convertToTitleCase(rate.type);
        }
        
        function convertNameToTitleCase() {
            vm.inventory.name = utils.convertToTitleCase(vm.inventory.name);
        }
        
        function changeNameLabel(force) {
            vm.isName = force != undefined || vm.inventory.name != '';
            vm.label_name = (vm.isName) ? 'Name:' : 'Enter Part Name:';
        }

        function changeRateLabel(force) {
            vm.isRate = force != undefined || ((vm.inventory.rate != '') == (vm.inventory.rate != null));
            vm.label_rate = (vm.isRate) ? 'Rate:' : 'Enter Part Rate:';
        }
        
        function save() {
            amInventory.saveInventory(vm.inventory, vm.operationMode).then(success).catch(failure);
            
            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast('Inventory has been added');
                    $state.go('restricted.inventory.all');
                } else
                    failure();
            }
            function failure(err) {
                utils.showSimpleToast('Inventory can not be added at moment. Please Try Again!');
            }
        }
    }
})();