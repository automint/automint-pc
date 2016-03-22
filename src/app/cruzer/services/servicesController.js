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
                    var vehicleKeys = Object.keys(user.vehicles);
                    vehicleKeys.forEach(function(element) {
                        var vehicle = user.vehicles[element];
                        var registration = element;
                        var serviceKeys = Object.keys(vehicle.services);
                        serviceKeys.forEach(function(element) {
                            var service = vehicle.services[element];
                            var s = {
                                id: element,
                                mobile: user.mobile,
                                name: user.name,
                                reg: registration,
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
            var TAG = "serviceAddCtrl : "; // TAG for logging

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
                model: '',
                variant: '',
                color: ''
            }

            //  keep track of service details from UI
            $scope.service = {
                date: '',
                odo: 0,
                cost: 0,
                details: '',
                problems: []
            };

            //  generate uuid for unique keys
            var generateUUID = function() {
                var d = new Date().getTime();

                var uuId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
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

            //  manuallu insert a problem
            $scope.addProblemRow = function() {
                $scope.service.problems.push({
                    details: '',
                    rate: 0,
                    type: 'Part',
                    qty: 0
                });
            };

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
                        console.log(TAG + 'error inserting data to db');
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
                propService[generateUUID()] = objService;
                var objVehicle = {
                    manuf: $scope.vehicle.manuf,
                    model: $scope.vehicle.model,
                    variant: $scope.vehicle.variant,
                    color: $scope.vehicle.color,
                    services: propService
                };

                var propVehicle = {};
                propVehicle[$scope.vehicle.reg] = objVehicle;
                var u = {
                    mobile: $scope.user.mobile,
                    name: $scope.user.name,
                    email: $scope.user.email,
                    vehicles: propVehicle
                };

                // console.log('user');
                // console.log(u);

                //Check if user exists or not
                $pouchDBUser.get($scope.user.mobile).then(function(res) {
                    if (res.user) {
                        if (res.user.vehicles) {
                            var flagFoundVehicle = false;
                            var vehicle = res.user.vehicles[$scope.vehicle.reg];
                            if (vehicle) {
                                if (vehicle.services) {
                                    vehicle.services[generateUUID()] = objService;
                                } else {
                                    vehicle.services = propService;
                                }
                            } else {
                                res.user.vehicles[$scope.vehicle.reg] = objVehicle;
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
                        _id: $scope.service.mobile,
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
            var TAG = "serviceEditCtrl : "; // TAG for logging

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
                model: '',
                variant: '',
                color: ''
            }

            //  keep track of service details from UI
            $scope.service = {
                date: '',
                odo: 0,
                cost: 0,
                details: '',
                problems: []
            };

            //  insert a problem by default
            $scope.service.problems.push({
                details: '',
                rate: 0,
                type: 'Part',
                qty: 0
            });

            //  manuallu insert a problem
            $scope.addProblemRow = function() {
                $scope.service.problems.push({
                    details: '',
                    rate: 0,
                    type: 'Part',
                    qty: 0
                });
            };

            console.log($state.params.id);

            //  validate parameters
            if ($state.params.id == undefined || $state.params.mobile) {
                UIkit.notify("Something went wrong! Please Try Again!", {
                    status: 'danger',
                    timeout: 3000
                });
                $state.go('restricted.services.all');
            }

            $pouchDBUser.get($scope.user.mobile).then(function(res) {
                if (res.user) {
                    if (res.user.vehicles) {
                        var keysVehicles = Object.keys(function (element) {
                            
                        })
                    }
                }
            }, function(err) {
                console.log('error in getting while edit');
                console.log(err);
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
                        console.log(TAG + 'error inserting data to db');
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
                propService[generateUUID()] = objService;
                var objVehicle = {
                    manuf: $scope.vehicle.manuf,
                    model: $scope.vehicle.model,
                    variant: $scope.vehicle.variant,
                    color: $scope.vehicle.color,
                    services: propService
                };

                var propVehicle = {};
                propVehicle[$scope.vehicle.reg] = objVehicle;
                var u = {
                    mobile: $scope.user.mobile,
                    name: $scope.user.name,
                    email: $scope.user.email,
                    vehicles: propVehicle
                };

                // console.log('user');
                // console.log(u);

                //Check if user exists or not
                $pouchDBUser.get($scope.user.mobile).then(function(res) {
                    if (res.user) {
                        if (res.user.vehicles) {
                            var flagFoundVehicle = false;
                            var vehicle = res.user.vehicles[$scope.vehicle.reg];
                            if (vehicle) {
                                if (vehicle.services) {
                                    vehicle.services[generateUUID()] = objService;
                                } else {
                                    vehicle.services = propService;
                                }
                            } else {
                                res.user.vehicles[$scope.vehicle.reg] = objVehicle;
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
                        _id: $scope.service.mobile,
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

            $scope.finishedWizard = function() {
                $scope.save();
            };

        }
    ]);