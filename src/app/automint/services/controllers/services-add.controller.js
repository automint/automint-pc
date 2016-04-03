(function() {
    angular.module('altairApp')
        .controller('servicesAddCtrl', ServicesAdd);

    ServicesAdd.$inject = ['ServiceFactory', '$filter', 'WizardHandler', '$state', 'utils'];

    function ServicesAdd(ServiceFactory, $filter, WizardHandler, $state, utils) {
        var vm = this;
        //  temporary assignments
        var currentDateObject = new Date();
        var currentMonthValue = currentDateObject.getMonth() + 1;
        var currentDateValue = currentDateObject.getDate();
        var autocompletedUser = '';
        //  declarations and mappings
        vm.validateCustomer = validateCustomer;
        vm.validateVehicle = validateVehicle;
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.convertRegToUpperCase = convertRegToUpperCase;
        vm.addProblemRow = addProblemRow;
        vm.updateTreatmentDetails = updateTreatmentDetails;
        vm.updateCost = updateCost;
        vm.fillUserDetails = fillUserDetails;
        vm.fillVehicleDetails = fillVehicleDetails;
        vm.save = save;
        vm.changeVehicleType = changeVehicleType;
        vm.populateModels = populateModels;
        vm.treatmentDetailsListener = treatmentDetailsListener;
        vm.manufacturerChange = manufacturerChange;
        //  define operation mode to disable particular fields in different modes
        vm.operationMode = 'add';
        //  handle vehicle types
        vm.possibleVehicleTypes = [{
            id: 'default',
            name: 'Default'
        }, {
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
        }];
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
            status: '',
            problems: []
        }
        vm.possibleUsersList = [];
        vm.treatments = [];
        //  default treatment settings
        vm.displayTreatmentAsList = false;
        //  auto complete user name options
        vm.autoUserOptions = {
            dataTextField: "key",
            dataValueField: "id",
            select: function(e) {
                var dataItem = this.dataItem(e.item.index());
                vm.user.id = dataItem.id;
                autocompletedUser = dataItem.key;
            }
        };
        //  keep track of service status [TEMP]
        vm.servicestatus = true;
        //  keep track of manufacturers and models
        vm.manufacturers = [];
        vm.models = [];
        vm.modelsOptions = {
            select: function(e) {
                var dataItem = this.dataItem(e.item.index());
                vm.vehicle.model = dataItem;
            }
        };

        //  default execution steps
        getTreatmentDisplayFormat();
        populateUsersList();
        populateTreatmentList();
        populateManufacturers();

        //  get manufacturers from database
        function populateManufacturers() {
            ServiceFactory.getManufacturers().then(function(res) {
                vm.manufacturers = res;
            }, function(err) {
                vm.manufacturers = res;
            });
        }

        //  get models based on manufacturer from database
        function populateModels() {
            if (vm.vehicle.manuf == '') {
                vm.vehicle.model = '';
                vm.models = [];
                return;
            }
            ServiceFactory.getModels(vm.vehicle.manuf).then(function(res) {
                vm.models = res;
            }, function(err) {
                vm.models = err;
            });
        }

        //  get treatment settings
        function getTreatmentDisplayFormat() {
            ServiceFactory.treatmentSettings().then(function(res) {
                if (res)
                    vm.displayTreatmentAsList = res.displayAsList;
            });
        }
        
        //  clear model name by changing manufacturer name
        function manufacturerChange() {
            vm.vehicle.model = '';
        }

        //  convert to title case
        function convertNameToTitleCase() {
            vm.user.name = utils.convertToTitleCase(vm.user.name);
            if (autocompletedUser != vm.user.name)
                vm.user.id = '';
        }

        //  convert to upper case
        function convertRegToUpperCase() {
            vm.vehicle.reg = vm.vehicle.reg.toUpperCase();
        }

        //  FORM VALIDATIONS [BEGIN]
        function validateCustomer() {
            var checkPoint1 = vm.user.name;
            if (checkPoint1 == '' || checkPoint1 == undefined) {
                UIkit.notify('Please Enter Customer Name', {
                    pos: 'bottom-right',
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
                        pos: 'bottom-right',
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

        //  listen to treatment details box
        function treatmentDetailsListener(index) {
            if (vm.service.problems[index].details == '') {
                vm.service.problems[index].checked = false;
                vm.service.problems[index].rate = 0;
            } else {
                vm.service.problems[index].checked = true;
            }
        }

        //  update treatment details when vehicle type changes
        function changeVehicleType() {
            vm.service.problems.forEach(function(problem) {
                var found = $filter('filter')(vm.treatments, {
                    name: problem.details
                });
                if (found.length > 0 && (problem.checked || vm.displayTreatmentAsList)) {
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
                checked: false,
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
            ServiceFactory.autoFillUser(vm.user.id).then(function(res) {
                vm.user.id = res.id;
                vm.user.email = res.email;
                vm.user.mobile = res.mobile;
                vm.possibleVehiclesList = res.vehicles;
                vm.currentVehicle = vm.possibleVehiclesList[0].name;
                fillVehicleDetails();
            }, function(err) {
                vm.user.id = '';
                vm.user.name = utils.convertToTitleCase(vm.user.name);
                vm.user.email = '';
                vm.user.mobile = '';
                vm.possibleVehiclesList = [{
                    id: undefined,
                    name: 'New Vehicle'
                }];
                vm.currentVehicle = vm.possibleVehiclesList[0].name;
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
            vm.service.status = vm.servicestatus ? 'Paid' : 'Billed';
            ServiceFactory.saveService(vm.user, vm.vehicle, vm.service).then(function(res) {
                if (res.ok) {
                    UIkit.notify("Service has been added.", {
                        pos: 'bottom-right',
                        status: 'info',
                        timeout: 3000
                    });
                    $state.go("restricted.services.all");
                } else {
                    UIkit.notify("Service can not be added at moment. Please Try Again!", {
                        pos: 'bottom-right',
                        status: 'danger',
                        timeout: 3000
                    });
                }
            }, function(err) {
                UIkit.notify("Service can not be added at moment. Please Try Again!", {
                    pos: 'bottom-right',
                    status: 'danger',
                    timeout: 3000
                });
            });
        }
    }
})();