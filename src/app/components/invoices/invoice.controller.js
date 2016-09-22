/**
 * Controller for Invoice
 * @author ndkcha
 * @since 0.5.0
 * @version 0.8.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    const ammPrint = require('./automint_modules/print/am-print.js');
    const ammMailApi = require('./automint_modules/am-mailer.js');
    const eIpc = require("electron").ipcRenderer;

    angular.module('automintApp').controller('amCtrlIvRI', InvoiceController);

    //  dependency injections for Invoice controller
    InvoiceController.$inject = ['$rootScope', '$q', '$state', '$window', '$mdDialog', 'utils', 'amInvoice'];

    function InvoiceController($rootScope, $q, $state, $window, $mdDialog, utils, amInvoice) {
        //  initialize view model
        var vm = this;

        //  temporary assignments for the instance
        var oCustomerEmail = undefined;
        var oUserName, oUserMobile, oVehicleName, oVehicleReg, oServiceOdo, oWorkshop, oSocial;

        //  named assignments to view model
        vm.currencySymbol = "Rs.";
        vm.isFacebookLinkVisible = false;
        vm.isInstagramLinkVisible = false;
        vm.isTwitterLinkVisible = false;
        vm.isSocialLinkVisible = false;
        vm.isDiscountVisible = false;
        vm.isRoundOffVisible = false;
        vm.isSubtotalVisible = false;
        vm.isWorkshopAreaVisible = false;

        //  function maps to view model
        vm.getProblemIndex = getProblemIndex;
        vm.getInventoryIndex = getInventoryIndex;
        vm.goBack = goBack;
        vm.IsTaxVisible = IsTaxVisible;
        vm.acWorkshopName = acWorkshopName;
        vm.acWorkshopAddress1 = acWorkshopAddress1;
        vm.acWorkshopAddress2 = acWorkshopAddress2;
        vm.acWorkshopCity = acWorkshopCity;
        vm.acUserMobile = acUserMobile;
        vm.acUserName = acUserName;
        vm.acVehicleName = acVehicleName;
        vm.acVehicleReg = acVehicleReg;
        vm.IsA4Size = IsA4Size;
        vm.editService = editService;
        vm.printInvoice = printInvoice;
        vm.askEmail = askEmail;
        vm.parseNotes = parseNotes;
        vm.changeInvoiceCache = changeInvoiceCache;
        vm.changeServiceDetails = changeServiceDetails;
        vm.changeWorkshopDetails = changeWorkshopDetails;
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
        getInvoiceDetails();

        //  function definitions

        function restrictNumbers(n) {
            n = parseFloat(n);
            return ((n % 1 != 0) ? n.toFixed(2) : parseInt(n));
        }

        function changeWorkshopDetails() {
            var isWorkshopChanged = ((vm.workshop.name != oWorkshop.name) || (vm.workshop.address1 != oWorkshop.address1) || (vm.workshop.address2 != oWorkshop.address2) || (vm.workshop.city != oWorkshop.city));
            var isSocialLinkChanged = ((vm.isSocialLinkVisible) && ((vm.workshop.social.facebook != oSocial.facebook) || (vm.workshop.social.instagram != oSocial.instagram) || (vm.workshop.social.twitter != oSocial.twitter)));
            if (isWorkshopChanged || isSocialLinkChanged)
                amInvoice.saveWorkshopDetails(vm.workshop).then(success).catch(failure);
            
            function success(res) {
                if (res.ok) {
                    oWorkshop = $.extend({}, vm.workshop);
                    if (vm.workshop.social != undefined)
                        oSocial = $.extend({}, vm.workshop.social);
                }
            }

            function failure(err) {
                console.error(err);
            }
        }

        function changeServiceDetails() {
            if ((vm.vehicle.reg != oVehicleReg) || (vm.service.odo != oServiceOdo))
                amInvoice.saveServiceDetails($state.params.userId, $state.params.vehicleId, $state.params.serviceId, vm.vehicle.reg, vm.service.odo).then(success).catch(failure);
            
            function success(res) {
                if (res.ok) {
                    oVehicleReg = vm.vehicle.reg;
                    oServiceOdo = vm.service.odo;
                }
            }

            function failure(err) {
                console.error(err);
            }
        }

        function changeInvoiceCache() {
            if ((vm.user.mobile != oUserMobile) || (vm.user.name != oUserName) || (vm.vehicle.name != oVehicleName))
                amInvoice.saveCacheDetails($state.params.userId, $state.params.vehicleId, vm.user.name, vm.user.mobile, vm.vehicle.name).then(success).catch(failure);
            
            function success(res) {
                if (res.ok) {
                    oUserMobile = vm.user.mobile;
                    oUserName = vm.user.name;
                    oVehicleName = vm.vehicle.name;
                }
            }

            function failure(err) {
                console.error(err);
            }
        }

        function parseNotes() {
            vm.notes = (vm.settings.notes.note !== undefined) ? vm.settings.notes.note.replace(/\n/g, '<br>') : '';
        }

        function OnInvoiceMailSent(event, arg) {
            var message = (arg) ? 'Mail has been sent!' : 'Could not sent email. Please Try Again!'; 
            utils.showSimpleToast(message);
        }

        function askEmail(event) {
            $mdDialog.show({
                controller: 'amIvConfirmEmailCtrl',
                controllerAs: 'vm',
                templateUrl: 'app/components/invoices/addons/confirmemail.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    utils: utils,
                    user: vm.user
                },
                clickOutsideToClose: true
            }).then(doMailInvoice).catch(doNothing);

            function doMailInvoice(result) {
                vm.user.email = result;
                if (vm.user.email != oCustomerEmail)
                    amInvoice.saveCustomerEmail($state.params.userId, vm.user.email).then(doNothing).catch(doNothing);
                mailInvoice();
            }

            function doNothing(something) {
                //  do nothing
            }
        }

        function mailInvoice() {
            if (vm.user.email == undefined || vm.user.email == '') {
                utils.showSimpleToast(vm.user.name + '\'s email has not been set. Email can not be sent!');
                return;
            }
            var printObj = document.getElementById('am-mail-body');
            utils.showSimpleToast('Sending Mail...');
            ammMailApi.send(printObj.innerHTML, vm.user, (vm.workshop) ? vm.workshop.name : undefined, (vm.settings) ? vm.settings.emailsubject : undefined);
        }

        function printInvoice() {
            var amSocialFacebook = document.getElementById('am-social-facebook');
            var amSocialInstagram = document.getElementById('am-social-instagram');
            var amSocialTwitter = document.getElementById('am-social-twitter');

            if (vm.isSocialLinkVisible) {
                if (vm.isFacebookLinkVisible) {
                    var ic = document.createElement('canvas'),
                        icontext = ic.getContext('2d');
                    ic.width = amSocialFacebook.width;
                    ic.height = amSocialFacebook.height;
                    icontext.drawImage(amSocialFacebook, 0, 0, amSocialFacebook.width, amSocialFacebook.height);
                    amSocialFacebook.src = ic.toDataURL();
                }
                if (vm.isInstagramLinkVisible) {
                    var ic = document.createElement('canvas'),
                        icontext = ic.getContext('2d');
                    ic.width = amSocialInstagram.width;
                    ic.height = amSocialInstagram.height;
                    icontext.drawImage(amSocialInstagram, 0, 0, amSocialInstagram.width, amSocialInstagram.height);
                    amSocialInstagram.src = ic.toDataURL();
                }
                if (vm.isTwitterLinkVisible) {
                    var ic = document.createElement('canvas'),
                        icontext = ic.getContext('2d');
                    ic.width = amSocialTwitter.width;
                    ic.height = amSocialTwitter.height;
                    icontext.drawImage(amSocialTwitter, 0, 0, amSocialTwitter.width, amSocialTwitter.height);
                    amSocialTwitter.src = ic.toDataURL();
                }
            }

            var printObj = document.getElementById('am-print-body');
            ammPrint.doPrint(printObj.innerHTML);

            if (vm.isSocialLinkVisible) {
                if (vm.isFacebookLinkVisible)
                    amSocialFacebook.src = 'assets/img/facebook.svg';
                if (vm.isInstagramLinkVisible)
                    amSocialInstagram.src = 'assets/img/instagram.svg';
                if (vm.isTwitterLinkVisible)
                    amSocialTwitter.src = 'assets/img/twitter.svg';
            }
        }

        function editService() {
            $state.go('restricted.services.edit', {
                userId: $state.params.userId,
                vehicleId: $state.params.vehicleId,
                serviceId: $state.params.serviceId,
                fromState: 'invoice'
            });
        }

        function loadInvoiceFLogo() {
            var source = localStorage.getItem('invoice-f-pic');
            if (source == undefined) {
                if (vm.settings && vm.settings.display && vm.settings.display.footerLogo)
                    vm.settings.display.footerLogo = false;
                return;
            }
            var elems = document.getElementsByName('am-footerlogo-holder');
            elems.forEach(iterateElements);

            function iterateElements(elem) {
                if (elem.hasChildNodes())
                    return;
                var x = document.createElement("IMG");
                x.setAttribute("src", source);
                elem.appendChild(x);
            }
        }

        function loadInvoiceWLogo() {
            var source = localStorage.getItem('invoice-w-pic');
            if (source == undefined) {
                if (vm.settings && vm.settings.display && vm.settings.display.workshopLogo)
                    vm.settings.display.workshopLogo = false;
                return;
            }
            var elems = document.getElementsByName('am-workshoplogo-holder');
            elems.forEach(iterateElements);

            function iterateElements(elem) {
                if (elem.hasChildNodes())
                        return;
                var x = document.createElement("IMG");
                x.setAttribute("src", source);
                x.setAttribute("width", "250");
                x.setAttribute("height", "125");
                elem.appendChild(x);
            }
        }

        function IsA4Size() {
            return ((vm.settings != undefined) && (vm.settings.pageSize == 'A4'));
        }

        function IsTaxVisible(tax) {
            var q = ((tax.isTaxApplied == true) && (tax.tax != undefined) && (tax.tax != '') && (parseFloat(tax.tax) != 0));
            if (q)
                vm.isSubtotalVisible = true;
            return q;
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

        function getInventoryIndex(index) {
            var length = (vm.service && vm.service.problems) ? Object.keys(vm.service.problems).length + 1 : 1;
            return (length + index);
        }

        function getProblemIndex(index) {
            return (index + 1);
        }

        function getInvoiceDetails() {
            amInvoice.getServiceDetails($state.params.userId, $state.params.vehicleId, $state.params.serviceId).then(usersuccess).catch(failure);

            function usersuccess(res) {
                vm.user = res.user;
                if (res.user.name == 'Anonymous')
                    vm.user.name = '';
                oCustomerEmail = res.user.email;
                vm.vehicle = res.vehicle;
                if (res.vehicle.reg.toLowerCase() == 'vehicle')
                    vm.vehicle.reg = ''; 
                vm.service = res.service;
                oVehicleReg = vm.vehicle.reg;
                oServiceOdo = vm.service.odo;
                if (vm.service.status.toLowerCase() == 'due') {
                    if (vm.service.partialpayment == undefined) {
                        vm.service.partialpayment = {
                            total: 0
                        };
                    }
                    vm.paymentdue = parseFloat(vm.service.cost) - parseFloat(vm.service.partialpayment.total);
                } else
                    delete vm.service.partialpayment;
                if (vm.vehicle.invoicedetails != undefined) {
                    vm.user.name = vm.vehicle.invoicedetails.name;
                    vm.user.mobile = vm.vehicle.invoicedetails.mobile;
                    vm.vehicle.name = vm.vehicle.invoicedetails.vehicle;
                    oUserName = vm.vehicle.invoicedetails.name;
                    oUserMobile = vm.vehicle.invoicedetails.mobile;
                    oVehicleName = vm.vehicle.invoicedetails.vehicle;
                }
                if (vm.service.discount != undefined) {
                    vm.service.discount.total = parseFloat(vm.service.discount.total);
                    vm.service.discount.total = (vm.service.discount.total % 1 != 0) ? vm.service.discount.total.toFixed(2) : parseInt(vm.service.discount.total); 
                    vm.isDiscountVisible = ((vm.service.discount.total != 0) && (vm.service.discount.total != '') && !isNaN(vm.service.discount.total));
                }
                vm.isRoundOffVisible = ((vm.service.roundoff != undefined) && (vm.service.roundoff != '') && (vm.service.roundoff != 0));
                vm.isSubtotalVisible = (vm.isDiscountVisible || vm.isRoundOffVisible);
                amInvoice.getWorkshopDetails(res.channel).then(workshopsuccess).catch(failure);
                amInvoice.getInvoiceSettings(res.channel).then(settingssuccess).catch(failure);
            }

            function settingssuccess(res) {
                vm.settings = res;
                if (vm.settings.display != undefined) {
                    if (vm.settings.display.workshopLogo == true)
                        setTimeout(loadInvoiceWLogo, 300);
                    if (vm.settings.display.footerLogo == true)
                        setTimeout(loadInvoiceFLogo, 300);
                    vm.isWorkshopAreaVisible = ((vm.settings.display.workshopDetails == true) || (vm.settings.display.workshopLogo == true));
                }
                if (vm.settings.margin != undefined) {
                    if (vm.settings.margin.enabled != true)
                        delete vm.settings.margin;
                }
                if (vm.settings.notes != undefined)
                    parseNotes();
            }

            function workshopsuccess(res) {
                vm.workshop = res;
                oWorkshop = $.extend({}, vm.workshop);
                if (vm.workshop.social != undefined)
                    oSocial = $.extend({}, vm.workshop.social);
                if (res.social != undefined) {
                    vm.isFacebookLinkVisible = ((res.social.facebook != undefined) && (res.social.facebook != ''));
                    vm.isInstagramLinkVisible = ((res.social.instagram != undefined) && (res.social.instagram != ''));
                    vm.isTwitterLinkVisible = ((res.social.twitter != undefined) && (res.social.twitter != ''));
                    if (vm.isFacebookLinkVisible)
                        vm.facebooklink = 'https://facebook.com/' + vm.workshop.social.facebook;
                    if (vm.isInstagramLinkVisible)
                        vm.instagramlink = 'https://instagram.com/' + vm.workshop.social.instagram;
                    if (vm.isTwitterLinkVisible)
                        vm.twitterlink = 'https://twitter.com/' + vm.workshop.social.twitter;
                    vm.isSocialLinkVisible = ((res.social.enabled == true) && (vm.isFacebookLinkVisible || vm.isTwitterLinkVisible || vm.isInstagramLinkVisible));
                }
            }

            function failure(err) {
                console.log(err);
            }
        }
        
        function getCurrencySymbol(channel) {
            if ($rootScope.isAllFranchiseOSelected() == true) {
                vm.currencySymbol = $rootScope.currencySymbol;
                return;
            }
            amInvoice.getCurrencySymbol(channel).then(success).catch(failure);

            function success(res) {
                vm.currencySymbol = res;
                $rootScope.currencySymbol = res;
            }

            function failure(err) {
                vm.currencySymbol = $rootScope.currencySymbol;
            }
        }

        function acWorkshopName() {
            vm.workshop.name = utils.autoCapitalizeWord(vm.workshop.name);
        }

        function acWorkshopAddress1() {
            vm.workshop.address1 = utils.autoCapitalizeWord(vm.workshop.address1);
        }

        function acWorkshopAddress2() {
            vm.workshop.address2 = utils.autoCapitalizeWord(vm.workshop.address2);
        }

        function acWorkshopCity() {
            vm.workshop.city = utils.autoCapitalizeWord(vm.workshop.city);
        }

        function acUserName() {
            vm.user.name = utils.autoCapitalizeWord(vm.user.name);
        }

        function acUserMobile() {
            vm.user.mobile = utils.autoCapitalizeWord(vm.user.mobile);
        }

        function acVehicleName() {
            vm.vehicle.name = utils.autoCapitalizeWord(vm.vehicle.name);
        }

        function acVehicleReg() {
            vm.vehicle.reg = vm.vehicle.reg.toUpperCase();
        }
    }
})();