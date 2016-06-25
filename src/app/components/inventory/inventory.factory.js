/**
 * Factory that handles database interactions between inventory database and controller
 * @author ndkcha
 * @since 0.6.1
 * @version 0.6.1 
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amInventory', InventoryFactory);

    InventoryFactory.$inject = ['$q', '$amRoot', '$filter', 'utils', 'pdbConfig'];

    function InventoryFactory($q, $amRoot, $filter, utils, pdbConfig) {
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
            $amRoot.isSettingsId().then(configFound).catch(failure);
            return tracker.promise;

            function configFound(res) {
                pdbConfig.get($amRoot.docIds.settings).then(configDocFound).catch(failure);
            }

            function configDocFound(res) {
                if (res.settings && res.settings.inventory)
                    tracker.resolve(res.settings.inventory.displayAsList);
                else
                    failure();
            }

            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'Setting not found!'
                    }
                }
                tracker.reject(err);
            }
        }

        function changeDisplayAsList(displayAsList) {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(configFound).catch(failure);
            return tracker.promise;
            
            function configFound(res) {
                pdbConfig.get($amRoot.docIds.settings).then(configDocFound).catch(writeNewConfig);
            }
            function configDocFound(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.inventory)
                    res.settings.inventory = {};
                res.settings.inventory['displayAsList'] = displayAsList;
                pdbConfig.save(res).then(saveSuccess).catch(failure);
            }
            function writeNewConfig(err) {
                var doc = {};
                doc['_id'] = utils.generateUUID('sttngs');
                doc['creator'] = $amRoot.username;
                doc.settings = {};
                doc.settings['inventory'] = {}
                doc.settings.inventory['displayAsList'] = displayAsList;
                pdbConfig.save(doc).then(saveSuccess).catch(failure);
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
            $amRoot.isInventoryId().then(getInventoryDoc).catch(failure);
            return tracker.promise;

            function getInventoryDoc(res) {
                pdbConfig.get($amRoot.docIds.inventory).then(getInventoryObj).catch(failure);
            }

            function getInventoryObj(res) {
                if (res[name]) {
                    res[name]._deleted = true;
                    pdbConfig.save(res).then(success).catch(failure);
                } else
                    failure();
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'Object Not Found!'
                    }
                }
                tracker.reject(err);
            }
        }

        function getInventory(name) {
            var tracker = $q.defer();
            $amRoot.isInventoryId().then(getInventoryDoc).catch(failure);
            return tracker.promise;

            function getInventoryDoc(res) {
                pdbConfig.get($amRoot.docIds.inventory).then(getInventoryObj).catch(failure);
            }

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
            $amRoot.isInventoryId().then(getInventoryDoc).catch(failure);
            return tracker.promise;

            function getInventoryDoc(res) {
                pdbConfig.get($amRoot.docIds.inventory).then(getInventoryObj).catch(failure);
            }

            function getInventoryObj(res) {
                Object.keys(res).forEach(iterateInventories);
                tracker.resolve(response);

                function iterateInventories(name) {
                    if (name.match(/\b_id|\b_rev|\bcreator/i) || res[name]._deleted == true)
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
            $amRoot.isInventoryId().then(getInventoryDoc).catch(failure);
            return tracker.promise;

            function getInventoryDoc(res) {
                pdbConfig.get($amRoot.docIds.inventory).then(getInventoryObj).catch(writeInventoryDoc);
            }

            function getInventoryObj(res) {
                if (!(res[inventory.name] && operationMode == 'add')) {
                    res[inventory.name] = inventory;
                    delete res[inventory.name].name;
                    pdbConfig.save(res).then(success).catch(failure);
                } else {
                    tracker.resolve({
                        ok: true,
                        message: 'Duplicate Entry'
                    });
                }
            }

            function writeInventoryDoc(err) {
                var doc = {
                    _id: utils.generateUUID('invntry'),
                    creator: $amRoot.username
                };
                doc[inventory.name] = inventory;
                delete inventory.name;
                pdbConfig.save(doc).then(success).catch(failure);
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