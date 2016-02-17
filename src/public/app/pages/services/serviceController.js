angular
    .module('altairApp')
    .controller('serviceListCtrl', [
        '$compile', '$scope', '$timeout', '$resource', 'DTOptionsBuilder', 'DTColumnDefBuilder', 'requestsHandler',
        function ($compile, $scope, $timeout, $resource, DTOptionsBuilder, DTColumnDefBuilder, requestsHandler) {
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
            /*var data = [];
            // JSON to Array
            for (var i = 0; i < services.length; i++) {
                var jsonArr = [];
                jsonArr.push(services[i])
                
            }
            // JSON to Array over
            */

            /* vm.dtColumn = [
                DTColumnBuilder.newColumn('customer').withLabel('customer').renderWith(function (data, type, full) {
                    return full.fname + ' ' + full.lname;
                }),
                DTColumnBuilder.newColumn('reg'),
            ]; */
            requestsHandler.service.getAll().then(function (data) {
                vm.services = data;
            }, function (e) {

            });



        }
])
    .controller('serviceAddEditCtrl', [
        '$scope', 'apiCall', 'requestsHandler', 'indexDBHandler', '$state',
        function ($scope, apiCall, requestsHandler, indexDBHandler, $state) {

            var db = indexDBHandler.getDB();

            var problemBlankModel = {
                id: 0,
                details: "",
                rate: 0,
                type: 0,
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

            $scope.service.problems.push(problemBlankModel);
            $scope.service.date = new Date();

            $scope.manufList = [];
            var store = db.transaction(indexDBHandler.stores.manufacturer, 'readwrite').objectStore(indexDBHandler.stores.manufacturer);
            var rquest = store.getAll().onsuccess = function (e) {
                $scope.manufList = e.target.result;
                //$scope.$apply();
            };

            $scope.getModel = function () {
                var store = db.transaction(indexDBHandler.stores.model, 'readwrite').objectStore(indexDBHandler.stores.model);
                store.index('mname').getAll(IDBKeyRange.only($scope.manufecPre.name)).onsuccess = function (e) {
                    $scope.modelList = e.target.result;
                };
            };
            $scope.setModel = function () {
                $scope.service.model_id = $scope.modelPre.id;
                $scope.service.manufec = $scope.manufecPre.name;
                $scope.service.model = $scope.modelPre.name;
            };

            $scope.addProblemBlankRow = function ($e) {
                $scope.service.problems.push({
                    id: 0,
                    details: "",
                    rate: 0,
                    type: 0,
                    qty: 0
                });
                return false;
            }

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

                requestsHandler.service.add($scope.service).then(function () {
                    debugger;
                    UIkit.notify("Service Added.", {
                        status: 'success',
                        timeout: 3000
                    });
                    $state.go('restricted.services')
                }, function () {

                });
                return false;
            };

        }
]);