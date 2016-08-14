/**
 * Service for Importing data to Automint
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .service('amImportdata', ImportDataService);

    ImportDataService.$inject = ['pdbMain', '$filter', '$q', 'utils', '$rootScope', '$log'];

    function ImportDataService(pdbMain, $filter, $q, utils, $rootScope, $log) {
        var sVm = this;
        
        //  temporary named mappings
        var tracker;
        
        //  function mappings
        sVm.checkTypeofFile = checkTypeofFile;
        sVm.cleanUp = cleanUp;

        function checkTypeofFile(files) {
            tracker = $q.defer();
            checkFile(files[0]);
            return tracker.promise;

            function checkFile(file) {
                var reader = new FileReader();
                reader.readAsText(file);
                reader.onload = onRLoad;

                function onRLoad(event) {
                    var isCsvFile, isJsonFile;
                    try {
                        var csvArray = $.csv2Array(event.target.result);
                        isCsvFile = true;
                        csvCallback(csvArray);
                    } catch(exception) {
                        isCsvFile = false;
                    }
                    if (isCsvFile)
                        return;
                    try {
                        var jsonObj = JSON.parse(event.target.result);
                        isJsonFile = true;
                        jsonCallback(jsonObj);
                    } catch(exception) {
                        isJsonFile = false;
                    }
                    if (isJsonFile)
                        return;
                    tracker.reject({
                        success: false,
                        message: 'Invalid File!'
                    });
                }
            }
        }

        function jsonCallback(restore) {
            $q.all([
                pdbMain.getAll(),
                pdbMain.get($rootScope.amGlobals.configDocIds.settings)
            ]).then(getAllDocs).catch(getAllDocs);

            function getAllDocs(combores) {
                var docsToSave = [];
                var res = combores[0];
                var setconfig = combores[1];
                
                if (restore.customers && restore.customers.doc)
                    restore.customers.doc.forEach(iterateCustomers);

                if (restore.config && restore.config.doc)
                    restore.config.doc.forEach(iterateConfig);

                pdbMain.saveAll(docsToSave).then(success).catch(failure);

                function success(res) {
                    tracker.resolve({
                        success: true,
                        message: 'Backup has been restored! You may now delete the file.'
                    })
                }

                function failure(err) {
                    console.error(err);
                    tracker.reject({
                        success: false,
                        message: 'Could not restore backup at moment! Please Try Again Later!'
                    })
                }

                function iterateConfig(config) {
                    var doc = $.extend({}, config);
                    doc.creator = $rootScope.amGlobals.creator;
                    doc.channel = $rootScope.amGlobals.channel;
                    if (config._id.match(/\btrtmnt-/i))
                        doc._id = $rootScope.amGlobals.configDocIds.treatment;
                    else if (config._id.match(/\bwrkshp-/i))
                        doc._id = $rootScope.amGlobals.configDocIds.workshop;
                    else if (config._id.match(/\bsttngs-/i))
                        doc._id = $rootScope.amGlobals.configDocIds.settings;
                    else if (config._id.match(/\binvntry-/i))
                        doc._id = $rootScope.amGlobals.configDocIds.inventory;

                    delete doc._rev;

                    if (doc._id == $rootScope.amGlobals.configDocIds.settings) {
                        if (doc.dbversion)
                            delete doc.dbversion;
                        if (doc.settings && doc.settings.serviceTax) {
                            if (!doc.settings.tax)
                                doc.settings.tax = {};
                            doc.settings.tax['Service Tax'] = {
                                type: doc.settings.serviceTax.taxIncType,
                                isTaxApplied: doc.settings.serviceTax.applyTax,
                                isForTreatments: true,
                                isForInventory: false,
                                percent: doc.settings.serviceTax.tax
                            }
                            delete doc.settings['serviceTax'];
                        }
                        if (doc.settings && doc.settings.servicetax) {
                            if (!doc.settings.tax)
                                doc.settings.tax = {};
                            doc.settings.tax['Service Tax'] = {
                                type: doc.settings.servicetax.taxIncType,
                                isTaxApplied: doc.settings.servicetax.applyTax,
                                isForTreatments: true,
                                isForInventory: false,
                                percent: doc.settings.servicetax.tax
                            }
                            delete doc.settings['servicetax'];
                        }
                        if (doc.settings && doc.settings.vat) {
                            if (!doc.settings.tax)
                                doc.settings.tax = {};
                            doc.settings.tax['VAT'] = {
                                type: doc.settings.vat.taxIncType,
                                isTaxApplied: doc.settings.vat.applyTax,
                                isForTreatments: false,
                                isForInventory: true,
                                percent: doc.settings.vat.tax
                            }
                            delete doc.settings['vat'];
                        }
                    }

                    if (res) {
                        var confound = $filter('filter')(res.rows, comparator, true);

                        if (confound.length == 1) {
                            doc._rev = confound[0].doc._rev;
                            doc.currency = confound[0].doc.currency;
                        }

                        function comparator(value, index) {
                            if (value.doc && (value.doc._id == doc._id))
                                return true;
                        }
                    }

                    docsToSave.push(doc);
                }

                function iterateCustomers(customer) {
                    if ($rootScope.amGlobals.IsConfigDoc(customer._id))
                        return;
                    var doc, custfound;
                    if (res.error) {
                        custfound = {
                            length: 0
                        }
                    } else
                        custfound = $filter('filter')(res.rows, comparator, true);

                    if (custfound.length == 1) {
                        //  doc = already existing user
                        //  customer = imported user
                        doc = custfound[0].doc;
                        if (doc.user && customer.user)
                            Object.keys(customer.user).forEach(changeNewFieldsInUser);

                        if (customer.user.vehicles)
                            Object.keys(customer.user.vehicles).forEach(iterateVehicles);
                    } else if (customer.user) {
                        //  doc = user to be inserted
                        //  customer = imported
                        var prefixUser = 'usr-' + angular.lowercase(customer.user.name).replace(' ', '-');
                        doc = {
                            _id: utils.generateUUID(prefixUser),
                            channel: $rootScope.amGlobals.channel,
                            creator: $rootScope.amGlobals.creator,
                            user: {}
                        };

                        if (customer.user)
                            Object.keys(customer.user).forEach(changeNewFieldsInUser);
                        
                        if (customer.user.vehicles)
                            Object.keys(customer.user.vehicles).forEach(iterateVehicles);
                    }    
                    docsToSave.push(doc);

                    function iterateVehicles(vId) {
                        var tempv = customer.user.vehicles[vId], isDuplicateVehicle = false;
                        var newVehicleId;
                        if (!doc.user.vehicles) {
                            doc.user.vehicles = {};
                            if (newVehicleId == undefined)
                                newVehicleId = utils.generateUUID('vhcl')
                            doc.user.vehicles[newVehicleId] = tempv;
                        } else {
                            Object.keys(doc.user.vehicles).forEach(iterateExstVehicle);
                            if (!isDuplicateVehicle) {
                                if (newVehicleId == undefined)
                                    newVehicleId = utils.generateUUID('vhcl')
                                doc.user.vehicles[newVehicleId] = tempv;
                            }
                        }

                        if (doc.user.vehicles[newVehicleId].services)
                            Object.keys(doc.user.vehicles[newVehicleId].services).forEach(iterateServices);

                        function iterateServices(sId) {
                            var temps = doc.user.vehicles[newVehicleId].services[sId];
                            var service = $.extend({}, temps);
                            if (temps.serviceTax) {
                                delete service['serviceTax'];
                                if (!service.taxes)
                                    service.taxes = {};
                                service.taxes['Service Tax'] = {
                                    type: temps.serviceTax.taxIncType,
                                    percent: temps.serviceTax.tax,
                                    isTaxApplied: temps.serviceTax.applyTax,
                                    isForTreatments: true,
                                    isForInventory: false
                                }
                            }
                            if (temps.vat) {
                                delete service['vat'];
                                if (!service.taxes)
                                    service.taxes = {};
                                service.taxes['VAT'] = {
                                    type: temps.vat.taxIncType,
                                    percent: temps.vat.tax,
                                    isTaxApplied: temps.vat.applyTax,
                                    isForTreatments: false,
                                    isForInventory: true
                                }
                            }

                            if (service.problems)
                                Object.keys(service.problems).forEach(iterateProblems);
                            if (service.inventories)
                                Object.keys(service.inventories).forEach(iterateInventory);
                            
                            doc.user.vehicles[newVehicleId].services[sId] = service;

                            function iterateInventory(inventory) {
                                var tempi = service.inventories[inventory];
                                if (temps.vat && temps.vat.applyTax) {
                                    if (temps.vat.taxIncType == 'inclusive') {
                                        tempi.amount = parseFloat(tempi.rate) + parseFloat(tempi.tax);
                                        tempi.amount = parseFloat(tempi.amount);
                                        tempi.amount = (tempi.amount % 1 != 0) ? tempi.amount.toFixed(2) : parseInt(tempi.amount);
                                    } else
                                        tempi.amount = parseFloat(tempi.rate);
                                } else
                                    tempi.amount = parseFloat(tempi.rate);
                                delete tempi.tax;
                                service.inventories[inventory] = tempi;
                            }

                            function iterateProblems(problem) {
                                var tempp = service.problems[problem];
                                if (temps.serviceTax && temps.serviceTax.applyTax) {
                                    if (temps.serviceTax.taxIncType == 'inclusive') {
                                        tempp.amount = parseFloat(tempp.rate) + parseFloat(tempp.tax);
                                        tempp.amount = parseFloat(tempp.amount);
                                        tempp.amount = (tempp.amount % 1 != 0) ? tempp.amount.toFixed(2) : parseInt(tempp.amount);
                                    } else
                                        tempp.amount = parseFloat(tempp.rate);
                                } else
                                    tempp.amount = parseFloat(tempp.rate);
                                delete tempp.tax;
                                service.problems[problem] = tempp;
                            }
                        }

                        function iterateExstVehicle(evId) {
                            var extv = doc.user.vehicles[evId];
                            if ((tempv.reg == extv.reg) || (vId == evId)) {
                                newVehicleId = evId;
                                extv.reg = tempv.reg;
                                extv.manuf = (tempv.manuf ? tempv.manuf : extv.manuf);
                                extv.model = (tempv.model ? tempv.model : extv.model);
                                extv.type = (tempv.type ? tempv.type : extv.type);
                                isDuplicateVehicle = true;
                            }
                        }
                    }

                    function changeNewFieldsInUser(key) {
                        if ((key == 'vehicles') || (customer.user[key] == '') || (angular.isObject(customer.user[key]) && (Object.keys(customer.user[key]).length == 0)))
                            return;
                        doc.user[key] = customer.user[key];
                    }

                    function comparator(value, index, array) {
                        if (value.doc && value.doc.user && value.doc.user.mobile && customer.user && customer.user.mobile && (value.doc.user.mobile != '') && (customer.user.mobile != '') && (value.doc.user.mobile == customer.user.mobile))
                            return true;
                    }
                }
            }
        }

        //  parse CSV file
        function csvCallback(csvArray) {
            var customers = [];
            var csvMap = {};
            var csvFields = csvArray[0];
            for (var j = 0; j < csvFields.length; j++) {
                var fieldName = csvFields[j].toLowerCase();
                switch (fieldName) {
                    case 'mobile':
                    case 'mo':
                    case 'mobile number':
                        csvMap.mobile = j;
                        break;
                    case 'name':
                        csvMap.name = j;
                        break;
                    case 'reg':
                    case 'registration':
                    case 'registration number':
                    case 'vehicle number':
                    case 'registration no':
                    case 'vehicle no':
                        csvMap.reg = j;
                        break;
                    case 'model':
                    case 'car':
                        csvMap.model = j;
                        break;
                    case 'manufacturer':
                    case 'company':
                        csvMap.manuf = j;
                        break;
                }
            }
            for (var row = 1; row < csvArray.length; row++) {
                //  hold different values coming from csv file
                var mobile = csvArray[row][csvMap.mobile];
                var name = csvArray[row][csvMap.name];
                var reg = csvArray[row][csvMap.reg];
                var manuf = csvArray[row][csvMap.manuf];
                var model = csvArray[row][csvMap.model];

                //  check if at least one entry has been found, skip otherwise
                if (!(mobile || name || reg || manuf || model))
                    continue;

                //  encode objects from derived data
                var user = {
                    mobile: mobile ? mobile : '',
                    name: name ? utils.convertToTitleCase(name) : ''
                }
                var vehicle = {
                    reg: reg ? reg.toUpperCase() : '',
                    manuf: manuf ? manuf : '',
                    model: model ? model : ''
                }

                //  reduce duplicates in imported file
                var found = $filter('filter')(customers, {
                    name: name,
                    mobile: mobile
                }, true);
                if (found.length > 0) {
                    var vfound = $filter('filter')(found[0].vehicles, {
                        reg: reg
                    }, true);
                    if (vfound.length > 0)
                        continue;
                    else {
                        if ((reg || manuf || model) && (reg != '' || manuf != '' || model != ''))
                            found[0].vehicles.push(vehicle);
                    }
                } else {
                    user.vehicles = [];
                    if ((reg || manuf || model) && (reg != '' || manuf != '' || model != ''))
                        user.vehicles.push(vehicle);
                    customers.push(user);
                }
            }

            updateDatabase(customers);

            function updateDatabase(customers) {
                var addedCustomerCount = 0;
                getDocuments().then(matchAndUpdate).catch(failure);

                function matchAndUpdate(res) {
                    var customersToSave = [];
                    customers.forEach(iterateCustomers);

                    function iterateCustomers(customer) {
                        var targetUser = {};
                        var found = $filter('filter')(res, {
                            user: {
                                name: customer.name,
                                mobile: customer.mobile
                            }
                        });
                        if (found.length > 0) {
                            var dbUser = found[0];
                            if (customer.vehicles && customer.vehicles.length > 0) {
                                if (!dbUser.user.vehicles)
                                    dbUser.user.vehicles = {};
                                customer.vehicles.forEach(iterateNewVehicles);

                                function iterateNewVehicles(vehicle) {
                                    var vIds = Object.keys(dbUser.user.vehicles);
                                    var existingVehicleInDb = false;
                                    for (var i = 0; i < vIds.length; i++) {
                                        var vId = vIds[i];
                                        if (dbUser.user.vehicles[vId].reg == vehicle.reg)
                                            existingVehicleInDb = true;
                                    }
                                    if (!existingVehicleInDb) {
                                        var prefixVehicle = 'vhcl';
                                        dbUser.user.vehicles[utils.generateUUID('vhcl')] = vehicle;
                                    }
                                }
                            }
                            targetUser = dbUser;
                        } else {
                            var prefixUser = 'usr-' + angular.lowercase(customer.name).replace(' ', '-');
                            targetUser = {
                                _id: utils.generateUUID(prefixUser),
                                creator: $rootScope.amGlobals.creator,
                                channel: $rootScope.amGlobals.channel
                            };
                            targetUser.user = $.extend({}, customer);
                            if (customer.vehicles && customer.vehicles.length > 0) {
                                targetUser.user.vehicles = {};
                                customer.vehicles.forEach(iterateVehicles);

                                function iterateVehicles(vehicle) {
                                    var prefixVehicle = 'vhcl';
                                    targetUser.user.vehicles[utils.generateUUID(prefixVehicle)] = vehicle;
                                }
                            } else
                                delete targetUser.user.vehicles;
                            addedCustomerCount++;
                        }
                        customersToSave.push(targetUser);
                    }
                    pdbMain.saveAll(customersToSave).then(saveSuccess).catch(failure);
                }

                function saveSuccess(res) {
                    tracker.resolve({
                        success: true,
                        message: addedCustomerCount + ' customers have been imported!'
                    })
                }

                function failure(error) {
                    tracker.reject({
                        success: false,
                        message: 'Error while accessing database! Please Try Again!'
                    });
                }
            }

            function getDocuments() {
                var tracker = $q.defer();
                var documents = [];
                pdbMain.getAll().then(docFound).catch(failure);
                return tracker.promise;

                function docFound(res) {
                    res.rows.forEach(iterateDocuments);
                    tracker.resolve(documents);
                }

                function failure(err) {
                    tracker.reject(documents);
                }

                function iterateDocuments(element) {
                    if ($rootScope.amGlobals.IsConfigDoc(element.id))
                        return;
                    documents.push(element.doc);
                }
            }
        }
        
        function cleanUp() {
            tracker = undefined;
        }
    }
})();