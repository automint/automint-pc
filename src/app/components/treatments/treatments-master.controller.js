/**
 * Controller to handle master view for displaying Treatments module
 * @author ndkcha
 * @since 0.5.0
 * @version 0.5.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlTrMaster', TreatmentMasterController);

    TreatmentMasterController.$inject = ['$state'];

    function TreatmentMasterController($state) {
        //  initialize view model
        var vm = this;
        
        //  function maps
        vm.changeTreatmentsTab = changeTreatmentsTab;
        vm.changePackagesTab = changePackagesTab;
        
        //  default execution steps
        switch ($state.params.openTab) {
            case 'treatments':
                changeTreatmentsTab(true);
                break;
            case 'packages':
                changePackagesTab(true);
                break;
            default:
                // changeTreatmentsTab(true);
                changePackagesTab(true);    //  testing purposes                
                break;
        }
        
        //  function definitions
        
        function changeTreatmentsTab(bool) {
            vm.treatmensTab = bool;
        }
        
        function changePackagesTab(bool) {
            vm.packagesTab = bool;
        }
    }
})();