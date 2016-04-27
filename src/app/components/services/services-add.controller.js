/**
 * Controller for Add Service module
 * @author ndkcha
 * @since 0.4.1
 * @version 0.4.1
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlSeCI', ServiceAddController);

    ServiceAddController.$inject = ['$state', '$q', '$log', '$filter', '$mdEditDialog', '$mdDialog', 'utils', 'amServices'];

    /*
    ====== NOTE =======
    > Do not create new method named moment() since it is used by moment.js
    */

    function ServiceAddController($state, $q, $log, $filter, $mdEditDialog, $mdDialog, utils, amServices) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var autofillVehicle = false, flagGetUserBasedOnMobile = true;

        //  vm assignments to keep track of UI related elements
        vm.label_userMobile = 'Enter Mobile Number:';
        vm.label_userEmail = 'Enter Email Address:';
        vm.label_vehicleReg = 'Enter Vehicle Reg Number:';
        vm.label_vehicleManuf = 'Manufacturer:';
        vm.label_vehicleModel = 'Model:';
        vm.vehicleTypeList = [];
        vm.user = {
            id: '',
            mobile: '',
            name: '',
            email: ''
        };
        vm.vehicle = {
            id: '',
            reg: '',
            manuf: '',
            model: '',
            type: ''
        };
        vm.service = {
            date: new Date(),
            odo: 0,
            cost: 0,
            status: '',
            problems: []
        };
        vm.problem = {
            details: '',
            rate: '',
            cost: 0
        }
        vm.manufacturers = [];
        vm.models = [];
        vm.possibleUserList = [];
        vm.treatments = [];
        vm.selectedProblems = [];

        //  function maps
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.convertRegToCaps = convertRegToCaps;
        vm.searchVehicleChange = searchVehicleChange;
        vm.manufacturersQuerySearch = manufacturersQuerySearch;
        vm.modelQuerySearch = modelQuerySearch;
        vm.changeUserMobileLabel = changeUserMobileLabel;
        vm.changeUserEmailLabel = changeUserEmailLabel;
        vm.changeVehicleRegLabel = changeVehicleRegLabel;
        vm.changeVehicleTab = changeVehicleTab;
        vm.changeUserTab = changeUserTab;
        vm.changeVehicle = changeVehicle;
        vm.isAddOperation = isAddOperation;
        vm.chooseVehicle = chooseVehicle;
        vm.userQuerySearch = userQuerySearch;
        vm.selectedUserChange = selectedUserChange;
        vm.changeUserMobile = changeUserMobile;
        vm.selectUserBasedOnMobile = selectUserBasedOnMobile;
        vm.changeVehicleType = changeVehicleType;
        vm.onProblemSelected = onProblemSelected;
        vm.onProblemDeselected = onProblemDeselected;
        vm.editProblemDetails = editProblemDetails;
        vm.editProblemRate = editProblemRate;
        vm.changeServiceTab = changeServiceTab;
        vm.updateTreatmentDetails = updateTreatmentDetails;
        vm.finalizeNewProblem = finalizeNewProblem;
        vm.save = save;

        //  default execution steps
        // vm.serviceTab = true // testing purposes
        getTreatmentDisplayFormat();
        getVehicleTypes();
        getRegularTreatments();
        
        //  function definitions

        //  get treatment settings
        function getTreatmentDisplayFormat() {
            amServices.getTreatmentSettings().then(success);

            //  set treatment flag according to response
            function success(response) {
                if (response) {
                    vm.displayTreatmentAsList = response.displayAsList;
                }
            }
        }

        //  get vehicle types from database
        function getVehicleTypes() {
            amServices.getVehicleTypes().then(success).catch(failure);

            function success(res) {
                res.forEach(iterateVehicleType);
                setDefaultVehicle();

                function iterateVehicleType(type) {
                    vm.vehicleTypeList.push(utils.convertToTitleCase(type.replace(/-/g, ' ')));
                }
            }

            function failure(err) {
                vm.vehicleTypeList.push('Default');
                setDefaultVehicle();
            }
        }

        //  query search for users [autocomplete]
        function userQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.user.name ? vm.possibleUserList.filter(createFilterForUsers(vm.user.name)) : vm.possibleUserList);

            if (results.length > 0) {
                return results;
            }

            amServices.getCustomerNames().then(populateUserList).catch(noUser);
            return tracker.promise;

            function populateUserList(res) {
                vm.possibleUserList = res;
                results = (vm.user.name ? vm.possibleUserList.filter(createFilterForUsers(vm.user.name)) : vm.possibleUserList);
                tracker.resolve(results);
            }

            function noUser(error) {
                results = [];
                tracker.resolve(results);
            }
        }

        //  create filter for users' query list
        function createFilterForUsers(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                return (angular.lowercase(item.name).indexOf(lcQuery) === 0);
            }
        }

        //  auto fill user details to entire service form when user name is selected
        function selectedUserChange() {
            if (vm.currentUser == null) {
                failure();
                return;
            }
            amServices.getCustomerChain(vm.currentUser.id).then(success).catch(failure);

            function success(res) {
                vm.user.id = res.id;
                vm.user.mobile = res.mobile;
                vm.user.email = res.email;
                vm.user.name = res.name;
                changeUserMobileLabel();
                changeUserEmailLabel();
                vm.possibleVehicleList = res.possibleVehicleList;
                vm.changeUserMobile(false);
                changeVehicle(vm.possibleVehicleList.length > 0 ? vm.possibleVehicleList[0].id : undefined);
            }

            function failure(err) {
                vm.user.id = '';
                vm.user.name = '';
                vm.user.mobile = '';
                vm.user.email = '';
                changeUserMobileLabel();
                changeUserEmailLabel();
                vm.possibleVehicleList = [];
                changeVehicle();
            }
        }
        
        //  change flagGetUserBasedOnMobile
        function changeUserMobile(bool) {
            flagGetUserBasedOnMobile = bool;
        }
        
        //  change user based on mobile number
        function selectUserBasedOnMobile() {
            if (vm.user.mobile != '' && (vm.user.id == '' || flagGetUserBasedOnMobile)) {
                vm.changeUserMobile(false);
                vm.loadingBasedOnMobile = true;
                amServices.getCustomerByMobile(vm.user.mobile).then(success).catch(failure);
            }
            
            function success(res) {
                vm.loadingBasedOnMobile = false;
                vm.user.id = res.id;
                vm.user.mobile = res.mobile;
                vm.user.email = res.email;
                vm.user.name = res.name;
                changeUserMobileLabel();
                changeUserEmailLabel();
                vm.possibleVehicleList = res.possibleVehicleList;
                changeVehicle(vm.possibleVehicleList.length > 0 ? vm.possibleVehicleList[0].id : undefined);
            }

            function failure(err) {
                vm.loadingBasedOnMobile = false;
                vm.user.id = '';
                changeUserMobileLabel();
                changeUserEmailLabel();
                vm.possibleVehicleList = [];
                changeVehicle();
            }
        }

        //  change vehicle related details when changed from UI
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
                vm.vehicle.type = found[0].type;
                changeVehicleRegLabel();
                autofillVehicle = true;
            } else
                setDefaultVehicle();
        }

        //  fail-safe mechanism for vehicle miss in database as well as currently loaded vehicle list
        function setDefaultVehicle() {
            vm.currentVehicle = 'New Vehicle';
            vm.vehicle.id = undefined;
            vm.vehicle.reg = '';
            vm.vehicle.manuf = '';
            vm.vehicle.model = '';
            vm.vehicle.type = vm.vehicleTypeList[0];
            autofillVehicle = false;
        }

        //  choose different existing vehicle
        function chooseVehicle($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        }

        //  convert user name to TitleCase when they are typing
        function convertNameToTitleCase() {
            vm.user.name = utils.convertToTitleCase(vm.user.name);
        }

        //  in order to keep registation field in All Caps mode
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

            amServices.getManufacturers().then(allotManufacturers).catch(noManufacturers);
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

            amServices.getModels(vm.vehicle.manuf).then(allotModels).catch(noModels);
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

        //  vehicle manufacturer is updated from UI, clear model list to populate new list w.r.t. manufacturer
        function searchVehicleChange() {
            if (!autofillVehicle) {
                vm.models = [];
                vm.vehicle.model = '';
                autofillVehicle = false;
            }
        }

        //  replace all the treatment values with updated vehicle type
        function changeVehicleType() {
            vm.service.problems.forEach(iterateProblem);
            updateCost();

            function iterateProblem(problem) {
                var found = $filter('filter')(vm.treatments, {
                    name: problem.details
                });
                if (found.length == 1) {
                    var rate = found[0].rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')];
                    var defaultRate = found[0].rate['default'];
                    problem.rate = (rate == '' ? (defaultRate == '' ? 0 : defaultRate) : rate);
                }
            }
        }

        //  return boolean response to different configurations [BEGIN]
        function isAddOperation() {
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

        //  change service tab selector variable
        function changeServiceTab(bool) {
            vm.serviceTab = bool;
        }

        //  listen to changes in input fields [BEGIN]
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
            vm.label_vehicleReg = vm.largeVehicleRegLabel ? 'Vehicle Registration Number:' : 'Enter Vehicle Reg Number:';
        }
        //  listen to changes in input fields [END]

        //  populate regular treatment list
        function getRegularTreatments() {
            amServices.getRegularTreatments().then(success).catch(failure);

            function success(res) {
                vm.treatments = res;
                loadTreatmentIntoProblems();
            }

            function failure(err) {
                vm.treatments = [];
                loadTreatmentIntoProblems();
            }
        }

        //  load treatment list into problem list
        function loadTreatmentIntoProblems() {
            vm.treatments.forEach(iterateTreatment);

            function iterateTreatment(treatment) {
                vm.service.problems.push({
                    details: treatment.name,
                    rate: treatment.rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')],
                    checked: false
                });
            }
        }

        //  problem table listeners [BEGIN]
        function onProblemSelected(item) {
            item.checked = true;
            updateCost();
        }

        function onProblemDeselected(item) {
            item.checked = false;
            updateCost();
        }
        //  problem table listeners [END]

        //  show edit dialog box to edit problem details in run time
        function editProblemDetails(event, item) {
            event.stopPropagation();
            $mdEditDialog.small({
                messages: {
                    test: 'Write your product or issue!'
                },
                modelValue: item.details,
                placeholder: 'Enter Product or Issue',
                save: function(input) {
                    item.details = input.$modelValue;
                },
                targetEvent: event
            });
        }

        //  show edit dialog box to edit problem rate in run time
        function editProblemRate(event, item) {
            event.stopPropagation();
            $mdEditDialog.small({
                messages: {
                    test: 'Enter Rate for ' + item.details + '!'
                },
                modelValue: item.rate,
                placeholder: 'Enter Rate',
                save: function(input) {
                    item.rate = input.$modelValue;
                    updateCost();
                },
                type: 'number',
                targetEvent: event
            });
        }

        //  update cost based on inserted and enabled problems
        function updateCost() {
            var totalCost = 0;
            vm.service.problems.forEach(iterateProblem);
            totalCost += vm.problem.cost;
            vm.service.cost = totalCost;

            function iterateProblem(element) {
                totalCost += (element.rate ? element.rate * (element.checked ? 1 : 0) : 0);
            }
        }

        function finalizeNewProblem(btnClicked) {
            vm.problem.details = vm.problem.details.trim();
            if (vm.problem.details != '') {
                var found = $filter('filter')(vm.service.problems, {
                    details: vm.problem.details
                });
                if (found.length == 1) {
                    found[0].checked = true;
                    vm.selectedProblems.push(found[0]);
                } else {
                    vm.service.problems.push({
                        details: vm.problem.details,
                        rate: vm.problem.rate,
                        checked: true
                    });
                    vm.selectedProblems.push(vm.service.problems[vm.service.problems.length - 1]);
                }
                updateCost();
                vm.problem.details = '';
                vm.problem.cost = '';
                vm.problem.rate = '';
                $('#new-problem-details').focus();
            }
            if (btnClicked)
                $('#new-problem-details').focus();
        }

        function updateTreatmentDetails() {
            var found = $filter('filter')(vm.treatments, {
                name: vm.problem.details
            });
            if (found.length == 1) {
                var rate = found[0].rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')];
                var defaultRate = found[0].rate['default'];
                vm.problem.rate = (rate == '' ? (defaultRate == '' ? 0 : defaultRate) : rate);
            } else
                vm.problem.rate = '';
            vm.problem.cost = (vm.problem.rate == '') ? 0 : vm.problem.rate;
            updateCost();
        }
        
        function validate() {
            if (vm.user.name == '') {
                changeUserTab(true);
                setTimeout(doFocus, 300);
                utils.showSimpleToast('Please Enter Name');
                
                function doFocus() {
                    $('#ami-user-name').focus();
                }
                return false
            }
            var isVehicleBlank = (vm.vehicle.manuf == undefined || vm.vehicle.manuf == '') && (vm.vehicle.model == undefined || vm.vehicle.model == '') && (vm.vehicle.reg == undefined || vm.vehicle.reg == '');
            var isServiceBlank = (vm.service.problems.length == 0) && (vm.service.cost == undefined || vm.service.cost == 0) && (vm.service.odo == undefined || vm.service.odo == 0);
            
            if (!isServiceBlank && isVehicleBlank) {
                changeVehicleTab(true);
                utils.showSimpleToast('Please Enter At Least One Vehicle Detail');
                return false;
            }
            return true;
        }

        //  save to database
        function save() {
            if (!validate()) return;
            vm.service.date = moment(vm.service.date).format();
            vm.service.problems = vm.selectedProblems;
            vm.service.problems.forEach(iterateProblems);
            vm.service.status = vm.servicestatus ? 'paid' : 'billed';
            amServices.saveService(vm.user, vm.vehicle, vm.service).then(success).catch(failure);

            function iterateProblems(problem) {
                delete problem.checked;
                delete problem['$$hashKey'];
            }
        }

        //  (save successfull)
        function success(res) {
            $state.go('restricted.services.all');
            utils.showSimpleToast('Successfully Added!');
        }

        //  !(save successfull)
        function failure(err) {
            utils.showSimpleToast('Failed to add. Please Try Again!');
        }
    }
})();