/**
 * Factory to handle login events
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amLogin', LoginFactory);

    LoginFactory.$inject = ['$q', '$amRoot', 'utils', 'pdbConfig', 'pdbCustomers'];

    function LoginFactory($q, $amRoot, utils, pdbConfig, pdbCustomers) {
        //  initialize factory variable and funtion maps
        var factory = {
            login: login,
            loginDetails: loginDetails
        }
        
        return factory;
        
        //  function definitions
        
        //  get login details from database
        function loginDetails() {
            var tracker = $q.defer();
            $amRoot.isWorkshopId().then(workshopConfigFound).catch(failure);
            return tracker.promise;
            
            function workshopConfigFound(res) {
                pdbConfig.get($amRoot.docIds.workshop).then(configExists).catch(failure);
            }
            
            function configExists(res) {
                if (res.user && res.user.username && res.user.password) {
                    tracker.resolve({
                        username: res.user.username
                    });
                } else
                    failure();
            }
            
            function failure(err) {
                tracker.reject({
                    success: false
                })
            }
        }
        
        //  store login information into database
        function login(username, password) {
            var tracker = $q.defer();
            $amRoot.isWorkshopId().then(workshopConfigFound).catch(failure);
            return tracker.promise;
            
            function workshopConfigFound(res) {
                pdbConfig.get($amRoot.docIds.workshop).then(configExists).catch(noDocFound);
                
                function configExists(res) {
                    if (!res.user)
                        res.user = {};
                    res.user['username'] = username;
                    res.user['password'] = password;
                    updateCreatorToDocs(username);
                    pdbConfig.save(res).then(success).catch(failure);
                }
                
                function noDocFound(err) {
                    var doc = {};
                    doc['_id'] = utils.generateUUID('workshop');
                    doc.user = {
                        username: username,
                        password: password
                    };
                    updateCreatorToDocs(username);
                    pdbConfig.save(doc).then(success).catch(failure);
                }
                
                function success(res) {
                    tracker.resolve(res);
                }
            }
            
            function failure(err) {
                tracker.reject(err);
            }
        }
        
        //  manually update creator to all (unsynced) documents
        function updateCreatorToDocs(creator) {
            pdbConfig.getAll().then(configFound).catch(failure);
            pdbCustomers.getAll().then(customersFound).catch(failure);
            
            function configFound(res) {
                res.rows.forEach(iterateConfigDoc);
                
                function iterateConfigDoc(element) {
                    element.doc['creator'] = creator;
                    pdbConfig.save(element.doc);
                }
            }
            
            function customersFound(res) {
                res.rows.forEach(iterateCustomerDoc);
                
                function iterateCustomerDoc(element) {
                    element.doc['creator'] = creator;
                    pdbCustomers.save(element.doc);
                }
            }
            
            function failure(err) {
                $log.warn('Cannot sync data');
            }
        }
    }
})();