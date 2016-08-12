/**
 * Controller for Edit Inventory component
 * @author ndkcha
 * @since 0.6.1
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlInUI', EditInventoryController);

    EditInventoryController.$inject = ['$rootScope', '$state', 'utils', 'amInventory'];

    function EditInventoryController($rootScope, $state, utils, amInventory) {
        //  Initialize view model
        var vm = this;

        //  named assignments to keep track of UI elements
        vm.label_name = 'Enter Part Name:';
        vm.label_rate = 'Enter Part Rate:';
        vm.inventory = {
            name: '',
            rate: ''
        };
        vm.operationMode = 'edit';

        //  function-maps
        vm.goBack = goBack;
        vm.changeNameLabel = changeNameLabel;
        vm.changeRateLabel = changeRateLabel;
        vm.isAddOperation = isAddOperation;
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.save = save;
        //  default execution steps
        if ($rootScope.isAmDbLoaded)
            defaultExecutionSteps(true, false);
        else
            $rootScope.$watch('isAmDbLoaded', defaultExecutionSteps);

        //  function definitions
        
        function defaultExecutionSteps(newValue, oldValue) {
            if (newValue) {
                if ($state.params.name == undefined) {
                    OnFailedHit();
                    return;
                }
                getInventory();
            }
        }

        function OnFailedHit() {
            utils.showSimpleToast('Something went wrong! Please Try Again!');
            $state.go('restricted.inventory.all');
        }

        function getInventory() {
            amInventory.getInventory($state.params.name).then(success).catch(failure);

            function success(res) {
                vm.inventory = res;
                changeNameLabel();
                changeRateLabel();
            }

            function failure(err) {
                OnFailedHit();
            }
        }
        
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
            vm.inventory.name = utils.autoCapitalizeWord(vm.inventory.name);
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
                    utils.showSimpleToast('Inventory has been updated');
                    $state.go('restricted.inventory.all');
                } else
                    failure();
            }
            function failure(err) {
                utils.showSimpleToast('Inventory can not be updated at moment. Please Try Again!');
            }
        }
    }
})();