(function() {
    angular.module('altairApp')
        .controller('servicesViewAllCtrl', ServiceViewAll);

    ServiceViewAll.$inject = ['$state', 'DTOptionsBuilder', 'ServiceFactory'];

    function ServiceViewAll($state, DTOptionsBuilder, ServiceFactory) {
        var vm = this;
        //  declarations and mappings
        vm.filterDatatable = filterDatatable;
        vm.addService = addService;
        vm.editService = editService;
        vm.deleteService = deleteService;
        //  datatable instance
        vm.dtInstance = {};
        //  datatable options
        vm.dtOptions = DTOptionsBuilder
            .newOptions()
            .withDisplayLength(10);
            
        //  array of date filters possible for datatable
        vm.possibleDateFilters = [
            '1 Month',
            '6 Months',
            '1 Year',
            'Everything'
        ];
        //  set default filter to first date filter
        vm.dateQuery = vm.possibleDateFilters[0];
        setDatatableValues(1, 0);

        //  filter datatable based on month and year
        //  param filterMonth- total months to be traversed (if query is for last 6 months, then 6 is to be passed)
        //  param filterYear- total years to be traversed (if query is for last 2 years, then 2 is to be passed)
        function setDatatableValues(filterMonth, filterYear) {
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

            ServiceFactory.filteredServices(queryDate, filterMonth, filterYear).then(function(res) {
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
            }, function(err) {
                vm.services = [];
            })
        };

        //  proccess according to different date filters
        function filterDatatable(index) {
            vm.dateQuery = vm.possibleDateFilters[index];
            switch (vm.dateQuery) {
                case vm.possibleDateFilters[0]:
                    setDatatableValues(1, 0);
                    break;
                case vm.possibleDateFilters[1]:
                    setDatatableValues(6, 0);
                    break;
                case vm.possibleDateFilters[2]:
                    setDatatableValues(0, 1);
                    break;
                case vm.possibleDateFilters[3]:
                    setDatatableValues(0, 0);
                    break;
            }
        }

        //  callback for edit service button
        function editService($e, service) {
            $state.go('restricted.services.edit', {
                serviceId: service.id,
                vehicleId: service.vehicleId,
                userId: service.userId
            });
        };

        //  callback for delete service button
        function deleteService($e, service) {
            ServiceFactory.deleteService(service.userId, service.vehicleId, service.id).then(function(res) {
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
        }

        //  callback for add service button
        function addService() {
            $state.go('restricted.services.add');
        };
    }
})();