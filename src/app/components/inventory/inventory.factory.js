/**
 * Factory that handles database interactions between inventory database and controller
 * @author ndkcha
 * @since 0.6.1
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amInventory', InventoryFactory);

    InventoryFactory.$inject = ['$q', '$rootScope', '$filter', 'pdbMain'];

    function InventoryFactory($q, $rootScope, $filter, pdbMain) {
        //  Initialize factory variable and function mappings
        var factory = {
            getInventory: getInventory,
            deleteInventory: deleteInventory,
            getInventories: getInventories,
            saveInventory: saveInventory,
            changeDisplayAsList: changeDisplayAsList,
            getDisplayAsList: getDisplayAsList
        }

        return factory;

        //  function definitions

        function getDisplayAsList() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(configDocFound).catch(failure);
            return tracker.promise;

            function configDocFound(res) {
                if (res.settings && res.settings.inventory)
                    tracker.resolve(res.settings.inventory.displayAsList);
                else
                    failure('Settings not found!');
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function changeDisplayAsList(displayAsList) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(configDocFound).catch(writeNewConfig);
            return tracker.promise;
            
            function configDocFound(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.inventory)
                    res.settings.inventory = {};
                res.settings.inventory['displayAsList'] = displayAsList;
                pdbMain.save(res).then(saveSuccess).catch(failure);
            }

            function writeNewConfig(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                };
                doc.settings = {};
                doc.settings['inventory'] = {}
                doc.settings.inventory['displayAsList'] = displayAsList;
                pdbMain.save(doc).then(saveSuccess).catch(failure);
            }

            function saveSuccess(response) {
                tracker.resolve(response);
            }

            function failure(error) {
                tracker.reject(error);
            }
        }

        function deleteInventory(name) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.inventory).then(getInventoryObj).catch(failure);
            return tracker.promise;

            function getInventoryObj(res) {
                if (res[name]) {
                    res[name]._deleted = true;
                    pdbMain.save(res).then(success).catch(failure);
                } else
                    failure('Object not found!');
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function getInventory(name) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.inventory).then(getInventoryObj).catch(failure);
            return tracker.promise;

            function getInventoryObj(res) {
                if (res[name]) {
                    var temp = res[name];
                    temp.name = name;
                    tracker.resolve(temp);
                } else
                    failure();
            }

            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'Inventory not found!'
                    }
                }
                tracker.reject(err);
            }
        }

        function getInventories() {
            var tracker = $q.defer();
            var response = [];
            pdbMain.get($rootScope.amGlobals.configDocIds.inventory).then(getInventoryObj).catch(failure);
            return tracker.promise;

            function getInventoryObj(res) {
                Object.keys(res).forEach(iterateInventories);
                tracker.resolve(response);

                function iterateInventories(name) {
                    if (name.match(/\b_id|\b_rev|\bcreator|\bchannel/i) || res[name]._deleted == true)
                        return;
                    var temp = res[name];
                    temp.name = name;
                    response.push(temp);
                    delete temp;
                }
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function saveInventory(inventory, operationMode) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.inventory).then(getInventoryObj).catch(writeInventoryDoc);
            return tracker.promise;

            function getInventoryObj(res) {
                if (!(res[inventory.name] && operationMode == 'add')) {
                    res[inventory.name] = inventory;
                    delete res[inventory.name].name;
                    pdbMain.save(res).then(success).catch(failure);
                } else {
                    tracker.resolve({
                        ok: true,
                        message: 'Duplicate Entry'
                    });
                }
            }

            function writeInventoryDoc(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.inventory,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel
                };
                doc[inventory.name] = inventory;
                delete inventory.name;
                pdbMain.save(doc).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }
    }
})();