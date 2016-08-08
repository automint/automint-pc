/**
 * Factory that handles database interactions between customer database and controller
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amCustomers', CustomersFactory);

    CustomersFactory.$inject = ['$q', '$http', 'utils', 'pdbCommon', 'pdbCustomers', 'pdbConfig', '$amRoot'];

    function CustomersFactory($q, $http, utils, pdbCommon, pdbCustomers, pdbConfig, $amRoot) {
        //  initialize factory variable and map functions
        var factory = {
            getCustomers: getCustomers,
            getManufacturers: getManufacturers,
            getModels: getModels,
            addNewCustomer: addNewCustomer,
            deleteCustomer: deleteCustomer,
            getCustomer: getCustomer,
            saveCustomer: saveCustomer,
            getMemberships: getMemberships,
            getRegularTreatments: getRegularTreatments,
            getVehicleTypes: getVehicleTypes,
            getCustomerByMobile: getCustomerByMobile,
            getCurrencySymbol: getCurrencySymbol
        };

        return factory;

        //  function definitions

        function getCurrencySymbol() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(failure);
            }

            function getSettingsObject(res) {
                if (res.currency)
                    tracker.resolve(res.currency);
                else
                    failure('No Currency Symbol Found!');
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function getCustomerByMobile(mobile) {
            var tracker = $q.defer();
            pdbCustomers.query(mapView, {
                include_docs: true,
                key: mobile
            }).then(success).catch(failure);
            return tracker.promise;
            
            function mapView(doc, emit) {
                if (doc.user)
                    emit(doc.user.mobile, doc.user);
            }
            
            function success(res) {
                var doc = res.rows[0].doc;
                var response = {};
                var pvl = [];
                response.id = doc._id;
                response.mobile = doc.user.mobile;
                response.email = doc.user.email;
                response.name = doc.user.name;
                response.address = doc.user.address;
                response.memberships = doc.user.memberships;
                if (doc.user.vehicles)
                    Object.keys(doc.user.vehicles).forEach(iterateVehicle);
                response.possibleVehicleList = pvl;
                tracker.resolve(response);
                
                delete doc;
                    
                function iterateVehicle(vId) {
                    var vehicle = doc.user.vehicles[vId];
                    pvl.push({
                        id: vId,
                        reg: vehicle.reg,
                        manuf: vehicle.manuf,
                        model: vehicle.model,
                        name: vehicle.manuf + ' - ' + vehicle.model + (vehicle.reg == '' || vehicle.reg == undefined ? '' : ', ' + vehicle.reg),
                        type: (vehicle.type) ? vehicle.type : ''
                    });
                }
            }
            function failure(err) {
                tracker.reject(undefined);
            }
        }
        
        function getVehicleTypes() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(failure);
            }

            function getSettingsObject(res) {
                if (res.vehicletypes)
                    tracker.resolve(res.vehicletypes);
                else
                    tracker.reject('No vehicle types found!');
            }

            function failure(err) {
                tracker.reject(err);
            }
        }
        
        function getRegularTreatments() {
            var tracker = $q.defer();
            var treatments = [];
            $amRoot.isTreatmentId().then(getConfigDocument).catch(failure);
            return tracker.promise;

            function getConfigDocument(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(getConfigObject).catch(failure);
            }

            function getConfigObject(res) {
                if (res.regular)
                    Object.keys(res.regular).forEach(iterateTreatments);
                tracker.resolve(treatments);

                function iterateTreatments(name) {
                    if (!res.regular[name]._deleted) {
                        treatments.push({
                            name: name,
                            rate: res.regular[name].rate
                        })
                    }
                }
            }

            function failure(err) {
                tracker.reject(treatments);
            }
        }
        
        function getMemberships() {
            var tracker = $q.defer();
            var response = {
                memberships: [],
                total: 0
            }
            $amRoot.isTreatmentId().then(getTreatmentsDoc).catch(failure);
            return tracker.promise;
            
            function getTreatmentsDoc(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(getTreatmentObject).catch(failure);
            }
            
            function getTreatmentObject(res) {
                if (res.memberships)
                    Object.keys(res.memberships).forEach(iterateMemberships);
                tracker.resolve(response);
                
                function iterateMemberships(membership) {
                    if (res.memberships[membership]._deleted == true)
                        return;
                    var occ = res.memberships[membership].occurences;
                    var dur = res.memberships[membership].duration;
                    delete res.memberships[membership].occurences;
                    delete res.memberships[membership].duration;
                    response.memberships.push({
                        name: membership,
                        treatments: res.memberships[membership],
                        occurences: occ,
                        duration: dur,
                        amount: res.memberships[membership].amount,
                        description: res.memberships[membership].description
                    });
                    delete res.memberships[membership].amount;
                    delete res.memberships[membership].description;
                    delete occ;
                    delete dur;
                    response.total++;
                }
            }
            
            function failure(err) {
                tracker.reject(response);
            }
        }

        //  get customers for datatable
        function getCustomers(page, limit, query) {
            var tracker = $q.defer();
            var customers = [];
            if (query == '' || query == undefined) {
                pdbCustomers.getAll({
                    include_docs: true,
                    limit: limit,
                    skip: --page * limit
                }).then(successBulk).catch(failure);
            } else {
                pdbCustomers.query({
                    map: mapQuery,
                    reduce: reduceQuery
                }, {
                    group: true,
                    limit: limit,
                    skip: --page * limit
                }).then(successQuery).catch(failure);
            }

            return tracker.promise;


            // map-reduce function for querying database [BEGIN]
            function mapQuery(doc, emit) {
                if (doc.user.vehicles)
                    Object.keys(doc.user.vehicles).forEach(iterateVehicles);
                doc.user._id = doc._id;
                emit(query, doc.user);

                function iterateVehicles(vehicle) {
                    delete vehicle.services;
                }
            }

            function reduceQuery(keys, values, rereduce) {
                var result = [];
                var q = angular.lowercase(keys[0][0]);
                values.forEach(iterateValues);
                return result;

                function iterateValues(value) {
                    var vehicleFound = false;
                    if (value.vehicles)
                        Object.keys(value.vehicles).forEach(iterateVehicles);
                    if ((value.name && angular.lowercase(value.name).search(q) > -1) || (value.email && angular.lowercase(value.email).search(q) > -1) || (value.mobile && angular.lowercase(value.mobile).search(q) > -1) || vehicleFound) {
                        result.push(value);
                    }

                    function iterateVehicles(vId) {
                        if ((value.vehicles[vId].manuf && angular.lowercase(value.vehicles[vId].manuf).search(q) > -1) || (value.vehicles[vId].model && angular.lowercase(value.vehicles[vId].model).search(q) > -1) || (value.vehicles[vId].reg && angular.lowercase(value.vehicles[vId].reg).search(q) > -1))
                            vehicleFound = true;
                    }
                }
            }
            // map-reduce function for querying database [END]

            //  when map-reduce query successfully executes
            function successQuery(res) {
                var result = [];
                res.rows.forEach(iterateRows);
                tracker.resolve({
                    total: result.length,
                    customers: result
                });

                function iterateRows(row) {
                    if (row.value)
                        row.value.forEach(iterateValues);
                }

                function iterateValues(value) {
                    var customer = {}, vehicles = [];
                    if (value) {
                        if (value.name == 'Anonymous')
                            return;
                        customer.id = value._id;
                        customer.name = value.name;
                        customer.mobile = value.mobile;
                        customer.email = value.email;
                        if (value.vehicles) {
                            Object.keys(value.vehicles).forEach(iterateVehicle);
                            customer.vehicles = vehicles;
                        }
                        result.push(customer);
                    }
                    //  self cleaning
                    delete customer;
                    delete vehicles;

                    function iterateVehicle(vId) {
                        vehicles.push({
                            reg: value.vehicles[vId].reg,
                            manuf: value.vehicles[vId].manuf,
                            model: value.vehicles[vId].model
                        });
                    }
                }
            }

            //  if documents are accisible in database
            function successBulk(res) {
                if (res.rows.length > 0) {
                    res.rows.forEach(iterateRow);

                    function iterateRow(row) {
                        if (row.doc.user.name == 'Anonymous')
                            return;
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
        function addNewCustomer(customer, vehicles) {
            var prefixUser = 'usr-' + angular.lowercase(customer.name).replace(' ', '-');

            if (vehicles)
                customer.vehicles = vehicles;
            
            if (customer.memberships != undefined) {
                var smArray = $.extend([], customer.memberships);
                customer.memberships = {};
                smArray.forEach(addMembershipsToUser);
            }

            var doc = {
                _id: utils.generateUUID(prefixUser),
                creator: $amRoot.username,
                user: customer
            }
            
            return saveCustomer(doc);
            
            function addMembershipsToUser(membership) {
                var mTreatments = $.extend([], membership.treatments);
                membership.treatments = {};
                mTreatments.forEach(iterateTreatments);
                customer.memberships[membership.name] = {
                    occurences: membership.occurences,
                    duration: membership.duration,
                    treatments: membership.treatments,
                    startdate: membership.startdate
                }
                delete mTreatments;
                
                function iterateTreatments(treatment) {
                    membership.treatments[treatment.name] = $.extend({}, treatment);
                    delete membership.treatments[treatment.name].name;
                    delete membership.treatments[treatment.name].checked;
                    delete membership.treatments[treatment.name]['$$hashKey'];
                }
            }
        }

        //  get customer from database
        function getCustomer(id) {
            return pdbCustomers.get(id);
        }
    }
})();