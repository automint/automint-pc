angular.module('altairApp')
    .controller('customersViewAllCtrl',
        function($state, $compile, $scope, $timeout, $resource, DTOptionsBuilder, DTColumnDefBuilder, $pouchDBUser) {
            var vm = this;
            //  datatable instance
            $scope.dtInstance = {};

            //  datatable options
            $scope.dtOptions = DTOptionsBuilder
                .newOptions()
                .withDisplayLength(10);

            var refresh = function () {
                $pouchDBUser.db().query(function(doc, emit) {
                    var vo = {};
                    var u = {
                        name: doc.user.name,
                        email: doc.user.email,
                        mobile: doc.user.mobile
                    }
                    if (doc.user.vehicles) {
                        Object.keys(doc.user.vehicles).forEach(function(vehicleKey) {
                            var vehicle = doc.user.vehicles[vehicleKey];
                            var v = {
                                reg: vehicle.reg,
                                manuf: vehicle.manuf,
                                model: vehicle.model,
                            }
                            vo[vehicleKey] = v;
                        });
                        u.vehicles = vo;
                    }
                    if (!doc.user._deleted)
                        emit(u);
                }).then(function(res) {
                    var customers = [];
                    for (var i = 0; i < res.rows.length; i++) {
                        var user = res.rows[i].key;
                        var c = {
                            id: res.rows[i].id,
                            mobile: user.mobile,
                            email: user.email,
                            name: user.name
                        };
                        if (user.vehicles) {
                            var vehicleKeys = Object.keys(user.vehicles);
                            vehicleKeys.forEach(function(vId) {
                                var vehicle = user.vehicles[vId];
                                c.vehicleId = vId;
                                c.reg = vehicle.reg;
                                c.manufacturer = vehicle.manuf;
                                c.model = vehicle.model;
                            }, this);
                        }
                        customers.push(c);
                    }
                    vm.customers = customers;
                    $scope.$apply();
                }).catch(function(err) {
                    vm.customers = [];
                });
            }
            
            refresh();

            //  callback for edit customer button
            $scope.editCustomer = function($e, customer) {
                $state.go('restricted.customers.edit', {
                    id: customer.id
                });
            };

            //  callback for delete customer button
            $scope.deleteCustomer = function($e, customer) {
                $pouchDBUser.get(customer.id).then(function (res) {
                    res.user._deleted = true;
                    $pouchDBUser.save(res).then(function(res) {
                        UIkit.notify("Customer has been deleted.", {
                            status: 'danger',
                            timeout: 3000
                        });
                        refresh();
                    }, function(err) {
                        UIkit.notify("Customer can not be deleted at moment. Please Try Again!", {
                            status: 'danger',
                            timeout: 3000
                        });
                    });
                });
            }

            //  callback for add customer button
            $scope.addCustomer = function() {
                $state.go('restricted.customers.add');
            };
        })
    .controller('customersAddCtrl', [
        '$scope',
        '$rootScope',
        'utils',
        '$pouchDBUser',
        '$state',
        function($scope, $rootScope, utils, $pouchDBUser, $state) {
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
            
            //  FORM VALIDATIONS [BEGIN]
            $scope.validateCustomerInformation = function () {
                var checkPoint1 = $scope.user.name == null ? $("#wizard_customer_name").val() : $scope.user.name;
                if (checkPoint1 == '') {
                    UIkit.notify("Please Enter Customer Name", {
                        status: 'danger',
                        timeout: 3000
                    });
                    return false;
                }
                return true;
            }
            //  FORM VALIDATIONS [END]

            //  save data to pouchDB instance
            $scope.save = function() {
                //  store in pouch data
                var saveDataInDB = function(document) {
                    $pouchDBUser.save(document).then(function(res) {
                        UIkit.notify("Customer has been added.", {
                            status: 'info',
                            timeout: 3000
                        });
                        $state.go("restricted.customers.all");
                    }, function(err) {
                        UIkit.notify("Customer can not be added. Please Try Again!", {
                            status: 'info',
                            timeout: 3000
                        });
                    });
                }

                //  make and format a document for pouchDB

                var objVehicle = {
                    reg: $scope.vehicle.reg,
                    manuf: $scope.vehicle.manuf,
                    model: $scope.vehicle.model
                };

                var propVehicle = {};
                propVehicle[generateUUID("vhcl")] = objVehicle;
                var u = {
                    mobile: $scope.user.mobile,
                    name: ($scope.user.name == null ? $("#wizard_customer_name").val() : $scope.user.name),
                    email: $scope.user.email
                };
                
                if (!($scope.vehicle.reg == '' && $scope.vehicle.manuf == '' && $scope.vehicle.model == '')) {
                    u.vehicles = propVehicle;
                }
                
                var doc = {
                    _id: generateUUID("user"),
                    user: u
                };
                //  save complete document on error of fatch user document
                saveDataInDB(doc);
            }

            //  callback function for finalizing wizard form
            $scope.finishedWizard = function() {
                $scope.save();
            };

        }
    ])
    .controller('customersEditCtrl', [
        '$scope',
        '$rootScope',
        'utils',
        '$pouchDBUser',
        '$state',
        function($scope, $rootScope, utils, $pouchDBUser, $state) {
            //  define operation mode to disbable particular fields in different modes
            $scope.operationMode = "edit";
            var userDbInstance = {};

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
            $scope.validateCustomerInformation = function () {
                var checkPoint1 = $scope.user.name == null ? $("#wizard_customer_name").val() : $scope.user.name;
                if (checkPoint1 == '') {
                    UIkit.notify("Please Enter Customer Name", {
                        status: 'danger',
                        timeout: 3000
                    });
                    return false;
                }
                return true;
            }
            //  FORM VALIDATIONS [END]

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
           
            //  add option for new vehicle by default in pvl
            $scope.possibleVehicleList = [{
                id: undefined,
                name: 'New Vehicle'
            }];
            
            //  auto select new vehicle as option
            $scope.currentVehicle = 'New Vehicle';
            
            //  fetch parameters of the state to keep track of current user
            var paramId = $state.params.id;
            
            //  pre fill data
            $pouchDBUser.get(paramId).then(function (res) {
                userDbInstance = res;
                var customers = [];
                var u = res.user;
                var pvl = [];
                $scope.user.id = res._id;
                $scope.user.mobile = u.mobile;
                $scope.user.email = u.email;
                $scope.user.name = u.name;
                if (u.vehicles) {
                    var vehicleKeys = Object.keys(u.vehicles);
                    vehicleKeys.forEach(function(vId) {
                        var vehicle = u.vehicles[vId];
                        pvl.push({
                            id: vId,
                            reg: vehicle.reg,
                            manuf: vehicle.manuf,
                            model: vehicle.model,
                            name: vehicle.manuf + ' - ' + vehicle.model + (vehicle.reg == '' ? '' : ', ' + vehicle.reg)
                        });
                    }, this);
                    pvl.push({
                        id: undefined,
                        name: 'New Vehicle'
                    })
                    $scope.possibleVehicleList = pvl;
                }
                $scope.$apply();
            }, function (err) {
                UIkit.notify("Something went wrong! Please Try Again!", {
                    status: 'danger',
                    timeout: 3000
                });
                $state.go('restricted.customers.all');
            });
            
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

            //  save data to pouchDB instance
            $scope.save = function() {
                //  store in pouch data
                var saveDataInDB = function(document) {
                    $pouchDBUser.save(document).then(function(res) {
                        UIkit.notify("Customer has been updated.", {
                            status: 'info',
                            timeout: 3000
                        });
                        $state.go("restricted.customers.all");
                    }, function(err) {
                        UIkit.notify("Customer can not be updated. Please Try Again!", {
                            status: 'info',
                            timeout: 3000
                        });
                    });
                }

                //  make and format a document for pouchDB

                var objVehicle = {
                    reg: $scope.vehicle.reg,
                    manuf: $scope.vehicle.manuf,
                    model: $scope.vehicle.model
                };

                var propVehicle = {};
                propVehicle[generateUUID("vhcl")] = objVehicle;
                
                userDbInstance.user.mobile = $scope.user.mobile;
                userDbInstance.user.name = ($scope.user.name == null ? $("#wizard_customer_name").val() : $scope.user.name);
                userDbInstance.user.email = $scope.user.email;
                
                if (!($scope.vehicle.reg == '' && $scope.vehicle.manuf == '' && $scope.vehicle.model == '')) {
                    if (userDbInstance.user.vehicles) {
                        var vehicleDbInstance = userDbInstance.user.vehicles[$scope.vehicle.id];
                        if (vehicleDbInstance) {
                            vehicleDbInstance.reg = $scope.vehicle.reg;
                            vehicleDbInstance.manuf = $scope.vehicle.manuf;
                            vehicleDbInstance.model = $scope.vehicle.model;
                        } else {
                            userDbInstance.user.vehicles[generateUUID("vhcl")] = objVehicle;
                        }
                    } else {
                        userDbInstance.user.vehicles = propVehicle;
                    }
                }
                
                if ($scope.user.id) {
                    saveDataInDB(userDbInstance);
                } else {
                    UIkit.notify("Something went wrong! Please Try Again!", {
                        status: 'danger',
                        timeout: 3000
                    });
                    $state.go('restricted.customers.all');
                }
            }

            //  callback function for finalizing wizard form
            $scope.finishedWizard = function() {
                $scope.save();
            };

        }
    ]);