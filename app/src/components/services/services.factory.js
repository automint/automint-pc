/**
 * Factory that handles database interactions between services database and controller
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amServices', ServicesFactory);

    ServicesFactory.$inject = ['$http', '$q', 'utils', '$amRoot', 'pdbCustomers', 'pdbCommon', 'pdbConfig'];

    function ServicesFactory($http, $q, utils, $amRoot, pdbCustomers, pdbCommon, pdbConfig) {
        //  initialize factory variable and function maps
        var factory = {
            getManufacturers: getManufacturers,
            getModels: getModels,
            getCustomerNames: getCustomerNames,
            getCustomerChain: getCustomerChain,
            getRegularTreatments: getRegularTreatments,
            saveService: saveService,
            getFilteredServices: getFilteredServices,
            serviceTree: serviceTree,
            deleteService: deleteService,
            getVehicleTypes: getVehicleTypes,
            getTreatmentSettings: getTreatmentSettings
        }

        return factory;

        //  function definitions

        //  retrieve current treatment settings
        function getTreatmentSettings() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(settingsExists).catch(failure);
            return tracker.promise;

            //  if settings configuration is tracked, fetch corrosponding document
            function settingsExists(response) {
                pdbConfig.get($amRoot.docIds.settings).then(settingsSuccess).catch(failure);
            }

            //  if document call is successfull, return treatment settings if available
            function settingsSuccess(response) {
                if (response.settings.treatments)
                    tracker.resolve(response.settings.treatments);
                else {
                    tracker.reject({
                        success: false
                    });
                }
            }

            //  when call fails, return error message
            function failure(error) {
                tracker.reject(error);
            }
        }

        //  retrieve vehicle types from config database
        function getVehicleTypes() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(configFound).catch(noConfigFound);
            return tracker.promise;

            function configFound(res) {
                pdbConfig.get($amRoot.docIds.settings).then(settingsDocFound).catch(noConfigFound);
            }

            function settingsDocFound(res) {
                if (res.vehicletypes)
                    tracker.resolve(res.vehicletypes);
                else
                    tracker.reject('No vehicle types found!');
            }

            function noConfigFound(err) {
                tracker.reject(err);
            }
        }

        //  return service tree
        function serviceTree(userId, vehicleId, serviceId) {
            var tracker = $q.defer();
            pdbCustomers.get(userId).then(userFound).catch(userNotFound);
            return tracker.promise;

            function userFound(response) {
                if (response.user) {
                    var user = $.extend({}, response.user);
                    if (user.vehicles && user.vehicles[vehicleId]) {
                        var vehicle = $.extend({}, user.vehicles[vehicleId]);
                        delete user.vehicles;
                        if (vehicle.services && vehicle.services[serviceId]) {
                            var service = $.extend({}, vehicle.services[serviceId]);
                            delete vehicle.services;
                            if (service.problems) {
                                var problemsArray = [];
                                Object.keys(service.problems).forEach(iterateProblems);

                                function iterateProblems(problem) {
                                    var sourceProblem = $.extend({}, service.problems[problem]);
                                    sourceProblem.details = problem;
                                    sourceProblem.checked = true;
                                    problemsArray.push(sourceProblem);
                                    delete sourceProblem;
                                }
                                service.problems = problemsArray;
                            }
                            vehicle.service = service;
                        }
                        user.vehicle = vehicle;
                    }
                    tracker.resolve(user);
                } else
                    tracker.reject('User Not Found!');
            }

            function userNotFound(error) {
                tracker.reject(error);
            }
        }

        //  delete service from UI
        function deleteService(userId, vehicleId, serviceId) {
            var tracker = $q.defer();
            pdbCustomers.get(userId).then(userFound).catch(failure);
            return tracker.promise;

            function userFound(res) {
                res.user.vehicles[vehicleId].services[serviceId]._deleted = true;
                pdbCustomers.save(res).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        //  return filtered services
        function getFilteredServices(page, limit, filterMonth, filterYear) {
            var tracker = $q.defer();
            queryOptions = {
                limit: limit,
                skip: --page * limit,
                descending: true,
                group: true
            };
            var queryDate = moment().subtract({
                months: filterMonth,
                years: filterYear
            });
            /*if (filterMonth != 0 || filterYear != 0) {
                var queryDate = moment().subtract({
                    months: filterMonth,
                    years: filterYear
                });
                queryOptions.endkey = moment(queryDate).format();
                queryOptions.startkey = moment().format();
            }*/
            pdbCustomers.query(mapFilteredServices, queryOptions).then(success).catch(failure);
            return tracker.promise;

            function mapFilteredServices(doc, emit) {
                view = {};
                if (doc.user.vehicles)
                    Object.keys(doc.user.vehicles).forEach(iterateVehicles);

                function iterateVehicles(vId) {
                    if (doc.user.vehicles[vId].services)
                        Object.keys(doc.user.vehicles[vId].services).forEach(iterateService);

                    function iterateService(sId) {
                        if (doc.user.vehicles[vId].services[sId] && !doc.user.vehicles[vId].services[sId]._deleted) {
                            var date = doc.user.vehicles[vId].services[sId].date;
                            if ((date <= moment().format && date >= moment(queryDate).format()) || (filterMonth == 0 && filterYear == 0)) {
                                view.id = sId;
                                view.vehicleId = vId;
                                view.name = doc.user.name;
                                view.reg = doc.user.vehicles[vId].reg;
                                view.manuf = doc.user.vehicles[vId].manuf;
                                view.model = doc.user.vehicles[vId].model;
                                view.date = moment(date).format('DD MMM YYYY');
                                view.cost = doc.user.vehicles[vId].services[sId].cost;
                                view.status = utils.convertToTitleCase(doc.user.vehicles[vId].services[sId].status);
                                emit(doc.user.vehicles[vId].services[sId].date, view);
                            }
                        }
                    }
                }
            }

            function success(res) {
                tracker.resolve({
                    services: res.rows,
                    total: res.total_rows
                });
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        //  return regular treatments from config database
        function getRegularTreatments() {
            var tracker = $q.defer();
            var treatments = [];
            $amRoot.isTreatmentId().then(treatmentConfigFound).catch(failure);
            return tracker.promise;

            function treatmentConfigFound(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(treatmentDocFound).catch(failure);
            }

            function treatmentDocFound(res) {
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

        //  return only names of the customers based on id
        function getCustomerNames() {
            var tracker = $q.defer();
            var dbOptions = {
                include_docs: false
            }
            var customers = [];
            pdbCustomers.getAll(dbOptions).then(success).catch(failure);
            return tracker.promise;

            function success(res) {
                res.rows.forEach(iterateRows);
                tracker.resolve(customers);

                function iterateRows(row) {
                    var splitname = row.id.split('-');
                    var name = splitname[1];
                    for (var i = 2; i < (splitname.length - 5); i++) {
                        name += ' ' + splitname[i];
                    }
                    name = utils.convertToTitleCase(name);
                    customers.push({
                        id: row.id,
                        name: name
                    });
                }
            }

            function failure(err) {
                tracker.reject(customers);
            }
        }

        //  return customer information and their vehicles
        function getCustomerChain(uId) {
            var tracker = $q.defer();
            pdbCustomers.get(uId).then(success).catch(failure);
            return tracker.promise;

            function success(res) {
                var response = {};
                var pvl = [];
                response.id = res._id;
                response.mobile = res.user.mobile;
                response.email = res.user.email;
                response.name = res.user.name;
                if (res.user.vehicles)
                    Object.keys(res.user.vehicles).forEach(iterateVehicle, this);
                response.possibleVehicleList = pvl;
                tracker.resolve(response);

                function iterateVehicle(vId) {
                    var vehicle = res.user.vehicles[vId];
                    pvl.push({
                        id: vId,
                        reg: vehicle.reg,
                        manuf: vehicle.manuf,
                        model: vehicle.model,
                        name: vehicle.manuf + ' - ' + vehicle.model + (vehicle.reg == '' ? '' : ', ' + vehicle.reg),
                        type: (vehicle.type) ? vehicle.type : ''
                    });
                }
            }

            function failure(err) {
                tracker.reject(undefined);
            }
        }

        //  save a service to database
        function saveService(newUser, newVehicle, newService) {
            var tracker = $q.defer();
            var prefixVehicle = 'vehicle' + ((newVehicle.manuf && newVehicle.model) ? '-' + angular.lowercase(newVehicle.manuf).replace(' ', '-') + '-' + angular.lowercase(newVehicle.model).replace(' ', '-') : '');
            var prefixUser = 'user-' + angular.lowercase(newUser.name).replace(' ', '-');
            var newServiceId = ((newService.id == undefined || newService.id == '') ? utils.generateUUID('srvc') : newService.id);
            var newVehicleId = ((newVehicle.id == undefined || newVehicle.id == '') ? utils.generateUUID(prefixVehicle) : newVehicle.id);
            var newUserId = ((newUser.id == undefined || newUser.id == '') ? utils.generateUUID(prefixUser) : newUser.id);
            var isVehicleBlank = (newVehicle.manuf == undefined || newVehicle.manuf == '') && (newVehicle.model == undefined || newVehicle.model == '') && (newVehicle.reg == undefined || newVehicle.reg == '');
            var isServiceBlank = (newService.problems.length == 0) && (newService.cost == undefined || newService.cost == 0);
            delete prefixUser, prefixVehicle;
            var problemsArray = $.extend([], newService.problems);
            newService.problems = {};
            problemsArray.forEach(iterateProblems);
            delete problemsArray;
            delete newService.id;
            delete newVehicle.id;
            delete newUser.id;
            pdbCustomers.get(newUserId).then(foundExistingUser).catch(noUserFound);
            return tracker.promise;

            function foundExistingUser(res) {
                if (!res.user)
                    res.user = {};
                Object.keys(newUser).forEach(iterateUserFields);
                if (!isVehicleBlank) {
                    if (!res.user.vehicles)
                        res.user.vehicles = {};
                    if (!res.user.vehicles[newVehicleId])
                        res.user.vehicles[newVehicleId] = {};
                    Object.keys(newVehicle).forEach(iterateVehicleFields);
                    if (!isServiceBlank) {
                        if (!res.user.vehicles[newVehicleId].services)
                            res.user.vehicles[newVehicleId].services = {};
                        res.user.vehicles[newVehicleId].services[newServiceId] = newService;
                    }
                }
                pdbCustomers.save(res).then(success).catch(failure);

                function iterateUserFields(ufn) {
                    res.user[ufn] = newUser[ufn];
                }

                function iterateVehicleFields(vfn) {
                    res.user.vehicles[newVehicleId][vfn] = newVehicle[vfn];
                }
            }

            function noUserFound(err) {
                if (!isVehicleBlank) {
                    if (!isServiceBlank) {
                        newVehicle.services = {};
                        newVehicle.services[newServiceId] = newService;
                    }
                    newUser.vehicles = {};
                    newUser.vehicles[newVehicleId] = newVehicle;
                }
                var doc = {
                    _id: newUserId,
                    creator: $amRoot.username,
                    user: newUser
                }
                pdbCustomers.save(doc).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }

            function iterateProblems(problem) {
                var finalProblem = $.extend({}, problem);
                delete finalProblem.details;
                delete finalProblem['$$hashKey'];
                newService.problems[problem.details] = finalProblem;
                delete finalProblem;
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
    }
})();