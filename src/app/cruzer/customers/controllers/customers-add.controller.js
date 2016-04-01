(function() {
    angular.module('altairApp')
        .controller('customersAddCtrl', CustomerAdd);
        
    CustomerAdd.$inject = ['$state', 'CustomerFactory', 'utils'];

    function CustomerAdd($state, CustomerFactory, utils) {
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
            propVehicle[utils.generateUUID("vhcl")] = objVehicle;
            var u = {
                mobile: vm.user.mobile,
                name: (vm.user.name == null ? $("#wizard_customer_name").val() : vm.user.name),
                email: vm.user.email
            };

            if (!(vm.vehicle.reg == '' && vm.vehicle.manuf == '' && vm.vehicle.model == '')) {
                u.vehicles = propVehicle;
            }
            
            CustomerFactory.addNewCustomer(u).then(function(res) {
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