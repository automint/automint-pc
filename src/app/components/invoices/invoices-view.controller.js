/**
 * Controller for View Invoice component
 * @author ndkcha
 * @since 0.5.0
 * @version 0.5.0 
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    //  import node dependencies and other automint modules
    var ammSaveHtml = require('./automint_modules/print/am-save-html.js');
    const ammPrint = require('./automint_modules/print/am-print.js');
    
    //  angular code 
    angular.module('automintApp').controller('amCtrlIvRI', InvoicesViewController);

    InvoicesViewController.$inject = ['$q', '$log', '$state', 'utils', 'amInvoices'];

    function InvoicesViewController($q, $log, $state, utils, amInvoices) {
        //  initialize view model
        var vm = this;
        
        //  named assignments to keep track of UI elements
        vm.fabOptions = {
            isOpen: false
        }
        
        //  function maps
        vm.test = test;
        vm.printInvoice = printInvoice;
        
        //  default execution steps
        if ($state.params.userId == undefined || $state.params.vehicleId == undefined || $state.params.serviceId == undefined) {
            utils.showSimpleToast('Something went wrong. Please try again!')
            $state.go('restricted.services.all');
            return;
        }
        getDisplaySettings();
        fillInvoiceDetails();
        loadInvoiceWLogo();
        
        //  function definitions
        
        //  fill invoice details
        function fillInvoiceDetails() {
            $q.all([
                amInvoices.getWorkshopDetails(),
                amInvoices.getServiceDetails($state.params.userId, $state.params.vehicleId, $state.params.serviceId)
            ]).then(success).catch(failure);
            
            function success(res) {
                vm.workshop = res[0];
                vm.user = res[1].user;
                vm.vehicle = res[1].vehicle;
                vm.service = res[1].service;
            }
            function failure(err) {
                console.log(err);
            }
        }
        
        //  load workshop logo in invoice settings
        function loadInvoiceWLogo() {
            var source = localStorage.getItem('invoice-w-pic');
            vm.invoiceWLogo = source;
        }
        
        //  load display settings
        function getDisplaySettings() {
            amInvoices.getDisplaySettings().then(success).catch(failure);
            
            function success(res) {
                vm.displaySettings = res;
            }
            
            function failure(err) {
                $log.info('Could not load display settings!');
            }
        }
        
        //  print receipt
        function printInvoice() {
            var printObj = document.getElementById('am-invoice-body');
            ammPrint.doPrint(printObj.innerHTML);
        }
        
        //  test zone [BEGIN]
        function test() {
            console.log('You have reached test');
        }
        //  test zone [END]
    }
})();