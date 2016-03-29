(function() {
    angular.module('altairApp')
        .controller('servicesEditCtrl', ServicesEdit);

    ServicesEdit.$inject = ['ServiceFactory', '$state', 'WizardHandler', '$filter'];

    function ServicesEdit(ServiceFactory, $state, WizardHandler, $filter) {
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
            model: ''
        }
        vm.service = {
            id: '',
            date: '',
            odo: 0,
            cost: 0,
            details: '',
            problems: []
        }
        vm.treatments = [];
        
        //  default execution steps
        populateTreatmentList();
        //  if any parameter is missing, then return to View All Services
        if (userId == undefined || vehicleId == undefined || serviceId == undefined) {
            UIkit.notify("Something went wrong! Please Try Again!", {
                status: 'danger',
                timeout: 3000
            });
            $state.go('restricted.services.all');
            return;
        }
        loadData();
        
        //  load customer service data from database
        function loadData() {
            ServiceFactory.customerDetails(userId, vehicleId, serviceId).then(function(res) {
                vm.user.id = userId;
                vm.vehicle.id = vehicleId;
                vm.user.mobile = res.mobile;
                vm.user.email = res.email;
                vm.user.name = res.name;
                vm.vehicle.reg = res.vehicle.reg;
                vm.vehicle.manuf = res.vehicle.manuf;
                vm.vehicle.model = res.vehicle.model;
                vm.service = res.vehicle.service;
                vm.service.id = serviceId;
                WizardHandler.wizard().goTo(2);
            }, function(err) {
                //  no user data found
            });
        }
        
        //  populate treatment list
        function populateTreatmentList() {
            ServiceFactory.populateRegularTreatments().then(function(res) {
                vm.treatments = res;
            }, function(err) {
                vm.treatments = [];
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
                vm.service.problems[index].rate = found[0].rate;
                if (vm.service.problems[index].qty < 1)
                    vm.service.problems[index].qty = 1;
            } else {
                vm.service.problems[index].rate = 0;
            }
            updateCost();
        }

        //  generate uuid for unique keys
        var generateUUID = function(type) {
            var d = new Date().getTime();
            var raw = type + '-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

            var uuId = raw.replace(/[xy]/g, function(c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d / 16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });

            return uuId;
        }

        //  add black problem record manually
        function addProblemRow() {
            var fIndex = vm.service.problems.length;
            vm.service.problems.push({
                details: '',
                rate: 0,
                qty: 0,
                focusIndex: fIndex
            });
            var focusField = '#pDetails' + fIndex;
            setTimeout(function() {
                $(focusField).focus();
            }, 500);
        }

        //  update total cost referecing indevidual problem's cost
        function updateCost() {
            var totalCost = 0;
            vm.service.problems.forEach(function(element) {
                totalCost += element.rate * element.qty;
            })
            vm.service.cost = totalCost;
        }

        //  save service to database
        function save() {
            ServiceFactory.saveService(vm.user, vm.vehicle, vm.service).then(function(res) {
                if (res.ok) {
                    UIkit.notify("Service has been updated.", {
                        status: 'info',
                        timeout: 3000
                    });
                    $state.go("restricted.services.all");
                } else {
                    UIkit.notify("Service can not be updated at moment. Please Try Again!", {
                        status: 'danger',
                        timeout: 3000
                    });
                }
            }, function(err) {
                UIkit.notify("Service can not be updated at moment. Please Try Again!", {
                    status: 'danger',
                    timeout: 3000
                });
            });
        }
    }
})();