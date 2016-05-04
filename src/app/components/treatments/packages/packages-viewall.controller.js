/**
 * Controller for View All Packages compoenent
 * @author ndkcha
 * @since 0.5.0
 * @version 0.5.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlPkRA', PackagesViewAllController);

    PackagesViewAllController.$inject = ['$state', '$filter', 'utils', 'amTreatments'];

    function PackagesViewAllController($state, $filter, utils, amTreatments) {
        //  initialize view model
        var vm = this;
        
        //  named assignments to keep track of UI elements
        vm.query = {
            limit: 10,
            page: 1,
            total: 0
        };
        
        //  function maps
        vm.addPackage = addPackage;
        vm.evalVehicleTypes = evalVehicleTypes;
        
        //  default execution steps
        getPackages();
        
        //  function definitions
        
        function addPackage() {
            $state.go('restricted.packages.add');
        }
        
        function getPackages() {
            amTreatments.getPackages().then(success).catch(failure);
            
            function success(res) {
                vm.packages = res.packages;
                vm.query.total = res.total;
            }
            
            function failure(err) {
                vm.packages = [];
                vm.query.total = 0;
            }
        }
        
        function evalVehicleTypes(treatments) {
            var vehicleTypes = [];
            Object.keys(treatments).forEach(iterateTreatments);
            return vehicleTypes;
            
            function iterateTreatments(treatment) {
                Object.keys(treatments[treatment].rate).forEach(iterateRates);
                
                function iterateRates(rateType) {
                    rateType = utils.convertToTitleCase(rateType.replace(/-/g, ' '));
                    var found = $filter('filter')(vehicleTypes, rateType);
                    
                    if (!(found.length == 1 && found[0] == rateType)) {
                        vehicleTypes.push(rateType);
                    }
                }
            }
        }
    }
})();