/**
 * Controller for discount control dialogbox
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlSeDc', DiscountController);

    DiscountController.$inject = ['$mdDialog', 'treatmentLength', 'partLength', 'treatmentTotal', 'partTotal', 'discountObj', 'currencySymbol'];

    function DiscountController($mdDialog, treatmentLength, partLength, treatmentTotal, partTotal,  discountObj, currencySymbol) {
        //  initiailize view model
        var vm = this;

        //  named assignments for view model
        vm.treatmentDiscount = 0;
        vm.partDiscount = 0;
        vm.totalDiscount = 0;
        vm.isTreatment = (treatmentLength > 0);
        vm.isPart = (partLength > 0);
        vm.isTreatmentSelected = false;
        vm.isPartSelected = false;
        vm.currencySymbol = currencySymbol;

        //  function maps to view model
        vm.cancel = cancel;
        vm.calculateTotal = calculateTotal;
        vm.checkTreatmentDiscount = checkTreatmentDiscount;
        vm.checkPartDiscount = checkPartDiscount;
        vm.save = save;

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
            if (discountObj != undefined) {
                vm.treatmentDiscount = parseFloat(discountObj.treatment);
                vm.partDiscount = parseFloat(discountObj.part);
                vm.treatmentDiscount = (vm.treatmentDiscount % 1 != 0) ? parseFloat(vm.treatmentDiscount.toFixed(2)) : parseInt(vm.treatmentDiscount);
                vm.partDiscount = (vm.partDiscount % 1 != 0) ? parseFloat(vm.partDiscount.toFixed(2)) : parseInt(vm.partDiscount);
                vm.isTreatmentSelected = (vm.treatmentDiscount > 0);
                vm.isPartSelected = (vm.partDiscount > 0);
                calculateTotal();
            }
        }

        function calculateTotal() {
            vm.totalDiscount = (vm.isTreatmentSelected ? parseFloat(vm.treatmentDiscount) : 0) + (vm.isPartSelected ? parseFloat(vm.partDiscount) : 0);
            vm.totalDiscount = (vm.totalDiscount % 1 != 0) ? parseFloat(vm.totalDiscount.toFixed(2)) : parseInt(vm.totalDiscount);
        }

        function save() {
            var discount = {
                treatment: (vm.isTreatmentSelected ? vm.treatmentDiscount : 0),
                part: (vm.isPartSelected ? vm.partDiscount : 0),
                total: vm.totalDiscount
            }
            $mdDialog.hide(discount);
        }
        
        function cancel() {
            $mdDialog.cancel();
        }
    }
})();