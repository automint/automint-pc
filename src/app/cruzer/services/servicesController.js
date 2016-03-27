angular
    .module('altairApp')
    .controller('servicesViewAllCtrl',
        function($state, $compile, $scope, $timeout, $resource, DTOptionsBuilder, DTColumnDefBuilder, $pouchDBUser) {
            var vm = this;
            //  datatable instance
            $scope.dtInstance = {};

            //  datatable options
            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withDisplayLength(10);
                
            //  filter datatable based on month and year
            //  param filterMonth- total months to be traversed (if query is for last 6 months, then 6 is to be passed)
            //  param filterYear- total years to be traversed (if query is for last 2 years, then 2 is to be passed)
            var setDatatableValues = function (filterMonth, filterYear) {
                var today = new Date();
                var currentDate = today.getDate();
                var currentMonth = today.getMonth();
                var currentYear = today.getFullYear();
                
                var filteredMonth = currentMonth - filterMonth;
                if (filteredMonth < 1) {
                    filteredMonth += 12;
                    currentYear--;
                }
                var filteredYear = currentYear - filterYear;
                var queryDate = new Date(filteredYear, filteredMonth, currentDate);
                
                $pouchDBUser.db().query(function (doc, emit) {
                    var boolServiceFound = false;
                    var vo = {};
                    Object.keys(doc.user.vehicles).forEach(function (vehicleKey) {
                        var vehicle = doc.user.vehicles[vehicleKey];
                        var so = {};
                        Object.keys(vehicle.services).forEach(function (serviceKey) {
                            var service = vehicle.services[serviceKey];
                            var splitDate = service.date.split("/");
                            var sDate = new Date(parseInt(splitDate[2]), parseInt(splitDate[1]) - 1, parseInt(splitDate[0]));
                            boolServiceFound = !service._deleted;
                            if (((sDate > queryDate) || (filterMonth == 0 && filterYear == 0)) && boolServiceFound) {    
                                var s = {
                                    cost: service.cost,
                                    date: service.date,
                                }
                                so[serviceKey] = s;
                            }
                        });
                        var v = {
                            reg: vehicle.reg,
                            manuf: vehicle.manuf,
                            model: vehicle.model,
                            services: so
                        }
                        vo[vehicleKey] = v;
                    });
                    var u = {
                        name: doc.user.name,
                        email: doc.user.email,
                        mobile: doc.user.mobile,
                        vehicles: vo
                    } 
                    if (boolServiceFound && !doc.user._deleted) {
                        emit(u);
                    }
                }).then(function (res) {
                    var services = [];
                    for (var i = 0; i < res.rows.length; i++) {
                        var user = res.rows[i].key;
                        var vehicleKeys = Object.keys(user.vehicles);
                        vehicleKeys.forEach(function(vId) {
                            var vehicle = user.vehicles[vId];
                            var serviceKeys = Object.keys(vehicle.services);
                            serviceKeys.forEach(function(sId) {
                                var service = vehicle.services[sId];
                                var dateSplit = service.date.split("/");
                                var targetDate = dateSplit[2] + "-" + dateSplit[1] + "-" + dateSplit[0];
                                var s = {
                                    id: sId,
                                    userId: res.rows[i].id,
                                    mobile: user.mobile,
                                    name: user.name,
                                    vehicleId: vId,
                                    reg: vehicle.reg,
                                    manufacturer: vehicle.manuf,
                                    model: vehicle.model,
                                    date: targetDate,
                                    cost: service.cost
                                };
                                services.push(s);
                            }, this);
                        }, this);
                    }
                    vm.services = services;
                    $scope.$apply();
                }).catch(function (err) {
                    vm.service = [];
                    $scope.$apply();
                });
            }
            //  array of date filters possible for datatable
            $scope.possibleDateFilters = [
                '1 Month',
                '6 Months',
                '1 Year',
                'Everything'
            ]
            
            //  set default filter to first date filter
            $scope.dateQuery = $scope.possibleDateFilters[0];
            setDatatableValues(1, 0);
            
            //  proccess according to different date filters
            $scope.filterDatatable = function (index) {
                $scope.dateQuery = $scope.possibleDateFilters[index];
                switch ($scope.dateQuery) {
                    case $scope.possibleDateFilters[0]:
                        setDatatableValues(1, 0);
                        break;
                    case $scope.possibleDateFilters[1]:
                        setDatatableValues(6, 0);
                        break;
                    case $scope.possibleDateFilters[2]:
                        setDatatableValues(0, 1);
                        break;
                    case $scope.possibleDateFilters[3]:
                        setDatatableValues(0, 0);
                        break;
                }
            }

            //  callback for edit service button
            $scope.editService = function($e, service) {
                $state.go('restricted.services.edit', {
                    id: service.id,
                    vehicleId: service.vehicleId,
                    userId: service.userId
                });
            };
            
            //  callback for delete service button
            $scope.deleteService = function ($e, service) {
                $pouchDBUser.get(service.userId).then(function (res) {
                    res.user.vehicles[service.vehicleId].services[service.id]._deleted = true;
                    $pouchDBUser.save(res).then(function(res) {
                        UIkit.notify("Service has been deleted.", {
                            status: 'danger',
                            timeout: 3000
                        });
                        setDatatableValues(1, 0);
                    }, function(err) {
                        UIkit.notify("Service can not be deleted at moment. Please Try Again!", {
                            status: 'danger',
                            timeout: 3000
                        });
                    });
                });
            }

            //  callback for add service button
            $scope.addService = function() {
                $state.go('restricted.services.add');
            };
        })
    .controller('servicesAddCtrl', [
        '$scope',
        '$rootScope',
        'utils',
        '$pouchDBUser',
        '$state',
        'WizardHandler',
        '$pouchDBDefault',
        '$filter',
        function($scope, $rootScope, utils, $pouchDBUser, $state, WizardHandler, $pouchDBDefault, $filter) {
            //  define operation mode to disbable particular fields in different modes
            $scope.operationMode = "add";
            
            //  keep track of user details from UI
            $scope.user = {
                id: '',
                mobile: '',
                email: '',
                name: ''
            }

            //  keep track of vehicle details from UI
            $scope.vehicle = {
                id: '',
                reg: '',
                manuf: '',
                model: ''
            }
            
            //  FORM VALIDATIONS [BEGIN]
            $scope.validateCustomer = function () {
                var checkPoint1 = $scope.user.name == null ? $("#wizard_customer_name").val() : $scope.user.name;
                if (checkPoint1 == '' || checkPoint1 == undefined) {
                    UIkit.notify("Please Enter Customer Name", {
                        status: 'danger',
                        timeout: 3000
                    });
                    return false;
                }
                return true;
            }
            $scope.validateVehicle = function () {
                var checkPoint1 = $scope.validateCustomer();
                if (checkPoint1) {
                    var checkPoint2 = ($scope.vehicle.reg == '' || $scope.vehicle.reg == undefined) && ($scope.vehicle.manuf == '' || $scope.vehicle.manuf == undefined) && ($scope.vehicle.model == '' || $scope.vehicle.model == undefined);
                    if (checkPoint2) {
                        UIkit.notify("Please Enter At Least One Vehicle Detail", {
                            status: 'danger',
                            timeout: 3000
                        });
                        WizardHandler.wizard().goTo(1);
                        return false;
                    }
                }
                return checkPoint1;
            }
            //  FORM VALIDATIONS [END]

            //  temporary objects for tracking current date
            var currentDateObject = new Date();
            var currentMonthValue = currentDateObject.getMonth() + 1;
            //  keep track of service details from UI
            $scope.service = {
                date: currentDateObject.getDate() + "/" + (currentMonthValue < 10 ? "0" + currentMonthValue : currentMonthValue) + "/" + currentDateObject.getFullYear(),
                odo: 0,
                cost: 0,
                details: '',
                problems: []
            };
            
            $scope.possibleUserList = [];
            //  populate user list
            $pouchDBUser.db().query(function (doc, emit) {
                emit(doc.user.name);
            }).then(function (result) {
                $scope.$apply(function () {
                    $scope.possibleUserList = result.rows;
                })
            }).catch(function (err) {
                //  no user found
            });
            
            //  populate treatments list
            $pouchDBDefault.get('inventory').then(function (res) {
                var treatments = [];
                if (res.regular) {
                    Object.keys(res.regular).forEach(function (details) {
                        if (!details.match(/^(_id|_rev)$/) && !res.regular[details]._deleted) {
                            treatments.push({
                                name: details,
                                rate: res.regular[details].rate
                            });
                        }
                    });
                }
                $scope.treatments = treatments;
                $scope.$apply();
            }, function (err) {
                $scope.treatments = [];
            });
            
            //  update treatment details
            $scope.updateTreatmenDetails = function (index, fIndex) {
                var divId = 'pDetails' + fIndex;
                var currentDetails = $("#" + divId).val();
                var found = $filter('filter')($scope.treatments, { name:  currentDetails}, true);
                if (found.length > 0) {
                    $scope.service.problems[index].rate = found[0].rate;
                    if ($scope.service.problems[index].qty < 1)
                        $scope.service.problems[index].qty = 1;
                } else {
                    $scope.service.problems[index].rate = 0;
                }
                $scope.updateCost();
            }
            
            //  auto fill user details based on customer name given from UI
            $scope.fillUserDetails = function() {
                var userIdentifier = $("#wizard_customer_name").val();
                $pouchDBUser.get(userIdentifier).then(function(res) {
                    if (res.user) {
                        var pvl = [];
                        $scope.user.id = userIdentifier;
                        $scope.user.mobile = res.user.mobile;
                        $scope.user.name = res.user.name;
                        $scope.user.email = res.user.email;
                        if (res.user.vehicles) {
                            Object.keys(res.user.vehicles).forEach(function (element) {
                                var vehicle = res.user.vehicles[element];
                                vehicle.id = element;
                                vehicle.name = vehicle.manuf + ' - ' + vehicle.model + (vehicle.reg == '' ? '' : ', ' + vehicle.reg);
                                pvl.push(vehicle);
                            });
                        }
                        pvl.push({
                            id: undefined,
                            name: 'New Vehicle'
                        })
                        $scope.$apply(function () {
                            $scope.possibleVehicleList = pvl;
                        });
                    }
                }, function(err) {
                    //  if match not found, replace everything with their defaults
                    $scope.user.id = '';
                    $scope.user.mobile = '';
                    $scope.user.email = '';
                    $scope.$apply(function () {
                        $scope.possibleVehicleList = [{
                            id: undefined,
                            name: 'New Vehicle'
                        }];
                    });
                });
            };
            
            //  add option for new vehicle by default in pvl
            $scope.possibleVehicleList = [{
                id: undefined,
                name: 'New Vehicle'
            }];
            
            //  auto select new vehicle as option
            $scope.currentVehicle = 'New Vehicle';
            
            //  auto fill vehicle details
            $scope.fillVehicleDetails = function() {
                var cv = $("#currentVehicle").val();
                for (var pvi = 0; pvi < $scope.possibleVehicleList.length; pvi++) {
                    var vehicle = $scope.possibleVehicleList[pvi];
                    if (vehicle.name == cv) {
                        $scope.vehicle.id = vehicle.id;
                        $scope.vehicle.reg = vehicle.reg;
                        $scope.vehicle.manuf = vehicle.manuf;
                        $scope.vehicle.model = vehicle.model;
                    }
                }
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

            //  insert a problem by default
            $scope.service.problems.push({
                details: '',
                rate: 0,
                type: 'Part',
                qty: 0,
                focusIndex: 0
            });

            //  manually insert a problem
            $scope.addProblemRow = function() {
                var fIndex = $scope.service.problems.length;
                $scope.service.problems.push({
                    details: '',
                    rate: 0,
                    type: 'Part',
                    qty: 0,
                    focusIndex: fIndex
                });
                var focusField = "#pDetails" + fIndex;
                var to = setTimeout(function () {
                    $(focusField).focus();
                }, 500);
            };

            //  save data to pouchDB instance
            $scope.save = function() {
                //  store in pouch data
                var saveDataInDB = function(document) {
                    //  free up possibly long global object
                    delete $scope.treatments;
                    //  open inventory doc and check for mismatch from existing problem details
                    $pouchDBDefault.get('inventory').then(function (res) {
                        var mismatchFound = false;
                        $scope.service.problems.forEach(function(element) {
                            if (!res.regular[element.details]) {
                                res.regular[element.details] = {
                                    rate: element.rate
                                }
                                mismatchFound = true;
                            }
                        });
                        
                        //  update inventory document if mismatch found
                        if (mismatchFound)
                            $pouchDBDefault.save(res);
                    });
                    //  save user document
                    $pouchDBUser.save(document).then(function(res) {
                        UIkit.notify("Service has been added.", {
                            status: 'info',
                            timeout: 3000
                        });
                        $state.go("restricted.services.all");
                    }, function(err) {
                        UIkit.notify("Service can not be added at moment. Please Try Again!", {
                            status: 'danger',
                            timeout: 3000
                        });
                    });
                }

                //  make and format a document for pouchDB

                var propProblems = {};
                $scope.service.problems.forEach(function(element) {
                    var objProblems = {
                        rate: element.rate,
                        type: element.type,
                        qty: element.qty
                    }
                    propProblems[element.details] = objProblems;
                });

                var objService = {
                    date: $scope.service.date,
                    odo: $scope.service.odo,
                    cost: $scope.service.cost,
                    details: $scope.service.details,
                    problems: propProblems
                };

                var propService = {};
                propService[generateUUID("srvc")] = objService;
                var objVehicle = {
                    reg: $scope.vehicle.reg,
                    manuf: $scope.vehicle.manuf,
                    model: $scope.vehicle.model,
                    services: propService
                };

                var propVehicle = {};
                propVehicle[generateUUID("vhcl")] = objVehicle;
                var u = {
                    mobile: $scope.user.mobile,
                    name: ($scope.user.name == null ? $("#wizard_customer_name").val() : $scope.user.name),
                    email: $scope.user.email,
                    vehicles: propVehicle
                };

                //  check if user exists or not
                $pouchDBUser.get($scope.user.id).then(function(res) {
                    if (res.user) {
                        if (res.user.vehicles) {
                            var vehicle = res.user.vehicles[$scope.vehicle.id];
                            if (vehicle) {
                                if (vehicle.services) {
                                    vehicle.services[generateUUID("srvc")] = objService;
                                } else {
                                    vehicle.services = propService;
                                }
                            } else {
                                res.user.vehicles[generateUUID("vhcl")] = objVehicle;
                            }
                        } else {
                            res.user.vehicles = propVehicle;
                        }
                    } else {
                        res.user = u;
                    }
                    //  save/update document with given user inputs
                    saveDataInDB(res);
                }, function(err) {
                    //  if user not found add new complete document
                    var doc = {
                        _id: generateUUID("user"),
                        user: u
                    };
                    //  save complete document on error of fatch user document
                    saveDataInDB(doc);
                });
            }

            //  temporary content for AutoComplete
            $scope.countryNames = [
                "Hero",
                "Honda",
                "Audi",
                "BMW",
                "Maruti",
                "Suzuki"
            ];

            //  update total cost based on individual problems' cost
            $scope.updateCost = function() {
                var totalCost = 0;
                $scope.service.problems.forEach(function(element) {
                    totalCost += element.rate * element.qty;
                });
                $scope.service.cost = totalCost;
            };

            //  callback function for finalizing wizard form
            $scope.finishedWizard = function() {
                $scope.save();
            };

        }
    ]).controller('servicesEditCtrl', [
        '$scope',
        '$rootScope',
        'utils',
        '$pouchDBUser',
        '$state',
        '$pouchDBDefault',
        '$filter',
        'WizardHandler',
        function($scope, $rootScope, utils, $pouchDBUser, $state, $pouchDBDefault, $filter, WizardHandler) {
            //  define operation mode to disbable particular fields in different modes
            $scope.operationMode = "edit";

            //  keep track of user details from UI
            $scope.user = {
                mobile: '',
                email: '',
                name: ''
            }

            //  keep track of vehicle details from UI
            $scope.vehicle = {
                reg: '',
                manuf: '',
                model: ''
            }
            
            //  keep track of service details from UI
            $scope.service = {
                date: '',
                odo: 0,
                cost: 0,
                details: '',
                problems: []
            };
            
            $scope.possibleVehicleList = [];
            $scope.currentVehicle = '';

            //  manually insert a problem
            $scope.addProblemRow = function() {
                var fIndex = $scope.service.problems.length;
                $scope.service.problems.push({
                    details: '',
                    rate: 0,
                    type: 'Part',
                    qty: 0,
                    focusIndex: fIndex
                });
                //  focus last inserted problem view
                var focusField = "#pDetails" + fIndex;
                var to = setTimeout(function () {
                    $(focusField).focus();
                }, 500);
            };
            
            //  update total cost based on individual problems' cost
            $scope.updateCost = function() {
                var totalCost = 0;
                $scope.service.problems.forEach(function(element) {
                    totalCost += element.rate * element.qty;
                });
                $scope.service.cost = totalCost;
            };

            //  fetch parameters of the state to keep track of current user, their vehicle and its service
            var paramId = $state.params.id;
            var paramUserId = $state.params.userId;
            var paramVehicleId = $state.params.vehicleId;

            //  validate parameters
            if (paramId == undefined || paramUserId == undefined || paramVehicleId == undefined) {
                $state.go('restricted.services.all');
            }

            //  auto fill form data based on parameters passed to the state
            $pouchDBUser.get(paramUserId).then(function(res) {
                if (res.user) {
                    var pvl = [];
                    if (res.user.vehicles) {
                        var vehicle = res.user.vehicles[paramVehicleId];
                        var service = vehicle.services[paramId];
                        if (service) {
                            $scope.user.mobile = res.user.mobile;
                            $scope.user.email = res.user.email;
                            $scope.user.name = res.user.name;
                            $scope.$apply(function () {
                                $scope.currentVehicle = vehicle.manuf + ' - ' + vehicle.model + (vehicle.reg == '' ? '' : ', ' + vehicle.reg);
                            });
                            $scope.vehicle.id = paramVehicleId;
                            $scope.vehicle.reg = vehicle.reg;
                            $scope.vehicle.manuf = vehicle.manuf;
                            $scope.vehicle.model = vehicle.model;
                            $scope.vehicle.name = vehicle.manuf + ' - ' + vehicle.model + (vehicle.reg == '' ? '' : ', ' + vehicle.reg);
                            pvl.push($scope.vehicle);
                            $scope.service.date = service.date;
                            $scope.service.odo = service.odo;
                            $scope.service.cost = service.cost;
                            $scope.service.details = service.details;
                            var keysProblems = Object.keys(service.problems);
                            keysProblems.forEach(function(element) {
                                var queryProblem = service.problems[element];
                                var fIndex = $scope.service.problems.length;
                                var probObject = {
                                    details: element,
                                    type: queryProblem.type,
                                    rate: queryProblem.rate,
                                    cost: queryProblem.cost,
                                    qty: queryProblem.qty,
                                    focusIndex: fIndex
                                }
                                $scope.service.problems.push(probObject);
                            });
                        }
                    }
                    Object.keys(res.user.vehicles).forEach(function (element) {
                        if (element != $scope.vehicle.id) {
                            var vehicle = res.user.vehicles[element];
                            vehicle.id = element;
                            vehicle.name = vehicle.manuf + ' - ' + vehicle.model + (vehicle.reg == '' ? '' : ', ' + vehicle.reg);
                            pvl.push(vehicle);
                        }
                    });
                    $scope.possibleVehicleList = pvl;
                }
                WizardHandler.wizard().goTo(2);
                $scope.$apply();
            }, function(err) {
                //  if no match found in database, exit the page notifying user about the error
                UIkit.notify("Something went wrong! Please Try Again!", {
                    status: 'danger',
                    timeout: 3000
                });
                $state.go('restricted.services.all');
            });
            
            //  populate treatments list
            $pouchDBDefault.get('inventory').then(function (res) {
                var treatments = [];
                if (res.regular) {
                    Object.keys(res.regular).forEach(function (details) {
                        if (!details.match(/^(_id|_rev)$/) && !res.regular[details]._deleted) {
                            treatments.push({
                                name: details,
                                rate: res.regular[details].rate
                            });
                        }
                    });
                }
                $scope.treatments = treatments;
                $scope.$apply();
            }, function (err) {
                $scope.treatments = [];
            });
            
            //  update treatment details
            $scope.updateTreatmenDetails = function (index, fIndex) {
                var divId = 'pDetails' + fIndex;
                var currentDetails = $("#" + divId).val();
                var found = $filter('filter')($scope.treatments, { name:  currentDetails}, true);
                if (found.length > 0) {
                    $scope.service.problems[index].rate = found[0].rate;
                    if ($scope.service.problems[index].qty < 1)
                        $scope.service.problems[index].qty = 1;
                } else {
                    $scope.service.problems[index].rate = 0;
                }
                $scope.updateCost();
            }

            //  save data to pouchDB instance
            $scope.save = function() {
                //  store in pouch data
                var saveDataInDB = function(document) {
                    //  free up possibly long global object
                    delete $scope.treatments;
                    //  open inventory doc and check for mismatch from existing problem details
                    $pouchDBDefault.get('inventory').then(function (res) {
                        var mismatchFound = false;
                        $scope.service.problems.forEach(function(element) {
                            if (!res.regular[element.details]) {
                                res.regular[element.details] = {
                                    rate: element.rate
                                }
                                mismatchFound = true;
                            }
                        });
                        
                        //  update inventory document if mismatch found
                        if (mismatchFound)
                            $pouchDBDefault.save(res);
                    });
                    //  save user document
                    $pouchDBUser.save(document).then(function(res) {
                        UIkit.notify("Service has been updated.", {
                            status: 'info',
                            timeout: 3000
                        });
                        $state.go("restricted.services.all");
                    }, function(err) {
                        UIkit.notify("Service can not be updated at moment. Please Try Again!", {
                            status: 'info',
                            timeout: 3000
                        });
                    });
                }

                //  make and format a document for pouchDB

                var propProblems = {};
                $scope.service.problems.forEach(function(element) {
                    var objProblems = {
                        rate: element.rate,
                        type: element.type,
                        qty: element.qty
                    }
                    propProblems[element.details] = objProblems;
                });

                var objService = {
                    date: $scope.service.date,
                    odo: $scope.service.odo,
                    cost: $scope.service.cost,
                    details: $scope.service.details,
                    problems: propProblems
                };

                //  check if user exists or not
                $pouchDBUser.get($state.params.userId).then(function(res) {
                    if (res.user && res.user.vehicles[$scope.vehicle.id] && res.user.vehicles[$scope.vehicle.id].services[$state.params.id]) {
                        res.user.vehicles[$scope.vehicle.id].services[$state.params.id] = objService;
                    }
                    saveDataInDB(res);
                }, function(err) {
                    //  if no match found in database, exit the page notifying user about the error
                    UIkit.notify("Something went wrong! Please Try Again!", {
                        status: 'danger',
                        timeout: 3000
                    });
                    $state.go('restricted.services.all');
                });
            }
            
            //  temporary content for AutoComplete
            $scope.countryNames = [
                "Hero",
                "Honda",
                "Audi",
                "BMW",
                "Maruti",
                "Suzuki"
            ];

            //  callback function for finalizing wizard form
            $scope.finishedWizard = function() {
                $scope.save();
            };

        }
    ]);