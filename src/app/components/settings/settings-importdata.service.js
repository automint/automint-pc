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
        sVm.compileCSVFile = compileCSVFile;
        sVm.cleanUp = cleanUp;

        //  function declarations and definations
        function compileCSVFile(files) {
            tracker = $q.defer();
            readFile(files[0], readerCallback);
            return tracker.promise;

            //  declarations and definations

            //  initiate reading of CSV file
            function readFile(f, callback) {
                var reader = new FileReader();
                reader.readAsText(f);
                reader.onload = onReaderLoad;

                function onReaderLoad(event) {
                    var csvArray = $.csv2Array(event.target.result);
                    callback(csvArray);
                }
            }

            //  parse CSV file
            function readerCallback(csvArray) {
                var customers = [];
                var csvMap = {};
                var csvFields = csvArray[0];
                tracker.notify({
                    current: 0,
                    total: csvFields.length
                });
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

            function updateDatabase(customers) {
                getDocuments().then(matchAndUpdate).catch(failure);

                function matchAndUpdate(res) {
                    var addedCustomerCount = 0;
                    var customersToSave = [];
                    tracker.notify({
                        current: 0,
                        total: customers.length
                    });
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
                                        var prefixVehicle = 'vhcl' + ((vehicle.manuf && vehicle.model) ? '-' + angular.lowercase(vehicle.manuf).replace(' ', '-') + '-' + angular.lowercase(vehicle.model).replace(' ', '-') : '');
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
                                    var prefixVehicle = 'vhcl' + ((vehicle.manuf && vehicle.model) ? '-' + angular.lowercase(vehicle.manuf).replace(' ', '-') + '-' + angular.lowercase(vehicle.model).replace(' ', '-') : '');
                                    targetUser.user.vehicles[utils.generateUUID(prefixVehicle)] = vehicle;
                                }
                            } else
                                delete targetUser.user.vehicles;
                            addedCustomerCount++;
                        }
                        tracker.notify({
                            current: addedCustomerCount,
                            total: customers.length
                        });
                        customersToSave.push(targetUser);
                    }
                    pdbMain.saveAll(customersToSave).then(saveSuccess).catch(failure);
                    tracker.resolve({
                        success: true,
                        message: addedCustomerCount + " customer(s) added!"
                    });
                }

                function saveSuccess(res) {
                    $log.info('Import Successfull!');
                }

                function failure(error) {
                    tracker.reject({
                        success: false,
                        message: 'Error while accessing database! Please Try Again!'
                    });
                }
            }
        }
        
        function cleanUp() {
            tracker = undefined;
        }
    }
})();