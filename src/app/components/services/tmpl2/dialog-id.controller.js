/**
 * Controller to handle Inventory Details (td) dialog box
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlSeId', IdController);

    IdController.$inject = ['$mdDialog', 'inventory'];

    function IdController($mdDialog, inventory) {
        //  intialize view model
        var vm = this;

        //  temporary assignments for controller instance
        //  no such assignments

        //  named assignments for view model
        vm.inventory = inventory;

        //  function mappings to view model
        vm.OnKeyDown = OnKeyDown;
        vm.submit = submit;
        vm.getDate = getDate;
        vm.clearall = clearall;

        //  default execution steps
        setTimeout(focusOriginalCost, 800);
        if (vm.inventory.purchasedate)
            vm.inventory.purchasedate = new Date(vm.inventory.purchasedate);

        //  function definitions

        function clearall() {
            delete vm.inventory.orgcost;
            delete vm.inventory.vendor;
        }

        function getDate(date) {
            return moment(date).format('DD MMM YYYY');
        }
        
        function focusOriginalCost() {
            $('#ami-did-orgcost').focus();
        }

        function OnKeyDown(event) {
            if (event.keyCode == 13)
                submit();
        }

        function submit() {
            vm.inventory.purchasedate = moment(vm.inventory.purchasedate).format();
            $mdDialog.hide(vm.inventory);
        }
    }
})();