(function() {
    angular.module('altairApp')
        .controller('inventoriesAddCtrl', InventoriesAdd);

    InventoriesAdd.$inject = ['$state', 'InventoryFactory'];

    function InventoriesAdd($state, InventoryFactory) {
        var vm = this;
        //  declarations and mappings
        vm.save = save;
        //  define operation mode to disbable particular fields in different modes
        vm.operationMode = "add";
        //  define object to track inventory details
        vm.inventory = {
            details: '',
            rate: ''
        }

        //  save data to pouchDB instance
        function save() {
            InventoryFactory.saveInventory(vm.inventory, vm.operationMode).then(function(res) {
                if (res.ok) {
                    UIkit.notify("Treatment has been added.", {
                        status: 'info',
                        timeout: 3000
                    });
                    $state.go("restricted.inventories.all");
                } else {
                    UIkit.notify("Treatment can not be added at moment. Please Try Again!", {
                        status: 'info',
                        timeout: 3000
                    });
                }
            }, function(err) {
                UIkit.notify("Treatment can not be added at moment. Please Try Again!", {
                    status: 'info',
                    timeout: 3000
                });
            })
        }
    }
})();