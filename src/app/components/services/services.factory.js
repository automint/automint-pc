/**
 * Factory that handles database interactions between services database and controller
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.2
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amServices', ServicesFactory);

    ServicesFactory.$inject = ['$http', '$timeout', '$q', '$log', '$filter', 'utils', '$rootScope', 'constants', 'pdbMain', 'pdbCache'];

    function ServicesFactory($http, $timeout, $q, $log, $filter, utils, $rootScope, constants, pdbMain, pdbCache) {
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
            getServices: getServices,
            getInventories: getInventories,
            getInventoriesSettings: getInventoriesSettings,
            getLastEstimateNo : getLastEstimateNo,
            getLastJobCardNo: getLastJobCardNo,
            getDefaultServiceType: getDefaultServiceType,
            getFilterMonths: getFilterMonths,
            getTreatmentsTax: getTreatmentsTax,
            getInventoryTax: getInventoryTax,
            getCurrencySymbol: getCurrencySymbol
        }

        return factory;

        //  function definitions

        function getCurrencySymbol() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;

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

        function getTreatmentsTax() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObj).catch(failure);
            return tracker.promise;

            function getSettingsObj(res) {
                var result = [];
                if (res.settings && res.settings.tax)
                    Object.keys(res.settings.tax).forEach(iterateTaxes);
                tracker.resolve(result);

                function iterateTaxes(tax) {
                    var t = res.settings.tax[tax];
                    if (t.isForTreatments) {
                        result.push({
                            inclusive: (t.type == "inclusive"),
                            isTaxApplied: t.isTaxApplied,
                            isForTreatments: t.isForTreatments,
                            isForInventory: t.isForInventory,
                            percent: t.percent,
                            name: tax
                        });
                    }
                }
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function getInventoryTax() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObj).catch(failure);
            return tracker.promise;

            function getSettingsObj(res) {
                var result = [];
                if (res.settings && res.settings.tax)
                    Object.keys(res.settings.tax).forEach(iterateTaxes);
                tracker.resolve(result);

                function iterateTaxes(tax) {
                    var t = res.settings.tax[tax];
                    if (t.isForInventory) {
                        result.push({
                            inclusive: (t.type == "inclusive"),
                            isTaxApplied: t.isTaxApplied,
                            isForTreatments: t.isForTreatments,
                            isForInventory: t.isForInventory,
                            percent: t.percent,
                            name: tax
                        });
                    }
                }
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function getFilterMonths() {
            var tracker = $q.defer();
            pdbCache.get(constants.pdb_cache_views.view_services).then(generateMonthsUsed).catch(failure);
            return tracker.promise;

            function generateMonthsUsed(res) {
                var result = [];
                Object.keys(res).forEach(iterateDateRange);
                tracker.resolve(result);

                function iterateDateRange(dr) {
                    if (dr.match(/_id|_rev/g))
                        return;
                    var temp = dr.split('-');
                    result.push({
                        month: utils.convertToTitleCase(temp[0]),
                        year: temp[1]
                    });
                }
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function getDefaultServiceType() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;

            function getSettingsObject(res) {
                if (res.settings && res.settings.servicestate)
                    tracker.resolve(res.settings.servicestate);
                else
                    failure();
            }

            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'Could not find service state'
                    }
                }
                tracker.reject(err);
            }
        }

        function getInventoriesSettings() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(configDocFound).catch(failure);
            return tracker.promise;

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

        function getInventories() {
            var tracker = $q.defer();
            var response = [];
            pdbMain.get($rootScope.amGlobals.configDocIds.inventory).then(getInventoryObj).catch(failure);
            return tracker.promise;

            function getInventoryObj(res) {
                Object.keys(res).forEach(iterateInventories);
                tracker.resolve(response);

                function iterateInventories(name) {
                    if (name.match(/\b_id|\b_rev|\bcreator|\bchannel/i) || res[name]._deleted == true)
                        return;
                    var temp = res[name];
                    temp.name = name;
                    temp.amount = temp.rate;
                    temp.tax = '';
                    temp.qty = 1;
                    temp.total = temp.amount*temp.qty;
                    response.push(temp);
                    delete temp;
                }
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        //  retrieve current treatment settings
        function getTreatmentSettings() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;

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
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;

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
            pdbMain.get(userId).then(getUserObject).catch(failure);
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
            pdbMain.get(userId).then(getUserObject).catch(failure);
            return tracker.promise;

            function getUserObject(res) {
                res.user.vehicles[vehicleId].services[serviceId]._deleted = true;
                pdbMain.save(res).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }
        
        function getServices(dateRange, query) {
            query = angular.lowercase(query);
            var tracker = $q.defer();
            pdbCache.get(constants.pdb_cache_views.view_services).then(success).catch(failure);
        return tracker.promise;
            
            function success(res) {
                var result = [], currentRange = '';
                Object.keys(res).forEach(iterateDateRange);
                tracker.resolve(result);

                function iterateDateRange(dr) {
                    if (dr.match(/_id|_rev/g))
                        return;
                    var crd = dr.split('-');
                    var crdfound = $filter('filter')(dateRange, {
                        month: utils.convertToTitleCase(crd[0]),
                        year: crd[1]
                    }, true);

                    if (crdfound.length == 0)
                        return;
                    currentRange = dr;
                    if (res[currentRange])
                        Object.keys(res[currentRange]).forEach(iterateService);
                }
                
                function iterateService(sId) {
                    var target = res[currentRange][sId];
                    if ($rootScope.amGlobals.channel && target.channel && ($rootScope.amGlobals.channel != '') && ($rootScope.amGlobals.channel != 'all') && (target.channel != '') && ($rootScope.amGlobals.channel != target.channel))
                        return;
                    if (query != undefined) {
                        if (query != undefined && (target.cstmr_name && angular.lowercase(target.cstmr_name).search(query) > -1) || (target.srvc_state && angular.lowercase(target.srvc_state).search(query) > -1) || (target.srvc_status && angular.lowercase(target.srvc_status).search(query) > -1) || (target.vhcl_manuf && angular.lowercase(target.vhcl_manuf).search(query) > -1) || (target.vhcl_model && angular.lowercase(target.vhcl_model).search(query) > -1) || (target.vhcl_reg && angular.lowercase(target.vhcl_reg).search(query) > -1) || (target.srvc_cost && target.srvc_cost.toString().search(query) > -1) || (target.srvc_date && angular.lowercase(target.srvc_date).search(query) > -1)) {
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
            pdbMain.get($rootScope.amGlobals.configDocIds.treatment).then(getTreatmentObject).catch(failure);
            return tracker.promise;
            
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
            pdbMain.get($rootScope.amGlobals.configDocIds.treatment).then(getConfigObject).catch(failure);
            return tracker.promise;
            
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
            pdbMain.get($rootScope.amGlobals.configDocIds.treatment).then(getConfigObject).catch(failure);
            return tracker.promise;

            function getConfigObject(res) {
                if (res.regular)
                    Object.keys(res.regular).forEach(iterateTreatments);
                tracker.resolve(treatments);

                function iterateTreatments(name) {
                    if (!res.regular[name]._deleted) {
                        var t = {
                            name: name,
                            rate: res.regular[name].rate
                        };
                        if (res.regular[name].orgcost)
                            t.orgcost = res.regular[name].orgcost;
                        treatments.push(t);
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
                include_docs: ($rootScope.amGlobals.isFranchise == true)
            }
            var customers = [];
            pdbMain.getAll(dbOptions).then(success).catch(failure);
            return tracker.promise;

            function success(res) {
                res.rows.forEach(iterateRows);
                tracker.resolve(customers);

                function iterateRows(row) {
                    if (row.doc)
                        delete row.doc.user;
                    if ($rootScope.amGlobals.IsConfigDoc(row.id))
                        return;
                    if (row.doc && $rootScope.amGlobals.channel && row.doc.channel && ($rootScope.amGlobals.channel != '') && ($rootScope.amGlobals.channel != 'all') && (row.doc.channel != '') && ($rootScope.amGlobals.channel != row.doc.channel))
                        return;
                    var splitname = row.id.split('-');
                    var name = splitname[1];
                    for (var i = 2; i < (splitname.length - 5); i++) {
                        name += ' ' + splitname[i];
                    }
                    name = utils.convertToTitleCase(name);
                    if (name == 'Anonymous')
                        return;
                    customers.push({
                        id: row.id,
                        name: name
                    });
                }
            }

            function failure(err) {
                console.log(err);
                tracker.reject(customers);
            }
        }

        //  return customer information and their vehicles
        function getCustomerChain(uId) {
            var tracker = $q.defer();
            pdbMain.get(uId).then(success).catch(failure);
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
                        type: (vehicle.type) ? vehicle.type : '',
                        nextdue: vehicle.nextdue
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
            pdbMain.query(mapView, {
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
                if ($rootScope.amGlobals.channel && doc.channel && ($rootScope.amGlobals.channel != '') && ($rootScope.amGlobals.channel != 'all') && (doc.channel != '') && ($rootScope.amGlobals.channel != doc.channel))
                    return;
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
                        type: (vehicle.type) ? vehicle.type : '',
                        nextdue: vehicle.nextdue
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
            var prefixVehicle = 'vhcl';
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
            if (options) {
                if (newService.invoiceno && options.isLastInvoiceNoChanged)
                    saveLastInvoiceNo(newService.invoiceno);
                if (newService.estimateno && options.isLastEstimateNoChanged)
                    saveLastEstimateNo(newService.estimateno);
                if (newService.jobcardno && options.isLastJobCardNoChanged)
                    saveLastJobCardNo(newService.jobcardno);
            }
            
            pdbMain.get(newUserId).then(foundExistingUser).catch(noUserFound);
            return tracker.promise;

            function foundExistingUser(res) {
                var splitname = res._id.split('-');
                var name = splitname[1];
                for (var i = 2; i < (splitname.length - 5); i++) {
                    name += ' ' + splitname[i];
                }
                name = utils.convertToTitleCase(name);
                if (name != newUser.name) { 
                    res._deleted = true;
                    pdbMain.save(res).then(doNothing).catch(doNothing);
                    res._id = utils.generateUUID(prefixUser);
                    delete res._deleted; 
                    delete res._rev;
                }
                if (!res.user)
                    res.user = {};
                Object.keys(newUser).forEach(iterateUserFields);
                if (res.user.type && (res.user.type == 'Lead'))
                    res.user.type = 'Customer';
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
                pdbMain.save(res).then(success).catch(failure);

                function iterateUserFields(ufn) {
                    res.user[ufn] = newUser[ufn];
                }

                function iterateVehicleFields(vfn) {
                    if (newVehicle[vfn] == undefined)
                        delete res.user.vehicles[newVehicleId][vfn];
                    res.user.vehicles[newVehicleId][vfn] = newVehicle[vfn];
                }
            }

            function doNothing(res) {
                //  do nothing
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
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    user: newUser
                }
                pdbMain.save(doc).then(success).catch(failure);
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
            $http.get('data/manuf_model.json').success(success).catch(failure);
            return tracker.promise;

            //  success ? add manufacturers to an array and return it via promise
            function success(response) {
                Object.keys(response).forEach(manufIterator);
                tracker.resolve(manufacturers);
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
            $http.get('data/manuf_model.json').success(success).catch(failure);
            return tracker.promise;

            //  success ? add models to an array and return it via promise
            function success(response) {
                if (response[manufacturer] && response[manufacturer].models)
                    models = Object.keys(response[manufacturer].models);
                tracker.resolve(models);
            }

            //  throw an error via promise
            function failure(error) {
                tracker.reject(error);
            }
        }

        function getLastJobCardNo() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;

            function getSettingsObject(res) {
                if (res.settings && res.settings.invoices && res.settings.invoices.lastJobCardNo)
                    tracker.resolve(res.settings.invoices.lastJobCardNo);
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

        function getLastEstimateNo() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;

            function getSettingsObject(res) {
                if (res.settings && res.settings.invoices && res.settings.invoices.lastEstimateNo)
                    tracker.resolve(res.settings.invoices.lastEstimateNo);
                else
                    faillure();
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
        
        //  get last invoice number
        function getLastInvoiceNo() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;
            
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
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(writeSettingsObject);
            
            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.lastInvoiceNumber = lino;
                pdbMain.save(res);
            }
            
            function writeSettingsObject(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    settings: {
                        invoices: {
                            lastInvoiceNumber: 1
                        }
                    }
                }
                pdbMain.save(doc);
            }
            
            function failure(err) {
                $log.info('Cannot save invoice settings');
            }
        }

        function saveLastEstimateNo(leno) {
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(writeSettingsObject);

            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.lastEstimateNo = leno;
                pdbMain.save(res);
            }

            function writeSettingsObject(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    settings: {
                        invoices: {
                            lastEstimateNo: 1
                        }
                    }
                }
                pdbMain.save(doc);
            }

            function failure(err) {
                $log.info('Cannot save estimate settings');
            }
        }

        function saveLastJobCardNo(ljbno) {
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(writeSettingsObject);

            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.lastJobCardNo = ljbno;
                pdbMain.save(res);
            }

            function writeSettingsObject(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    settings: {
                        invoices: {
                            lastJobCardNo: 1
                        }
                    }
                }
                pdbMain.save(doc);
            }

            function failure(err) {
                $log.info('Cannot save jobcard settings');
            }
        }
    }
})();