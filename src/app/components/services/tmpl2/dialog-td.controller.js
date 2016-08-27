/**
 * Controller to handle Treatment Details (td) dialog box
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlSeTd', TdController);

    TdController.$inject = ['$mdDialog', 'problem'];

    function TdController($mdDialog, problem) {
        //  intialize view model
        var vm = this;

        //  temporary assignments for controller instance
        //  no such assignments

        //  named assignments for view model
        vm.problem = problem;

        //  function mappings to view model
        vm.OnKeyDown = OnKeyDown;
        vm.submit = submit;

        //  default execution steps
        setTimeout(focusOriginalCost, 800);

        //  function definitions
        
        function focusOriginalCost() {
            $('#ami-dtd-orgcost').focus();
        }

        function OnKeyDown(event) {
            if (event.keyCode == 13)
                submit();
        }

        function submit() {
            $mdDialog.hide(vm.problem);
        }
    }
})();