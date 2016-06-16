/**
 * Factory that handles database interactions between services database and controller
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.1
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amServices', ServicesFactory);

    ServicesFactory.$inject = ['$http', '$timeout', '$q', '$log', 'utils', '$amRoot', 'constants', 'pdbCustomers', 'pdbCommon', 'pdbConfig', 'pdbCache'];

    function ServicesFactory($http, $timeout, $q, $log, utils, $amRoot, constants, pdbCustomers, pdbCommon, pdbConfig, pdbCache) {
        //  initialize factory variable and function maps
        var factory = {
            getManufacturers: getManufacturers,
            getModels: getModels,
            getCustomerNames: getCustomerNames,
            getCustomerChain: getCustomerChain,
            getRegularTreatments: getRegularTreatments,
            saveService: saveService,
            serviceTree: serviceTree,
            deleteService: deleteService,
            getVehicleTypes: getVehicleTypes,
            getTreatmentSettings: getTreatmentSettings,
            getCustomerByMobile: getCustomerByMobile,
            getLastInvoiceNo: getLastInvoiceNo,
            getPackages: getPackages,
            getMemberships: getMemberships,
            getServiceTaxSettings: getServiceTaxSettings,
            getServices: getServices,
            getInventories: getInventories,
            getVatSettings: getVatSettings,
            getInventoriesSettings: getInventoriesSettings
        }

        return factory;

        //  function definitions

        function getInventoriesSettings() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(configFound).catch(failure);
            return tracker.promise;

            function configFound(res) {
                pdbConfig.get($amRoot.docIds.settings).then(configDocFound).catch(failure);
            }

            function configDocFound(res) {
                if (res.settings && res.settings.inventory)
                    tracker.resolve(res.settings.inventory.displayAsList);
                else
                    failure();
            }

            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'Setting not found!'
                    }
                }
                tracker.reject(err);
            }
        }

        function getVatSettings() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;
            
            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObj).catch(failure);
            }
            
            function getSettingsObj(res) {
                if (res.settings && res.settings.vat) {
                    tracker.resolve({
                        applyTax: res.settings.vat.applyTax,
                        inclusive: (res.settings.vat.taxIncType == 'inclusive') ? true : false,
                        tax: res.settings.vat.tax
                    });
                } else
                    failure();
            }
            
            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'VAT Settings Not Found!'
                    }
                }
                tracker.reject(err);
            }
        }

        function getInventories() {
            var tracker = $q.defer();
            var response = [];
            $amRoot.isInventoryId().then(getInventoryDoc).catch(failure);
            return tracker.promise;

            function getInventoryDoc(res) {
                pdbConfig.get($amRoot.docIds.inventory).then(getInventoryObj).catch(failure);
            }

            function getInventoryObj(res) {
                Object.keys(res).forEach(iterateInventories);
                tracker.resolve(response);

                function iterateInventories(name) {
                    if (name.match(/\b_id|\b_rev|\bcreator/i) || res[name]._deleted == true)
                        return;
                    var temp = res[name];
                    temp.name = name;
                    temp.amount = temp.rate;
                    temp.tax = '';
                    response.push(temp);
                    delete temp;
                }
            }

            function failure(err) {
                tracker.reject(err);
            }
        }
        
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
                            if (service.inventories) {
                                var inventoryArray = [];
                                Object.keys(service.inventories).forEach(iterateInventories);

                                function iterateInventories(inventory) {
                                    var sourceInventory = $.extend({}, service.inventories[inventory]);
                                    sourceInventory.name = inventory;
                                    sourceInventory.checked = true;
                                    inventoryArray.push(sourceInventory);
                                    delete sourceInventory;
                                }
                                service.inventories = inventoryArray;
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
        
        function getServices(filterMonth, filterYear, query) {
            query = angular.lowercase(query);
            filterMonth += (12*filterYear);
            var tracker = $q.defer();
            pdbCache.get(constants.pdb_cache_views.view_services).then(success).catch(failure);
            return tracker.promise;
            
            function success(res) {
                var result = [], ltm = filterMonth, currentRange = '';
                if (filterMonth < 0 && filterYear < 0) {
                    Object.keys(res).forEach(iterateDateRange);
                    
                    function iterateDateRange(dr) {
                        currentRange = dr;
                        if (currentRange.match(/_id|_rev/g))
                            return;
                        if (res[currentRange])
                            Object.keys(res[currentRange]).forEach(iterateService);
                    }
                } else {
                    do {
                        var queryDate = moment().subtract({
                            months: ltm
                        });
                        currentRange = moment(queryDate).format('MMM YYYY');
                        currentRange = angular.lowercase(currentRange).replace(' ', '-');
                        if (res[currentRange])
                            Object.keys(res[currentRange]).forEach(iterateService);
                        ltm--;
                    } while(ltm >= 0);
                }
                result.sort(dateSort);
                tracker.resolve(result);
                
                function dateSort(lhs, rhs) {
                    return rhs.srvc_date.localeCompare(lhs.srvc_date);
                }
                
                function iterateService(sId) {
                    var target = res[currentRange][sId];
                    if (query != undefined) {
                        if (query != undefined && (target.cstmr_name && angular.lowercase(target.cstmr_name).search(query) > -1) || (target.srvc_status && angular.lowercase(target.srvc_status).search(query) > -1) || (target.vhcl_manuf && angular.lowercase(target.vhcl_manuf).search(query) > -1) || (target.vhcl_model && angular.lowercase(target.vhcl_model).search(query) > -1) || (target.vhcl_reg && angular.lowercase(target.vhcl_reg).search(query) > -1) || (target.srvc_cost && target.srvc_cost.toString().search(query) > -1) || (target.srvc_date && angular.lowercase(target.srvc_date).search(query) > -1)) {
                            target.srvc_status = utils.convertToTitleCase(target.srvc_status);
                            target.srvc_id = sId;
                            result.push(target);
                        }
                    } else {
                        target.srvc_status = utils.convertToTitleCase(target.srvc_status);
                        target.srvc_id = sId;
                        result.push(target);
                    }
                }
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
                response.id = doc._id;
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
            if (newService.problems) {
                var problemsArray = $.extend([], newService.problems);
                newService.problems = {};
                problemsArray.forEach(iterateProblems);
                delete problemsArray;
            }
            if (newService.inventories) {
                var inventoryArray = $.extend([], newService.inventories);
                newService.inventories = {};
                inventoryArray.forEach(iterateInventories);
                delete inventoryArray;
            }
            delete smArray;
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

            function iterateInventories(inventory) {
                var finalInventory = $.extend({}, inventory);
                delete finalInventory.name;
                delete finalInventory['$$hashKey'];
                newService.inventories[inventory.name] = finalInventory;
                delete finalInventory;
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