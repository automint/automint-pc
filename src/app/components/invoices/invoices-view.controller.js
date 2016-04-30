/**
 * Controller for View Invoice component
 * @author ndkcha
 * @since 0.5.0
 * @version 0.5.0 
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    //  import node dependencies and other automint modules
    const ammPrint = require('./automint_modules/print/am-print.js');
    const ammMailApi = require('./automint_modules/am-mailer.js');

    //  angular code 
    angular.module('automintApp').controller('amCtrlIvRI', InvoicesViewController);

    InvoicesViewController.$inject = ['$q', '$log', '$state', '$window', 'utils', 'amInvoices'];

    function InvoicesViewController($q, $log, $state, $window, utils, amInvoices) {
        //  initialize view model
        var vm = this;

        //  named assignments to keep track of UI elements
        vm.isFabOpen = true;
        vm.fabClass = '';

        //  function maps
        vm.test = test;
        vm.printInvoice = printInvoice;
        vm.mailInvoice = mailInvoice;
        vm.goBack = goBack;
        vm.editWorkshopInfo = editWorkshopInfo;
        vm.openFab = openFab;
        vm.closeFab = closeFab;

        //  default execution steps
        if ($state.params.userId == undefined || $state.params.vehicleId == undefined || $state.params.serviceId == undefined) {
            utils.showSimpleToast('Something went wrong. Please try again!')
            $state.go('restricted.services.all');
            return;
        }
        fillInvoiceDetails();
        loadInvoiceWLogo();

        //  function definitions
        
        function openFab() {
            if (vm.fabClass == '')
                vm.fabClass = 'md-scale';
            vm.isFabOpen = true;
            vm.showFabTooltip = true;
        }
        
        function closeFab() {
            vm.isFabOpen = false;
            vm.showFabTooltip = false;
        }
        
        //  edit workshop info
        function editWorkshopInfo() {
            $state.go('restricted.settings', {
                openTab: 'invoice'
            });
        }

        //  fill invoice details
        function fillInvoiceDetails() {
            amInvoices.getWorkshopDetails().then(fillWorkshopDetails).catch(failure);
            amInvoices.getServiceDetails($state.params.userId, $state.params.vehicleId, $state.params.serviceId).then(fillServiceDetails).catch(failure);

            function fillWorkshopDetails(res) {
                vm.workshop = res;
                vm.workshop.label_phone = (vm.workshop.phone || vm.workshop.phone != '') ? '(M)' : '&nbsp;';
                getDisplaySettings();
            }

            function fillServiceDetails(res) {
                vm.user = res.user;
                vm.vehicle = res.vehicle;
                vm.service = res.service;
            }

            function failure(err) {
                getDisplaySettings();
                $log.info('Could not load details');
            }
        }

        //  load workshop logo in invoice settings
        function loadInvoiceWLogo() {
            var source = localStorage.getItem('invoice-w-pic');
            vm.invoiceWLogo = source;
            if (!vm.invoiceWLogo)
                removeInvoiceWLogo();
        }

        //  load display settings
        function getDisplaySettings() {
            amInvoices.getDisplaySettings().then(success).catch(failure);

            function success(res) {
                if (!res.workshopDetails) {
                    vm.workshop = {};
                }
                if (!res.workshopLogo)
                    removeInvoiceWLogo();
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

        //  send email
        function mailInvoice() {
            var elem = document.getElementsByClassName('am-blank-padding');
            for (var i=0; i<elem.length; i++) {
                var e = elem[i];
                e.innerHTML = '';
            }
            var printObj = document.getElementById('am-invoice-mail-body');
            // console.log(printObj.innerHTML);
            ammMailApi.send(printObj.innerHTML, vm.service.invoiceno, vm.user);
            for (var i=0; i<elem.length; i++) {
                var e = elem[i];
                e.innerHTML = '&nbsp;';
            }
        }

        function goBack() {
            $window.history.back();
        }

        function removeInvoiceWLogo() {
            var elem = document.getElementById('am-invoice-w-logo');
            elem.parentNode.removeChild(elem);
        }

        //  test zone [BEGIN]
        function test() {
            console.log('You have reached test');
        }
        //  test zone [END]
    }
})();