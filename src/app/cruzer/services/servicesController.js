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
                .withDisplayLength(10)
                .withOption('initComplete', function() {
                    //  additional options as features to table (Copy, CSV, Excel, PDF, Print)
                    $timeout(function() {
                        var $dt_tableTools = $scope.dtInstance.dataTable;
                        dt_tabletTools = $scope.dtInstance.DataTable;

                        var tt = new $.fn.dataTable.TableTools(dt_tabletTools, {
                            "sSwfPath": "bower_components/datatables-tabletools/swf/copy_csv_xls_pdf.swf"
                        });
                        $(tt.fnContainer()).insertBefore($dt_tableTools.closest('.dt-uikit').find('.dt-uikit-header'));

                        $('body').on('click', function(e) {
                            if ($('body').hasClass('DTTT_Print')) {
                                if (!$(e.target).closest(".DTTT").length && !$(e.target).closest(".uk-table").length) {
                                    var esc = $.Event("keydown", {
                                        keyCode: 27
                                    });
                                    $('body').trigger(esc);
                                }
                            }
                        });
                        // md inputs
                        $compile($('.dt-uikit .md-input'))($scope);
                    })
                });

            //  callback for edit service button
            $scope.editService = function($e, service) {
                $state.go('restricted.services.edit', {
                    id: service.id,
                    vehicleId: service.vehicleId,
                    mobile: service.mobile
                });
            };

            //  callback for add service button
            $scope.addService = function() {
                $state.go('restricted.services.add');
            };

            //  get Data from pouchDB
            $pouchDBUser.getAll().then(function(res) {
                var services = [];
                for (var i = 0; i < res.rows.length; i++) {
                    var user = res.rows[i].doc.user;
                    console.log(user);
                    var vehicleKeys = Object.keys(user.vehicles);
                    vehicleKeys.forEach(function(element) {
                        var vehicle = user.vehicles[element];
                        var vId = element;
                        var serviceKeys = Object.keys(vehicle.services);
                        serviceKeys.forEach(function(element) {
                            var service = vehicle.services[element];
                            var s = {
                                id: element,
                                mobile: user.mobile,
                                name: user.name,
                                vehicleId: vId,
                                reg: vehicle.reg,
                                manufacturer: vehicle.manuf,
                                model: vehicle.model,
                                date: service.date,
                                odo: service.odo,
                                cost: service.cost,
                                details: service.details
                            };
                            services.push(s);
                        }, this);
                    }, this);
                }
                vm.services = services;
                $scope.$apply();
            }, function(err) {
                debugger
            });
        })
    .controller('servicesAddCtrl', [
        '$scope',
        '$rootScope',
        'utils',
        '$pouchDBUser',
        '$state',
        function($scope, $rootScope, utils, $pouchDBUser, $state) {
            $scope.operationMode = "add";
            
            //  keep track of user details from UI
            $scope.user = {
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

            var currentDateObject = new Date();
            var currentMonthValue = currentDateObject.getUTCMonth() + 1;
            //  keep track of service details from UI
            $scope.service = {
                date: currentDateObject.getUTCDate() + "/" + (currentMonthValue < 10 ? "0" + currentMonthValue : currentMonthValue) + "/" + currentDateObject.getUTCFullYear(),
                odo: 0,
                cost: 0,
                details: '',
                problems: []
            };
            
            $scope.possibleVehicleList = [{
                id: undefined,
                name: 'New Vehicle'
            }];
            
            $scope.currentVehicle = 'New Vehicle';

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
                qty: 0
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

            //  auto fill user details
            $scope.fillUserDetails = function() {
                $pouchDBUser.get($scope.user.mobile).then(function(res) {
                    if (res.user) {
                        var pvl = [];
                        $scope.user.name = res.user.name;
                        $scope.user.email = res.user.email;
                        Object.keys(res.user.vehicles).forEach(function (element) {
                            var vehicle = res.user.vehicles[element];
                            vehicle.id = element;
                            vehicle.name = vehicle.manuf + ' - ' + vehicle.model + (vehicle.reg == '' ? '' : ', ' + vehicle.reg);
                            pvl.push(vehicle);
                        });
                        pvl.push({
                            id: undefined,
                            name: 'New Vehicle'
                        })
                        $scope.$apply(function () {
                            $scope.possibleVehicleList = pvl;
                        });
                    }
                }, function(err) {
                    console.log(err);
                });
            };

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
                        UIkit.notify("Service has been added.", {
                            status: 'info',
                            timeout: 3000
                        });
                        $state.go("restricted.services.all");
                    }, function(err) {
                        console.log(err);
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
                    name: $scope.user.name,
                    email: $scope.user.email,
                    vehicles: propVehicle
                };

                //Check if user exists or not
                $pouchDBUser.get($scope.user.mobile).then(function(res) {
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
                    saveDataInDB(res);
                }, function(err) { //If user not found add new complete document user/vehicle/service
                    var doc = {
                        _id: $scope.user.mobile,
                        user: u
                    };
                    saveDataInDB(doc); // save complete document on error of fatch user document
                });
            }

            $scope.countryNames = [
                "Hero",
                "Honda",
                "Audi",
                "BMW",
                "Maruti",
                "Suzuki"
            ];

            $scope.updateCost = function() {
                var totalCost = 0;
                $scope.service.problems.forEach(function(element) {
                    totalCost += element.rate * element.qty;
                });
                $scope.service.cost = totalCost;
            };

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
        function($scope, $rootScope, utils, $pouchDBUser, $state) {
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

            //  manuallu insert a problem
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
            
            $scope.updateCost = function() {
                var totalCost = 0;
                $scope.service.problems.forEach(function(element) {
                    totalCost += element.rate * element.qty;
                });
                $scope.service.cost = totalCost;
            };

            var paramId = $state.params.id;
            var paramMobile = $state.params.mobile;
            var paramVehicleId = $state.params.vehicleId;

            //  validate parameters
            if (paramId == undefined || paramMobile == undefined || paramVehicleId == undefined) {
                $state.go('restricted.services.all');
            }

            $pouchDBUser.get(paramMobile).then(function(res) {
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
                                var probObject = {
                                    details: element,
                                    type: queryProblem.type,
                                    rate: queryProblem.rate,
                                    cost: queryProblem.cost,
                                    qty: queryProblem.qty
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
                $scope.$apply();
            }, function(err) {
                console.log(err);
                UIkit.notify("Something went wrong! Please Try Again!", {
                    status: 'danger',
                    timeout: 3000
                });
                $state.go('restricted.services.all');
            });

            //  save data to pouchDB instance
            $scope.save = function() {
                //  store in pouch data
                var saveDataInDB = function(document) {
                    $pouchDBUser.save(document).then(function(res) {
                        UIkit.notify("Service has been updated.", {
                            status: 'info',
                            timeout: 3000
                        });
                        $state.go("restricted.services.all");
                    }, function(err) {
                        console.log(err);
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

                //Check if user exists or not
                $pouchDBUser.get($scope.user.mobile).then(function(res) {
                    if (res.user && res.user.vehicles[$scope.vehicle.id] && res.user.vehicles[$scope.vehicle.id].services[$state.params.id]) {
                        res.user.vehicles[$scope.vehicle.id].services[$state.params.id] = objService;
                        console.log('done');
                    }
                    saveDataInDB(res);
                }, function(err) { //If user not found add new complete document user/vehicle/service
                    UIkit.notify("Something went wrong! Please Try Again!", {
                        status: 'danger',
                        timeout: 3000
                    });
                    $state.go('restricted.services.all');
                });
            }

            $scope.countryNames = [
                "Hero",
                "Honda",
                "Audi",
                "BMW",
                "Maruti",
                "Suzuki"
            ];

            $scope.finishedWizard = function() {
                $scope.save();
            };

        }
    ]);