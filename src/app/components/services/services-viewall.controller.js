/**
 * Controller for View Services module
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.1
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlSeRA', ServiceViewAllController);

    ServiceViewAllController.$inject = ['$scope', '$state', '$filter', '$timeout', '$mdDialog', 'utils', 'amServices'];

    function ServiceViewAllController($scope, $state, $filter, $timeout, $mdDialog, utils, amServices) {
        //  initialize view model
        var vm = this, queryChangedPromise, cacheLoadTimeout = false;

        //  named assginments for tracking UI elements
        vm.query = {
            limit: 10,
            page: 1,
            total: 0
        };
        vm.filter = {
            month: 0,
            year: 0
        }
        vm.services = [];
        vm.displayDataOptions = [{
            name: 'This Month',
            month: 0,
            year: 0
        }, {
            name: 'Last 6 Months',
            month: 6,
            year: 0
        }, {
            name: 'Last Year',
            month: 0,
            year: 1
        }, {
            name: 'Everything',
            month: -1,
            year: -1
        }];
        vm.displayDataFor = vm.displayDataOptions[0].name;
        vm.serviceQuery = '';
        vm.isQueryMode = false;
        vm.displayItemPage = 1;

        //  function maps
        vm.addService = addService;
        vm.getServices = getServices;
        vm.editService = editService;
        vm.deleteService = deleteService;
        vm.changeQueryMode = changeQueryMode;
        vm.goToInvoice = goToInvoice;
        vm.getServiceDate = getServiceDate;

        //  default execution steps
        $scope.$watch('vm.displayDataFor', watchDisplayDataFor);
        $scope.$watch('vm.serviceQuery', watchServiceQuery);

        //  function definitions
        
        function getServiceDate(date) {
            return moment(date).format('DD MMM YYYY');
        }
        
        function watchServiceQuery(newValue, oldValue) {
            if(queryChangedPromise){
                $timeout.cancel(queryChangedPromise);
            }
            queryChangedPromise = $timeout(getServices, 500);
        }
        
        //  listen to changes in display data settings
        function watchDisplayDataFor(newValue, oldValue) {
            var found = $filter('filter')(vm.displayDataOptions, {
                name: newValue
            });
            if (found.length == 1) {
                vm.filter.month = found[0].month;
                vm.filter.year = found[0].year;
                getServices();
            }
        }
        
        //  toggle boolean to indicate searching operation
        function changeQueryMode(bool) {
            vm.isQueryMode = bool;
            if (vm.isQueryMode)
                setTimeout(focusOnSearchbox, 300);
            else {
                vm.serviceQuery = '';
                getServices();
            }
                
            function focusOnSearchbox() {
                $('#am-query-search').focus();
            }
        }
        
        //  fill datatable with list of services
        function getServices() {
            vm.showPaginationBar = (vm.serviceQuery == '');
            vm.promise = amServices.getServices(vm.filter.month, vm.filter.year, vm.serviceQuery).then(success).catch(failure);

            function success(res) {
                vm.services = res;
                vm.query.total = res.length;
            }

            function failure(err) {
                if (cacheLoadTimeout == false) {
                    cacheLoadTimeout = true;
                    getServices();
                }
                vm.services = [];
                vm.query.total = 0;
            }
        }

        //  go to add service state
        function addService() {
            $state.go('restricted.services.add');
        }

        //  edit service
        function editService(service) {
            $state.go('restricted.services.edit', {
                serviceId: service.srvc_id,
                vehicleId: service.vhcl_id,
                userId: service.cstmr_id
            });
        }

        //  delete service from UI
        function deleteService(service, ev) {
            var confirm = $mdDialog.confirm()
                .textContent('Are you sure you want to delete the service ?')
                .ariaLabel('Delete Customer')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');

            $mdDialog.show(confirm).then(performDelete, ignoreDelete);

            function performDelete() {
                amServices.deleteService(service.cstmr_id, service.vhcl_id, service.srvc_id).then(success).catch(failure);
            }

            function ignoreDelete() {
                console.log('nope');
            }
            

            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast('Service has been deleted.');
                    setTimeout(getServices, 200);
                } else
                    failure();
            }

            function failure(err) {
                console.log(err);
                utils.showSimpleToast('Service can not be deleted at moment. Please Try Again!');
            }
        }
        
        //  transit to state to view selected invoice
        function goToInvoice(service) {
            $state.go('restricted.invoices.view', {
                userId: service.cstmr_id,
                vehicleId: service.vhcl_id,
                serviceId: service.srvc_id
            });
        }
    }
})();