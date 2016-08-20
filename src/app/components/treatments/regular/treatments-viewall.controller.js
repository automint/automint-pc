/**
 * Controller for View All Treatments component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlTrRA', TreatmentsViewAll);

    TreatmentsViewAll.$inject = ['$rootScope', '$scope', '$state', 'utils', 'amTreatments'];

    function TreatmentsViewAll($rootScope, $scope, $state, utils, amTreatments) {
        //  initialize view model
        var vm = this;
        
        //  named assignments for tracking UI elements
        vm.selectedTreatments = [];
        vm.query = {
            limit: 10,
            page: 1,
            total: 0
        };
        vm.treatments = [];
        vm.vehicletypes = [];
        
        //  temporary named assignments
        var skipWsDal = true;
        
        //  function maps
        vm.addTreatment = addTreatment;
        vm.getTreatments = getTreatments;
        vm.deleteTreatment = deleteTreatment;
        vm.editTreatment = editTreatment;
        vm.getRate = getRate;
        
        //  default execution steps
        amTreatments.getTreatmentSettings().then(treatmentSettingFound).catch(noSettingFound);
        getVehicleTypes();
        getTreatments();
        
        //  watchers
        $scope.$watch('trVm.stgDisplayAsList', listenToDisplayAsList);
        
        //  function definitions
        
        //  listeners
        function listenToDisplayAsList(newValue, oldValue) {
            if (skipWsDal) {
                skipWsDal = false;
                return;
            }
            if (newValue != oldValue)
                amTreatments.changeDisplayAsList(vm.stgDisplayAsList).then(success).catch(failure);
            
            function success(res) {
                if (res.ok)
                    utils.showSimpleToast('Settings Saved!');
                else
                    failure();
            } 
            function failure(err) {
                skipWsDal = true;
                vm.stgDisplayAsList = !vm.stgDisplayAsList;
                utils.showSimpleToast('Could not save settings at moment. Please Try Again!');
            }
        }
        
        //  get current treatment settings [BEGIN]
        function treatmentSettingFound(res) {
            skipWsDal = true;
            vm.stgDisplayAsList = (res.displayAsList != undefined) ? res.displayAsList : false;
        }
        function noSettingFound(err) {
            skipWsDal = true;
            vm.stgDisplayAsList = false;
        }
        //  get current treatment settings [END]
        
        //  get vehicle types to display headers on datatable
        function getVehicleTypes() {
            amTreatments.getVehicleTypes().then(success).catch(failure);
            
            function success(res) {
                res.forEach(iterateVehicleType);
                
                function iterateVehicleType(type) {
                    vm.vehicletypes.push(utils.convertToTitleCase(type.replace(/-/g, ' ')));
                }
            }
            
            function failure(err) {
                vm.vehicletypes = [];
            }
        }
        
        //  get rate
        function getRate(rate, type) {
            return rate[angular.lowercase(type).replace(/\s/g, '-')];
        }
        
        //  fetch relevant treatments from database
        function getTreatments() {
            vm.promise = amTreatments.getTreatments().then(success).catch(failure);
            
            function success(res) {
                vm.treatments = res.treatments;
                vm.query.total = res.treatments.length;
            }
            
            function failure(error) {
                vm.treatments = [];
                vm.query.total = 0;
            }
        }
        
        //  edit treatment details
        function editTreatment(name) {
            $state.go('restricted.treatments.edit', {
                name: name
            })
        }
        
        //  callback for add treatment button
        function addTreatment() {
            $state.go('restricted.treatments.add');
        }
        
        //  callback for delete treatment button
        function deleteTreatment(name) {
            amTreatments.deleteTreatment(name).then(success).catch(failure);
            
            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast('Treatment has been deleted!');
                    getTreatments();
                } else
                    failure();
            }
            function failure(err) {
                utils.showSimpleToast('Treatment can not be deleted at moment. Please Try Again!');
            }
        }
    }
})();