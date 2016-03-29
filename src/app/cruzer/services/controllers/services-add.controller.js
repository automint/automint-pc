(function() {
    angular.module('altairApp')
        .controller('servicesAddCtrl', ServicesAdd);

    ServicesAdd.$inject = ['ServiceFactory', '$filter', 'WizardHandler', '$state'];

    function ServicesAdd(ServiceFactory, $filter, WizardHandler, $state) {
        var vm = this;
        //  temporary assignments
        var currentDateObject = new Date();
        var currentMonthValue = currentDateObject.getMonth() + 1;
        //  declarations and mappings
        vm.validateCustomer = validateCustomer;
        vm.validateVehicle = validateVehicle;
        vm.addProblemRow = addProblemRow;
        vm.updateTreatmentDetails = updateTreatmentDetails;
        vm.updateCost = updateCost;
        vm.fillUserDetails = fillUserDetails;
        vm.fillVehicleDetails = fillVehicleDetails;
        vm.save = save;
        //  define operation mode to disable particular fields in different modes
        vm.operationMode = 'add';
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
            date: currentDateObject.getDate() + "/" + (currentMonthValue < 10 ? "0" + currentMonthValue : currentMonthValue) + "/" + currentDateObject.getFullYear(),
            odo: 0,
            cost: 0,
            details: '',
            problems: [{
                details: '',
                rate: 0,
                qty: 0,
                focusIndex: 0
            }]
        }
        vm.possibleUsersList = [];
        vm.treatments = [];
        vm.possibleVehiclesList = [{
            id: undefined,
            name: 'New Vehicle'
        }];
        vm.currentVehicle = vm.possibleVehiclesList[0].name;

        //  default execution steps
        populateUsersList();
        populateTreatmentList();

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
            }, function(err) {
                vm.treatments = [];
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
                if (vehicle.name == vm.currentVehicle)
                    vm.vehicle = vehicle;
            }
        }

        //  save service to database
        function save() {
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