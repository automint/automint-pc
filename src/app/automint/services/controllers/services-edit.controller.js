(function() {
    angular.module('altairApp')
        .controller('servicesEditCtrl', ServicesEdit);

    ServicesEdit.$inject = ['ServiceFactory', '$state', 'WizardHandler', '$filter', '$q'];

    function ServicesEdit(ServiceFactory, $state, WizardHandler, $filter, $q) {
        var vm = this;
        //  temporary assignments
        var userId = $state.params.userId;
        var vehicleId = $state.params.vehicleId;
        var serviceId = $state.params.serviceId;
        //  declarations and mappings
        vm.validateCustomer = validateCustomer;
        vm.validateVehicle = validateVehicle;
        vm.addProblemRow = addProblemRow;
        vm.updateTreatmentDetails = updateTreatmentDetails;
        vm.updateCost = updateCost;
        vm.save = save;
        vm.changeVehicleType = changeVehicleType;
        //  define operation mode to disable particular fields in different modes
        vm.operationMode = 'edit';
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
            vehicletype: ''
        }
        vm.service = {
            id: '',
            date: '',
            odo: 0,
            cost: 0,
            status: '',
            problems: []
        }
        vm.treatments = [];
        //  default treatment settings
        vm.displayTreatmentAsList = false;
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
            name: 'XLarge Car'
        }];
        //  auto complete user name options
        vm.autoUserOptions = {
                dataTextField: "key",
                dataValueField: "id",
                select: function(e) {
                    var dataItem = this.dataItem(e.item.index());
                    vm.user.id = dataItem.id;
                }
            }
            //  keep track of service status [TEMP]
        vm.servicestatus = true;
        //  keep track of model options
        vm.modelsOptions = {
            select: function(e) {
                var dataItem = this.dataItem(e.item.index());
                vm.vehicle.model = dataItem;
            }
        };

        //  default execution steps
        //  if any parameter is missing, then return to View All Services
        if (userId == undefined || vehicleId == undefined || serviceId == undefined) {
            UIkit.notify("Something went wrong! Please Try Again!", {
                pos: 'bottom-right',
                status: 'danger',
                timeout: 3000
            });
            $state.go('restricted.services.all');
            return;
        }
        //  resolve all dependent promises and then load data
        $q.all([
            getTreatmentDisplayFormat(),
            populateTreatmentList()
        ]).then(function(res) {
            loadData();
        }, function(err) {
            loadData();
        });

        //  get treatment settings
        function getTreatmentDisplayFormat() {
            var differed = $q.defer();
            ServiceFactory.treatmentSettings().then(function(res) {
                if (res)
                    vm.displayTreatmentAsList = res.displayAsList;
                differed.resolve({
                    success: true
                });
            }, function(err) {
                differed.reject({
                    success: false
                })
            });
            return differed.promise;
        }

        //  load customer service data from database
        function loadData() {
            ServiceFactory.customerDetails(userId, vehicleId, serviceId).then(function(res) {
                var u = $.extend({}, res);
                delete u.vehicle;
                vm.user = u;
                delete u;

                var v = $.extend({}, res.vehicle);
                delete v.service;
                vm.vehicle = v;
                delete v;

                if (vm.displayTreatmentAsList) {
                    vm.service.date = moment(res.vehicle.service.date).format('DD/MM/YYYY'); 
                    vm.service.odo = res.vehicle.service.odo;
                    vm.service.cost = res.vehicle.service.cost;
                    vm.service.status = res.vehicle.service.status;
                    res.vehicle.service.problems.forEach(function(problem) {
                        var found = $filter('filter')(vm.service.problems, {
                            details: problem.details
                        }, true);
                        if (found.length > 0) {
                            found[0].checked = true;
                            found[0].rate = found[0].rate[vm.vehicle.vehicletype];
                        } else {
                            var focusIndex = vm.service.problems.length;
                            var problem = {
                                populateType: 'manual',
                                checked: true,
                                details: problem.details,
                                rate: problem.rate,
                                focusIndex: focusIndex
                            }
                            vm.service.problems.push(problem);
                        }
                    });
                } else {
                    vm.service = res.vehicle.service;
                    vm.service.date = moment(res.vehicle.service.date).format('DD/MM/YYYY');
                    vm.service.problems.forEach(function(problem) {
                        problem.checked = true;
                        problem.populateType = 'manual';
                    });
                }
                changeVehicleType();
                vm.user.id = userId;
                vm.vehicle.id = vehicleId;
                vm.service.id = serviceId;
                vm.servicestatus = (vm.service.status == 'Paid');
                WizardHandler.wizard().goTo(2);
            }, function(err) {
                //  no user data found
            });
        }

        //  populate treatment list
        function populateTreatmentList() {
            var differed = $q.defer();
            ServiceFactory.populateRegularTreatments().then(function(res) {
                vm.treatments = res;
                if (vm.displayTreatmentAsList) {
                    res.forEach(function(treatment) {
                        var focusIndex = vm.service.problems.length;
                        var problem = {
                            populateType: 'treatments',
                            checked: false,
                            rate: treatment.rate,
                            details: treatment.name,
                            focusIndex: focusIndex
                        }
                        vm.service.problems.push(problem);
                    });
                }
                differed.resolve({
                    success: true
                })
            }, function(err) {
                vm.treatments = [];
                differed.reject({
                    success: false
                })
            });
            return differed.promise;
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
                return false;
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
                    return false;
                }
            }
            return checkPoint1;
        }
        //  FORM VALIDATIONS [END]

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

        //  save service to database
        function save() {
            vm.service.date = moment(vm.service.date, 'DD/MM/YYYY').format();
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
                    UIkit.notify("Service has been updated.", {
                        pos: 'bottom-right',
                        status: 'info',
                        timeout: 3000
                    });
                    $state.go("restricted.services.all");
                } else {
                    UIkit.notify("Service can not be updated at moment. Please Try Again!", {
                        pos: 'bottom-right',
                        status: 'danger',
                        timeout: 3000
                    });
                }
            }, function(err) {
                UIkit.notify("Service can not be updated at moment. Please Try Again!", {
                    pos: 'bottom-right',
                    status: 'danger',
                    timeout: 3000
                });
            });
        }
    }
})();