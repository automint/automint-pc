/**
 * Controller for Add Treatments component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.1
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlTrCI', TreatmentAddController);

    TreatmentAddController.$inject = ['$state', 'utils', 'amTreatments'];

    function TreatmentAddController($state, utils, amTreatments) {
        //  initialize view model object
        var vm = this;

        //  named assignments to keep track of UI elements
        vm.label_name = 'Enter Treatment Name:';
        vm.treatment = {
            name: ''
        };
        vm.rates = [];
        vm.operationMode = 'add';
        vm.save = save;
        vm.addRate = addRate;

        //  function-maps
        vm.goBack = goBack;
        vm.changeNameLabel = changeNameLabel;
        vm.isAddOperation = isAddOperation;
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.convertVtToTitleCase = convertVtToTitleCase;
        
        //  default execution steps
        getVehicleTypes();

        //  function definitions
        
        function goBack() {
            $state.go('restricted.treatments.master', {
                openTab: 'treatments'
            });
        }
        
        function isAddOperation() {
            return (vm.operationMode == 'add');
        }
        
        function convertVtToTitleCase(rate) {
            rate.type = utils.autoCapitalizeWord(rate.type);
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
                vm.rates = [];
                addRate();
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
        
        function convertNameToTitleCase() {
            vm.treatment.name = utils.convertToTitleCase(vm.treatment.name);
        }
        
        function changeNameLabel(force) {
            vm.largeNameLabel = force != undefined || vm.treatment.name != '';
            vm.label_name = (vm.largeNameLabel) ? 'Name:' : 'Enter Treatment Name:';
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
                    $state.go('restricted.treatments.master', {
                        openTab: 'treatments'
                    });
                } else
                    failure();
            }
            function failure(err) {
                utils.showSimpleToast('Treatment can not be added at moment. Please Try Again!');
            }
        }
    }
})();