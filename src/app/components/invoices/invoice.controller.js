/**
 * Controller for Invoice
 * @author ndkcha
 * @since 0.5.0
 * @version 0.8.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlIvRI', InvoiceController);

    //  dependency injections for Invoice controller
    InvoiceController.$inject = ['$rootScope', '$q', '$state', '$window', '$mdDialog', 'utils', 'amInvoice'];

    function InvoiceController($rootScope, $q, $state, $window, $mdDialog, utils, amInvoice) {
        //  initialize view model
        var vm = this;

        //  temporary assignments for the instance
        //  no such assignments

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
        vm.acServiceDate = acServiceDate;
        vm.IsA4Size = IsA4Size;

        //  default execution steps
        if ($state.params.userId == undefined || $state.params.vehicleId == undefined || $state.params.serviceId == undefined) {
            utils.showSimpleToast('Something went wrong. Please try again!')
            $state.go('restricted.services.all');
            return;
        }
        getCurrencySymbol();
        getInvoiceDetails();

        //  function definitions

        function loadInvoiceFLogo() {
            var source = localStorage.getItem('invoice-f-pic');
            if (source == undefined) {
                if (vm.settings && vm.settings.display && vm.settings.display.footerLogo)
                    vm.settings.display.footerLogo = false;
                return;
            }
            var elem = document.getElementById('am-footerlogo-holder');
            if (elem.hasChildNodes())
                return;
            var x = document.createElement("IMG");
            x.setAttribute("src", source);
            elem.appendChild(x);
        }

        function loadInvoiceWLogo() {
            var source = localStorage.getItem('invoice-w-pic');
            if (source == undefined) {
                if (vm.settings && vm.settings.display && vm.settings.display.workshopLogo)
                    vm.settings.display.workshopLogo = false;
                return;
            }
            var elem = document.getElementById('am-workshoplogo-holder');
            if (elem.hasChildNodes())
                    return;
            var x = document.createElement("IMG");
            x.setAttribute("src", source);
            x.setAttribute("width", "250");
            x.setAttribute("height", "125");
            elem.appendChild(x);
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
                vm.vehicle = res.vehicle;
                vm.service = res.service;
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
                console.log(res);
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
            }

            function workshopsuccess(res) {
                vm.workshop = res;
                if (res.social != undefined) {
                    vm.isFacebookLinkVisible = ((res.social.facebook != undefined) && (res.social.facebook != ''));
                    vm.isInstagramLinkVisible = ((res.social.instagram != undefined) && (res.social.instagram != ''));
                    vm.isTwitterLinkVisible = ((res.social.twitter != undefined) && (res.social.twitter != ''));
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

        function acServiceDate() {
            vm.service.date = utils.autoCapitalizeWord(vm.service.date);
        }
    }
})();