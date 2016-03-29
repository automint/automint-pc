(function() {
    angular.module('altairApp')
        .controller('customersEditCtrl', CustomersEdit);

    CustomersEdit.$inject = ['$state', 'CustomerFactory'];

    function CustomersEdit($state, CustomerFactory) {
        var vm = this;
        //  declare and map functions
        vm.validateCustomerInformation = validateCustomerInformation;
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
        //  add option for new vehicle by default in pvl
        vm.possibleVehicleList = [{
            id: undefined,
            name: 'New Vehicle'
        }];
        //  auto select new vehicle as option
        vm.currentVehicle = 'New Vehicle';
        
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
            }
        }, function(err) {
            UIkit.notify("Something went wrong! Please Try Again!", {
                status: 'danger',
                timeout: 3000
            });
            $state.go('restricted.customers.all');
        });

        //  FORM VALIDATIONS [BEGIN]
        function validateCustomerInformation() {
            var checkPoint1 = vm.user.name;
            if (checkPoint1 == '') {
                UIkit.notify("Please Enter Customer Name", {
                    status: 'danger',
                    timeout: 3000
                });
                return false;
            }
            return true;
        }
        //  FORM VALIDATIONS [END]

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
        };

        //  auto fill vehicle details
        function fillVehicleDetails() {
            var cv = $("#currentVehicle").val();
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
            propVehicle[generateUUID("vhcl")] = objVehicle;

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
                        userDbInstance.user.vehicles[generateUUID("vhcl")] = objVehicle;
                    }
                } else {
                    userDbInstance.user.vehicles = propVehicle;
                }
            }

            if (vm.user.id) {
                CustomerFactory.saveCustomer(userDbInstance).then(function(res) {
                    UIkit.notify("Customer has been updated.", {
                        status: 'info',
                        timeout: 3000
                    });
                    $state.go("restricted.customers.all");
                }, function(err) {
                    UIkit.notify("Customer can not be updated. Please Try Again!", {
                        status: 'info',
                        timeout: 3000
                    });
                });
            } else {
                UIkit.notify("Something went wrong! Please Try Again!", {
                    status: 'danger',
                    timeout: 3000
                });
                $state.go('restricted.customers.all');
            }
        };
    }
})();