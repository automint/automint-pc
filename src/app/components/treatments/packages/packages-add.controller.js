/**
 * Controller for Add Package component
 * @author ndkcha
 * @since 0.5.0
 * @version 0.5.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlPkCI', PackageAddController);
    
    PackageAddController.$inject = ['amTreatments'];
    
    function PackageAddController(amTreatments) {
        //  initialize view model
        var vm = this;
        
        //  named assignments to keep track of UI elements
        vm.label_name = "Enter Package Name:";
        vm.operationMode = 'add';
        vm.package = {
            name: ''
        };
        vm.treatment = {
            details: '',
            rate: ''
        }
        vm.selectedTreatments = [];
        
        //  default execution steps
        getTreatments();
        
        //  function maps
        vm.changeNameLabel = changeNameLabel;
        vm.isAddOperation = isAddOperation;
        
        //  function definitions
        
        function changeNameLabel(force) {
            vm.isName = (force != undefined) || (vm.package.name != '');
            vm.label_name = (vm.isName) ? "Package Name:" : "Enter Package Name:";
        }
        
        function isAddOperation() {
            return (vm.operationMode == 'add');
        }
        
        function getTreatments() {
            vm.treatmentPromise = amTreatments.getTreatments().then(success).catch(failure);
            
            function success(res) {
                console.log(res);
                vm.treatments = res.treatments;
            }

            function failure(err) {
                vm.treatments = [];
            }
        }
    }
})();