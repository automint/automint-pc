/**
 * Controller for Dialog box for CRUD Operations on Particular Vehicle
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.2
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlCuVeCRUD', VehicleCRUDController);

    VehicleCRUDController.$inject = ['$rootScope', '$mdDialog', '$q', 'utils', 'amCustomers', 'vehicle'];

    function VehicleCRUDController($rootScope, $mdDialog, $q, utils, amCustomers, vehicle) {
        //  initialize view model
        var vm = this;

        //  named assignments to keep track of temporary variables
        var autofillVehicle = false;

        //  named assignments to view model
        vm.vehicle = vehicle;
        vm.manufacturers = [];
        vm.model = [];

        //  function maps to view model
        vm.manufacturersQuerySearch = manufacturersQuerySearch;
        vm.modelQuerySearch = modelQuerySearch;
        vm.searchVehicleChange = searchVehicleChange;
        vm.autoCapitalizeVehicleModel = autoCapitalizeVehicleModel;
        vm.convertRegToCaps = convertRegToCaps;
        vm.save = save;
        vm.cancel = cancel;
        vm.deleteVehicle = deleteVehicle;
        vm.cancelDelete = cancelDelete;
        vm.performDelete = performDelete;
        vm.viewDeleteIcon = viewDeleteIcon;

        //  function definitions

        function viewDeleteIcon() {
            if ($rootScope.isAllFranchiseOSelected() == true)
                return false;
            return (!vm.isDeleteDialog);
        }

        function cancelDelete() {
            vm.isDeleteDialog = false;
        }

        function deleteVehicle() {
            vm.isDeleteDialog = true;
        }

        function performDelete() {
            vm.vehicle._deleted = true;
            save();
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

        function searchVehicleChange(e) {
            autoCapitalizeVehicleManuf();
            if (!autofillVehicle) {
                vm.models = [];
                vm.vehicle.model = '';
                autofillVehicle = false;
            } else
                autofillVehicle = false;
        }

        function autoCapitalizeVehicleModel() {
            vm.vehicle.model = utils.autoCapitalizeWord(vm.vehicle.model);
        }

        function autoCapitalizeVehicleManuf() {
            vm.vehicle.manuf = utils.autoCapitalizeWord(vm.vehicle.manuf);
        }

        function convertRegToCaps() {
            vm.vehicle.reg = vm.vehicle.reg.toUpperCase();
        }

        function save() {
            $mdDialog.hide(vm.vehicle);
        }

        function cancel() {
            $mdDialog.cancel();
        }
    }
})();