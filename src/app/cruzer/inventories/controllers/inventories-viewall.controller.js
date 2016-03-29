(function() {
    angular.module('altairApp')
        .controller('inventoriesViewAllCtrl', InventoriesViewAll);

    InventoriesViewAll.$inject = ['$state', 'DTOptionsBuilder', 'InventoryFactory'];

    function InventoriesViewAll($state, DTOptionsBuilder, InventoryFactory) {
        var vm = this;
        //  declarations and mappings
        vm.addInventory = addInventory;
        vm.editInventory = editInventory;
        vm.deleteInventory = deleteInventory;
        //  datatable instance
        vm.dtInstance = {};
        //  datatable options
        vm.dtOptions = DTOptionsBuilder
            .newOptions()
            .withDisplayLength(10);
        //  inventories array for datatable
        vm.inventories = [];

        //  default execution steps
        refresh();

        //  refresh datatable from database
        function refresh() {
            InventoryFactory.inventoriesAsArray().then(function(res) {
                vm.inventories = res;
            }, function(err) {
                vm.inventories = [];
            });
        }

        //  callback for edit service button
        function editInventory($e, inventory) {
            $state.go('restricted.inventories.edit', {
                name: inventory.name,
            });
        };

        //  callback for delete service button
        function deleteInventory($e, inventory) {
            InventoryFactory.deleteInventory(inventory.name).then(function(res) {
                if (res.ok) {
                    UIkit.notify("Treatment has been deleted.", {
                        status: 'danger',
                        timeout: 3000
                    });
                    refresh();
                } else {
                    UIkit.notify("Treatment can not be deleted at moment. Please Try Again!", {
                        status: 'danger',
                        timeout: 3000
                    });
                }
            }, function(err) {
                UIkit.notify("Treatment can not be deleted at moment. Please Try Again!", {
                    status: 'danger',
                    timeout: 3000
                });
            });
        }

        //  callback for add service button
        function addInventory() {
            $state.go('restricted.inventories.add');
        };
    }
})();