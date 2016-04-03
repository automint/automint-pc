(function() {
    angular.module('altairApp')
        .controller('customersEditCtrl', CustomersEdit);

    CustomersEdit.$inject = ['$state', 'CustomerFactory', 'utils'];

    function CustomersEdit($state, CustomerFactory, utils) {
        var vm = this;
        //  declare and map functions
        vm.validateCustomerInformation = validateCustomerInformation;
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.autoCapitalizeManuf = autoCapitalizeManuf;
        vm.autoCapitalizeModel = autoCapitalizeModel;
        vm.convertRegToUpperCase = convertRegToUpperCase;
        vm.fillVehicleDetails = fillVehicleDetails;
        vm.save = save;
        //  define operation mode to disable particular fields in different mode
        vm.operationMode = "edit";
        //  keep track of user and vehicle details from UI
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
        
        //  fetch parameters of the state to keep track of current user
        var paramId = $state.params.id;
      
        //  default execution steps
        //  pre-fill customer and vehicle data
        CustomerFactory.customer(paramId).then(function(res) {
            userDbInstance = res;
            var customers = [];
            var u = res.user;
            var pvl = [];
            vm.user.id = res._id;
            vm.user.mobile = u.mobile;
            vm.user.email = u.email;
            vm.user.name = u.name;
            if (u.vehicles) {
                var vehicleKeys = Object.keys(u.vehicles);
                vehicleKeys.forEach(function(vId) {
                    var vehicle = u.vehicles[vId];
                    pvl.push({
                        id: vId,
                        reg: vehicle.reg,
                        manuf: vehicle.manuf,
                        model: vehicle.model,
                        name: vehicle.manuf + ' - ' + vehicle.model + (vehicle.reg == '' ? '' : ', ' + vehicle.reg)
                    });
                }, this);
                pvl.push({
                    id: undefined,
                    name: 'New Vehicle'
                })
                vm.possibleVehicleList = pvl;
            } else {
                pvl.push({
                    id: undefined,
                    name: 'New Vehicle'
                })
                vm.possibleVehicleList = pvl;
            }
            vm.currentVehicle = vm.possibleVehicleList[0].name;
            fillVehicleDetails();
        }, function(err) {
            UIkit.notify("Something went wrong! Please Try Again!", {
                pos: 'bottom-right',
                status: 'danger',
                timeout: 3000
            });
            $state.go('restricted.customers.all');
        });
        
        //  convert to title case
        function convertNameToTitleCase() {
            vm.user.name = utils.convertToTitleCase(vm.user.name);
        }
        
        //  convert manufacturer to title case
        function autoCapitalizeManuf() {
            vm.vehicle.manuf = utils.autoCapitalize(vm.vehicle.manuf);
        }
        
        //  convert model to title case
        function autoCapitalizeModel() {
            vm.vehicle.model = utils.autoCapitalize(vm.vehicle.model);
        }
        
        //  convert to upper case
        function convertRegToUpperCase() {
            vm.vehicle.reg = vm.vehicle.reg.toUpperCase();
        }

        //  FORM VALIDATIONS [BEGIN]
        function validateCustomerInformation() {
            var checkPoint1 = vm.user.name;
            if (checkPoint1 == '') {
                UIkit.notify("Please Enter Customer Name", {
                    pos: 'bottom-right',
                    status: 'danger',
                    timeout: 3000
                });
                return false;
            }
            return true;
        }
        //  FORM VALIDATIONS [END]

        //  auto fill vehicle details
        function fillVehicleDetails() {
            var cv = vm.currentVehicle;
            for (var pvi = 0; pvi < vm.possibleVehicleList.length; pvi++) {
                var vehicle = vm.possibleVehicleList[pvi];
                if (vehicle.name == cv) {
                    vm.vehicle.id = vehicle.id;
                    vm.vehicle.reg = vehicle.reg;
                    vm.vehicle.manuf = vehicle.manuf;
                    vm.vehicle.model = vehicle.model;
                }
            }
        }

        //  save data to database instance
        function save() {
            //  make and format a document for pouchDB
            var objVehicle = {
                reg: vm.vehicle.reg,
                manuf: vm.vehicle.manuf,
                model: vm.vehicle.model
            };

            var propVehicle = {};
            propVehicle[utils.generateUUID("vhcl")] = objVehicle;

            userDbInstance.user.mobile = vm.user.mobile;
            userDbInstance.user.name = (vm.user.name == null ? $("#wizard_customer_name").val() : vm.user.name);
            userDbInstance.user.email = vm.user.email;

            if (!(vm.vehicle.reg == '' && vm.vehicle.manuf == '' && vm.vehicle.model == '')) {
                if (userDbInstance.user.vehicles) {
                    var vehicleDbInstance = userDbInstance.user.vehicles[vm.vehicle.id];
                    if (vehicleDbInstance) {
                        vehicleDbInstance.reg = vm.vehicle.reg;
                        vehicleDbInstance.manuf = vm.vehicle.manuf;
                        vehicleDbInstance.model = vm.vehicle.model;
                    } else {
                        userDbInstance.user.vehicles[utils.generateUUID("vhcl")] = objVehicle;
                    }
                } else {
                    userDbInstance.user.vehicles = propVehicle;
                }
            }

            if (vm.user.id) {
                CustomerFactory.saveCustomer(userDbInstance).then(function(res) {
                    UIkit.notify("Customer has been updated.", {
                        pos: 'bottom-right',
                        status: 'info',
                        timeout: 3000
                    });
                    $state.go("restricted.customers.all");
                }, function(err) {
                    UIkit.notify("Customer can not be updated. Please Try Again!", {
                        pos: 'bottom-right',
                        status: 'info',
                        timeout: 3000
                    });
                });
            } else {
                UIkit.notify("Something went wrong! Please Try Again!", {
                    pos: 'bottom-right',
                    status: 'danger',
                    timeout: 3000
                });
                $state.go('restricted.customers.all');
            }
        };
    }
})();