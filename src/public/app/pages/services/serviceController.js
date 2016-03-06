angular
    .module('altairApp')
    .controller('serviceListCtrl', [
        '$state', '$compile', '$scope', '$timeout', '$resource', 'DTOptionsBuilder', 'DTColumnDefBuilder', 'requestsHandler',
        function ($state, $compile, $scope, $timeout, $resource, DTOptionsBuilder, DTColumnDefBuilder, requestsHandler) {
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

            //Get Data from DB
            requestsHandler.service.getAll().then(function (data) {
                vm.services = data;
                for (var i = 0; i < vm.services.length; i++) {
                    var dateObj = new Date(vm.services[i].date);
                    vm.services[i].date = dateObj.getDate() + "-" + (parseInt(dateObj.getMonth()) + 1) + "-" + dateObj.getFullYear();
                }
            }, function (e) {

            });



        }
])
    .controller('serviceAddEditCtrl', [
        '$stateParams', '$scope', 'apiCall', 'requestsHandler', 'indexDBHandler', '$state',
        function ($stateParams, $scope, apiCall, requestsHandler, indexDBHandler, $state) {

            var db = indexDBHandler.getDB();

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
            $scope.modelPre = {};
            $scope.manufList = [];
            $scope.service.date = new Date();
            $scope.service.problems.push(problemBlankModel);

            var store = db.transaction(indexDBHandler.stores.manufacturer, 'readwrite').objectStore(indexDBHandler.stores.manufacturer);
            var rquest = store.getAll().onsuccess = function (e) {
                $scope.manufList = e.target.result;
                //$scope.$apply();
            };

            if (!$stateParams.addMode && $stateParams.id !== undefined) {
                $scope.okButtonLable = "UPDATE SERVICE";
                $("#vmanuf").hide();
                $("#vmodel").hide();
                $("#manuModelColumn").hide();
                requestsHandler.service.get($stateParams.id).then(function (data) {
                    debugger;
                    $scope.service = data;
                    $scope.service.date = new Date($scope.service.date);
                    $scope.manufecPre = {
                        id: $scope.service.manu_id,
                        name: $scope.service.manu
                    };
                    $scope.modelPre = {
                        id: $scope.service.model_id,
                        name: $scope.service.model
                    };
                }, function (e) {
                    console.log(e);
                });
            }

            //Get user detail based on mobile number
            $scope.getUserDetails = function () {
                debugger;
                if ($scope.service.mobile !== "") {
                    var store = db.transaction(indexDBHandler.stores.user, 'readwrite').objectStore(indexDBHandler.stores.user);
                    store.index('mobile').get(IDBKeyRange.only($scope.service.mobile)).onsuccess = function (e) {
                        if (!e.target.result) {
                            return; //No record
                        }
                        $scope.service.firstname = e.target.result.firstname;
                        $scope.service.lastname = e.target.result.lastname;
                        $scope.service.email = e.target.result.email;
                        $scope.service.luid = e.target.result.id;
                        $("#vreg").focus();
                    };
                }
            };

            var store = db.transaction(indexDBHandler.stores.manufacturer, 'readwrite').objectStore(indexDBHandler.stores.manufacturer);
            var rquest = store.getAll().onsuccess = function (e) {
                $scope.manufList = e.target.result;
            };

            $scope.getModel = function () {
                var store = db.transaction(indexDBHandler.stores.model, 'readwrite').objectStore(indexDBHandler.stores.model);
                store.index('mname').getAll(IDBKeyRange.only($scope.manufecPre.name)).onsuccess = function (e) {
                    $scope.modelList = e.target.result;
                };
            };
            $scope.setModel = function () {
                $scope.service.model_id = $scope.modelPre.id;
                $scope.service.manu_id = $scope.manufecPre.id;
                $scope.service.manu = $scope.manufecPre.name;
                $scope.service.model = $scope.modelPre.name;
            };

            $scope.addProblemBlankRow = function ($e) {
                $scope.service.problems.push({
                    details: "",
                    rate: 0,
                    type: 0,
                    qty: 0
                });
                return false;
            };

            $scope.saveData = function ($e) {
                //Mobile Required validation
                if ($scope.service.mobile.trim() === "") {
                    UIkit.notify("Mobile number is required", {
                        status: 'warning',
                        timeout: 3000
                    });
                    return false;
                }
                //Reg Required validation
                if ($scope.service.reg.trim() === "") {
                    UIkit.notify("Vehicle Number is required", {
                        status: 'warning',
                        timeout: 3000
                    });
                    return false;
                }
                debugger;
                var serviceData = $.extend(true, {}, $scope.service);
                serviceData.date = $scope.service.date.getFullYear() + "-" + $scope.service.date.getMonth() + "-" + $scope.service.date.getDate();
                if (!$stateParams.addMode && $stateParams.id !== undefined) {
                    requestsHandler.service.update($scope.service).then(function () {
                        debugger;
                        UIkit.notify("Service has been updated successfully.", {
                            status: 'success',
                            timeout: 3000
                        });
                        $state.go('restricted.services');
                    }, function () {

                    });
                } else {
                    requestsHandler.service.add($scope.service).then(function () {
                        debugger;
                        UIkit.notify("New Service Added.", {
                            status: 'success',
                            timeout: 3000
                        });
                        $state.go('restricted.services');
                    }, function () {

                    });
                }

            };
            }]);