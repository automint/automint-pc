(function() {
    angular.module('altairApp')
        .controller('customersAddCtrl', CustomerAdd);
        
    CustomerAdd.$inject = ['$state', 'CustomerData'];

    function CustomerAdd($state, CustomerData) {
        var vm = this;
        //  declare and map functions
        vm.validateCustomerInformation = validateCustomerInformation;
        vm.save = save;
        //  define operation mode to disbable particular fields in different modes
        vm.operationMode = "add";
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

        //  save data to pouchDB instance
        function save() {
            //  make and format a document for pouchDB

            var objVehicle = {
                reg: vm.vehicle.reg,
                manuf: vm.vehicle.manuf,
                model: vm.vehicle.model
            };

            var propVehicle = {};
            propVehicle[generateUUID("vhcl")] = objVehicle;
            var u = {
                mobile: vm.user.mobile,
                name: (vm.user.name == null ? $("#wizard_customer_name").val() : vm.user.name),
                email: vm.user.email
            };

            if (!(vm.vehicle.reg == '' && vm.vehicle.manuf == '' && vm.vehicle.model == '')) {
                u.vehicles = propVehicle;
            }
            
            CustomerData.addNewCustomer(u).then(function(res) {
                UIkit.notify("Customer has been added.", {
                    status: 'info',
                    timeout: 3000
                });
                $state.go("restricted.customers.all");
            }, function(err) {
                //  customer can not be added
            });
        };

    };
})();