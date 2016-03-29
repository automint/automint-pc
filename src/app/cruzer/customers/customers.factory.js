(function() {
    angular.module('altairApp')
        .factory('CustomerFactory', CustomerFactory);

    CustomerFactory.$inject = ['$pouchDBUser', '$q'];

    function CustomerFactory($pouchDBUser, $q) {
        var factory = {
            forDatatable: forDatatable,
            deleteCustomer: deleteCustomer,
            addNewCustomer: addNewCustomer,
            saveCustomer: saveCustomer,
            customer: customer
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

        //   retrieve data to display into datatables
        function forDatatable() {
            var differed = $q.defer();
            var customers = [];
            $pouchDBUser.db().query(function(doc, emit) {
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
                    if (user.vehicles) {
                        var vehicleKeys = Object.keys(user.vehicles);
                        vehicleKeys.forEach(function(vId) {
                            var vehicle = user.vehicles[vId];
                            c.vehicleId = vId;
                            c.reg = vehicle.reg;
                            c.manufacturer = vehicle.manuf;
                            c.model = vehicle.model;
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
            $pouchDBUser.get(customer.id).then(function(res) {
                res.user._deleted = true;
                $pouchDBUser.save(res).then(function(res) {
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
            $pouchDBUser.save(u).then(function(res) {
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
                _id: generateUUID("user"),
                user: u
            };
            // saveDataInDB(doc);
            return saveCustomer(doc);
        }
        
        //  get customer from database
        function customer(customerId) {
            return $pouchDBUser.get(customerId);
        }

        return factory;
    }
})();