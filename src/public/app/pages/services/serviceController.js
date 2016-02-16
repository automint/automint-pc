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
                debugger;
            }, function (e) {

            });



        }
])
    .controller('serviceAddEditCtrl', [
        '$scope',
        'apiCall',
        'manufectures',
        'indexDBHandler',
        function ($scope, apiCall, manufectures, indexDBHandler) {
            var problemBlankModel = {
                id: 0,
                details: "",
                lcost: 0,
                pcost: 0,
                qty: 0
            };
            $scope.service = {
                mobile: "",
                firstname: "",
                lastname: "",
                email: "",
                reg: "",
                manufec: "",
                model: "",
                date: "",
                odo: 0,
                cost: 0,
                details: "",
                problems: []
            };

            $scope.service.problems.push(problemBlankModel);
            $scope.service.date = new Date();


            /*  $scope.getUserAndVehicleDetails = function ($e) {
                debugger;
                var mobile = $scope.service.mobile;
                if (mobile.trim() === "") {
                    return;
                }
                apiCall.all("users/" + mobile + "/vehicles").success(function (data) {
                    if (data.errorCode && data.errorCode == 1) {
                        $scope.service.firstname = "";
                        $scope.service.lastname = "";
                        $scope.service.email = "";

                    } else {
                        $scope.service.firstname = data.firstname;
                        $scope.service.lastname = data.lastname;
                        $scope.service.email = data.email;
                        document.getElementById("vreg").focus();
                        $scope.userVehicle = data.vehicles;
                        var regList = [];
                        for (var i = 0; i < $scope.userVehicle.length; i++) {
                            regList.push($scope.userVehicle[i].reg);
                        }
                        $("#vreg").autocomplete({
                            source: regList
                        });
                    }
                });
            };
*/

            $scope.addProblemBlankRow = function ($e) {
                debugger;
                $scope.service.problems.push({
                    id: 0,
                    details: "",
                    lcost: 0,
                    pcost: 0,
                    qty: 0
                });
                return false;
            }

            $scope.saveData = function ($e) {
                debugger;




                var db = indexDBHandler.getDB();
                // Me Workshop
                var transaction = db.transaction(indexDBHandler.stores.services, 'readwrite');
                transaction.onerror = function (e) {
                    debugger;
                    console.log(e.target.error.message);
                    console.log("error transaction");
                };

                var serviceData = $scope.service;
                var serviceStore = transaction.objectStore(indexDBHandler.stores.services);

                var tranRequest = serviceStore.put(serviceData);
                tranRequest.onsuccess = function (e) {
                    console.log("New Service added");
                };
                tranRequest.onerror = function (e) {
                    console.log(e.target.error.message);
                };


                return false;
            };


        }]);