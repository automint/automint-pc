/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('altairApp')
        .service('importDataService', ImportDataService);
        
    ImportDataService.$inject = ['pdbCustomer', '$filter', '$q', 'utils', '$automintService'];
    
    function ImportDataService(pdbCustomer, $filter, $q, utils, $automintService) {
        var sVm = this;
        //  function mappings
        sVm.compileCSVFile = compileCSVFile;
        
        //  function declarations and definations
        function compileCSVFile(files) {
            //  default execution steps
            readFile(files[0], readerCallback);
            
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
                var differed = $q.defer();
                var documents = [];
                pdbCustomer.getAll().then(function(res) {
                    res.rows.forEach(function(element) {
                        documents.push(element.doc);
                    });
                    differed.resolve(documents);
                }, function(err) {
                    differed.reject(documents);
                });
                return differed.promise;
            }
            
            function updateDatabase(customers) {
                getDocuments().then(function(res) {
                    var addedCustomerCount = 0;
                    customers.forEach(function(customer) {
                        var targetUser = {};
                        var found = $filter('filter')(res, {
                            user : {
                                name: customer.name,
                                mobile: customer.mobile
                            }
                        });
                        if (found.length > 0) {
                            var dbUser = found[0];
                            if (customer.vehicles && customer.vehicles.length > 0) {
                                if (!dbUser.user.vehicles)
                                    dbUser.user.vehicles = {};
                                customer.vehicles.forEach(function(vehicle) {
                                    var vIds = Object.keys(dbUser.user.vehicles);
                                    var existingVehicleInDb = false;
                                    for (var i = 0; i < vIds.length; i++) {
                                        var vId = vIds[i];
                                        if (dbUser.user.vehicles[vId].reg == vehicle.reg)
                                            existingVehicleInDb = true;
                                    }
                                    if (!existingVehicleInDb) {
                                        dbUser.user.vehicles[utils.generateUUID('vhcl')] = vehicle;
                                    }
                                });
                            }
                            targetUser = dbUser;
                        } else {
                            targetUser = {
                                _id: utils.generateUUID('user'),
                                creator: $automintService.username
                            };
                            targetUser.user = $.extend({}, customer);
                            if (customer.vehicles && customer.vehicles.length > 0) {
                                targetUser.user.vehicles = {};
                                customer.vehicles.forEach(function(vehicle) {
                                    targetUser.user.vehicles[utils.generateUUID('vhcl')] = vehicle;
                                })
                            } else
                                delete targetUser.user.vehicles;
                            addedCustomerCount++;
                        }
                        pdbCustomer.save(targetUser).then(function(saveSuccess) {
                            //  party karo. save thai gayu
                            console.log('Import Successfull!');
                        }, function(saveFailure) {
                            //  lagi gai
                            UIkit.notify("Error adding " + targetUser.user.name + '!', {
                                status: 'danger',
                                timeout: 1500
                            });
                        });
                    });
                    UIkit.notify(addedCustomerCount + " customer(s) added!", {
                        status: 'info',
                        timeout: 3000
                    });
                }, function(err) {
                    console.log(err);
                    UIkit.notify("Error access database! Please Try Again!", {
                        status: 'danger',
                        timeout: 3000
                    });
                })
            }
        }
    }
})();