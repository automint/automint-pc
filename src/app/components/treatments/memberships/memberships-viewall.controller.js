/**
 * Conroller for View All Memberships component
 * @author ndkcha
 * @since 0.5.0
 * @version 0.5.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlMsRA', MembershipsViewAll);
    
    MembershipsViewAll.$inject = ['$state', '$filter', 'utils', 'amTreatments'];
    
    function MembershipsViewAll($state, $filter, utils, amTreatments) {
        //  initialize view model
        var vm = this;
        
        //  named assignments to keep track of UI elements
        vm.query = {
            limit: 10,
            page: 1,
            total: 0
        };
        
        //  function maps
        vm.evalVehicleTypes = evalVehicleTypes;
        vm.addMembership = addMembership;
        
        //  default execution steps
        getMemberships();
        
        //  function definitions
        
        function addMembership() {
            $state.go('restricted.memberships.add');
        }
        
        function getMemberships() {
            amTreatments.getMemberships().then(success).catch(failure);
            
            function success(res) {
                vm.memberships = res.memberships;
                vm.query.total = res.total;
            }
            
            function failure(err) {
                vm.memberships = [];
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
                    var found = $filter('filter')(vehicleTypes, rateType, true);
                    
                    if (found.length == 0)
                        vehicleTypes.push(rateType);
                }
            }
        }
    }
})();