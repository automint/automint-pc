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
        vm.changeDisplayAs = changeDisplayAs;
        //  datatable instance
        vm.dtInstance = {};
        //  datatable options
        vm.dtOptions = DTOptionsBuilder
            .newOptions()
            .withDisplayLength(10);
        //  inventories array for datatable
        vm.inventories = [];
        //  checkbox for display format
        vm.displayAsList = false;

        //  default execution steps
        refresh();

        //  refresh datatable from database
        function refresh() {
            InventoryFactory.currentInventorySettings().then(function(res) {
                if (res)
                    vm.displayAsList = res.displayAsList;
            });
            InventoryFactory.inventoriesAsArray().then(function(res) {
                vm.inventories = res;
            }, function(err) {
                vm.inventories = [];
            });
        }

        //  checkbox listener for display format
        function changeDisplayAs() {
            InventoryFactory.changeDisplayAs(vm.displayAsList).then(function(res) {
                if (res.ok) {
                    UIkit.notify("Settings Saved!", {
                        status: 'success',
                        timeout: 3000
                    });
                } else {
                    vm.displayAsList = !vm.displayAsList;
                    UIkit.notify("Could not save settings at moment.", {
                        status: 'warning',
                        timeout: 3000
                    });
                }
            }, function(err) {
                vm.displayAsList = !vm.displayAsList;
                UIkit.notify("Could not save settings at moment.", {
                    status: 'warning',
                    timeout: 3000
                });
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