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
        vm.selectedMembership = undefined;
        
        //  function maps
        vm.evalVehicleTypes = evalVehicleTypes;
        vm.changeExpandValues = changeExpandValues;
        vm.expandMembership = expandMembership;
        vm.addMembership = addMembership;
        vm.editMembership = editMembership;
        vm.deleteMembership = deleteMembership;
        
        //  default execution steps
        getMemberships();
        
        //  function definitions
        
        function changeExpandValues(isExpandAll) {
            vm.isMembershipSelected = (isExpandAll) ? true : undefined;
            for (var i = 0; i < vm.memberships.length; i++) {
                vm.memberships[i].expanded = isExpandAll;
            }
        }
        
        function expandMembership(index) {
            index += (vm.query.page - 1)*(vm.query.limit);
            vm.memberships[index].expanded = !vm.memberships[index].expanded;
            for (var i = 0; i < vm.memberships.length; i++) {
                if (vm.memberships[i].expanded == true) {
                    vm.isMembershipSelected = true;
                    return;
                }
                vm.isMembershipSelected = undefined
            }
        }
        
        function addMembership() {
            $state.go('restricted.memberships.add');
        }
        
        function editMembership(name) {
            $state.go('restricted.memberships.edit', {
                name: name
            });
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
        
        function deleteMembership(name) {
            amTreatments.deleteMembership(name).then(success).catch(failure);
            
            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast('Membership has been deleted!');
                    getMemberships();
                } else
                    failure();
            }
            function failure(err) {
                utils.showSimpleToast('Could not delete membership at moment. Please Try Again!');
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