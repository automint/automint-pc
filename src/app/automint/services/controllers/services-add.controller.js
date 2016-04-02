(function() {
    angular.module('altairApp')
        .controller('servicesAddCtrl', ServicesAdd);

    ServicesAdd.$inject = ['ServiceFactory', '$filter', 'WizardHandler', '$state'];

    function ServicesAdd(ServiceFactory, $filter, WizardHandler, $state) {
        var vm = this;
        //  temporary assignments
        var currentDateObject = new Date();
        var currentMonthValue = currentDateObject.getMonth() + 1;
        var currentDateValue = currentDateObject.getDate();
        //  declarations and mappings
        vm.validateCustomer = validateCustomer;
        vm.validateVehicle = validateVehicle;
        vm.addProblemRow = addProblemRow;
        vm.updateTreatmentDetails = updateTreatmentDetails;
        vm.updateCost = updateCost;
        vm.fillUserDetails = fillUserDetails;
        vm.fillVehicleDetails = fillVehicleDetails;
        vm.save = save;
        vm.changeVehicleType = changeVehicleType;
        //  define operation mode to disable particular fields in different modes
        vm.operationMode = 'add';
        //  handle vehicle types
        vm.possibleVehicleTypes = [{
            id: 'smallcar',
            name: 'Small Car'
        }, {
            id: 'mediumcar',
            name: 'Medium Car'
        }, {
            id: 'largecar',
            name: 'Large Car'
        }, {
            id: 'xlargecar',
            name: 'x-Large Car'
        }, {
            id: 'default',
            name: 'Default'
        }]
        //  keep track of data from UI and set their default values
        vm.user = {
            id: '',
            mobile: '',
            email: '',
            name: ''
        }
        vm.vehicle = {
            id: '',
            reg: '',
            manuf: '',
            model: '',
            vehicletype: vm.possibleVehicleTypes[0].id
        }
        vm.service = {
            date: (currentDateValue < 10 ? "0" + currentDateValue : currentDateValue) + "/" + (currentMonthValue < 10 ? "0" + currentMonthValue : currentMonthValue) + "/" + currentDateObject.getFullYear(),
            odo: 0,
            cost: 0,
            details: '',
            problems: []
        }
        vm.possibleUsersList = [];
        vm.treatments = [];
        vm.possibleVehiclesList = [{
            id: undefined,
            name: 'New Vehicle'
        }];
        vm.currentVehicle = vm.possibleVehiclesList[0].name;
        //  default treatment settings
        vm.displayTreatmentAsList = false;

        //  default execution steps
        getTreatmentDisplayFormat();
        populateUsersList();
        populateTreatmentList();

        //  get treatment settings
        function getTreatmentDisplayFormat() {
            ServiceFactory.treatmentSettings().then(function(res) {
                if (res)
                    vm.displayTreatmentAsList = res.displayAsList;
            });
        }

        //  FORM VALIDATIONS [BEGIN]
        function validateCustomer() {
            var checkPoint1 = vm.user.name;
            if (checkPoint1 == '' || checkPoint1 == undefined) {
                UIkit.notify('Please Enter Customer Name', {
                    status: 'danger',
                    timeout: 3000
                });
                return false; // (TODO) CHANGE IT TO FALSE
            }
            return true;
        }

        function validateVehicle() {
            var checkPoint1 = vm.validateCustomer();
            if (checkPoint1) {
                var checkPoint2 = (vm.vehicle.reg == '' || vm.vehicle.reg == undefined) && (vm.vehicle.manuf == '' || vm.vehicle.manuf == undefined) && (vm.vehicle.model == '' || vm.vehicle.model == undefined);
                if (checkPoint2) {
                    UIkit.notify('Please Enter At Least One Vehicle Detail', {
                        status: 'danger',
                        timeout: 3000
                    });
                    WizardHandler.wizard().goTo(1);
                    return false; //  (TODO) CHANGE IT TO FALSE
                }
            }
            return checkPoint1;
        }
        //  FORM VALIDATIONS [END]

        //  populate users list based on user's name
        function populateUsersList() {
            ServiceFactory.populateUsersList('name').then(function(res) {
                vm.possibleUsersList = res;
            }, function(err) {
                vm.possibleUsersList = [];
            })
        }

        //  populate treatment list
        function populateTreatmentList() {
            ServiceFactory.populateRegularTreatments().then(function(res) {
                vm.treatments = res;
                if (vm.displayTreatmentAsList) {
                    if (res.length > 0) {
                        res.forEach(function(treatment) {
                            var focusIndex = vm.service.problems.length;
                            var problem = {
                                populateType: 'treatments',
                                checked: false,
                                details: treatment.name,
                                rate: treatment.rate[vm.vehicle.vehicletype],
                                focusIndex: focusIndex
                            }
                            vm.service.problems.push(problem);
                        });
                    } else
                        addProblemRow(false);
                } else
                    addProblemRow(false);
            }, function(err) {
                vm.treatments = [];
                addProblemRow(false);
            });
        }

        //  update treatment details on blurring focus of input fields
        function updateTreatmentDetails(index, fIndex) {
            var divId = 'pDetails' + fIndex;
            var currentDetails = $('#' + divId).val();
            var found = $filter('filter')(vm.treatments, {
                name: currentDetails
            }, true);
            if (found.length > 0) {
                var rate = found[0].rate[vm.vehicle.vehicletype];
                vm.service.problems[index].rate = (rate == '' ? 0 : rate);
            } else {
                vm.service.problems[index].rate = 0;
            }
            updateCost();
        }
        
        //  update treatment details when vehicle type changes
        function changeVehicleType() {
            vm.service.problems.forEach(function(problem) {
                var found = $filter('filter')(vm.treatments, {
                    name: problem.details
                });
                if (found.length > 0) {
                    var rate = found[0].rate[vm.vehicle.vehicletype];
                    var defaultRate = found[0].rate['default'];
                    problem.rate = (rate == '' ? (defaultRate == '' ? 0 : defaultRate) : rate);
                }
            });
            updateCost();
        }

        //  add black problem record manually
        function addProblemRow(focus) {
            var fIndex = vm.service.problems.length;
            vm.service.problems.push({
                populateType: 'manual',
                checked: true,
                details: '',
                rate: 0,
                focusIndex: fIndex
            });
            if (focus) {
                var focusField = '#pDetails' + fIndex;
                setTimeout(function() {
                    $(focusField).focus();
                }, 500);
            }
        }

        //  update total cost referecing indevidual problem's cost
        function updateCost() {
            var totalCost = 0;
            vm.service.problems.forEach(function(element) {
                totalCost += element.rate * (element.checked ? 1 : 0);
            })
            vm.service.cost = totalCost;
        }

        //  auto fill user details based on name provided in input box
        function fillUserDetails() {
            ServiceFactory.autoFillUser(vm.user.name).then(function(res) {
                vm.user.id = res.id;
                vm.user.email = res.email;
                vm.user.mobile = res.mobile;
                vm.possibleVehiclesList = res.vehicles;
            }, function(err) {
                vm.user.id = '';
                vm.user.email = '';
                vm.user.mobile = '';
                vm.possibleVehiclesList = [{
                    id: undefined,
                    name: 'New Vehicle'
                }];
            });
        }

        //  auto fill vehicle based on drop down value
        function fillVehicleDetails() {
            for (var i = 0; i < vm.possibleVehiclesList.length; i++) {
                var vehicle = vm.possibleVehiclesList[i];
                if (vehicle.name == vm.currentVehicle) {
                    vm.vehicle = vehicle;
                    vm.vehicle.vehicletype = (!vm.vehicle.vehicletype) ? vm.possibleVehicleTypes[0].id : vm.vehicle.vehicletype; 
                    changeVehicleType();
                }
            }
        }

        //  save service to database
        function save() {
            for (var i = 0; i < vm.service.problems.length; i++) {
                var problem = vm.service.problems[i];
                if (problem.checked) {
                    delete problem.checked;
                    delete problem.populateType;
                } else
                    vm.service.problems.splice(i--, 1);
            }
            ServiceFactory.saveService(vm.user, vm.vehicle, vm.service).then(function(res) {
                if (res.ok) {
                    UIkit.notify("Service has been added.", {
                        status: 'info',
                        timeout: 3000
                    });
                    $state.go("restricted.services.all");
                } else {
                    UIkit.notify("Service can not be added at moment. Please Try Again!", {
                        status: 'danger',
                        timeout: 3000
                    });
                }
            }, function(err) {
                UIkit.notify("Service can not be added at moment. Please Try Again!", {
                    status: 'danger',
                    timeout: 3000
                });
            });
        }
    }
})();