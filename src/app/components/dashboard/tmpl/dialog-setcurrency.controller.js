/**
 * Controller for Set Currency Dialogbox
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlDashCurrency', CurrencyController);

    CurrencyController.$inject = ['$mdDialog', 'utils'];

    function CurrencyController($mdDialog, utils) {
        //  initialize view model
        var vm = this;

        //  named assignments for view model
        vm.countries = [{
            name: 'India',
            currency: 'Rs.'
        }, {
            name: 'North America',
            currency: '$'
        }];
        vm.selectedCountry = vm.countries[0];

        //  function mappings to view model
        vm.IsCountrySelected = IsCountrySelected;
        vm.selectCountry = selectCountry;
        vm.changeCountry = changeCountry;
        vm.save = save;

        //  function definitions

        function focusCurrencyInput() {
            $('#ami-currency-symbol').focus();
        }
        
        function selectCountry(country) {
            vm.selectedCountry = country;
            vm.isOtherCountry = false;
        }

        function IsCountrySelected(country) {
            return (vm.selectedCountry == country);
        }
 
        function changeCountry(force) {
            if (force != undefined) {
                if (vm.currencySymbol == '') {
                    vm.isOtherCountry = false;
                    vm.selectedCountry = vm.countries[0];
                } else
                    vm.isOtherCountry = force;
            }
            if (vm.isOtherCountry) {
                vm.selectedCountry = undefined;
                setTimeout(focusCurrencyInput, 300);
            } else
                vm.selectedCountry = vm.countries[0];
        }

        function save() {
            if ((vm.isOtherCountry == true) && vm.currencySymbol == '') {
                utils.showSimpleToast('Please enter currency symbol. Or choose one of the countries.');
                return;
            }
            var currency = (vm.isOtherCountry) ? vm.currencySymbol : vm.selectedCountry.currency;
            $mdDialog.hide(currency);
        }
    }
})();