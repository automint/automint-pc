angular.module('altairApp')
    .controller('inventoriesViewAllCtrl',
        function($state, $compile, $scope, $timeout, $resource, DTOptionsBuilder, DTColumnDefBuilder, $pouchDBDefault) {
            var vm = this;
            //  datatable instance
            $scope.dtInstance = {};

            //  datatable options
            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withDisplayLength(10);

            var refresh = function() {
                $pouchDBDefault.get('inventory').then(function(res) {
                    var inventories = [];
                    if (res.regular) {
                        Object.keys(res.regular).forEach(function(details) {
                            if (!details.match(/^(_id|_rev)$/) && !res.regular[details]._deleted) {
                                inventories.push({
                                    name: details,
                                    rate: res.regular[details].rate
                                });
                            }
                        });
                    }
                    vm.inventories = inventories;
                    $scope.$apply();
                }, function(err) {
                    vm.inventories = [];
                });
            }

            refresh();

            //  callback for edit service button
            $scope.editInventory = function($e, inventory) {
                $state.go('restricted.inventories.edit', {
                    name: inventory.name,
                });
            };

            //  callback for delete service button
            $scope.deleteInventory = function($e, inventory) {
                $pouchDBDefault.get('inventory').then(function(res) {
                    res.regular[inventory.name]._deleted = true;
                    $pouchDBDefault.save(res).then(function(res) {
                        UIkit.notify("Treatment has been deleted.", {
                            status: 'danger',
                            timeout: 3000
                        });
                        refresh();
                    }, function(err) {
                        UIkit.notify("Treatment can not be deleted at moment. Please Try Again!", {
                            status: 'danger',
                            timeout: 3000
                        });
                    });
                });
            }

            //  callback for add service button
            $scope.addInventory = function() {
                $state.go('restricted.inventories.add');
            };
        })
    .controller('inventoriesAddCtrl', [
        '$scope',
        '$rootScope',
        'utils',
        '$pouchDBDefault',
        '$state',
        function($scope, $rootScope, utils, $pouchDBDefault, $state) {
            //  define operation mode to disbable particular fields in different modes
            $scope.operationMode = "add";

            //  define object to track inventory details
            $scope.inventory = {
                details: '',
                rate: ''
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

            //  save data to pouchDB instance
            $scope.save = function() {
                //  store in pouch data
                var saveDataInDB = function(document) {
                    $pouchDBDefault.save(document).then(function(res) {
                        UIkit.notify("Treatment has been added.", {
                            status: 'info',
                            timeout: 3000
                        });
                        $state.go("restricted.inventories.all");
                    }, function(err) {
                        UIkit.notify("Treatment can not be added at moment. Please Try Again!", {
                            status: 'info',
                            timeout: 3000
                        });
                    });
                }

                //  make a doc or conflict resolution     CRUZER-TODO[PROMT USER FOR PROPER RESOLUTION]
                var i = {
                    rate: $scope.inventory.rate
                }
                $pouchDBDefault.get('inventory').then(function(res) {
                    if (!res.regular) {
                        res.regular = {};
                    }
                    if (!res.regular[$scope.inventory.details]) {
                        res.regular[$scope.inventory.details] = i;
                    }
                    saveDataInDB(res);
                }, function(err) {
                    var doc = {};
                    doc['_id'] = 'inventory';
                    doc.regular = {};
                    doc.regular[$scope.inventory.details] = i;
                    saveDataInDB(doc);
                });
            }
        }
    ])
    .controller('inventoriesEditCtrl', [
        '$scope',
        '$rootScope',
        'utils',
        '$pouchDBDefault',
        '$state',
        function($scope, $rootScope, utils, $pouchDBDefault, $state) {
            //  define operation mode to disbable particular fields in different modes
            $scope.operationMode = "edit";

            //  define object to track inventory details
            $scope.inventory = {
                details: '',
                rate: ''
            }

            //  check if inventory name is passed
            if ($state.params.name == undefined || $state.params.name == '') {
                UIkit.notify("Something went wrong! Please Try Again!", {
                    status: 'danger',
                    timeout: 3000
                });
                $state.go('restricted.inventories.all');
            }

            //  get inventory from database
            $pouchDBDefault.get('inventory').then(function (res) {
                $scope.inventory.details = $state.params.name;
                $scope.inventory.rate = res.regular[$state.params.name].rate;
            }, function (err) {
                UIkit.notify("Something went wrong! Please Try Again!", {
                    status: 'danger',
                    timeout: 3000
                });
                $state.go('restricted.inventories.all');
            });

            //  save data to pouchDB instance
            $scope.save = function() {
                //  store in pouch data
                var saveDataInDB = function(document) {
                    $pouchDBDefault.save(document).then(function(res) {
                        UIkit.notify("Treatment has been updated.", {
                            status: 'info',
                            timeout: 3000
                        });
                        $state.go("restricted.inventories.all");
                    }, function(err) {
                        UIkit.notify("Treatment can not be updated at moment. Please Try Again!", {
                            status: 'info',
                            timeout: 3000
                        });
                    });
                }

                //  make a doc or conflict resolution     CRUZER-TODO[PROMT USER FOR PROPER RESOLUTION]
                var i = {
                    rate: $scope.inventory.rate
                }
                $pouchDBDefault.get('inventory').then(function(res) {
                    res.regular[$scope.inventory.details] = i;
                    saveDataInDB(res);
                }, function(err) {
                    //  if no match found in database, exit the page notifying user about the error
                    UIkit.notify("Something went wrong! Please Try Again!", {
                        status: 'danger',
                        timeout: 3000
                    });
                    $state.go('restricted.inventories.all');
                });
            }
        }
    ]);