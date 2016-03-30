(function() {
    angular.module('altairApp')
        .factory('InventoryFactory', InventoryFactory);

    InventoryFactory.$inject = ['$pouchDBDefault', '$q'];

    function InventoryFactory($pouchDBDefault, $q) {
        var factory = {
            inventoriesAsArray: inventoriesAsArray,
            inventoryDetails: inventoryDetails,
            saveInventory: saveInventory,
            deleteInventory: deleteInventory,
            changeDisplayAs: changeDisplayAs,
            currentInventorySettings: currentInventorySettings
        }

        //  return inventories list in form of an array
        function inventoriesAsArray() {
            var differed = $q.defer();
            $pouchDBDefault.get('inventory').then(function(res) {
                var inventories = [];
                if (res.regular) {
                    Object.keys(res.regular).forEach(function(details) {
                        if (!res.regular[details]._deleted) {
                            inventories.push({
                                name: details,
                                rate: res.regular[details].rate
                            });
                        }
                    });
                }
                differed.resolve(inventories);
            }, function(err) {
                differed.reject(err);
            });
            return differed.promise;
        }
        
        //  return particular inventory
        function inventoryDetails(inventoryName) {
            var differed = $q.defer();
            $pouchDBDefault.get('inventory').then(function(res) {
                var inventory = {
                    details: inventoryName,
                    rate: res.regular[inventoryName].rate
                }
                differed.resolve(inventory);
            }, function(err) {
                differed.reject(err);
            });
            return differed.promise;
        }
        
        //  delete inventory from database
        function deleteInventory(inventoryName) {
            var differed = $q.defer();
            $pouchDBDefault.get('inventory').then(function(res) {
                res.regular[inventoryName]._deleted = true;
                $pouchDBDefault.save(res).then(function(success) {
                    differed.resolve(success);
                }, function(failure) {
                    differed.resolve(failure);
                });
            }, function(err) {
                differed.resolve(err);
            });
            return differed.promise;
        }

        //  store inventory to database
        function saveInventory(inventory, method) {
            var differed = $q.defer();
            var i = {
                rate: inventory.rate
            }
            $pouchDBDefault.get('inventory').then(function(res) {
                if (!res.regular)
                    res.regular = {};
                if (!(res.regular[inventory.details] && method == 'add')) {
                    res.regular[inventory.details] = i;
                }
                $pouchDBDefault.save(res).then(function(status) {
                    differed.resolve(status);
                }, function(fail) {
                    differed.reject(fail);
                });
            }, function(err) {
                var doc = {};
                doc['_id'] = 'inventory';
                doc.regular = {};
                doc.regular[inventory.details] = i;
                $pouchDBDefault.save(doc).then(function(success) {
                    differed.resolve(success);
                }, function(error) {
                    differed.reject(error);
                });
            });
            return differed.promise;
        }
        
        function currentInventorySettings() {
            var differed = $q.defer();
            $pouchDBDefault.get('inventory').then(function(res) {
                differed.resolve(res.settings);
            }, function(err) {
                differed.reject(err);
            });
            return differed.promise;
        }
        
        //  change display format setting of inventories
        function changeDisplayAs(displayAsList) {
            var differed = $q.defer();
            $pouchDBDefault.get('inventory').then(function(res) {
                if (!res.settings)
                    res.settings = {};
                res.settings['displayAsList'] = displayAsList;
                $pouchDBDefault.save(res).then(function(status) {
                    differed.resolve(status);
                }, function(fail) {
                    differed.reject(fail);
                });
            }, function(err) {
                var doc = {};
                doc['_id'] = 'inventory';
                doc.settings = {};
                doc.settings['displayAsList'] = displayAsList;
                $pouchDBDefault.save(doc).then(function(status) {
                    differed.resolve(status);
                }, function(fail) {
                    differed.reject(fail);
                });
            });
            return differed.promise;
        }

        return factory;
    }
})();