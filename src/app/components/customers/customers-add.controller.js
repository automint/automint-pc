/**
 * Controller for Add Customer component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.4.1
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlCuCI', CustomerAddController);

    CustomerAddController.$inject = ['$state', '$timeout', '$q', '$log', '$mdToast', 'utils', 'amCustomers'];

    // function CustomerAddController($state, $timeout: angular.ITimeoutService, $q: angular.IQService, $log: angular.ILogService, $mdToast:angular.material.IToastService, utils, amCustomers) {
    function CustomerAddController($state, $timeout, $q, $log, $mdToast, utils, amCustomers) {
        //  initialize view model
        var vm = this;

        //  vm assignments to keep track of UI related elements
        vm.label_userName = 'Enter Full Name:'; 
        vm.label_userMobile = 'Enter Mobile Number:'; 
        vm.label_userEmail = 'Enter Email Address:'; 
        vm.label_vehicleReg = 'Enter Vehicle Registration Number:'; 
        vm.label_vehicleManuf = 'Manufacturer:'; 
        vm.label_vehicleModel = 'Model:';
        vm.user = {
            mobile: '',
            name: '',
            email: ''
        };
        vm.vehicle = {
            id: '',
            reg: '',
            manuf: '',
            model: ''
        };
        vm.manufacturers = [];
        vm.models = [];

        //  function maps
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.convertRegToCaps = convertRegToCaps;
        vm.searchVehicleChange = searchVehicleChange;
        vm.manufacturersQuerySearch = manufacturersQuerySearch;
        vm.modelQuerySearch = modelQuerySearch;
        vm.changeUserNameLabel = changeUserNameLabel;
        vm.changeUserMobileLabel = changeUserMobileLabel;
        vm.changeUserEmailLabel = changeUserEmailLabel;
        vm.changeVehicleRegLabel = changeVehicleRegLabel;
        vm.changeVehicleTab = changeVehicleTab;
        vm.changeUserTab = changeUserTab;
        vm.addOperationConfig = addOperationConfig;
        vm.save = save;

        //  function definitions
        function convertNameToTitleCase() {
            vm.user.name = utils.convertToTitleCase(vm.user.name);
        }
        function convertRegToCaps() {
            vm.vehicle.reg = vm.vehicle.reg.toUpperCase();
        }

        //  query search for manufacturers [autocomplete]
        function manufacturersQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.vehicle.manuf ? vm.manufacturers.filter(createFilterForManufacturers(vm.vehicle.manuf)) : vm.manufacturers);
            
            if (results.length > 0) {
                return results;
            }
            
            amCustomers.getManufacturers().then(allotManufacturers).catch(noManufacturers);
            return tracker.promise;
            
            function allotManufacturers(res) {
                vm.manufacturers = res;
                results = (vm.vehicle.manuf ? vm.manufacturers.filter(createFilterForManufacturers(vm.vehicle.manuf)) : vm.manufacturers);
                tracker.resolve(results);
            }
            
            function noManufacturers(error) {
                results = [];
                tracker.resolve(results);
            }
        }

        //  create filter for manufacturers' query list
        function createFilterForManufacturers(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                item = angular.lowercase(item);
                return (item.indexOf(lcQuery) === 0);
            }
        }

        //  query search for model [autocomplete]
        function modelQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.vehicle.model ? vm.models.filter(createFilterForModel(vm.vehicle.model)) : vm.models);
            
            if (results.length > 0)
                return results;
            
            amCustomers.getModels(vm.vehicle.manuf).then(allotModels).catch(noModels);
            return tracker.promise;
            
            function allotModels(res) {
                vm.models = res;
                results = (vm.vehicle.model ? vm.models.filter(createFilterForModel(vm.vehicle.model)) : vm.models);
                tracker.resolve(results);
            }
            
            function noModels(err) {
                results = [];
                tracker.resolve(results);
            }
        }

        //  create filter for models' query list
        function createFilterForModel(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                item = angular.lowercase(item);
                return (item.indexOf(lcQuery) === 0);
            }
        }
        
        function searchVehicleChange() {
            vm.models = [];
            vm.vehicle.model = '';
        }
        
        //  return boolean response to different configurations [BEGIN]
        function addOperationConfig() {
            return true;
        }
        //  return boolean response to different configurations [END]
        
        //  change user tab selector variable
        function changeUserTab(bool) {
            vm.userTab = bool;
        }
        
        //  change vehicle tab selector variable
        function changeVehicleTab(bool) {
            vm.vehicleTab = bool;
        }
        
        //  listen to changes in input fields [BEGIN]
        function changeUserNameLabel(force) {
            vm.largeUserNameLabel = (force != undefined || vm.user.name != '');
            vm.label_userName = vm.largeUserNameLabel ? 'Name:' : 'Enter Full Name:';
        }
        function changeUserMobileLabel(force) {
            vm.largeUserMobileLabel = (force != undefined || vm.user.mobile != ''); 
            vm.label_userMobile = vm.largeUserMobileLabel ? 'Mobile:' : 'Enter Mobile Number:';
        }
        function changeUserEmailLabel(force) {
            vm.largeUserEmailLabel = (force != undefined || vm.user.email != ''); 
            vm.label_userEmail = vm.largeUserEmailLabel ? 'Email:' : 'Enter Email Address:';
        }
        function changeVehicleRegLabel(force) {
            vm.largeVehicleRegLabel = (force != undefined || vm.vehicle.reg != ''); 
            vm.label_vehicleReg = vm.largeVehicleRegLabel ? 'Vehcile Registration Number:' : 'Enter Vehicle Registration Number:';
        }
        //  listen to changes in input fields [END]
        
        function validate() {
            if (vm.user.name == '') {
                changeUserTab(true);
                setTimeout(doFocus, 300);
                utils.showSimpleToast('Please Enter Name');
                
                function doFocus() {
                    $('#ami-user-name').focus();
                }
                return false;
            }
            return true;
        }

        //  save to database
        function save() {
            if (!validate()) return;
            if (!(vm.vehicle.reg == '' && vm.vehicle.manuf == '' && vm.vehicle.model == '')) {
                vm.vehicle.reg = vm.vehicle.reg.replace(/\s/g, '');
                amCustomers.addNewCustomer(vm.user, vm.vehicle).then(successfullSave).catch(failedSave);
            } else
                amCustomers.addNewCustomer(vm.user).then(successfullSave).catch(failedSave);
        }
        
        function successfullSave(res) {
            $state.go('restricted.customers.all');
            utils.showSimpleToast('Customer has been added successfully!');
        }
        
        function failedSave(err) {
            utils.showSimpleToast('Failed to add customer. Please Try Again!');
        }
    }
})();