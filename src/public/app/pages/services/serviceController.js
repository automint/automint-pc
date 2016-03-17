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
                $state.go('restricted.servicesadd', {
                    addMode: false,
                    id: service.id
                });
            };

            vm.editService = function (event, id) {
                debugger;
            }
            debugger;
            //Get Data from DB
            $pouchDBUser.getAll().then(function (res) {
                var services = [];
                debugger;
                for (var i = 0; i < res.rows.length; i++) {
                    var user = res.rows[i].doc.user;
                    for (var j = 0; j < user.vehicles.length; j++) {
                        var vehicle = user.vehicles[j];
                        for (var k = 0; k < vehicle.services.length; k++) {
                            var service = vehicle.services[k];
                            var s = {
                                id: res.rows[i].id,
                                mobile: user.mobile,
                                firstname: user.firstname,
                                lastname: user.lastname,
                                email: user.email,
                                reg: vehicle.reg,
                                manu: "",
                                model: "",
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

            $scope.service.date = new Date();
            $scope.service.problems.push(problemBlankModel);
            debugger;

            $pouchDBDefault.get('manuf').then(function (res) {
                $scope.manufList = res.list;
                $scope.setModel = function () {
                    debugger;
                    $scope.modelList = $scope.manufec.models;
                }
            }, function (err) {

            });

            $scope.save = function () {
                var doc = {
                    _id: $scope.service.mobile,
                    user: {
                        mobile: $scope.service.mobile,
                        firstname: $scope.service.firstname,
                        lastname: $scope.service.lastname,
                        email: $scope.service.email,
                        vehicles: [{
                            reg: $scope.service.reg,
                            manu: $scope.service.manu,
                            model: $scope.service.model,
                            services: [{
                                date: $scope.service.date,
                                odo: $scope.service.odo,
                                cost: $scope.service.cost,
                                details: $scope.service.details,
                                problems: $scope.service.problems
                            }]
                        }]
                    }
                }

                debugger;
                $pouchDBUser.save(doc).then(function (res) {
                    debugger;
                }, function (err) {
                    debugger;
                });
            }

        }
]);