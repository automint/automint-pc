(function() {
    angular.module('altairApp')
        .service('$automintService', AutomintService)
        .factory('backupRestore', BackupRestore);

    AutomintService.$inject = ['constants', 'pdbCustomer', 'pdbConfig', 'automintFactory', '$q', 'pdbCommon'];
    BackupRestore.$inject = ['pdbConfig', 'pdbCustomer', 'constants', '$q'];

    function AutomintService(constants, pdbCustomer, pdbConfig, automintFactory, $q, pdbCommon) {
        var sVm = this;
        //  keep track of current user name
        sVm.currentConfig = {};
        sVm.username = '';
        //  function declaration and mapping
        sVm.initDb = initDb;
        sVm.syncDb = syncDb;
        sVm.updateConfigReferences = updateConfigReferences;
        sVm.checkTreatmentId = checkTreatmentId;
        sVm.checkWorkshopId = checkWorkshopId;
        sVm.checkSettingsId = checkSettingsId;

        //  create and set up database with remote
        function initDb() {
            //  set local database and blank database url indicating no remote configured
            pdbConfig.setDatabase(constants.pdb_w_config);
            pdbCustomer.setDatabase(constants.pdb_w_customers);
            pdbCommon.setDatabase(constants.pdb_common);

            //  call sync
            remoteToLocalSync();
            syncDb();
        }

        //  update currentConfig content
        function updateConfigReferences() {
            var differed = $q.defer();
            pdbConfig.getAll().then(function(res) {
                res.rows.forEach(function(element) {
                    if (element.id.match(/treatment-/i))
                        sVm.currentConfig.treatment = element.id;
                    if (element.id.match(/workshop-/i))
                        sVm.currentConfig.workshop = element.id;
                    if (element.id.match(/settings-/i))
                        sVm.currentConfig.settings = element.id;
                });
                differed.resolve({
                    success: true
                })
            }, function(err) {
                differed.reject({
                    success: false
                })
            });
            return differed.promise;
        }

        //  check if database is syncable to remote
        function checkSyncable() {
            var differed = $q.defer();
            checkWorkshopId().then(function(configRes) {
                pdbConfig.get(sVm.currentConfig.workshop).then(function(res) {
                    if (res.user) {
                        differed.resolve({
                            success: true,
                            username: res.user.username,
                            password: res.user.password
                        });
                    } else {
                        differed.reject({
                            success: false
                        });
                    }
                }, function(err) {
                    differed.reject({
                        success: false
                    });
                });
            }, function(configErr) {
                differed.reject({
                    success: false
                })
            });
            return differed.promise;
        }

        //  set up sync
        function syncDb() {
            checkSyncable().then(function(res) {
                if (res.success) {
                    sVm.username = res.username;
                    //  construct database url for workshop configurations
                    dbConfigUrl = automintFactory.generateDbUrl(res.username, res.password, constants.sgw_w_config);
                    //  construct database url for workshop's customers db
                    dbCustomerUrl = automintFactory.generateDbUrl(res.username, res.password, constants.sgw_w_customers);

                    //  sync database
                    pdbConfig.sync(dbConfigUrl).on('change', function(info) {
                        //  listen to on change event
                    }).on('paused', function(err) {
                        //  listen to on pause event
                    }).on('active', function() {
                        //  listen to on active event
                    }).on('denied', function(err) {
                        //  listen to on denied event
                    }).on('complete', function(info) {
                        //  listen to on complete event
                        updateConfigReferences();
                    }).on('error', function(err) {
                        //  listen to on error event
                    });
                    pdbCustomer.sync(dbCustomerUrl).on('change', function(info) {
                        //  listen to on change event
                    }).on('paused', function(err) {
                        //  listen to on pause event
                    }).on('active', function() {
                        //  listen to on active event
                    }).on('denied', function(err) {
                        //  listen to on denied event
                    }).on('complete', function(info) {
                        //  listen to on complete event
                    }).on('error', function(err) {
                        //  listen to on error event
                    });
                }
            }, function(err) {
                //  no doc found
            });
        }
        
        //  set up remote to local sync
        function remoteToLocalSync() {
            //  set up common database sync
            pdbCommon.replicate(constants.db_url + constants.sgw_common).on('change', function(info) {
                //  listen to on change event
            }).on('paused', function(err) {
                //  listen to on pause event
            }).on('active', function() {
                //  listen to on active event
            }).on('denied', function(err) {
                //  listen to on denied event
            }).on('complete', function(info) {
                //  listen to on complete event
            }).on('error', function(err) {
                //  listen to on error event
            });
        }

        //  check if treatment id is loaded to currentConfig
        function checkTreatmentId() {
            return checkId('treatment');
        }

        //  check if workshop id is loaded to currentConfig
        function checkWorkshopId() {
            return checkId('workshop');
        }

        //  check if settings id is loaded to currentConfig
        function checkSettingsId() {
            return checkId('settings');
        }

        function checkId(query) {
            var differed = $q.defer();
            if (sVm.currentConfig[query] == '' || sVm.currentConfig[query] == undefined) {
                sVm.updateConfigReferences().then(function(res) {
                    differed.resolve({
                        success: true
                    });
                }, function(err) {
                    differed.reject({
                        success: false
                    })
                })
            } else {
                differed.resolve({
                    success: true
                })
            }
            return differed.promise;
        }
    }

    function BackupRestore(pdbConfig, pdbCustomer, constants, $q) {
        var factory = {
            backup: backup
        }

        function backup() {
            var differed = $.Deferred();
            var backupDocument = {
                backAppVersion: constants.automint_version,
                backupTime: Date.now()
            }

            $q.all([
                pdbCustomer.getAll(),
                pdbConfig.getAll()
            ]).then(function(data) {
                backupDocument.customers = {}
                backupDocument.customers.doc = [];
                backupDocument.config = {};
                backupDocument.config.doc = [];
                data[0].rows.forEach(function(intr_customer) {
                    backupDocument.customers.doc.push(intr_customer.doc);
                });
                data[1].rows.forEach(function(intr_config) {
                    backupDocument.config.doc.push(intr_config.doc);
                });
                //  content dispostion
                var docText = JSON.stringify(backupDocument);
                var date = new Date();
                //  download content
                var a = document.createElement('a');
                var file = new Blob([docText], {
                    type: 'text/plain'
                });
                a.href = URL.createObjectURL(file);
                a.download = 'backup-' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + '-' + date.getMinutes() + '-auto.mint';
                a.click();
                differed.resolve({
                    status: 1,
                    message: 'Backup File has been created.'
                });
            }, function(err) {
                differed.reject({
                    status: 0,
                    message: 'Failed to create backup.'
                });
            });

            return differed;
        }

        return factory;
    }
})();