(function() {
    angular.module('altairApp')
        .factory('CustomerFactory', CustomerFactory);

    CustomerFactory.$inject = ['pdbCustomer', '$q', '$automintService', 'utils', 'pdbCommon'];

    function CustomerFactory(pdbCustomer, $q, $automintService, utils, pdbCommon) {
        var factory = {
            forDatatable: forDatatable,
            deleteCustomer: deleteCustomer,
            addNewCustomer: addNewCustomer,
            saveCustomer: saveCustomer,
            customer: customer,
            getManufacturers: getManufacturers,
            getModels: getModels
        }
        
        //  fetch manufacturers from database
        function getManufacturers() {
            var differed = $q.defer();
            var manufacturers = [];
            pdbCommon.get('manuf-models').then(function(res) {
                Object.keys(res).forEach(function(manuf) {
                    if (!manuf.match(/\b_id|\b_rev/i))
                        manufacturers.push(manuf);
                });
                
                differed.resolve(manufacturers);
            }, function(err) {
                differed.reject(manufacturers);
            });
            return differed.promise;
        }
        
        //  fetch models based on manufacturer from database
        function getModels(manufacturer) {
            var differed = $q.defer();
            var models = [];
            pdbCommon.get('manuf-models').then(function(res) {
                if (res[manufacturer] && res[manufacturer].models)
                    differed.resolve(Object.keys(res[manufacturer].models));
                else
                    differed.reject(models);
            }, function(err) {
                differed.reject(models);
            });
            return differed.promise;
        }

        //   retrieve data to display into datatables
        function forDatatable() {
            var differed = $q.defer();
            var customers = [];
            pdbCustomer.db().query(function(doc, emit) {
                var vo = {};
                var u = {
                    name: doc.user.name,
                    email: doc.user.email,
                    mobile: doc.user.mobile
                }
                if (doc.user.vehicles) {
                    Object.keys(doc.user.vehicles).forEach(function(vehicleKey) {
                        var vehicle = doc.user.vehicles[vehicleKey];
                        var v = {
                            reg: vehicle.reg,
                            manuf: vehicle.manuf,
                            model: vehicle.model,
                        }
                        vo[vehicleKey] = v;
                    });
                    u.vehicles = vo;
                }
                if (!doc.user._deleted)
                    emit(u);
            }).then(function(res) {
                for (var i = 0; i < res.rows.length; i++) {
                    var user = res.rows[i].key;
                    var c = {
                        id: res.rows[i].id,
                        mobile: user.mobile,
                        email: user.email,
                        name: user.name
                    };
                    c.vehicles = [];
                    if (user.vehicles) {
                        var vehicleKeys = Object.keys(user.vehicles);
                        vehicleKeys.forEach(function(vId) {
                            var vehicle = $.extend({}, user.vehicles[vId]);
                            if (vehicle.services)
                                delete vehicle.services;
                            c.vehicles.push(vehicle);
                        }, this);
                    }
                    customers.push(c);
                }
                differed.resolve(customers);
            });
            return differed.promise;
        }

        //  delete a customer from database
        function deleteCustomer(customer) {
            var differed = $q.defer();
            pdbCustomer.get(customer.id).then(function(res) {
                res.user._deleted = true;
                pdbCustomer.save(res).then(function(res) {
                    differed.resolve(res)
                }, function(err) {
                    differed.reject(res);
                });
            });
            return differed.promise;
        }
        
        //  save a document to pouchDB
        function saveCustomer(u) {
            var differed = $q.defer();
            pdbCustomer.save(u).then(function(res) {
                differed.resolve(res);
            }, function(err) {
                differed.reject(err);
            });
            return differed.promise;
        }

        //  save new customer to pouchDB instance
        function addNewCustomer(u) {
            //  make fresh document
            var doc = {
                _id: utils.generateUUID("user"),
                creator: $automintService.username,
                user: u
            };
            // saveDataInDB(doc);
            return saveCustomer(doc);
        }
        
        //  get customer from database
        function customer(customerId) {
            return pdbCustomer.get(customerId);
        }

        return factory;
    }
})();