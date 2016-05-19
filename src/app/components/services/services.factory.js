/**
 * Factory that handles database interactions between services database and controller
 * @author ndkcha
 * @since 0.4.1
 * @version 0.5.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amServices', ServicesFactory);

    ServicesFactory.$inject = ['$http', '$q', '$log', 'utils', '$amRoot', 'pdbCustomers', 'pdbCommon', 'pdbConfig'];

    function ServicesFactory($http, $q, $log, utils, $amRoot, pdbCustomers, pdbCommon, pdbConfig) {
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
            getTreatmentSettings: getTreatmentSettings,
            getCustomerByMobile: getCustomerByMobile,
            getLastInvoiceNo: getLastInvoiceNo,
            getPackages: getPackages,
            getMemberships: getMemberships,
            getServiceTaxSettings: getServiceTaxSettings
        }

        return factory;

        //  function definitions
        
        function getServiceTaxSettings() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;
            
            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObj).catch(failure);
            }
            
            function getSettingsObj(res) {
                if (res.settings && res.settings.servicetax) {
                    tracker.resolve({
                        applyTax: res.settings.servicetax.applyTax,
                        inclusive: (res.settings.servicetax.taxIncType == 'inclusive') ? true : false,
                        tax: res.settings.servicetax.tax
                    });
                } else
                    failure();
            }
            
            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'Service Tax Settings Not Found!'
                    }
                }
                tracker.reject(err);
            }
        }

        //  retrieve current treatment settings
        function getTreatmentSettings() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            //  if settings configuration is tracked, fetch corrosponding document
            function getSettingsDoc(response) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(failure);
            }

            //  if document call is successfull, return treatment settings if available
            function getSettingsObject(response) {
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

        //  return service tree
        function serviceTree(userId, vehicleId, serviceId) {
            var tracker = $q.defer();
            pdbCustomers.get(userId).then(getUserObject).catch(failure);
            return tracker.promise;

            function getUserObject(response) {
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
                    failure();
            }

            function failure(error) {
                if (!error) {
                    error = {
                        success: false,
                        message: 'User Not Found!'
                    }
                }
                tracker.reject(error);
            }
        }

        //  delete service from UI
        function deleteService(userId, vehicleId, serviceId) {
            var tracker = $q.defer();
            pdbCustomers.get(userId).then(getUserObject).catch(failure);
            return tracker.promise;

            function getUserObject(res) {
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
        function getFilteredServices(page, limit, filterMonth, filterYear, query) {
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
            if (query == '' || query == undefined) {
                pdbCustomers.query(mapFilteredServices, queryOptions).then(success).catch(failure);
            } else {
                pdbCustomers.query({
                    map: mapFilteredServices,
                    reduce: reduceQuery
                }, queryOptions).then(success).catch(failure);
            }
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
                                if (query != undefined)
                                    view.query = query;
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

            function reduceQuery(keys, values, rereduce) {
                var result = [];
                var q = angular.lowercase(values[0].query);
                values.forEach(iterateValues);
                return result;

                function iterateValues(value) {
                    if ((value.name && angular.lowercase(value.name).search(q) > -1) || (value.manuf && angular.lowercase(value.manuf).search(q) > -1) || (value.model && angular.lowercase(value.model).search(q) > -1) || (value.reg && angular.lowercase(value.reg).search(q) > -1) || (value.status && angular.lowercase(value.status).search(q) > -1) || (value.date && angular.lowercase(value.date).search(q) > -1) || (value.cost && value.cost.toString().search(q) > -1)) {
                        result.push(value);
                    }
                }
            }

            function success(res) {
                var result = [],
                    total = 0;
                if (query == '' || query == undefined) {
                    result = res.rows;
                    total = res.total_rows;
                } else {
                    res.rows.forEach(iterateRows);
                    total = result.length;

                    function iterateRows(row) {
                        row.value.forEach(iterateValues);
                    }

                    function iterateValues(value) {
                        result.push({
                            value: value
                        });
                    }
                }
                tracker.resolve({
                    services: result,
                    total: total
                });
            }

            function failure(err) {
                tracker.reject(err);
            }
        }
        
        //  return memberships from config database
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
                    delete res.memberships[membership].occurences
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
        
        //  return packages from config database
        function getPackages() {
            var tracker = $q.defer();
            var packages = [];
            $amRoot.isTreatmentId().then(getConfigDocument).catch(failure);
            return tracker.promise;
            
            function getConfigDocument(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(getConfigObject).catch(failure);
            }
            
            function getConfigObject(res) {
                if (res.packages)
                    Object.keys(res.packages).forEach(iteratePackages);
                tracker.resolve(packages);
                
                function iteratePackages(package) {
                    if (res.packages[package]._deleted == true)
                        return;
                    packages.push({
                        name: package,
                        treatments: res.packages[package]
                    });
                }
            }
            
            function failure(err) {
                tracker.reject(packages);
            }
        }

        //  return regular treatments from config database
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
                response.address = res.user.address;
                response.memberships = res.user.memberships;
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
        
        //  return customer information based on their mobile number
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
                response.id = doc.id;
                response.mobile = doc.user.mobile;
                response.email = doc.user.email;
                response.name = doc.user.name;
                response.address = doc.user.address;
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

        //  save a service to database
        function saveService(newUser, newVehicle, newService, options) {
            var tracker = $q.defer();
            var prefixVehicle = 'vhcl' + ((newVehicle.manuf && newVehicle.model) ? '-' + angular.lowercase(newVehicle.manuf).replace(' ', '-') + '-' + angular.lowercase(newVehicle.model).replace(' ', '-') : '');
            var prefixUser = 'usr-' + angular.lowercase(newUser.name).replace(' ', '-');
            var newServiceId = ((newService.id == undefined || newService.id == '') ? utils.generateUUID('srvc') : newService.id);
            var newVehicleId = ((newVehicle.id == undefined || newVehicle.id == '') ? utils.generateUUID(prefixVehicle) : newVehicle.id);
            var newUserId = ((newUser.id == undefined || newUser.id == '') ? utils.generateUUID(prefixUser) : newUser.id);
            var isVehicleBlank = (newVehicle.manuf == undefined || newVehicle.manuf == '') && (newVehicle.model == undefined || newVehicle.model == '') && (newVehicle.reg == undefined || newVehicle.reg == '');
            delete prefixUser, prefixVehicle;
            if (newUser.memberships != undefined) {
                var smArray = $.extend([], newUser.memberships);
                newUser.memberships = {};
                smArray.forEach(addMembershipsToUser);
            }
            var problemsArray = $.extend([], newService.problems);
            if (newService.packages) {
                var packageArray = $.extend([], newService.packages);
                newService.packages = {};
                packageArray.forEach(iteratePackages);
                delete packageArray;
            }
            if (newService.memberships) {
                var membershipArray = $.extend([], newService.memberships);
                newService.memberships = {};
                membershipArray.forEach(iterateMemberships);
                delete membershipArray;
            }
            newService.problems = {};
            problemsArray.forEach(iterateProblems);
            delete smArray;
            delete problemsArray;
            delete newService.id;
            delete newVehicle.id;
            delete newUser.id;
            if (options && options.isLastInvoiceNoChanged)
                saveLastInvoiceNo(newService.invoiceno);
            
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
                    if (!res.user.vehicles[newVehicleId].services)
                        res.user.vehicles[newVehicleId].services = {};
                    res.user.vehicles[newVehicleId].services[newServiceId] = newService;
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
                    newVehicle.services = {};
                    newVehicle.services[newServiceId] = newService;
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
                res.id = {
                    userId: newUserId,
                    vehicleId: newVehicleId,
                    serviceId: newServiceId
                }
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
            
            function iteratePackages(package) {
                var finalPackage = $.extend({}, package);
                delete finalPackage.name;
                delete finalPackage['$$hashKey'];
                var fpTreatments = $.extend([], finalPackage.treatments);
                finalPackage.treatments = {};
                fpTreatments.forEach(iterateTreatments);
                newService.packages[package.name] = finalPackage;
                delete fpTreatments;
                delete finalPackage;
                
                function iterateTreatments(treatment) {
                    if (!treatment.checked)
                        return;
                    treatment.rate = treatment.rate[newVehicle.type.toLowerCase().replace(' ', '-')];
                    treatment.tax = treatment.tax[newVehicle.type.toLowerCase().replace(' ', '-')];
                    finalPackage.treatments[treatment.name] = treatment;
                    delete treatment.amount;
                    delete treatment.name;
                    delete treatment.checked;
                    delete treatment['$$hashKey'];
                }
            }
            
            function iterateMemberships(membership) {
                var finalMembership = $.extend({}, membership);
                delete finalMembership.name;
                delete finalMembership['$$hashKey'];
                var fmTreatments = $.extend([], finalMembership.treatments);
                finalMembership.treatments = {};
                fmTreatments.forEach(iterateTreatments);
                newService.memberships[membership.name] = finalMembership;
                delete fmTreatments;
                delete finalMembership;
                
                function iterateTreatments(treatment) {
                    if (!treatment.checked)
                        return;
                    ++treatment.used.occurences;
                    treatment.used.duration = moment().diff(moment(membership.startdate), "months");
                    treatment = $.extend(treatment, treatment.used, false);
                    finalMembership.treatments[treatment.name] = treatment;
                    delete treatment.given;
                    delete treatment.used;
                    delete treatment.name;
                    delete treatment.checked;
                    delete treatment['$$hashKey'];
                }
            }
            
            function addMembershipsToUser(membership) {
                var mTreatments = $.extend([], membership.treatments);
                membership.treatments = {};
                mTreatments.forEach(iterateTreatments);
                newUser.memberships[membership.name] = {
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
        
        //  get last invoice number
        function getLastInvoiceNo() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;
            
            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(failure);
            }
            
            function getSettingsObject(res) {
                if (res.settings && res.settings.invoices && res.settings.invoices.lastInvoiceNumber)
                    tracker.resolve(res.settings.invoices.lastInvoiceNumber);
                else
                    failure();
            }
            
            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'No invoice settings found!'
                    }
                }
                tracker.reject(err);
            }
        }
        
        //  save last invoice number
        function saveLastInvoiceNo(lino) {
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            
            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(writeSettingsObject);
            }
            
            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.lastInvoiceNumber = lino;
                pdbConfig.save(res);
            }
            
            function writeSettingsObject(err) {
                var doc = {
                    _id: utils.generateUUID('sttngs'),
                    creator: $amRoot.username,
                    settings: {
                        invoices: {
                            lastInvoiceNumber: 1
                        }
                    }
                }
                pdbConfig.save(doc);
            }
            
            function failure(err) {
                $log.info('Cannot save invoice settings');
            }
        }
    }
})();