/**
 * Controller for Edit Treatments component
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlTrUI', TreatmentsEditController);
    
    TreatmentsEditController.$inject = ['$state', '$filter', 'utils', 'amTreatments'];
    
    function TreatmentsEditController($state, $filter, utils, amTreatments) {
        //  initialize view model object
        var vm = this;
        
        //  temporary named assignments
        var treatmentName = $state.params.name;

        //  named assignments to keep track of UI elements
        vm.label_name = 'Enter Treatment Name';
        vm.treatment = {
            name: ''
        };
        vm.rates = [];
        vm.operationMode = 'edit';
        vm.save = save;
        vm.addRate = addRate;

        //  function-maps
        vm.changeNameLabel = changeNameLabel;
        vm.isAddOperation = isAddOperation;
        
        //  default execution steps
        if (treatmentName == '' || treatmentName == undefined) {
            utils.showSimpleToast('Something went wrong! Please Try Again!');
            $state.go('restricted.treatments.all');
            return;
        }
        getVehicleTypes();
        
        //  auto load treatment details
        function loadTreatment() {
            amTreatments.treatmentDetails(treatmentName).then(treatmentsFound);
            
            function treatmentsFound(res) {
                vm.treatment.name = res.name;
                changeNameLabel();
                Object.keys(res.rate).forEach(iterateRate);
                
                function iterateRate(rk) {
                    var found = $filter('filter')(vm.rates, {
                        type: utils.convertToTitleCase(rk.replace(/-/g, ' '))
                    });
                    if (found.length == 1)
                        found[0].value = res.rate[rk];
                }
            }
        }

        //  function definitions
        function isAddOperation() {
            return (vm.operationMode == 'add');
        }
        
        function getVehicleTypes() {
            amTreatments.getVehicleTypes().then(success).catch(failure);
            
            function success(res) {
                res.forEach(iterateVehicleType);
                loadTreatment();
                
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
                });
                loadTreatment();
            }
        }
        
        function addRate() {
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
                    utils.showSimpleToast('Treatment has been updated');
                    $state.go('restricted.treatments.all');
                } else
                    failure();
            }
            function failure(err) {
                utils.showSimpleToast('Treatment can not be updated at moment. Please Try Again!');
            }
        }
    }
})();