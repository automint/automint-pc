/**
 * Controller for Add Treatments component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.4.1
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlTrCI', TreatmentAddController);

    TreatmentAddController.$inject = ['$state', 'utils', 'amTreatments'];

    function TreatmentAddController($state, utils, amTreatments) {
        //  initialize view model object
        var vm = this;

        //  named assignments to keep track of UI elements
        vm.label_name = 'Enter Treatment Name';
        vm.treatment = {
            name: ''
        };
        vm.rates = [];
        vm.operationMode = 'add';
        vm.save = save;
        vm.addRate = addRate;

        //  function-maps
        vm.changeNameLabel = changeNameLabel;
        vm.isAddOperation = isAddOperation;
        
        //  default execution steps
        getVehicleTypes();

        //  function definitions
        function isAddOperation() {
            return (vm.operationMode == 'add');
        }
        
        function getVehicleTypes() {
            amTreatments.getVehicleTypes().then(success).catch(failure);
            
            function success(res) {
                res.forEach(iterateVehicleType);
                
                function iterateVehicleType(type) {
                    vm.rates.push({
                        type: utils.convertToTitleCase(type.replace(/-/g, ' ')),
                        value: '',
                        fromDb: true,
                        focusIndex: vm.rates.length
                    });
                }
            }
            
            function failure(err) {
                vm.rates.push({
                    type: 'Default',
                    value: '',
                    fromDb: true,
                    focusIndex: vm.rates.length
                })
            }
        }
        
        function addRate(focus) {
            var fIndex = vm.rates.length;
            vm.rates.push({
                type: '',
                value: '',
                fromDb: false,
                focusIndex: fIndex
            });
            if (focus) {
                var focusField = "#rType" + fIndex;
                setTimeout(doFocus, 300);
                
                function doFocus() {
                    $(focusField).focus();
                }
            }
        }
        
        function changeNameLabel(force) {
            vm.largeNameLabel = force != undefined || vm.treatment.name != '';
            vm.label_name = (vm.largeNameLabel) ? 'Name:' : 'Enter Treatment Name';
        }
        
        function generateRate() {
            var result = {};
            vm.rates.forEach(iterateRate);
            
            function iterateRate(rate) {
                rate.type = rate.type.trim();
                if (rate.type && rate.value != '')
                    result[angular.lowercase(rate.type.replace(/\s/g, '-'))] = rate.value;
            }
            return result;
        }
        
        function save() {
            vm.treatment.rate = generateRate();
            amTreatments.saveVehicleTypes(Object.keys(vm.treatment.rate));
            amTreatments.saveTreatment(vm.treatment, vm.operationMode).then(success).catch(failure);
            
            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast('Treatment has been added');
                    $state.go('restricted.treatments.all');
                } else
                    failure();
            }
            function failure(err) {
                utils.showSimpleToast('Treatment can not be added at moment. Please Try Again!');
            }
        }
    }
})();