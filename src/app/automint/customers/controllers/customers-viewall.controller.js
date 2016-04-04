(function() {
    angular.module('altairApp')
        .controller('customersViewAllCtrl', CustomersViewAll);

    CustomersViewAll.$inject = ['$state', '$scope', 'DTOptionsBuilder', 'CustomerFactory']

    function CustomersViewAll($state, $scope, DTOptionsBuilder, CustomerFactory) {
        var vm = this;
        //  declarations and mappings
        vm.editCustomer = editCustomer;
        vm.addCustomer = addCustomer;
        vm.deleteCustomer = deleteCustomer;

        //  datatable instance
        vm.dtInstance = {};

        //  datatable options
        vm.dtOptions = DTOptionsBuilder
            .newOptions()
            .withDisplayLength(10);

        //  default execution steps
        refresh();

        //  initialization and definations of functions

        //  refreshes data from data factory (pouchDB)
        function refresh() {
            CustomerFactory.forDatatable().then(function(res) {
                vm.customers = res;
            });
        }

        //  callback for edit customer button
        function editCustomer($e, customer) {
            $state.go('restricted.customers.edit', {
                id: customer.id
            });
        };

        //  callback for delete customer button
        function deleteCustomer($e, customer) {
            CustomerFactory.deleteCustomer(customer).then(function(res) {
                if (res.ok) {
                    UIkit.notify("Customer has been deleted.", {
                        pos: 'bottom-right',
                        status: 'danger',
                        timeout: 3000
                    });
                    refresh();
                }
            }, function (err) {
                //  customer cannot be deleted
            })
        }

        //  callback for add customer button
        function addCustomer() {
            $state.go('restricted.customers.add');
        };
    };
})();