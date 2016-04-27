/**
 * Controller for Edit Customer component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.4.1
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlCuUI', CustomerEditController);

    CustomerEditController.$inject = ['$state', '$q', '$log', '$filter', 'utils', 'amCustomers'];

    function CustomerEditController($state, $q, $log, $filter, utils, amCustomers) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var autofillVehicle = false;
        var userDbInstance;

        //  vm assignments to keep track of UI related elements
        vm.label_userName = 'Enter Full Name';
        vm.label_userMobile = 'Enter Mobile Number';
        vm.label_userEmail = 'Enter Email Address';
        vm.label_vehicleReg = 'Enter Vehicle Registration Number';
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
        vm.changeVehicle = changeVehicle;
        vm.addOperationConfig = addOperationConfig;
        vm.chooseVehicle = chooseVehicle;
        vm.save = save;

        //  default execution steps
        if ($state.params.id != undefined)
            getCustomer();
        else {
            utils.showSimpleToast('Something went wrong!');
            $state.go('restricted.customers.all');
        }

        //  function definitions

        function getCustomer() {
            amCustomers.getCustomer($state.params.id).then(success).catch(failure);

            function success(res) {
                userDbInstance = res;
                var pvl = [];
                vm.user.id = res._id;
                vm.user.mobile = res.user.mobile;
                vm.user.email = res.user.email;
                vm.user.name = res.user.name;
                changeUserMobileLabel();
                changeUserEmailLabel();
                changeUserNameLabel();
                if (res.user.vehicles)
                    Object.keys(res.user.vehicles).forEach(iterateVehicle, this);
                vm.possibleVehicleList = pvl;
                changeVehicle(pvl.length > 0 ? pvl[0].id : undefined);

                function iterateVehicle(vId) {
                    var vehicle = res.user.vehicles[vId];
                    pvl.push({
                        id: vId,
                        reg: vehicle.reg,
                        manuf: vehicle.manuf,
                        model: vehicle.model,
                        name: vehicle.manuf + ' - ' + vehicle.model + (vehicle.reg == '' ? '' : ', ' + vehicle.reg)
                    });
                }
            }

            function failure(err) {
                utils.showSimpleToast('Something went wrong!');
                $state.go('restricted.customers.all');
            }
        }

        function changeVehicle(id) {
            if (!id) {
                setDefaultVehicle();
                return;
            }
            var found = $filter('filter')(vm.possibleVehicleList, {
                id: id
            }, true);
            if (found.length > 0) {
                vm.currentVehicle = found[0].name;
                vm.vehicle.id = found[0].id;
                vm.vehicle.reg = found[0].reg;
                vm.vehicle.manuf = found[0].manuf;
                vm.vehicle.model = found[0].model;
                changeVehicleRegLabel();
                autofillVehicle = true;
            } else
                setDefaultVehicle();
        }

        function setDefaultVehicle() {
            vm.currentVehicle = 'New Vehicle';
            vm.vehicle.id = undefined;
            vm.vehicle.reg = '';
            vm.vehicle.manuf = '';
            vm.vehicle.model = '';
            autofillVehicle = false;
        }

        //  choose different existing vehicle
        function chooseVehicle($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        }

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
            if (!autofillVehicle) {
                vm.models = [];
                vm.vehicle.model = '';
                autofillVehicle = false;
            }
        }

        //  return boolean response to different configurations [BEGIN]
        function addOperationConfig() {
            return false;
        }
        //  return boolean response to different configurations [END]

        //  change vehicle table selector variable
        function changeVehicleTab(bool) {
            vm.vehicleTab = bool;
        }

        //  listen to changes in input fields [BEGIN]
        function changeUserNameLabel(force) {
            vm.largeUserNameLabel = (force != undefined || vm.user.name != '');
            vm.label_userName = vm.largeUserNameLabel ? 'Name:' : 'Enter Full Name';
        }
        function changeUserMobileLabel(force) {
            vm.largeUserMobileLabel = (force != undefined || vm.user.mobile != ''); 
            vm.label_userMobile = vm.largeUserMobileLabel ? 'Mobile:' : 'Enter Mobile Number';
        }
        function changeUserEmailLabel(force) {
            vm.largeUserEmailLabel = (force != undefined || vm.user.email != ''); 
            vm.label_userEmail = vm.largeUserEmailLabel ? 'Email:' : 'Enter Email Address';
        }
        function changeVehicleRegLabel(force) {
            vm.largeVehicleRegLabel = (force != undefined || vm.vehicle.reg != ''); 
            vm.label_vehicleReg = vm.largeVehicleRegLabel ? 'Vehicle Registration Number:' : 'Enter Vehicle Registration Number';
        }
        //  listen to changes in input fields [END]

        function isSame() {
            var checkuser = userDbInstance.user.mobile == vm.user.mobile && userDbInstance.user.name == vm.user.name && userDbInstance.user.email == vm.user.email;
            var checkvehicle = (userDbInstance.user.vehicles && userDbInstance.user.vehicles[vm.vehicle.id] && userDbInstance.user.vehicles[vm.vehicle.id].reg == vm.vehicle.reg && userDbInstance.user.vehicles[vm.vehicle.id].manuf == vm.vehicle.manuf && userDbInstance.user.vehicles[vm.vehicle.id].model == vm.vehicle.model) || (vm.vehicle.reg == '' && vm.vehicle.manuf == '' && vm.vehicle.model == '');
            return checkuser && checkvehicle;
        }

        //  save to database
        function save() {
            $log.info('same = ' + isSame());
            if (isSame() == true) {
                successfullSave();
                return;
            }

            userDbInstance.user.mobile = vm.user.mobile;
            userDbInstance.user.name = vm.user.name;
            userDbInstance.user.email = vm.user.email;

            if (!((vm.vehicle.reg == '' || vm.vehicle.reg == undefined) && (vm.vehicle.manuf == '' || vm.vehicle.manuf == undefined) && (vm.vehicle.model == '' || vm.vehicle.model == undefined))) {
                if (!userDbInstance.user.vehicles)
                    userDbInstance.user.vehicles = {}
                var vehicleDbInstance = userDbInstance.user.vehicles[vm.vehicle.id];
                if (vehicleDbInstance) {
                    vehicleDbInstance.reg = vm.vehicle.reg;
                    vehicleDbInstance.manuf = vm.vehicle.manuf;
                    vehicleDbInstance.model = vm.vehicle.model;
                } else {
                    var prefixVehicle = 'vhcl' + ((vm.vehicle.manuf && vm.vehicle.model) ? '-' + angular.lowercase(vm.vehicle.manuf).replace(' ', '-') + '-' + angular.lowercase(vm.vehicle.model).replace(' ', '-') : '');
                    userDbInstance.user.vehicles[utils.generateUUID(prefixVehicle)] = {
                        reg: (vm.vehicle.reg == undefined ? '' : vm.vehicle.reg),
                        manuf: (vm.vehicle.manuf == undefined ? '' : vm.vehicle.manuf),
                        model: (vm.vehicle.model == undefined ? '' : vm.vehicle.model)
                    };
                }
            }
            
            if (vm.user.id)
                amCustomers.saveCustomer(userDbInstance).then(successfullSave).catch(failedSave);
            else
                failedSave();
        }

        function successfullSave(res) {
            $state.go('restricted.customers.all');
            utils.showSimpleToast('Customer has been updated successfully!');
        }

        function failedSave(err) {
            utils.showSimpleToast('Failed to update customer. Please Try Again!');
        }
    }
})();