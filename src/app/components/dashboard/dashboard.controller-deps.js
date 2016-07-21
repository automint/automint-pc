/**
 * Controller for dashboard sub-views
 * @author ndkcha
 * @since 0.6.4
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    const ammPreferences = require('./automint_modules/am-preferences.js');

    angular.module('automintApp')
        .controller('amCtrlDashDuPy', DuePaymentsController)
        .controller('amCtrlDashNwCu', NewCustomerController)
        .controller('amCtrlDashTmFl', TimeFilterController)
        .controller('amCtrlDashNxDu', NextDueServicesController);

    DuePaymentsController.$inject = ['$state', '$mdDialog', 'unbilledServices'];
    NewCustomerController.$inject = ['$mdDialog', 'newCustomers'];
    TimeFilterController.$inject = ['$mdDialog', '$filter', 'filterRange', 'currentTimeSet'];
    NextDueServicesController.$inject = ['$state', '$mdDialog', 'amDashboard', 'dueCustomers', 'nsdcTimeRange', 'nsdcTime'];
    
    function DuePaymentsController($state, $mdDialog, unbilledServices) {
        //  initialize view model
        var vm = this;
        
        //  named assignments to keep track of UI
        vm.query = {
            limit: 20,
            page: 1,
            total: unbilledServices.length
        };
        //  function mappings
        vm.getServiceDate = getServiceDate;
        vm.services = unbilledServices;
        vm.editService = editService;
        vm.closeDialog = closeDialog;
        
        //  default execution steps
        vm.services.sort(sortFunction);
        
        //  function definitions
        
        function sortFunction(lhs, rhs) {
            return (rhs.srvc_date.localeCompare(lhs.srvc_date));
        }
        
        function getServiceDate(date) {
            return moment(date).format('DD MMM YYYY');
        }
        
        //  close dialog box
        function closeDialog() {
            $mdDialog.hide();
        }
        
        //  edit service
        function editService(service) {
            $mdDialog.hide();
            $state.go('restricted.services.edit', {
                serviceId: service.srvc_id,
                vehicleId: service.vhcl_id,
                userId: service.cstmr_id,
                fromState: 'dashboard.duepayments'
            });
        }
    }
    
    function NewCustomerController($mdDialog, newCustomers) {
        //  initialize view model
        var vm = this;
        
        //  named assignments to keep track of UI
        vm.query = {
            limit: 20,
            page: 1,
            total: newCustomers.length
        };
        //  function mappings
        vm.customers = newCustomers;
        vm.closeDialog = closeDialog;
        
        //  function definitions
        
        //  close dialog box
        function closeDialog() {
            $mdDialog.hide();
        }
    }

    function TimeFilterController($mdDialog, $filter, filterRange, currentTimeSet) {
        var vm = this;

        vm.currentYearIndex = 0;
        vm.yearRange = [];
        vm.selectedDateSet = $.extend([], currentTimeSet);
        
        //  default execution steps
        populateYearRange();

        //  function mappings
        vm.IsNextYear = IsNextYear;
        vm.IsPreviousYear = IsPreviousYear;
        vm.changeToNextYear = changeToNextYear;
        vm.changeToPreviousYear = changeToPreviousYear;
        vm.selectDateSet = selectDateSet;
        vm.IsDateSetSelected = IsDateSetSelected;
        vm.IsDateSetDisabled = IsDateSetDisabled;
        vm.confirm = confirm;

        //  function definitions

        function confirm() {
            if (vm.selectedDateSet.length < 1)
                vm.selectedDateSet = currentTimeSet;
            $mdDialog.hide(vm.selectedDateSet);
        }

        function IsDateSetDisabled(month) {
            var temp_m = moment(month, 'M').format('MMM');
            var found =  $filter('filter')(filterRange, {
                year: vm.yearRange[vm.currentYearIndex],
                month: temp_m
            }, true);

            return (found.length == 0);
        }

        function IsDateSetSelected(month) {
            var temp_m = moment(month, 'M').format('MMM');
            var found =  $filter('filter')(vm.selectedDateSet, {
                year: vm.yearRange[vm.currentYearIndex],
                month: temp_m
            }, true);

            return (found.length == 1);
        }

        function selectDateSet(month) {
            var temp_m = moment(month, 'M').format('MMM');
            var found =  $filter('filter')(vm.selectedDateSet, {
                year: vm.yearRange[vm.currentYearIndex],
                month: temp_m
            }, true);

            if (found.length == 0) {
                vm.selectedDateSet.push({
                    year: vm.yearRange[vm.currentYearIndex],
                    month: temp_m
                });
            } else {
                var i = vm.selectedDateSet.indexOf(found[0]);
                vm.selectedDateSet.splice(i, 1);
            }
        }

        function changeToNextYear() {
            vm.currentYearIndex--;
        }

        function changeToPreviousYear() {
            vm.currentYearIndex++;
        }

        function IsNextYear() {
            return (vm.currentYearIndex != 0);
        }

        function IsPreviousYear() {
            return (vm.currentYearIndex != (vm.yearRange.length - 1));
        }

        function populateYearRange() {
            filterRange.forEach(iterateYearRange);

            function iterateYearRange(item) {
                var found = $filter('filter')(vm.yearRange, item.year, true);

                if (found == 0)
                    vm.yearRange.push(item.year);
            }
        }
    }

    function NextDueServicesController($state, $mdDialog, amDashboard, dueCustomers, nsdcTimeRange, nsdcTime) {
        //  initialize view model
        var vm = this;
        
        //  named assignments to keep track of UI
        vm.query = {
            limit: 20,
            page: 1,
            total: dueCustomers.length
        };
        vm.nsdcTime = nsdcTime;
        vm.nsdcTimeRange = nsdcTimeRange

        //  function mappings
        vm.closeDialog = closeDialog;
        vm.getDate = getDate;
        vm.openNxtDueTimer = openNxtDueTimer;
        vm.changeNsdcTimeRange = changeNsdcTimeRange;
        vm.editCustomer = editCustomer;
        vm.deleteServiceReminder = deleteServiceReminder;
        vm.changeDate = changeDate;

        //  default execution steps
        manageCustomers(dueCustomers);
        
        //  function definitions

        function changeDate(customer) {
            amDashboard.changeServiceReminderDate(customer.cstmr_id, customer.vhcl_id, moment(customer.vhcl_nextdue).format()).then(success).catch(failure);

            function success(res) {
                setTimeout(changeNsdcTimeRange, 300);
            }

            function failure(err) {
                console.warn(err);
            }
        }

        function manageCustomers(holder) {
            holder.forEach(iterateCustomers);
            vm.customers = holder;

            function iterateCustomers(customer) {
                customer.vhcl_nextdue = new Date(moment(customer.vhcl_nextdue).format("YYYY"), moment(customer.vhcl_nextdue).format("MM") - 1, moment(customer.vhcl_nextdue).format("DD"));
            }
        }

        function deleteServiceReminder(cId, vId) {
            amDashboard.deleteServiceReminder(cId, vId).then(success).catch(failure);

            function success(res) {
                setTimeout(changeNsdcTimeRange, 300);
            }

            function failure(err) {
                console.warn(err);
            }
        }

        function editCustomer(cId) {
            $state.go('restricted.customers.edit', {
                id: cId,
                fromState: 'dashboard.nextdueservices'
            });
            $mdDialog.hide();
        }

        function generateNdcData(res) {
            manageCustomers(res);
        }

        function changeNsdcTimeRange(time) {
            if (time != undefined) {
                vm.nsdcTime = time;
                ammPreferences.storePreference('dashboard.serviceReminders', vm.nsdcTime);
            }
            amDashboard.getNextDueCustomers(vm.nsdcTime).then(generateNdcData).catch(failure);

            function failure(err) {
                console.warn(err);
            }
        }

        function openNxtDueTimer($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        }

        function getDate(date) {
            return moment(date).format('DD MMM YYYY');
        }
        
        //  close dialog box
        function closeDialog() {
            $mdDialog.hide();
        }
    }
})();