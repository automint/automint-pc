/**
 * Controller for discount control dialogbox
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlSeDc', DiscountController);

    DiscountController.$inject = ['$mdDialog', 'treatmentLength', 'partLength', 'discountObj', 'discountValue'];

    function DiscountController($mdDialog, treatmentLength, partLength,  discountObj, discountValue) {
        //  initiailize view model
        var vm = this;

        //  adjustments to input assignments
        discountValue = (discountValue ? parseFloat(discountValue) : 0); 

        //  named assignments for view model
        vm.treatmentDiscount = 0;
        vm.partDiscount = 0;
        vm.totalDiscount = 0;
        vm.isTreatment = (treatmentLength > 0);
        vm.isPart = (partLength > 0);
        vm.isTreatmentSelected = false;
        vm.isPartSelected = false; 

        //  function maps to view model
        vm.cancel = cancel;
        vm.calculateTotal = calculateTotal;
        vm.checkTreatmentDiscount = checkTreatmentDiscount;
        vm.checkPartDiscount = checkPartDiscount;

        //  default execution steps
        initialize();

        //  function definitions

        function checkTreatmentDiscount() {
            vm.isTreatmentSelected = (vm.treatmentDiscount > 0);
            calculateTotal();
        }

        function checkPartDiscount() {
            vm.isPartSelected = (vm.partDiscount > 0);
            calculateTotal();
        }

        function initialize() {
            if (discountObj == undefined) {
                if (partLength > 0)
                    vm.partDiscount = (treatmentLength > 0) ? (discountValue / 2) : discountValue;
                if (treatmentLength > 0)
                    vm.treatmentDiscount = (partLength > 0) ? (discountValue / 2) : discountValue;
                vm.isTreatmentSelected = (vm.treatmentDiscount > 0);
                vm.isPartSelected = (vm.partDiscount > 0);
                calculateTotal();
            }
        }

        function calculateTotal() {
            vm.totalDiscount = (vm.isTreatmentSelected ? parseFloat(vm.treatmentDiscount) : 0) + (vm.isPartSelected ? parseFloat(vm.partDiscount) : 0);
        }
        
        function cancel() {
            $mdDialog.cancel();
        }
    }
})();