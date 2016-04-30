/**
 * Controller for Edit Service component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.5.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlSeUI', ServiceEditController);

    ServiceEditController.$inject = ['$state', '$q', '$log', '$filter', '$mdEditDialog', '$mdDialog', 'utils', 'amServices'];

    /*
    ====== NOTE =======
    > Do not create new method named moment() since it is used by moment.js
    */

    function ServiceEditController($state, $q, $log, $filter, $mdEditDialog, $mdDialog, utils, amServices) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var autofillVehicle = false;

        //  vm assignments to keep track of UI related elements
        vm.label_userMobile = 'Enter Mobile Number:';
        vm.label_userEmail = 'Enter Email Address:';
        vm.label_vehicleReg = 'Enter Vehicle Registration Number:';
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
            type: 'default'
        };
        vm.service = {
            date: new Date(),
            odo: 0,
            cost: 0,
            invoiceno: 1,
            status: '',
            problems: []
        }
        vm.manufacturers = [];
        vm.models = [];
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
        vm.changeVehicleType = changeVehicleType;
        vm.onProblemSelected = onProblemSelected;
        vm.onProblemDeselected = onProblemDeselected;
        vm.isAddOperation = isAddOperation;
        vm.editProblemDetails = editProblemDetails;
        vm.editProblemRate = editProblemRate;
        vm.changeServiceTab = changeServiceTab;
        vm.updateTreatmentDetails = updateTreatmentDetails;
        vm.finalizeNewProblem = finalizeNewProblem;
        vm.save = save;

        //  default execution steps
        getVehicleTypes();
        changeServiceTab(true);

        //  function definitions
        
        //  get vehicle types from database
        function getVehicleTypes() {
            amServices.getVehicleTypes().then(success).catch(failure);
            
            function success(res) {
                res.forEach(iterateVehicleType);
                getDetails();
                
                function iterateVehicleType(type) {
                    vm.vehicleTypeList.push(utils.convertToTitleCase(type.replace(/-/g, ' ')));
                }
            }
            
            function failure(err) {
                vm.vehicleTypeList.push('Default');
                getDetails();
            }
        }
        
        //  fill details
        function getDetails() {
            amServices.serviceTree($state.params.userId, $state.params.vehicleId, $state.params.serviceId).then(success).catch(failure);
            
            function success(res) {
                autofillVehicle = true;
                vm.user.id = $state.params.userId;
                vm.user.name = res.name;
                vm.user.email = res.email;
                vm.user.mobile = res.mobile;
                changeUserEmailLabel();
                changeUserMobileLabel();
                vm.vehicle.id = $state.params.vehicleId;
                vm.vehicle.reg = res.vehicle.reg;
                changeVehicleRegLabel();
                vm.vehicle.manuf = res.vehicle.manuf;
                vm.vehicle.model = res.vehicle.model;
                vm.vehicle.type = res.vehicle.type;
                vm.service.id = $state.params.serviceId;
                vm.service.date = new Date(res.vehicle.service.date);
                vm.service.cost = res.vehicle.service.cost;
                vm.service.odo = res.vehicle.service.odo;
                vm.service.invoiceno = res.vehicle.service.invoiceno;
                vm.service.status = res.vehicle.service.status;
                vm.servicestatus = (res.vehicle.service.status == 'paid');
                getRegularTreatments(res.vehicle.service.problems);
            }
            function failure(err) {
                utils.showSimpleToast('Something went wrong!');
                $state.go('restricted.services.all');
            }
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
            return false;
        }
        //  return boolean response to different configurations [END]

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
            vm.label_vehicleReg = vm.largeVehicleRegLabel ? 'Vehicle Registration Number:' : 'Enter Vehicle Registration Number:';
        }
        //  listen to changes in input fields [END]

        //  populate regular treatment list
        function getRegularTreatments(existingProblems) {
            amServices.getRegularTreatments().then(success).catch(failure);

            function success(res) {
                vm.treatments = res;
                loadTreatmentIntoProblems(existingProblems);
            }

            function failure(err) {
                vm.treatments = [];
                loadTreatmentIntoProblems(existingProblems);
            }
        }

        //  load treatment list into problem list
        function loadTreatmentIntoProblems(existingProblems) {
            vm.treatments.forEach(iterateTreatment);
            existingProblems.forEach(iterateProblem);
            
            function iterateProblem(problem) {
                var found = $filter('filter')(vm.service.problems, {
                    details: problem.details
                });
                if (found.length == 1) {
                    found[0].checked = true;
                    found[0].rate = problem.rate;
                    vm.selectedProblems.push(found[0]);
                } else {
                    vm.service.problems.push({
                        details: problem.details,
                        rate: problem.rate,
                        checked: true
                    });
                    vm.selectedProblems.push(vm.service.problems[vm.service.problems.length - 1]);
                }
            }

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
            vm.service.cost = totalCost;
            
            function iterateProblem(element) {
                totalCost += (element.rate ? element.rate * (element.checked ? 1 : 0) : 0);
            }
        }
        
        function finalizeNewProblem() {
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
            utils.showSimpleToast('Successfully Updated!');
        }

        //  !(save successfull)
        function failure(err) {
            utils.showSimpleToast('Failed to update. Please Try Again!');
        }
    }
})();