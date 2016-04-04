(function() {
    angular.module('altairApp')
        .factory('settingsFactory', SettingsFactory);

    SettingsFactory.$inject = ['pdbConfig', '$q', 'pdbCustomer', '$automintService', 'utils'];

    function SettingsFactory(pdbConfig, $q, pdbCustomer, $automintService, utils) {
        var factory = {
            login: login,
            loginDetails: loginDetails
        }

        //  get login details from database
        function loginDetails() {
            var differed = $q.defer();

            $automintService.checkWorkshopId().then(function(configRes) {
                pdbConfig.get($automintService.currentConfig.workshop).then(function(res) {
                    if (res.user && res.user.username && res.user.password) {
                        differed.resolve({
                            success: true,
                            username: res.user.username
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
                });
            })
            return differed.promise;
        }

        //  store login details to database
        function login(username, password) {
            var differed = $q.defer();
            $automintService.checkWorkshopId().then(function(configRes) {
                pdbConfig.get($automintService.currentConfig.workshop).then(function(res) {
                    if (!res.user)
                        res.user = {};
                    res.user['username'] = username;
                    res.user['password'] = password;
                    addCreatorToDocuments(username);
                    pdbConfig.save(res).then(function(saveres) {
                        differed.resolve(saveres);
                    }, function(errres) {
                        differed.reject(errres);
                    });
                }, function(err) {
                    var doc = {};
                    doc['_id'] = utils.generateUUID('workshop');
                    doc.user = {};
                    doc.user['username'] = username;
                    doc.user['password'] = password;
                    addCreatorToDocuments(username);
                    pdbConfig.save(doc).then(function(saveres) {
                        differed.resolve(saveres);
                    }, function(errres) {
                        differed.reject(errres);
                    });
                });
            }, function(configErr) {
                differed.reject(configErr);
            });
            return differed.promise;
        }

        //  manually add create to all (unsynced) documents
        function addCreatorToDocuments(creator) {
            pdbConfig.getAll().then(function(configResponse) {
                configResponse.rows.forEach(function(configDocument) {
                    configDocument.doc['creator'] = creator;
                    pdbConfig.save(configDocument.doc);
                })
            }, function(err) {
                //  error accessing database
            });
            pdbCustomer.getAll().then(function(customerResponse) {
                customerResponse.rows.forEach(function(customerDocument) {
                    customerDocument.doc['creator'] = creator;
                    pdbCustomer.save(customerDocument.doc);
                })
            }, function(err) {
                //  error accessing database
            })
        }

        return factory;
    }
})();