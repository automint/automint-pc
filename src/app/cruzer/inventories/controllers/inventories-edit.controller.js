(function() {
    angular.module('altairApp')
        .controller('inventoriesEditCtrl', InventoriesEdit);

    InventoriesEdit.$inject = ['$state', 'InventoryFactory'];

    function InventoriesEdit($state, InventoryFactory) {
        var vm = this;
        //  temporary assignments
        var inventoryName = $state.params.name;
        //  declarations and mappings
        vm.save = save;
        //  define operation mode to disbable particular fields in different modes
        vm.operationMode = "edit";
        //  define object to track inventory details
        vm.inventory = {
            details: '',
            rate: ''
        }

        //default execution steps
        if (inventoryName == '' || inventoryName == undefined) {
            UIkit.notify("Something went wrong! Please Try Again!", {
                status: 'danger',
                timeout: 3000
            });
            $state.go('restricted.inventories.all');
            return;
        }
        loadInventory();
        
        //  auto load inventory details
        function loadInventory() {
            InventoryFactory.inventoryDetails(inventoryName).then(function(res) {
                vm.inventory = res;
                console.log(res);
            });
        }

        //  save data to pouchDB instance
        function save() {
            console.log(vm.inventory);
            InventoryFactory.saveInventory(vm.inventory, vm.operationMode).then(function(res) {
                if (res.ok) {
                    UIkit.notify("Treatment has been updated.", {
                        status: 'info',
                        timeout: 3000
                    });
                    $state.go("restricted.inventories.all");
                } else {
                    UIkit.notify("Treatment can not be updated at moment. Please Try Again!", {
                        status: 'info',
                        timeout: 3000
                    });
                }
            }, function(err) {
                UIkit.notify("Treatment can not be updated at moment. Please Try Again!", {
                    status: 'info',
                    timeout: 3000
                });
            })
        }
    }
})();