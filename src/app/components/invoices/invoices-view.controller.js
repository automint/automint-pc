/**
 * Controller for View Invoice component
 * @author ndkcha
 * @since 0.5.0
 * @version 0.6.1 
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
        vm.calculateServiceTax = calculateServiceTax;
        vm.editService = editService;
        vm.isRoundOff = false;
        vm.isDiscountApplied = false;
        vm.calculateVat = calculateVat;

        //  default execution steps
        if ($state.params.userId == undefined || $state.params.vehicleId == undefined || $state.params.serviceId == undefined) {
            utils.showSimpleToast('Something went wrong. Please try again!')
            $state.go('restricted.services.all');
            return;
        }
        fillInvoiceDetails();
        loadInvoiceWLogo();
        getIvAlignMargins();
    
        //  electron watchers
        eIpc.on('am-invoice-mail-sent', OnInvoiceMailSent);

        //  function definitions

        function getIvAlignMargins() {
            amInvoices.getIvAlignMargins().then(success).catch(failure);

            function success(res) {
                vm.alignmentMargins = res;
                if (res.enabled) {
                    var t = document.getElementById('am-invoice-body');
                    t.style.paddingTop = res.top + 'cm';
                    t.style.paddingBottom = res.bottom + 'cm';
                }
            }

            function failure(err) {
                console.log('Cound not find margin settings');
            }
        }
        
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
        
        function editService() {
            $state.go('restricted.services.edit', {
                userId: $state.params.userId,
                vehicleId: $state.params.vehicleId,
                serviceId: $state.params.serviceId,
                fromState: 'invoice'
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
                vm.isRoundOff = (vm.service.roundoff != undefined);
                vm.isDiscountApplied = (vm.service.discount != undefined);
                vm.sTaxSettings = {
                    applyTax: res.service.serviceTax.applyTax,
                    inclusive: (res.service.serviceTax.taxIncType == 'inclusive'),
                    tax: res.service.serviceTax.tax
                };
                vm.vatSettings = {
                    applyTax: res.service.vat.applyTax,
                    inclusive: (res.service.vat.taxIncType == 'inclusive'),
                    tax: res.service.vat.tax
                }
            }

            function failure(err) {
                getDisplaySettings();
                $log.info('Could not load details');
            }
        }

        function calculateVat() {
            var tax = 0;
            if (!vm.service.vat.applyTax)
                return 0;
            vm.service.inventories.forEach(iterateInventories);
            tax = (tax % 1 != 0) ? tax.toFixed(2) : tax; 
            if (tax == 0)
                vm.vatSettings.applyTax = false;
            return tax;

            function iterateInventories(inventory) {
                tax += inventory.tax;
            }
        }
        
        function calculateServiceTax() {
            var tax = 0;
            if (!vm.service.serviceTax.applyTax)
                return 0;
            vm.service.problems.forEach(iterateProblems);
            if (vm.service.packages)
                vm.service.packages.forEach(iteratePackages);
            if (tax == 0)
                vm.sTaxSettings.applyTax = false;
            return tax;
            
            function iterateProblems(problem) {
                tax += problem.tax;
            }
            
            function iteratePackages(package) {
                package.treatments.forEach(iterateTreatments);
                
                function iterateTreatments(treatment) {
                    tax += treatment.tax;
                }
            }
        }

        //  load workshop logo in invoice settings
        function loadInvoiceWLogo() {
            var source = localStorage.getItem('invoice-w-pic');
            vm.invoiceWLogo = source;
        }

        //  load display settings
        function getDisplaySettings() {
            amInvoices.getIvSettings().then(success).catch(failure);

            function success(res) {
                if (res.display.workshopLogo)
                    addInvoiceWLogo();
                vm.ivSettings = res; 
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
            if (vm.user.email == undefined || vm.user.email == '') {
                utils.showSimpleToast(vm.user.name + '\'s email has not been set. Email can not be sent!');
                return;
            }
            var t = document.getElementById('am-invoice-body');
            if (vm.alignmentMargins.enabled) {
                t.style.paddingTop = 0;
                t.style.paddingBottom = 0;
            }
            var amInScFb = document.getElementById('am-invoice-social-facebook');
            var amInScIn = document.getElementById('am-invoice-social-instagram');
            var amInScTw = document.getElementById('am-invoice-social-twitter');
            if (vm.workshop.social.enabled) {
                amInScFb.src = 'https://www.facebook.com/images/fb_icon_325x325.png';
                amInScIn.src = 'http://3835642c2693476aa717-d4b78efce91b9730bcca725cf9bb0b37.r51.cf1.rackcdn.com/Instagram_App_Large_May2016_200.png';
                amInScTw.src = 'https://g.twimg.com/Twitter_logo_blue.png';
            }
            removeInvoiceWLogo();
            var printObj = document.getElementById('am-invoice-mail-body');
            utils.showSimpleToast('Sending Mail...');
            ammMailApi.send(printObj.innerHTML, vm.user, (vm.workshop) ? vm.workshop.name : undefined, (vm.ivSettings) ? vm.ivSettings.emailsubject : undefined);
            if (vm.workshop.social.enabled) {
                amInScFb.src = 'assets/img/facebook.svg';
                amInScIn.src = 'assets/img/instagram.svg';
                amInScTw.src = 'assets/img/twitter.svg';
            }
            if (vm.ivSettings.display.workshopLogo)
                addInvoiceWLogo();
            if (vm.alignmentMargins.enabled) {
                t.style.paddingTop = vm.alignmentMargins.top + 'cm';
                t.style.paddingBottom = vm.alignmentMargins.bottom + 'cm';
            }
        }

        function goBack() {
            var transitState = 'restricted.services.all';
            var transitParams = undefined;
            if ($state.params.fromState) {
                switch ($state.params.fromState) {
                    case 'dashboard':
                        transitState = 'restricted.dashboard';
                        break;
                    case 'customers.edit.services':
                        transitState = 'restricted.customers.edit';
                        transitParams = {
                            id: $state.params.userId,
                            openTab: 'services'
                        }
                        break;
                }
            }
            $state.go(transitState, transitParams);
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