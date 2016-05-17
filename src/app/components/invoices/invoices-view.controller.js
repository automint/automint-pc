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
    const eIpc = require("electron").ipcRenderer;

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
    
        //  electron watchers
        eIpc.on('am-invoice-mail-sent', OnInvoiceMailSent);

        //  function definitions
        
        function OnInvoiceMailSent(event, arg) {
            var message = (arg) ? 'Mail has been sent!' : 'Could not sent email. Please Try Again!'; 
            utils.showSimpleToast(message);
        }

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
                vm.sTaxSettings = {
                    applyTax: res.service.serviceTax.applyTax,
                    inclutionAdjust: (res.service.serviceTax.taxIncType == 'adjust'),
                    tax: res.service.serviceTax.tax
                };
                vm.service.problems.forEach(iterateProblems);
                
                function iterateProblems(problem) {
                    if (vm.service.serviceTax && vm.service.serviceTax.applyTax && vm.service.serviceTax.taxIncType == 'adjust') {
                        problem.rate = Math.round(parseFloat(problem.rate) + parseFloat(problem.rate)*problem.tax/100);
                    }
                }
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
            if (vm.invoiceWLogo)
                addInvoiceWLogo();
        }

        //  load display settings
        function getDisplaySettings() {
            amInvoices.getDisplaySettings().then(success).catch(failure);

            function success(res) {
                if (!res.workshopDetails) {
                    vm.workshop = {};
                }
                if (res.workshopLogo)
                    addInvoiceWLogo();
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
            removeInvoiceWLogo();
            var elem = document.getElementsByClassName('am-blank-padding');
            for (var i = 0; i < elem.length; i++) {
                var e = elem[i];
                e.innerHTML = '';
            }
            var printObj = document.getElementById('am-invoice-mail-body');
            utils.showSimpleToast('Sending Mail...');
            ammMailApi.send(printObj.innerHTML, vm.service.invoiceno, vm.user);
            for (var i = 0; i < elem.length; i++) {
                var e = elem[i];
                e.innerHTML = '&nbsp;';
            }
            addInvoiceWLogo();
        }

        function goBack() {
            $window.history.back();
        }

        function addInvoiceWLogo() {
            var elem = document.getElementById('am-invoice-w-logo-holder');
            if (elem.hasChildNodes())
                return;
            var x = document.createElement("IMG");
            x.setAttribute("src", vm.invoiceWLogo);
            x.setAttribute("width", "250");
            x.setAttribute("height", "125");
            elem.appendChild(x);
        }

        function removeInvoiceWLogo() {
            var elem = document.getElementById('am-invoice-w-logo-holder');
            while (elem.firstChild) {
                elem.removeChild(elem.firstChild);
            }
        }

        //  test zone [BEGIN]
        function test() {
            console.log('You have reached test');
        }
        //  test zone [END]
    }
})();