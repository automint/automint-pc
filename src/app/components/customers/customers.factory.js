/**
 * Factory that handles database interactions between customer database and controller
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amCustomers', CustomersFactory);
    
    CustomersFactory.$inject = ['$q', '$http', 'utils','pdbCommon', 'pdbCustomers', '$amRoot'];
    
    // function CustomersFactory($q:angular.IQService, $http:angular.IHttpService, utils, pdbCommon, pdbCustomers, $amRoot) {
    function CustomersFactory($q, $http, utils, pdbCommon, pdbCustomers, $amRoot) {
        //  initialize factory variable and map functions
        var factory = {
            getCustomers: getCustomers,
            getManufacturers: getManufacturers,
            getModels: getModels,
            addNewCustomer: addNewCustomer,
            deleteCustomer: deleteCustomer,
            getCustomer: getCustomer,
            saveCustomer: saveCustomer
        };
        
        return factory;
        
        //  function definitions
        
        
        //  get customers for datatable
        function getCustomers(page, limit) {
            var tracker = $q.defer();
            var customers = [];
            var skip = --page*limit;
            var dbOptions = {
                include_docs: true,
                limit: limit,
                skip: skip
            }
            pdbCustomers.getAll(dbOptions).then(success).catch(failure);
            return tracker.promise;
            
            //  if documents are accisible in database
            function success(res) {
                if (res.rows.length > 0) {
                    res.rows.forEach(iterateRow);
                    
                    function iterateRow(row) {
                        var customer = {}, vehicles = [];
                        if (row.doc && row.doc.user) {
                            customer.id = row.doc._id;
                            customer.name = row.doc.user.name;
                            customer.mobile = row.doc.user.mobile;
                            customer.email = row.doc.user.email;
                            if (row.doc.user.vehicles) {
                                Object.keys(row.doc.user.vehicles).forEach(iterateVehicle);
                                customer.vehicles = vehicles;
                            }
                            customers.push(customer);
                        }
                        //  self cleaning
                        delete customer;
                        delete vehicles;
                        
                        function iterateVehicle(vId) {
                            vehicles.push({
                                reg: row.doc.user.vehicles[vId].reg,
                                manuf: row.doc.user.vehicles[vId].manuf,
                                model: row.doc.user.vehicles[vId].model
                            });
                        }
                    }
                }
                tracker.resolve({
                    total: res.total_rows,
                    customers: customers
                });
            }
            //  when database rejects
            function failure(error) {
                tracker.reject({
                    total: 0,
                    customers: customers
                });
            }
        }
        
        //  get all manufacturers available in Automint
        function getManufacturers() {
            var tracker = $q.defer();
            var manufacturers = [];
            pdbCommon.get('manuf-models').then(success).catch(missDb);
            return tracker.promise;
            
            //  success ? add manufacturers to an array and return it via promise
            function success(response) {
                Object.keys(response).forEach(manufIterator);
                tracker.resolve(manufacturers);
            }
            
            //  !success ? get manufacturer list from raw json file, then execute success sequence again
            function missDb(error) {
                $http.get('data/manuf_model.json').success(success).catch(failure);
            }
            
            //  iterate through manufacturer list and get individual manufacturer
            function manufIterator(manuf) {
                if (!manuf.match(/\b_id|\b_rev/i))
                    manufacturers.push(manuf);
            }
            
            //  thorwn an error via promise
            function failure(error) {
                tracker.reject(error);
            }
        }
        
        //  get model for particular manufacturer
        function getModels(manufacturer) {
            var tracker = $q.defer();
            var models = [];
            pdbCommon.get('manuf-models').then(success).catch(missDb);
            return tracker.promise;
            
            //  success ? add models to an array and return it via promise
            function success(response) {
                if (response[manufacturer] && response[manufacturer].models)
                    models = Object.keys(response[manufacturer].models);
                tracker.resolve(models);
            }
            
            //  !success ? get manufacturer list from raw json file, then execute success sequence again
            function missDb(error) {
                $http.get('data/manuf_model.json').success(success).catch(failure);
            }
            
            //  throw an error via promise
            function failure(error) {
                tracker.reject(error);
            }
        }
        
        //  delete customer from database
        function deleteCustomer(cId) {
            var tracker = $q.defer();
            pdbCustomers.get(cId).then(userFound).catch(failure);
            return tracker.promise;
            
            function userFound(res) {
                res._deleted = true;
                pdbCustomers.save(res).then(success).catch(failure);
            }
            
            function success(res) {
                tracker.resolve(res);
            }
            
            function failure(error) {
                tracker.reject(error);
            }
        }
        
        //  save customer to database
        function saveCustomer(document) {
            var tracker = $q.defer();
            pdbCustomers.save(document).then(success).catch(failure);
            return tracker.promise;
            
            function success(response) {
                tracker.resolve(response);
            }
            
            function failure(error) {
                tracker.reject(error);
            }
        }
        
        //  add new customer
        function addNewCustomer(customer, vehicle) {
            var prefixUser = 'user-' + angular.lowercase(customer.name).replace(' ', '-'),
                prefixVehicle;
            
            if (vehicle) { 
                prefixVehicle = 'vehicle' + ((vehicle.manuf && vehicle.model) ? '-' + angular.lowercase(vehicle.manuf).replace(' ', '-') + '-' + angular.lowercase(vehicle.model).replace(' ', '-') : '');
                customer.vehicles = {};
                delete vehicle.id;
                customer.vehicles[utils.generateUUID(prefixVehicle)] = vehicle;
            }
            
            var doc = {
                _id: utils.generateUUID(prefixUser),
                creator: $amRoot.username,
                user: customer
            }
            
            return saveCustomer(doc);
        }
        
        //  get customer from database
        function getCustomer(id) {
            return pdbCustomers.get(id);
        }
    }
})();