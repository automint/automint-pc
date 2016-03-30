(function() {
    angular.module('altairApp')
        .factory('ServiceFactory', ServiceFactory);

    ServiceFactory.$inject = ['$pouchDBUser', '$q', '$pouchDBDefault'];

    function ServiceFactory($pouchDBUser, $q, $pouchDBDefault) {
        var factory = {
            filteredServices: filteredServices,
            populateUsersList: populateUsersList,
            populateRegularTreatments: populateRegularTreatments,
            autoFillUser: autoFillUser,
            saveService: saveService,
            customerDetails: customerDetails,
            deleteService: deleteService
        }

        //  return filtered services to controller
        //  param filterMonth- total months to be traversed (if query is for last 6 months, then 6 is to be passed)
        //  param filterYear- total years to be traversed (if query is for last 2 years, then 2 is to be passed)
        function filteredServices(queryDate, filterMonth, filterYear) {
            var differed = $q.defer();
            $pouchDBUser.db().query(function(doc, emit) {
                if (!doc.user._deleted) {
                    if (doc.user.vehicles) {
                        Object.keys(doc.user.vehicles).forEach(function(vId) {
                            if (doc.user.vehicles[vId].services) {
                                Object.keys(doc.user.vehicles[vId].services).forEach(function(sId) {
                                    var service = doc.user.vehicles[vId].services[sId];
                                    var dateSlice = service.date.split("/");
                                    var sourceDate = new Date(parseInt(dateSlice[2]), parseInt(dateSlice[1]), parseInt(dateSlice[0]));
                                    if ((sourceDate >= queryDate || (filterYear == 0 && filterMonth == 0)) && !service._deleted) {
                                        var so = {};
                                        so[sId] = {
                                            date: service.date,
                                            cost: service.cost
                                        };
                                        var vehicle = $.extend(true, {}, doc.user.vehicles[vId]);
                                        vehicle.services = so;
                                        var user = $.extend(true, {}, doc.user);
                                        user.vehicles = {};
                                        user.vehicles[vId] = vehicle;
                                        emit(user);
                                    }
                                });
                            }
                        });
                    }
                }
            }).then(function(res) {
                differed.resolve(res);
            }).catch(function(err) {
                differed.reject(err);
            });
            return differed.promise;
        }

        //  return current users list based on particular field
        function populateUsersList(filterName) {
            var differed = $q.defer();
            $pouchDBUser.db().query(function(doc, emit) {
                if (!doc.user._deleted)
                    emit(doc.user[filterName]);
            }).then(function(res) {
                differed.resolve(res.rows);
            }).catch(function(err) {
                differed.reject(res);
            });
            return differed.promise;
        }

        //  return current regular treatment list
        function populateRegularTreatments() {
            var differed = $q.defer();
            $pouchDBDefault.get('inventory').then(function(res) {
                var treatments = [];
                if (res.regular) {
                    Object.keys(res.regular).forEach(function(details) {
                        if (!res.regular[details]._deleted) {
                            treatments.push({
                                name: details,
                                rate: res.regular[details].rate
                            });
                        }
                    });
                }
                differed.resolve(treatments);
            }, function(err) {
                differed.reject(err);
            });
            return differed.promise;
        }

        //  return particular user with their vehicles
        function autoFillUser(userId) {
            var differed = $q.defer();
            $pouchDBUser.get(userId).then(function(res) {
                if (res.user) {
                    var pvl = [];
                    var user = $.extend(true, {}, res.user);
                    if (res.user.vehicles) {
                        delete user.vehicles;
                        Object.keys(res.user.vehicles).forEach(function(vId) {
                            var vehicle = $.extend(true, {}, res.user.vehicles[vId]);
                            vehicle.id = vId;
                            vehicle.name = vehicle.manuf + ' ' + vehicle.model + ((vehicle.reg == '' || vehicle.reg == undefined) ? '' : ', ' + vehicle.reg);
                            if (vehicle.services)
                                delete vehicle.services;
                            pvl.push(vehicle);
                        });
                    }
                    pvl.push({
                        id: undefined,
                        name: 'New Vehicle'
                    });
                    user['id'] = userId;
                    user['vehicles'] = pvl;
                    differed.resolve(user);
                } else {
                    differed.reject('No User Found!')
                }
            }, function(err) {
                differed.reject(err);
            });
            return differed.promise;
        }
        
        //  return particular user information
        function customerDetails(userId, vehicleId, serviceId) {
            var differed = $q.defer();
            $pouchDBUser.get(userId).then(function(res) {
                if (res.user && res.user.vehicles && res.user.vehicles[vehicleId] && res.user.vehicles[vehicleId].services[serviceId]) {
                    var user = $.extend({}, res.user);
                    var vehicle = $.extend({}, user.vehicles[vehicleId]);
                    var service = $.extend({}, vehicle.services[serviceId]);
                    var problemArray = [];
                    if (service.problems) {
                        Object.keys(service.problems).forEach(function(problemDetails) {
                            var sourceProblem = $.extend({}, service.problems[problemDetails]);
                            sourceProblem.details = problemDetails;
                            sourceProblem.focusIndex = problemArray.length;
                            problemArray.push(sourceProblem);
                            delete sourceProblem;
                        })
                    }
                    service.problems = problemArray; 
                    delete vehicle.services;
                    vehicle.service = service;
                    delete user.vehicles;
                    user.vehicle = vehicle;
                    differed.resolve(user);
                } else
                    differed.reject('User Not Found');
            }, function(err) {
                differed.reject(err);
            });
            return differed.promise;
        }
        
        //  save new inventory details from problems [for adaptive inventort listing]
        function saveInventory(problems) {
            $pouchDBDefault.get('inventory').then(function(res) {
                var mismatchFound = false;
                if (!res.regular)
                    res.regular = {};
                problems.forEach(function(problem) {
                    if (problem.details != undefined || problem.details != '') {
                        if (!res.regular[problem.details]) {
                            res.regular[problem.details] = {
                                rate: problem.rate
                            }
                            mismatchFound = true;
                        }
                    }
                });
                if (mismatchFound)
                    $pouchDBDefault.save(res);
            }, function(err) {
                var doc = {};
                doc['_id'] = 'inventory';
                doc.regular = {};
                problems.forEach(function(problem) {
                    if (problem.details != undefined || problem.details != '') {
                        doc.regular[problem.details] = {
                            rate: problem.rate
                        }
                    }
                });
                $pouchDBDefault.save(doc);
            });
        }
        
        //  delete a service from customer database
        function deleteService(userId, vehicleId, serviceId) {
            var differed = $q.defer();
            $pouchDBUser.get(userId).then(function(res) {
                res.user.vehicles[vehicleId].services[serviceId]._deleted = true;
                $pouchDBUser.save(res).then(function(status) {
                    differed.resolve(status);
                }, function(fail) {
                    differed.reject(fail);
                });
            }, function(err) {
                differed.reject(fail);
            });
            return differed.promise;
        }

        //  store service to customer database
        function saveService(newUser, newVehicle, newService) {
            var differed = $q.defer();
            var newServiceId = (newService.id == undefined || newService.id == '') ? generateUUID('srvc') : newService.id;
            saveInventory(newService.problems);
            var finalService = $.extend(true, {}, newService);
            finalService.problems = {};
            newService.problems.forEach(function(problem) {
                var tempDetails = problem.details;
                var finalProblem = $.extend({}, problem);
                delete finalProblem.details;
                delete finalProblem.focusIndex;
                finalService.problems[tempDetails] = problem;
            })
            var finalVehicle = $.extend(true, {}, newVehicle);
            if (finalVehicle.name)
                delete finalVehicle.name;
            delete finalVehicle.id;
            finalVehicle.services = {};
            finalVehicle.services[newServiceId] = finalService;
            var finalUser = $.extend(true, {}, newUser);
            delete finalUser.id;
            $pouchDBUser.get(newUser.id).then(function(res) {
                if (!res.user)
                    res.user = finalUser;
                if (!res.user.vehicles)
                    res.user.vehicles = {};
                var intermediateVehicle = res.user.vehicles[newVehicle.id];
                if (intermediateVehicle) {
                    if (!intermediateVehicle.services)
                        intermediateVehicle.services = {};
                    intermediateVehicle.services[newServiceId] = finalService;
                } else
                    res.user.vehicles[generateUUID('vhcl')] = finalVehicle;
                $pouchDBUser.save(res).then(function(status) {
                    differed.resolve(status);
                }, function(conflict) {
                    differed.reject(conflict);
                })
            }, function(err) {
                finalUser.vehicles = {};
                finalUser.vehicles[generateUUID('vhcl')] = finalVehicle;
                var doc = {
                    _id: generateUUID('user'),
                    user: finalUser
                }
                $pouchDBUser.save(doc).then(function(status) {
                    differed.resolve(status);
                }, function(conflict) {
                    differed.reject(conflict);
                })
            });
            return differed.promise;
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

        return factory;
    }
})();