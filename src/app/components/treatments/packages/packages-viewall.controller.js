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
        vm.isExpandAll = false;
        
        //  function maps
        vm.changeExpandValues = changeExpandValues;
        vm.expandPackage = expandPackage;
        vm.addPackage = addPackage;
        vm.evalVehicleTypes = evalVehicleTypes;
        vm.deletePackage = deletePackage;
        vm.editPackage = editPackage;
        vm.calculateTotal = calculateTotal;
        
        //  default execution steps
        getPackages();
        
        //  function definitions
        
        function calculateTotal(vehicletype, index) {
            var total = 0;
            if (vm.packages[index])
                Object.keys(vm.packages[index].treatments).forEach(iterateTreatments);
            return total;
            
            function iterateTreatments(treatment) {
                if (vm.packages[index].treatments[treatment].rate[vehicletype.toLowerCase().replace(' ', '-')] == undefined || vm.packages[index].treatments[treatment].rate[vehicletype.toLowerCase().replace(' ', '-')] == '')
                    return;
                total += vm.packages[index].treatments[treatment].rate[vehicletype.toLowerCase().replace(' ', '-')];
            }
        }
        
        function changeExpandValues() {
            vm.isExpandAll = !vm.isExpandAll;
            vm.isPackageSelected = (vm.isExpandAll) ? true : undefined;
            for (var i = 0; i < vm.packages.length; i++) {
                vm.packages[i].expanded = vm.isExpandAll;
            }
        }
        
        function expandPackage(index) {
            index += (vm.query.page - 1)*(vm.query.limit);
            vm.packages[index].expanded = !vm.packages[index].expanded;
            for (var i = 0; i < vm.packages.length; i++) {
                if (vm.packages[i].expanded == true) {
                    vm.isPackageSelected = true;
                    return;
                }
                vm.isPackageSelected = undefined
            }
        }
        
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
        
        function editPackage(name) {
            $state.go('restricted.packages.edit', {
                name: name
            });
        }
        
        function deletePackage(name) {
            amTreatments.deletePackage(name).then(success).catch(failure);
            
            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast('Package has been deleted!');
                    getPackages();
                } else
                    failure();
            }
            function failure(err) {
                utils.showSimpleToast('Package can not be deleted at moment. Please Try Again!');
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
                    var found = $filter('filter')(vehicleTypes, rateType, true);
                    
                    if (found.length == 0)
                        vehicleTypes.push(rateType);
                }
            }
        }
    }
})();