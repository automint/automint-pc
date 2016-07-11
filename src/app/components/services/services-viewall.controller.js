/**
 * Controller for View Services module
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.4
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    const ammPreferences = require('./automint_modules/am-preferences.js');

    angular.module('automintApp').controller('amCtrlSeRA', ServiceViewAllController);

    ServiceViewAllController.$inject = ['$scope', '$state', '$filter', '$timeout', '$mdDialog', 'utils', 'amServices'];

    function ServiceViewAllController($scope, $state, $filter, $timeout, $mdDialog, utils, amServices) {
        //  initialize view model
        var vm = this, queryChangedPromise, cacheLoadTimeout = false, isDataLoaded = false, isPreferencesLoaded = false;

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
        //  month indexes will start from zero
        vm.displayDataOptions = [{
            name: 'This Month',
            month: 0,
            year: 0
        }, {
            name: 'Last 2 Months',
            month: 1,
            year: 0
        }, {
            name: 'Last 6 Months',
            month: 5,
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
        vm.sortColumns = '';
        vm.serviceStateList = ['Job Card', 'Estimate', 'Bill'];

        //  function maps
        vm.addService = addService;
        vm.getServices = getServices;
        vm.editService = editService;
        vm.deleteService = deleteService;
        vm.changeQueryMode = changeQueryMode;
        vm.goToInvoice = goToInvoice;
        vm.getServiceDate = getServiceDate;
        vm.sortByColumns = sortByColumns;
        vm.changeDisplayFilter = changeDisplayFilter;
        vm.IsServiceDue = IsServiceDue;
        vm.IsServiceStateJc = IsServiceStateJc;
        vm.IsServiceStateEs = IsServiceStateEs;
        vm.IsServiceStateIv = IsServiceStateIv;

        //  default execution steps
        $scope.$watch('vm.serviceQuery', watchServiceQuery);
        processPreferences();

        //  function definitions

         function IsServiceStateIv(state) {
            return (state == vm.serviceStateList[2]);
        }

        function IsServiceStateEs(state) {
            return (state == vm.serviceStateList[1]);
        }

        function IsServiceStateJc(state) {
            return (state == vm.serviceStateList[0]);
        }

        function IsServiceDue(status) {
            return (status == 'Due');
        }

        function changeDisplayFilter(isAssignVarOnly) {
            var found = $filter('filter')(vm.displayDataOptions, {
                name: vm.displayDataFor
            }, true);
            if (found.length == 1) {
                vm.filter.month = found[0].month;
                vm.filter.year = found[0].year;
                if (isAssignVarOnly)
                    return;
                ammPreferences.storePreference('viewServices.displayFilter', found[0].name);
                getServices();
            }
        }

        function sortByColumns(isBlockSave) {
            if (vm.sortColumns == '' || vm.sortColumns == undefined)
                return;
            switch (vm.sortColumns) {
                case "date":
                    vm.services.sort(sortAColumnByDate);
                    break;
                case "-date":
                    vm.services.sort(sortDColumnByDate);
                    break;
                case "customerName":
                    vm.services.sort(sortAColumnByCustomerName);
                    break;
                case "-customerName":
                    vm.services.sort(sortDColumnByCustomerName);
                    break;
                case "vehicle":
                    vm.services.sort(sortAColumnByVehicle);
                    break;
                case "-vehicle":
                    vm.services.sort(sortDColumnByVehicle);
                    break;
                case "amount":
                    vm.services.sort(sortAColumnByAmount);
                    break;
                case "-amount":
                    vm.services.sort(sortDColumnByAmount);
                    break;
                case "payment":
                    vm.services.sort(sortAColumnByPayment);
                    break;
                case "-payment":
                    vm.services.sort(sortDColumnByPayment);
                    break;
            }

            if (isPreferencesLoaded && !((typeof(isBlockSave) === "boolean") && isBlockSave))
                ammPreferences.storePreference('viewServices.sort', vm.sortColumns.replace('-', '') + '.' + ((vm.sortColumns.indexOf('-') == 0) ? 'descending' : 'ascending'));
        }

        function sortAColumnByPayment(lhs, rhs) {
            return lhs.srvc_status.localeCompare(rhs.srvc_status);
        }

        function sortDColumnByPayment(lhs, rhs) {
            return rhs.srvc_status.localeCompare(lhs.srvc_status);
        }

        function sortAColumnByAmount(lhs, rhs) {
            return (parseFloat(lhs.srvc_cost) - parseFloat(rhs.srvc_cost));
        }

        function sortDColumnByAmount(lhs, rhs) {
            return (parseFloat(rhs.srvc_cost) - parseFloat(lhs.srvc_cost));
        }

        function sortAColumnByVehicle(lhs, rhs) {
            var lhsv = ((lhs.vhcl_manuf) ? lhs.vhcl_manuf : '') + ' ' + ((lhs.vhcl_model) ? lhs.vhcl_model : '') + ' ' + ((lhs.vhcl_reg) ? lhs.vhcl_reg : '');
            var rhsv = ((rhs.vhcl_manuf) ? rhs.vhcl_manuf : '') + ' ' + ((rhs.vhcl_model) ? rhs.vhcl_model : '') + ' ' + ((rhs.vhcl_reg) ? rhs.vhcl_reg : '');
            return lhsv.localeCompare(rhsv);
        }

        function sortDColumnByVehicle(lhs, rhs) {
            var lhsv = ((lhs.vhcl_manuf) ? lhs.vhcl_manuf : '') + ' ' + ((lhs.vhcl_model) ? lhs.vhcl_model : '') + ' ' + ((lhs.vhcl_reg) ? lhs.vhcl_reg : '');
            var rhsv = ((rhs.vhcl_manuf) ? rhs.vhcl_manuf : '') + ' ' + ((rhs.vhcl_model) ? rhs.vhcl_model : '') + ' ' + ((rhs.vhcl_reg) ? rhs.vhcl_reg : '');
            return rhsv.localeCompare(lhsv);
        }

        function sortAColumnByCustomerName(lhs, rhs) {
            return lhs.cstmr_name.localeCompare(rhs.cstmr_name);
        }

        function sortDColumnByCustomerName(lhs, rhs) {
            return rhs.cstmr_name.localeCompare(lhs.cstmr_name);
        }

        function sortAColumnByDate(lhs, rhs) {
            return lhs.srvc_date.localeCompare(rhs.srvc_date);
        }

        function sortDColumnByDate(lhs, rhs) {
            return rhs.srvc_date.localeCompare(lhs.srvc_date);
        }

        function processPreferences() {
            ammPreferences.getAllPreferences('viewServices').then(success).catch(failure);

            function success(res) {
                var t = res['viewServices.sort'].split('.');
                vm.sortColumns = ((t[1] == 'descending') ? "-" : "") + t[0];
                if (res['viewServices.displayFilter'])
                    vm.displayDataFor = res['viewServices.displayFilter'];

                changeDisplayFilter(true);
                isPreferencesLoaded = true;
            }

            function failure(err) {
                isPreferencesLoaded = true;
                console.warn(err.message);
            }
        }
        
        function getServiceDate(date) {
            return moment(date).format('DD MMM YYYY');
        }
        
        function watchServiceQuery(newValue, oldValue) {
            if(queryChangedPromise){
                $timeout.cancel(queryChangedPromise);
            }
            queryChangedPromise = $timeout(getServices, 500);
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
            vm.promise = (isPreferencesLoaded) ? amServices.getServices(vm.filter.month, vm.filter.year, vm.serviceQuery).then(success).catch(failure) : undefined;

            function success(res) {
                isDataLoaded = true;
                vm.services = res;
                vm.query.total = res.length;
                sortByColumns(true);
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
                console.info('nope');
            }
            

            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast('Service has been deleted.');
                    setTimeout(getServices, 200);
                } else
                    failure();
            }

            function failure(err) {
                console.info(err);
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