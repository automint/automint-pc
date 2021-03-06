/**
 * Controller to handle master view for displaying Treatments module
 * @author ndkcha
 * @since 0.5.0
 * @version 0.7.2
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlTrMaster', TreatmentMasterController);

    TreatmentMasterController.$inject = ['$rootScope', '$state'];

    function TreatmentMasterController($rootScope, $state) {
        //  initialize view model
        var vm = this;
        
        //  function maps
        vm.changeTreatmentsTab = changeTreatmentsTab;
        vm.changePackagesTab = changePackagesTab;
        
        //  default execution steps
        $rootScope.isCUSection = false;
        switch ($state.params.openTab) {
            case 'treatments':
                changeTreatmentsTab(true);
                break;
            case 'packages':
                changePackagesTab(true);
                break;
            case 'memberships':
                changeMembershipsTab(true);
                break;
            default:
                changeTreatmentsTab(true);
                // changeMembershipsTab(true);    //  testing purposes                
                break;
        }
        
        //  function definitions
        
        function changeTreatmentsTab(bool) {
            vm.treatmensTab = bool;
        }
        
        function changePackagesTab(bool) {
            vm.packagesTab = bool;
        }
        
        function changeMembershipsTab(bool) {
            vm.membershipsTab = bool;
        }
    }
})();