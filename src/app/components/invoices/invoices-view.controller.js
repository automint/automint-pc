/**
 * Controller for View Invoice component
 * @author ndkcha
 * @since 0.5.0
 * @version 0.7.2
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    //  import node dependencies and other automint modules
    const ammPrint = require('./automint_modules/print/am-print.js');
    const ammMailApi = require('./automint_modules/am-mailer.js');
    const eIpc = require("electron").ipcRenderer;

    //  angular code 
    angular.module('automintApp')
        .controller('amCtrlIvRI', InvoicesViewController)
        .controller('amCtrlCmI', ConfirmMailController);

    InvoicesViewController.$inject = ['$rootScope', '$q', '$log', '$state', '$window', '$mdDialog', 'utils', 'amInvoices'];
    ConfirmMailController.$inject = ['$mdDialog', 'utils', 'user'];

    function InvoicesViewController($rootScope, $q, $log, $state, $window, $mdDialog, utils, amInvoices) {
        //  initialize view model
        var vm = this;

        var oCustomerEmail;
        var rowCount = 0, membershipTreatmentCount = 0, packageTreatmentCount = 0, treatmentCount = 0, inventoryCount = 0, packageCount = {}, membershipCount = {};

        //  named assignments to keep track of UI elements
        vm.isFabOpen = true;
        vm.fabClass = '';
        vm.subtotal = 0;
        vm.currencySymbol = "Rs.";
        vm.taxSettings = [];
        vm.invoicePageSizeList = ['Single Page', 'A4'];
        vm.invoicePageSize = vm.invoicePageSizeList[0];
        vm.pages = [];

        //  function maps
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
        vm.IsSocialFacebook = IsSocialFacebook;
        vm.IsSocialInstagram = IsSocialInstagram;
        vm.IsSocialTwitter = IsSocialTwitter;
        vm.initiateMailInvoiceProcess = initiateMailInvoiceProcess;
        vm.IsInvoiceAvailable = IsInvoiceAvailable;
        vm.IsSubtotalEnabled = IsSubtotalEnabled;
        vm.calculateSubtotal = calculateSubtotal;
        vm.IsTaxEnabled = IsTaxEnabled;
        vm.IsHeaderAvailable = IsHeaderAvailable;
        vm.IsLastPage = IsLastPage;
        vm.currentPage = currentPage;
        vm.IsNotSinglePage = IsNotSinglePage;
        vm.IsCustomerNotAnonymus = IsCustomerNotAnonymus;
        vm.IsVehicleNotAnonymus = IsVehicleNotAnonymus;
        vm.getIndexCount = getIndexCount;
        vm.restrictNumbers = restrictNumbers;
    
        //  electron watchers
        eIpc.on('am-invoice-mail-sent', OnInvoiceMailSent);

        //  default execution steps

        if ($state.params.userId == undefined || $state.params.vehicleId == undefined || $state.params.serviceId == undefined) {
            utils.showSimpleToast('Something went wrong. Please try again!')
            $state.go('restricted.services.all');
            return;
        }
        getCurrencySymbol();
        fillInvoiceDetails();
        loadInvoiceWLogo();
        loadInvoiceFLogo();
        getIvAlignMargins();
        getInvoicePageSize();

        //  function definitions

        function restrictNumbers(number) {
            number = parseFloat(number);
            return ((number % 1 != 0) ? number.toFixed(2) : parseInt(number));
        }

        function getIndexCount(root) {
            return (root - 1);
        }

        function IsVehicleNotAnonymus() {
            if (vm.vehicle == undefined)
                return false;
            return (vm.vehicle.reg != 'Vehicle');
        }

        function IsCustomerNotAnonymus() {
            if (vm.user == undefined)
                return false;
            return (vm.user.name != 'Anonymous');
        }

        function loadInvoiceFLogo() {
            var source = localStorage.getItem('invoice-f-pic');
            vm.invoiceFLogo = source;
        }

        function addInvoiceFLogo() {
            var elems = document.getElementsByName('am-invoice-f-logo-holder');
            elems.forEach(iterateElements);

            function iterateElements(elem) {
                if (elem.hasChildNodes())
                    return;
                var x = document.createElement("IMG");
                x.setAttribute("src", vm.invoiceFLogo);
                elem.appendChild(x);
            }
        }

        function removeInvoiceFogo() {
            var elems = document.getElementsByName('am-invoice-f-logo-holder');
            elems.forEach(iterateElements);

            function iterateElements(elem) {
                while (elem.firstChild) {
                    elem.removeChild(elem.firstChild);
                }
            }
        }

        function IsNotSinglePage() {
            return (vm.pages.length > 1);
        }

        function currentPage(index) {
            return (index + 1);
        }

        function IsLastPage(index) {
            return (index == (vm.pages.length - 1));
        }

        function doPagination() {
            vm.pages = [];
            var membershippages = 0, packagepages = 0, treatmentpages = 0, inventorypages = 0;
            if (rowCount > 15) {
                var pageCount = Math.ceil(rowCount / 15);
                var mtc = membershipTreatmentCount, ptc = packageTreatmentCount, tc = treatmentCount, ic = inventoryCount;
                for (var i = 0; i < pageCount; i++) {
                    if (mtc > 15) {
                        var ms = 0, mst = 0;
                        Object.keys(membershipCount).forEach(iterateMemberships);
                        membershippages++;
                        pushPages(ms, 0, 0, 0);
                        mtc -= mst;
                        continue;

                        function iterateMemberships(membership) {
                            mst += membershipCount[membership];
                            if (mst < 15) {
                                ms++;
                                delete membershipCount[membership];
                            }
                        }
                    }
                    var total = 0;
                    total = mtc + ptc;
                    if (total > 15) {
                        var ps = 0, ms = 0, pst = 0, mst = 0;
                        Object.keys(membershipCount).forEach(iterateMemberships);
                        Object.keys(packageCount).forEach(iteratePackages);
                        ptc = 15 - mtc;
                        packagepages++;
                        if (ms != 0)
                            membershippages++;
                        pushPages(ms, ps, 0, 0);
                        mtc = 0;
                        continue;

                        function iterateMemberships(membership) {
                            mst += membershipCount[membership];
                            if (mst < 15) {
                                ms++;
                                delete membershipCount[membership];
                            }
                        }

                        function iteratePackages(package) {
                            pst += packageCount[package];
                            if (pst < 15) {
                                ps++;
                                delete packageCount[package];
                            }
                        }
                    }
                    total = mtc + ptc + tc;
                    if (total > 15) {
                        var ps = 0, ms = 0, pst = 0, mst = 0;
                        Object.keys(membershipCount).forEach(iterateMemberships);
                        Object.keys(packageCount).forEach(iteratePackages);
                        tc = 15 - mtc - ptc;
                        if (ms != 0)
                            membershippages++;
                        if (ps != 0)
                            packagepages++;
                        treatmentpages++;
                        pushPages(ms, ps, tc, 0);
                        mtc = 0;
                        ptc = 0;
                        continue;

                        function iterateMemberships(membership) {
                            mst += membershipCount[membership];
                            if (mst < 15) {
                                ms++;
                                delete membershipCount[membership];
                            }
                        }

                        function iteratePackages(package) {
                            pst += packageCount[package];
                            if (pst < 15) {
                                ps++;
                                delete packageCount[package];
                            }
                        }
                    }
                    total = mtc + ptc + tc + ic;
                    if (total > 15) {
                        var ps = 0, ms = 0, pst = 0, mst = 0;
                        Object.keys(membershipCount).forEach(iterateMemberships);
                        Object.keys(packageCount).forEach(iteratePackages);
                        ic = 15 - mtc - ptc - tc;
                        if (ic == 0)
                            ic = 1;
                        if (ms != 0)
                            membershippages++;
                        if (ps != 0)
                            packagepages++;
                        if (tc != 0)
                            treatmentpages++;
                        inventorypages++;
                        pushPages(ms, ps, tc, ic);
                        mtc = 0;
                        ptc = 0;
                        tc = 0;
                        ic = inventoryCount - ic;
                        continue;

                        function iterateMemberships(membership) {
                            mst += membershipCount[membership];
                            if (mst < 15) {
                                ms++;
                                delete membershipCount[membership];
                            }
                        }

                        function iteratePackages(package) {
                            pst += packageCount[package];
                            if (pst < 15) {
                                ps++;
                                delete packageCount[package];
                            }
                        }
                    }
                    var ps = 0, ms = 0, pst = 0, mst = 0;
                    Object.keys(membershipCount).forEach(iterateMemberships);
                    Object.keys(packageCount).forEach(iteratePackages);
                    pushPages(ms, ps, tc, ic);

                    function iterateMemberships(membership) {
                        mst += membershipCount[membership];
                        if (mst < 15) {
                            ms++;
                            delete membershipCount[membership];
                        }
                    }

                    function iteratePackages(package) {
                        pst += packageCount[package];
                        if (pst < 15) {
                            ps++;
                            delete packageCount[package];
                        }
                    }
                }
            } else {
                var ps = 0, ms = 0, pst = 0, mst = 0;
                Object.keys(membershipCount).forEach(iterateMemberships);
                Object.keys(packageCount).forEach(iteratePackages);
                if (ms != 0)
                    membershippages++;
                if (ps != 0)
                    packagepages++;
                if (tc != 0)
                    treatmentpages++;
                if (ic != 0)
                    inventorypages++;
                
                pushPages(ms, ps, treatmentCount, inventoryCount);

                function iterateMemberships(membership) {
                    mst += membershipCount[membership];
                    if (mst < 15) {
                        ms++;
                        delete membershipCount[membership];
                    }
                }

                function iteratePackages(package) {
                    pst += packageCount[package];
                    if (pst < 15) {
                        ps++;
                        delete packageCount[package];
                    }
                }
            }

            function pushPages(pmtc, pptc, pagetc, pic) {
                var index = vm.pages.length;
                vm.pages.push({
                    index: index,
                    membershippages: membershippages,
                    packagepages: packagepages,
                    treatmentpages: treatmentpages,
                    inventorypages: inventorypages,
                    membershipTreatmentCount: pmtc,
                    packageTreatmentCount: pptc,
                    treatmentCount: pagetc,
                    inventoryCount: pic
                });
            }
        }

        function IsHeaderAvailable() {
            return ((vm.ivSettings && vm.ivSettings.display && vm.ivSettings.display.workshopDetails) || (vm.ivSettings && vm.ivSettings.display && vm.ivSettings.display.workshopLogo));
        }

        function getInvoicePageSize(channel) {
            amInvoices.getInvoicePageSize(channel).then(success).catch(failure);

            function success(res) {
                vm.invoicePageSize = res;
                switch (res) {
                    case "A4":
                        A4Size();
                        doPagination();
                        break;
                    default:
                        normalPageSize();
                        vm.pages.push({
                            index: 0,
                            membershipTreatmentCount: membershipTreatmentCount,
                            packageTreatmentCount: packageTreatmentCount,
                            treatmentCount: treatmentCount,
                            inventoryCount: inventoryCount
                        });
                        break;
                }
            }

            function failure(err) {
                success(vm.invoicePageSizeList[1]);
            }
        }

        function normalPageSize() {
            vm.pageWidth = "100%";
            vm.pageHeight = "auto";
        }

        function A4Size() {
            vm.pageWidth = "210mm";
            vm.pageHeight = "297mm";
        }

        function IsTaxEnabled(tax) {
            return ((tax.isTaxApplied == true) && (tax.tax > 0));
        }

        function getCurrencySymbol(channel) {
            if ($rootScope.isAllFranchiseOSelected() == true) {
                vm.currencySymbol = $rootScope.currencySymbol;
                return;
            }
            amInvoices.getCurrencySymbol(channel).then(success).catch(failure);

            function success(res) {
                vm.currencySymbol = res;
                $rootScope.currencySymbol = res;
            }

            function failure(err) {
                vm.currencySymbol = "Rs.";
            }
        }

        function IsSubtotalEnabled() {
            var isTaxEnabled = false;
            vm.taxSettings.forEach(iterateTaxes);
            return (vm.isDiscountApplied || vm.isRoundOffVal || isTaxEnabled);

            function iterateTaxes(tax) {
                if (tax.isTaxApplied)
                    isTaxEnabled = true;
            }
        }

        function calculateSubtotal() {
            var totalCost = 0;
            vm.service.problems.forEach(iterateProblem);
            vm.service.inventories.forEach(iterateInventories);
            if (vm.service.packages) {
                vm.service.packages.forEach(iteratePackages);
            }
            totalCost = (totalCost % 1 != 0) ? totalCost.toFixed(2) : parseInt(totalCost);
            vm.subtotal = totalCost;

            function iterateProblem(element) {
                totalCost += parseFloat(element.rate);
            }

            function iterateInventories(element) {
                totalCost += parseFloat(element.rate * element.qty);
            }

            function iteratePackages(package) {
                package.treatments.forEach(ipt);
            }

            function ipt(treatment) {
                totalCost += treatment.rate;
            }
        }

        function IsInvoiceAvailable() {
            return (vm.service && vm.service.state == "Bill");
        }

        function IsSocialFacebook() {
            if (vm.workshop.social.facebook == undefined)
                return false;
            return (vm.workshop.social.facebook != '');
        }

        function IsSocialInstagram() {
            if (vm.workshop.social.instagram == undefined)
                return false;
            return (vm.workshop.social.instagram != '');
        }

        function IsSocialTwitter() {
            if (vm.workshop.social.twitter == undefined)
                return false;
            return (vm.workshop.social.twitter != '');
        }

        function getIvAlignMargins(channel) {
            amInvoices.getIvAlignMargins(channel).then(success).catch(failure);

            function success(res) {
                vm.alignmentMargins = res;
            }

            function failure(err) {
                //  do nothing
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

        function calculateInventoryValues() {
            vm.service.inventories.forEach(iterateInventories);

            function iterateInventories(inventory) {
                if (inventory.qty == undefined)
                    inventory.qty = 1;
                inventory.total = inventory.rate * inventory.qty;
                inventory.total = (inventory.total % 1 != 0) ? inventory.total.toFixed(2) : parseInt(inventory.total);
            }
        }

        //  fill invoice details
        function fillInvoiceDetails() {
            amInvoices.getWorkshopDetails().then(fillWorkshopDetails).catch(failure);
            amInvoices.getServiceDetails($state.params.userId, $state.params.vehicleId, $state.params.serviceId).then(fillServiceDetails).catch(failure);

            function fillWorkshopDetails(res) {
                vm.workshop = res;
                vm.workshop.label_phone = (vm.workshop.phone || vm.workshop.phone != '') ? '(M)' : '&nbsp;';
                var ch = ($rootScope.isAllFranchiseOSelected() == true) ? res.channel : undefined;
                getDisplaySettings(ch);
            }

            function fillServiceDetails(res) {
                rowCount = 0, membershipTreatmentCount = 0, packageTreatmentCount = 0, treatmentCount = 0, inventoryCount = 0;
                vm.user = res.user;
                oCustomerEmail = res.user.email;
                vm.vehicle = res.vehicle;
                vm.service = res.service;
                vm.isRoundOff = (vm.service.roundoff != undefined);
                vm.isDiscountApplied = (vm.service.discount != undefined);
                if (vm.isDiscountApplied)
                    vm.discountValue = (vm.service.discount.amount || vm.service.discount.total);
                if (res.service.taxes)
                    Object.keys(res.service.taxes).forEach(iterateTaxes);
                calculateInventoryValues();
                if (vm.service.memberships)
                    Object.keys(vm.service.memberships).forEach(iterateMemberships);
                if (vm.service.packages)
                    Object.keys(vm.service.packages).forEach(iteratePackages);
                if (vm.service.problems) {
                    rowCount += vm.service.problems.length;
                    treatmentCount += vm.service.problems.length;
                }
                if (vm.service.inventories) {
                    rowCount += vm.service.inventories.length;
                    inventoryCount += vm.service.inventories.length;
                }
                calculateSubtotal();

                if ($rootScope.isAllFranchiseOSelected() == true) {
                    getCurrencySymbol(res.channel);
                    amInvoices.getWorkshopDetails(res.channel).then(fillWorkshopDetails).catch(failure);
                    getIvAlignMargins(res.channel);
                    getInvoicePageSize(res.channel);
                }

                function iteratePackages(package) {
                    var tempp = vm.service.packages[package];
                    packageCount[package] = Object.keys(tempp.treatments).length; 
                    rowCount += Object.keys(tempp.treatments).length;
                    packageTreatmentCount += Object.keys(tempp.treatments).length;
                }

                function iterateMemberships(membership) {
                    var tempm = vm.service.memberships[membership];
                    membershipCount[membership] = Object.keys(tempm.treatments).length;
                    rowCount += Object.keys(tempm.treatments).length;
                    membershipTreatmentCount += Object.keys(tempm.treatments).length;
                }

                function iterateTaxes(tax) {
                    var t = res.service.taxes[tax];

                    vm.taxSettings.push({
                        tax: t.tax,
                        inclusive: (t.type == "inclusive"),
                        isTaxApplied: t.isTaxApplied,
                        isForTreatments: t.isForTreatments,
                        isForInventory: t.isForInventory,
                        percent: t.percent,
                        name: tax
                    });
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
                tax += inventory.tax * (inventory.qty ? inventory.qty : 1);
            }
        }
        
        function calculateServiceTax() {
            var tax = 0;
            if (!vm.service.serviceTax.applyTax)
                return 0;
            vm.service.problems.forEach(iterateProblems);
            if (vm.service.packages)
                vm.service.packages.forEach(iteratePackages);
            tax = (tax % 1 != 0) ? tax.toFixed(2) : parseInt(tax);
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
                vm.ivSettings = res;
                if (!res.display)
                    return;
                if (res.display.workshopLogo)
                    setTimeout(addInvoiceWLogo, 1000);
                if (res.display.footerLogo)
                    setTimeout(addInvoiceFLogo, 1000);
            }

            function failure(err) {
                vm.ivSettings = {
                    display: {
                        workshopLogo: false,
                        footerLogo: false,
                        workshopDetails: false
                    }
                }
                $log.info('Could not load display settings!');
            }
        }

        //  print receipt
        function printInvoice() {
            var amInScFb = document.getElementById('am-invoice-social-facebook');
            var amInScIn = document.getElementById('am-invoice-social-instagram');
            var amInScTw = document.getElementById('am-invoice-social-twitter');

            if (vm.workshop && vm.workshop.social && vm.workshop.social.enabled) {
                if (IsSocialFacebook()) {
                    var ic = document.createElement('canvas'),
                        icontext = ic.getContext('2d');
                    ic.width = amInScFb.width;
                    ic.height = amInScFb.height;
                    icontext.drawImage(amInScFb, 0, 0, amInScFb.width, amInScFb.height);
                    amInScFb.src = ic.toDataURL();
                }
                if (IsSocialInstagram()) {
                    var ic = document.createElement('canvas'),
                        icontext = ic.getContext('2d');
                    ic.width = amInScIn.width;
                    ic.height = amInScIn.height;
                    icontext.drawImage(amInScIn, 0, 0, amInScIn.width, amInScIn.height);
                    amInScIn.src = ic.toDataURL();
                }
                if (IsSocialTwitter()) {
                    var ic = document.createElement('canvas'),
                        icontext = ic.getContext('2d');
                    ic.width = amInScTw.width;
                    ic.height = amInScTw.height;
                    icontext.drawImage(amInScTw, 0, 0, amInScTw.width, amInScTw.height);
                    amInScTw.src = ic.toDataURL();
                }
            }
            var printObj = document.getElementById('am-invoice-mail-body');
            ammPrint.doPrint(printObj.innerHTML);
            if (vm.workshop && vm.workshop.social && vm.workshop.social.enabled) {
                if (IsSocialFacebook()) {
                    amInScFb.src = 'assets/img/facebook.svg';
                }
                if (IsSocialInstagram()) {
                    amInScIn.src = 'assets/img/instagram.svg';
                }
                if (IsSocialTwitter()) {
                    amInScTw.src = 'assets/img/twitter.svg';                
                }
            }
        }

        function initiateMailInvoiceProcess(ev) {
            $mdDialog.show({
                controller: 'amCtrlCmI',
                controllerAs: 'vm',
                templateUrl: 'app/components/invoices/invoices_confirmmail.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    utils: utils,
                    user: vm.user
                },
                clickOutsideToClose: true
            }).then(doMailInvoice).catch(cancelMailInvoice);

            function doMailInvoice(result) {
                vm.user.email = result;
                mailInvoice();
                if (vm.user.email != oCustomerEmail)
                    amInvoices.saveCustomerEmail($state.params.userId, vm.user.email).then(respond).catch(respond);
                
                function respond(res) {
                    //  do nothing
                }
            }

            function cancelMailInvoice() {
                //  do nothing
            }
        }

        //  send email
        function mailInvoice() {
            if (vm.user.email == undefined || vm.user.email == '') {
                utils.showSimpleToast(vm.user.name + '\'s email has not been set. Email can not be sent!');
                return;
            }
            var amInScFb = document.getElementById('am-invoice-social-facebook');
            var amInScIn = document.getElementById('am-invoice-social-instagram');
            var amInScTw = document.getElementById('am-invoice-social-twitter');
            var amInLkFb = document.getElementById('am-invoice-link-facebook');
            var amInLkIn = document.getElementById('am-invoice-link-instagram');
            var amInLkTw = document.getElementById('am-invoice-link-twitter');
            if (vm.workshop && vm.workshop.social && vm.workshop.social.enabled) {
                if (IsSocialFacebook()) {
                    amInLkFb.href = 'facebook.com/' + vm.workshop.social.facebook;
                    amInScFb.src = 'https://www.facebook.com/images/fb_icon_325x325.png';
                }
                if (IsSocialInstagram()) {
                    amInLkIn.href = 'instagram.com/' + vm.workshop.social.instagram;
                    amInScIn.src = 'http://3835642c2693476aa717-d4b78efce91b9730bcca725cf9bb0b37.r51.cf1.rackcdn.com/Instagram_App_Large_May2016_200.png';
                }
                if (IsSocialTwitter()) {
                    amInLkTw.href = 'twitter.com/' + vm.workshop.social.twitter;
                    amInScTw.src = 'https://g.twimg.com/Twitter_logo_blue.png';
                }
            }
            removeInvoiceWLogo();
            removeInvoiceFogo();
            var printObj = document.getElementById('am-invoice-mail-body');
            utils.showSimpleToast('Sending Mail...');
            ammMailApi.send(printObj.innerHTML, vm.user, (vm.workshop) ? vm.workshop.name : undefined, (vm.ivSettings) ? vm.ivSettings.emailsubject : undefined);
            if (vm.workshop && vm.workshop.social && vm.workshop.social.enabled) {
                if (IsSocialFacebook()) {
                    amInLkFb.href = '';
                    amInScFb.src = 'assets/img/facebook.svg';
                }
                if (IsSocialInstagram()) {
                    amInLkIn.href = '';
                    amInScIn.src = 'assets/img/instagram.svg';
                }
                if (IsSocialTwitter()) {
                    amInLkTw.href = '';
                    amInScTw.src = 'assets/img/twitter.svg';                
                }
            }
            if (vm.ivSettings.display.workshopLogo)
                addInvoiceWLogo();
            if (vm.ivSettings.display.footerLogo)
                addInvoiceFLogo();
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
                            id: $state.params.userId
                        }
                        break;
                }
            }
            $state.go(transitState, transitParams);
        }

        function addInvoiceWLogo() {
            var elems = document.getElementsByName('am-invoice-w-logo-holder');
            elems.forEach(iterateElements);

            function iterateElements(elem) {
                if (elem.hasChildNodes())
                    return;
                var x = document.createElement("IMG");
                x.setAttribute("src", vm.invoiceWLogo);
                x.setAttribute("width", "250");
                x.setAttribute("height", "125");
                elem.appendChild(x);
            }
        }

        function removeInvoiceWLogo() {
            var elems = document.getElementsByName('am-invoice-w-logo-holder');
            elems.forEach(iterateElements);

            function iterateElements(elem) {
                while (elem.firstChild) {
                    elem.removeChild(elem.firstChild);
                }
            }
        }
    }

    function ConfirmMailController($mdDialog, utils, user) {
        var vm = this;

        vm.user = user;
        vm.sendInvoice = sendInvoice;
        vm.cancelInvoice = cancelInvoice;

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