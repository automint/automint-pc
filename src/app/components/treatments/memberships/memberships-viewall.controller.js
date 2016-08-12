/**
 * Conroller for View All Memberships component
 * @author ndkcha
 * @since 0.5.0
 * @version 0.7.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlMsRA', MembershipsViewAll);
    
    MembershipsViewAll.$inject = ['$rootScope', '$state', '$filter', 'utils', 'amTreatments'];
    
    function MembershipsViewAll($rootScope, $state, $filter, utils, amTreatments) {
        //  initialize view model
        var vm = this;
        
        //  named assignments to keep track of UI elements
        vm.query = {
            limit: 10,
            page: 1,
            total: 0
        };
        vm.selectedMembership = undefined;
        vm.isExpandAll = false;
        vm.currencySymbol = "Rs.";
        
        //  function maps
        vm.changeExpandValues = changeExpandValues;
        vm.expandMembership = expandMembership;
        vm.addMembership = addMembership;
        vm.editMembership = editMembership;
        vm.deleteMembership = deleteMembership;
        vm.IsMembershipVisible = IsMembershipVisible;
        
        //  default execution steps
        if ($rootScope.isAmDbLoaded)
            defaultExecutionSteps(true, false);
        else
            $rootScope.$watch('isAmDbLoaded', defaultExecutionSteps);
        
        //  function definitions

        function defaultExecutionSteps(newValue, oldValue) {
            if (newValue) {
                getCurrencySymbol();
                getMemberships(changeExpandValues);
            }
        }

        function getCurrencySymbol() {
            amTreatments.getCurrencySymbol().then(success).catch(failure);

            function success(res) {
                vm.currencySymbol = res;
            }

            function failure(err) {
                vm.currencySymbol = "Rs.";
            }
        }
        
        function changeExpandValues() {
            vm.isExpandAll = !vm.isExpandAll;
            vm.isMembershipSelected = (vm.isExpandAll) ? true : undefined;
            for (var i = 0; i < vm.memberships.length; i++) {
                vm.memberships[i].expanded = vm.isExpandAll;
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
            var callback = arguments[0];
            var callingFunction = this;
            var callbackArgs = arguments;
            
            amTreatments.getMemberships().then(success).catch(failure);
            
            function success(res) {
                vm.memberships = res.memberships;
                vm.query.total = res.total;
                if (callback)
                    callback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 1));
            }
            
            function failure(err) {
                vm.memberships = [];
                vm.query.total = 0;
                if (callback)
                    callback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 1));
            }
        }
        
        function IsMembershipVisible(membership) {
            return (Object.keys(membership.treatments).length > 0);
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
    }
})();