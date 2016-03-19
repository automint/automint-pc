angular
    .module('altairApp')
    .controller('serviceListCtrl', [
        '$state', '$compile', '$scope', '$timeout', '$resource', 'DTOptionsBuilder', 'DTColumnDefBuilder', '$pouchDBUser',
        function ($state, $compile, $scope, $timeout, $resource, DTOptionsBuilder, DTColumnDefBuilder, $pouchDBUser) {
            var vm = this;
            //$scope.services = services;
            vm.dt_data = [];
            vm.dtOptions = DTOptionsBuilder
                .newOptions()
                .withDisplayLength(10)
                .withOption('initComplete', function () {
                    $timeout(function () {
                        $compile($('.dt-uikit .md-input'))($scope);
                    })
                });
            vm.dtColumnDefs = [
                DTColumnDefBuilder.newColumnDef(0),
                DTColumnDefBuilder.newColumnDef(1),
                DTColumnDefBuilder.newColumnDef(2),
                DTColumnDefBuilder.newColumnDef(3),
                DTColumnDefBuilder.newColumnDef(4),
                DTColumnDefBuilder.newColumnDef(5)
            ];

            //event
            $scope.editService = function ($e, service) {
                debugger;
                $state.go('restricted.services.add', {
                    editMode: false,
                    id: service.id,
                    sid: service.sid
                });
            };


            //Get Data from DB
            $pouchDBUser.getAll().then(function (res) {
                var services = [];
                for (var i = 0; i < res.rows.length; i++) {
                    var user = res.rows[i].doc.user;
                    for (var j = 0; j < user.vehicles.length; j++) {
                        var vehicle = user.vehicles[j];
                        for (var k = 0; k < vehicle.services.length; k++) {
                            var service = vehicle.services[k];
                            var s = {
                                id: res.rows[i].id,
                                sid: service.id,
                                mobile: user.mobile,
                                firstname: user.firstname,
                                lastname: user.lastname,
                                email: user.email,
                                reg: vehicle.reg,
                                manu: vehicle.manufec.name,
                                model: vehicle.model.name,
                                date: service.date,
                                odo: service.odo,
                                cost: service.cost,
                                details: service.details,
                            };
                            services.push(s);
                        }
                    }
                }
                vm.services = services;
                $scope.$apply();

            }, function (err) {
                debugger
            });

        }
])
    .controller('serviceAddEditCtrl', ['$stateParams', '$scope', '$state', '$pouchDBUser', '$pouchDBDefault',
        function ($stateParams, $scope, $state, $pouchDBUser, $pouchDBDefault) {
            $scope.service = {};

            //UI Habdle
            $scope.okButtonLable = "ADD SERVICE";

            var problemBlankModel = {
                details: "",
                rate: 0,
                type: "",
                qty: 0
            };
            $scope.service = {
                mobile: "",
                firstname: "",
                lastname: "",
                email: "",
                reg: "",
                manu: "",
                model: "",
                date: "",
                odo: 0,
                cost: 0,
                details: "",
                model_id: "",
                problems: []
            };
            
            $scope.serviceId = undefined;
            $scope.problemExisting = false;

            if (!$state.params.editMode) {
                $scope.okButtonLable = "UPDATE SERVICE";
                $pouchDBUser.getAll().then(function (res) {
                    for (var i = 0; i < res.rows.length; i++) {
                        var user = res.rows[i].doc.user;
                        for (var j = 0; j < user.vehicles.length; j++) {
                            var vehicle = user.vehicles[j];
                            for (var k = 0; k < vehicle.services.length; k++) {
                                var serv = vehicle.services[k];
                                if (serv.id == $state.params.sid) {
                                    console.log('edit service : match found');
                                    $scope.serviceId = serv.id;
                                    $scope.service.mobile = user.mobile;
                                    $scope.service.firstname = user.firstname;
                                    $scope.service.lastname = user.lastname;
                                    $scope.service.email = user.email;
                                    $scope.service.reg = vehicle.reg;
                                    $scope.service.manu = vehicle.manufec.name;
                                    $scope.service.model = vehicle.model.name;
                                    var serDate = serv.date.split("-");
                                    console.log(serDate);
                                    console.log((parseInt(serDate[2]) + " " + parseInt(serDate[1]) + " " + parseInt(serDate[0])))
                                    $scope.service.date = new Date(parseInt(serDate[2]), parseInt(serDate[1])-1, parseInt(serDate[0]));
                                    $scope.service.odo = serv.odo;
                                    $scope.service.cost = serv.cost;
                                    $scope.service.details = serv.details;
                                    for (var nop = 0; nop < serv.problems.length; nop++) {
                                        var prob = serv.problems[nop];
                                        console.log(prob);
                                        $scope.service.problems.push({
                                            details: prob.details,
                                            rate: prob.rate,
                                            type: prob.type,
                                            qty: prob.qty
                                        });
                                        $scope.problemExisting = true;
                                    }
                                    j = user.vehicles.length;       // break out of vehicles loop
                                    i = res.rows.length;            // break out of users loop
                                    break;
                                }
                            }
                        }
                    }
                    $scope.$apply();
                }, function (err) {
                    debugger
                });
            }
            
            $scope.addProblemBlankRow = function () {
                $scope.service.problems.push(problemBlankModel);
            };

            $scope.service.date = new Date();

            $pouchDBDefault.get('manuf').then(function (res) {
                $scope.manufList = res.list;
                $scope.setModel = function () {
                    $scope.modelList = $scope.service.manufec.models;
                }
            }, function (err) {

            });

            //Auto feel user details
            $scope.getUserDetails = function () {
                $pouchDBUser.get($scope.service.mobile).then(function (res) {
                    if (res.user) {
                        $scope.service.firstname = res.user.firstname;
                        $scope.service.lastname = res.user.lastname;
                        $scope.service.email = res.user.email;
                        $scope.$apply();
                        $("#vreg").focus();
                    }
                }, function (err) {
                    console.log("User not found");
                });
            };
            //AUto feel vehicle details
            $scope.getVehicleDetails = function () {
                $pouchDBUser.get($scope.service.mobile).then(function (res) {
                    if (res.user && res.user.vehicles) {
                        var flagVehicle = false;
                        for (var i = 0; i < res.user.vehicles.length; i++) {
                            if (res.user.vehicles[i].reg === $scope.service.reg) {
                                var v = res.user.vehicles[i];
                                $scope.service.manufec = {
                                    id: v.manufec.id
                                };
                                for (var j = 0; j < $scope.manufList.length; j++) { // For Model get model details and set
                                    if ($scope.manufList[j].id === v.manufec.id) {
                                        $scope.modelList = $scope.manufList[j].models;
                                        break;
                                    }

                                }
                                $scope.service.model = {
                                    id: v.model.id
                                };
                                $scope.$apply();
                                flagVehicle = true;
                                $("#sodo").focus();
                                break;
                            }
                        }
                        if (!flagVehicle) {
                            $scope.service.manufec = {
                                id: undefined
                            }
                            $scope.service.model = {
                                id: undefined
                            };
                        }
                    }
                }, function (err) {
                    console.log("User not found");
                });
            };

            $scope.save = function () {
                var saveDataInDB = function (document) {
                    debugger;
                    $pouchDBUser.save(document).then(function (res) {
                        debugger;
                        UIkit.notify("Service has been added.", {
                            status: 'info',
                            timeout: 3000
                        });
                        $state.go("restricted.services.all");
                    }, function (err) {
                        debugger;
                    });
                }

                //Make Doc
                var sdate = $scope.service.date;
                var s = {
                    id: ($scope.serviceId == undefined) ? (Math.floor(100 + Math.random() * 900000)) : $scope.serviceId, //This temp hack
                    date: (sdate.getDate() + "-" + (sdate.getMonth() + 1) + "-" + sdate.getFullYear()),
                    odo: $scope.service.odo,
                    cost: $scope.service.cost,
                    details: $scope.service.details,
                    problems: $scope.service.problems
                };
                var manu = $.extend({}, $scope.service.manufec);
                delete manu.models;
                var v = {
                    reg: $scope.service.reg,
                    manufec: manu,
                    model: $scope.service.model,
                    services: [s]
                };
                var u = {
                    mobile: $scope.service.mobile,
                    firstname: $scope.service.firstname,
                    lastname: $scope.service.lastname,
                    email: $scope.service.email,
                    vehicles: [v]
                };

                //Check if user exists or not
                $pouchDBUser.get($scope.service.mobile).then(function (res) {
                    debugger;
                    if (res.user) {
                        if (res.user.vehicles) { // vehicle objec found
                            var flagFoundVehicle = false;
                            var flagFoundService = false;
                            for (var i = 0; i < res.user.vehicles.length; i++) {
                                if (res.user.vehicles[i].reg === $scope.service.reg) { // vehicle found
                                    for (var j = 0; j < res.user.vehicles[i].services.length; j++) {
                                        if (res.user.vehicles[i].services[j].id == $scope.serviceId) {
                                            flagFoundService = true;
                                            res.user.vehicles[i].services[j] = s;
                                            break;
                                        }
                                    }
                                    if (!flagFoundService) {
                                        res.user.vehicles[i].services.push(s); //Add/push only service in found vehicle
                                    }
                                    flagFoundVehicle = true;
                                    break;
                                }
                            }
                            if (!flagFoundVehicle) { //vehicle not found
                                res.user.vehicles.push(v); // add new vehicle with service
                            }
                        } else {
                            res.user.vehicles = [v];
                        }
                    } else {
                        console.log("Id found but user object not found on save service");
                        res.user = u;
                    }
                    saveDataInDB(res);
                }, function (err) { //If user not found add new complete document user/vehicle/service
                    debugger;
                    var doc = {
                        _id: $scope.service.mobile,
                        user: u
                    };
                    saveDataInDB(doc); // save complete document on error of fatch user document
                });
            }
        }
]);