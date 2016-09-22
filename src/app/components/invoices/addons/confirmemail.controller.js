/**
 * Controller for Confirm Email dialog box in Invoice
 * @author ndkcha
 * @since 0.7.0
 * @version 0.8.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amIvConfirmEmailCtrl', ConfirmemailController);

    //  dependency injections for Confirm Email controller
    ConfirmemailController.$inject = ['$mdDialog', 'utils', 'user'];

    function ConfirmemailController($mdDialog, utils, user) {
        //  initialize view model
        var vm = this;

        //  temporary assignments for the instance
        //  no such assignments

        //  named assignments for view model
        vm.user = user;

        //  function maps to view model
        vm.sendInvoice = sendInvoice;
        vm.cancelInvoice = cancelInvoice;
        
        //  function definitions
        
        function sendInvoice() {
            if (vm.user.email == '' || vm.user.email == undefined) {
                utils.showSimpleToast('Please Enter Email Address');
                return;
            }
            $mdDialog.hide(vm.user.email);
        }

        function cancelInvoice() {
            $mdDialog.cancel();
        }
    }
})();