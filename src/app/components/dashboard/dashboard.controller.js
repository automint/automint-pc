/**
 * Controller for dashboard view
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    const ammPreferences = require('./automint_modules/am-preferences.js');

    angular.module('automintApp').controller('dashboardCtrl', DashboardController);

    DashboardController.$inject = ['$rootScope', '$state', '$filter', '$log', '$mdDialog', 'utils', 'amDashboard'];

    function DashboardController($rootScope, $state, $filter, $log, $mdDialog, utils, amDashboard) {
        //  initialize view model
        var vm = this;
        var ubServices = [], nwCustomers = [], filterRange = [], isNextDueServicesOpened = false;

        //  named assignments to keep track of UI
        vm.totalCustomersServed = 0;
        vm.totalRevenueEarned = 0;
        vm.totalNewCustomers = 0;
        vm.totalPendingPayments = 0;
        vm.totalServicesDone = 0;
        vm.perDayServiceChart = {};
        vm.perDayServiceChart.type = "AnnotationChart";
        vm.perDayServiceChart.options = {
            displayAnnotations: true,
            displayZoomButtons: false,
            displayRangeSelector: false,
            thickness: 2,
            colors: ['03A9F4'],
            displayLegendDots: false,
            min: 0
        };
        vm.perDayServiceChart.data = {
            cols: [{
                id: "date",
                label: "Date",
                type: "date"
            }, {
                id: "nos",
                label: "Services",
                type: "number"
            }],
            rows: []
        };
        vm.topTreatmentsChart = {};
        vm.topTreatmentsChart.type = "PieChart";
        vm.topTreatmentsChart.data = {
            cols: [{
                id: "t",
                label: "Treatments",
                type: "string"
            }, {
                id: "n",
                label: "Number",
                type: "number"
            }],
            rows: []
        };
        vm.topVtChart = {};
        vm.topVtChart.type = "PieChart";
        vm.topVtChart.data = {
            cols: [{
                id: "t",
                label: "Vehicle Type",
                type: "string"
            }, {
                id: "n",
                label: "Number",
                type: "number"
            }],
            rows: []
        };
        vm.currentTimeSet = [];
        vm.ddTimeSet = '';
        vm.displayIncome = false;
        vm.nextServiceDueCustomers = [];
        vm.nsdcTimeRange = ['Today', 'This Week', 'This Month', 'All'];
        vm.nsdcTime = vm.nsdcTimeRange[0];
        vm.currencySymbol = "Rs.";

        //  function maps
        vm.addNewService = addNewService;
        vm.viewAllServices = viewAllServices;
        vm.openDuePayments = openDuePayments;
        vm.openNewCustomers = openNewCustomers;
        vm.openTimeFilter = openTimeFilter;
        vm.openNxtDueTimer = openNxtDueTimer;
        vm.changeNsdcTimeRange = changeNsdcTimeRange;
        vm.getNxtDueField = getNxtDueField;
        vm.getNextDueVehicle = getNextDueVehicle;
        vm.IsNextDueFieldLong = IsNextDueFieldLong;
        vm.openNextDueServices = openNextDueServices;
        vm.IsNoNextDueReminders = IsNoNextDueReminders;
        vm.IsReminderInPast = IsReminderInPast;

        //  default execution steps
        if ($rootScope.isAmDbLoaded)
            defaultExecutionSteps(true, false);
        else
            $rootScope.$watch('isAmDbLoaded', defaultExecutionSteps);

        //  function definitions

        function defaultExecutionSteps(newValue, oldValue) {
            if (newValue) {
                initCurrentTimeSet();
                getFilterMonths();
                processPreferences();
                getCurrencySymbol();
            }
        }

        function openCurrencyDialog() {
            $mdDialog.show({
                controller: 'amCtrlDashCurrency',
                controllerAs: 'vm',
                templateUrl: 'app/components/dashboard/tmpl/dialog-setcurrency.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: event,
                clickOutsideToClose: false
            }).then(success).catch(success);

            function success(res) {
                if (!res) {
                    openCurrencyDialog();
                    return;
                }
                vm.currencySymbol = res;
                amDashboard.saveCurrencySymbol(vm.currencySymbol).then(success).catch(failure);

                function success(res) {
                    if (res.ok)
                        utils.showSimpleToast('Currency saved successfully!');
                    else
                        failure();
                }

                function failure(err) {
                    utils.showSimpleToast('Could not save Currency at moment! Try Again!');
                    openCurrencyDialog();
                }
            }
        }

        function IsReminderInPast(date) {
            return (moment().format().localeCompare(date) > 0);
        }

        function getCurrencySymbol() {
            amDashboard.getCurrencySymbol().then(success).catch(failure);

            function success(res) {
                vm.currencySymbol = res;
            }

            function failure(err) {
                openCurrencyDialog();
            }
        }

        function IsNoNextDueReminders() {
            return (vm.nextServiceDueCustomers.length == 0);
        }

        function openNextDueServices() {
            $mdDialog.show({
                controller: 'amCtrlDashNxDu',
                controllerAs: 'vm',
                templateUrl: 'app/components/dashboard/tmpl/dialog_nextdueservices.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    dueCustomers: vm.nextServiceDueCustomers,
                    nsdcTimeRange: vm.nsdcTimeRange,
                    nsdcTime: vm.nsdcTime
                },
                clickOutsideToClose: true
            }).then(closeNdsDialog).catch(closeNdsDialog);

            function closeNdsDialog() {
                ammPreferences.getPreference('dashboard.serviceReminders').then(success).catch(failure);

                function success(res) {
                    changeNsdcTimeRange(res, true);
                }
            }
        }

        function IsNextDueFieldLong(text) {
            return (text.length > 15);
        }

        function getNextDueVehicle(manuf, model, reg, long) {
            var v = (model ? model : (reg ? reg : (manuf ? manuf : '')));
            var t = (manuf ? manuf : '') + ((manuf || model) ? ' ' : '') + (model ? model : '') + (((manuf || model) && reg) ? ' - ' : '') + (reg ? reg : '');
            return (long ? t : getNxtDueField(v));
        }

        function getNxtDueField(text) {
            return ((text.length <= 15) ? text : text.substr(0, 15) + '...');
        }

        function changeNsdcTimeRange(time, isStoreBlocked) {
            vm.nsdcTime = time;
            amDashboard.getNextDueCustomers(vm.nsdcTime).then(generateNdcData).catch(failure);
            if (!isStoreBlocked)
                ammPreferences.storePreference('dashboard.serviceReminders', vm.nsdcTime);
        }

        function openNxtDueTimer($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        }

        function generateNdcData(res) {
            vm.nextServiceDueCustomers = res;
            if (isNextDueServicesOpened) {
                openNextDueServices();
                isNextDueServicesOpened = false;
            }
        }

        function processPreferences() {
            ammPreferences.getAllPreferences('viewServices').then(processViewServices).catch(failure);
            ammPreferences.getAllPreferences('dashboard').then(processDashboard).catch(failure);

            function processDashboard(res) {
                if ($state.params.openDialog == 'nextdueservices')
	                isNextDueServicesOpened = true;
                if (res['dashboard.serviceReminders']) {
                    vm.nsdcTime = res['dashboard.serviceReminders'];
                }
                changeNsdcTimeRange(vm.nsdcTime, true);
            }

            function processViewServices(res) {
                if (res['viewServices.showingDataFor']) {
                    var sdf = res['viewServices.showingDataFor'].split(';');
                    vm.currentTimeSet = [];
                    sdf.forEach(iterateDateRange);
                    displayCurrentTimeSet();
                }

                amDashboard.getTotalCustomerServed(vm.currentTimeSet).then(generateTcsData).catch(failure);
                amDashboard.getNewCustomers(vm.currentTimeSet).then(generateNcpData).catch(failure);
                amDashboard.getProblemsAndVehicleTypes(vm.currentTimeSet).then(sortProblemsAndVehicleTypes).catch(failure);

                function iterateDateRange(dr) {
                    var m = dr.split(',');
                    for (var i = 0; i < (m.length - 1); i++) {
                        vm.currentTimeSet.push({
                            month: moment(m[i].replace(' ', ''), "MMMM").format("MMM"),
                            year: m[m.length - 1].replace(' ', '')
                        });
                    }
                }
            }

            function failure(err) {
                amDashboard.getTotalCustomerServed(vm.currentTimeSet).then(generateTcsData).catch(failure);
                amDashboard.getNewCustomers(vm.currentTimeSet).then(generateNcpData).catch(failure);
                amDashboard.getProblemsAndVehicleTypes(vm.currentTimeSet).then(sortProblemsAndVehicleTypes).catch(failure);
                changeNsdcTimeRange(vm.nsdcTimeRange[0]);
            }
        }

        function displayCurrentTimeSet() {
            vm.ddTimeSet = '';
            var years = [];
            vm.currentTimeSet.forEach(iterateTimeSets);
            years.forEach(iterateYears);
            vm.ddTimeSet = vm.ddTimeSet.substr(0, vm.ddTimeSet.length - 2);

            function iterateYears(y) {
                var tyf = $filter('filter')(vm.currentTimeSet, {
                    year: y
                }, true);

                tyf.forEach(iterateFoundYear);
                vm.ddTimeSet += y + '; ';

                function iterateFoundYear(fy) {
                    vm.ddTimeSet += moment(fy.month, 'MMM').format('MMMM') + ', ';
                }
            }

            function iterateTimeSets(ts) {
                var tyf = $filter('filter')(years, ts.year, true);

                if (tyf.length == 0)
                    years.push(ts.year);
            }
        }

        function initCurrentTimeSet() {
            vm.currentTimeSet.push({
                month: moment().format('MMM'),
                year: moment().format('YYYY')
            });
            displayCurrentTimeSet();
        }

        function getFilterMonths() {
            amDashboard.getFilterMonths().then(success).catch(failure);

            function success(res) {
                filterRange = res;
            }

            function failure(err) {
                //  do nothing
            }
        }

        function openTimeFilter(event) {
            $mdDialog.show({
                controller: 'amCtrlDashTmFl',
                controllerAs: 'vm',
                templateUrl: 'app/components/dashboard/tmpl/dialog_timefilter.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    filterRange: filterRange,
                    currentTimeSet: vm.currentTimeSet
                },
                clickOutsideToClose: true
            }).then(success).catch(success);

            function success(res) {
                if (!res)
                    return;
                vm.currentTimeSet = res;
                amDashboard.getTotalCustomerServed(vm.currentTimeSet).then(generateTcsData).catch(failure);
                amDashboard.getNewCustomers(vm.currentTimeSet).then(generateNcpData).catch(failure);
                amDashboard.getProblemsAndVehicleTypes(vm.currentTimeSet).then(sortProblemsAndVehicleTypes).catch(failure);
                displayCurrentTimeSet();
                ammPreferences.storePreference('viewServices.showingDataFor', vm.ddTimeSet);
            }
        }
        
        function openDuePayments() {
            if (ubServices.length <= 0) {
                utils.showSimpleToast('No Due Payments');
                return;
            }
                
            $mdDialog.show({
                controller: 'amCtrlDashDuPy',
                controllerAs: 'vm',
                templateUrl: 'app/components/dashboard/tmpl/dashboard_due-payments.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    unbilledServices: ubServices
                },
                clickOutsideToClose: true
            }).then(OnCloseDialog).catch(OnCloseDialog);
        }
        
        function openNewCustomers() {
            if (nwCustomers.length <= 0) {
                utils.showSimpleToast('No Customers');
                return;
            }
                
            $mdDialog.show({
                controller: 'amCtrlDashNwCu',
                controllerAs: 'vm',
                templateUrl: 'app/components/dashboard/tmpl/dashboard_new-customers.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    newCustomers: nwCustomers
                },
                clickOutsideToClose: true
            }).then(OnCloseDialog).catch(OnCloseDialog);
        }
            
        function OnCloseDialog(obj) {
            $log.info('will miss you');
        }
        
        function addNewService() {
            $state.go('restricted.services.add', {
                fromState: 'dashboard'
            });
        }

        function viewAllServices() {
            $state.go('restricted.services.all');
        }

        function sortProblemsAndVehicleTypes(res) {
            var sp = [], sortedProblems = [], svt = [], sortedVehicleTypes = [];
            if (res.problems) {
                Object.keys(res.problems).forEach(iterateProblems);
                sp.sort(sortByCount);
                for (var i = 0; i < sp.length; i++) {
                    if (i == 5) {
                        sortedProblems.push({
                            name: "Others",
                            count: sp[i].count
                        });
                    } else if (i > 5)
                        sortedProblems[5].count += sp[i].count;
                    else
                        sortedProblems.push(sp[i]);
                }
                vm.topTreatmentsChart.data.rows = [];
                sortedProblems.forEach(ip);
            }
            if (res.vehicletypes) {
                Object.keys(res.vehicletypes).forEach(iterateVehicleTypes);
                svt.sort(sortByCount);
                for (var i = 0; i < svt.length; i++) {
                    if (i == 4) {
                        sortedVehicleTypes.push({
                            name: "Others",
                            count: 1
                        });
                    } else if (i > 4)
                        sortedVehicleTypes[4].count += svt[i].count;
                    else
                        sortedVehicleTypes.push(svt[i]);
                }
                vm.topVtChart.data.rows = [];
                sortedVehicleTypes.forEach(ivt);
            }
            
            function ivt(vt) {
                vm.topVtChart.data.rows.push({
                    c:[{
                        v: vt.name
                    }, {
                        v: vt.count
                    }]
                })
            }
            
            function iterateVehicleTypes(vt) {
                svt.push({
                    name: vt,
                    count: res.vehicletypes[vt]
                });
            }
            
            function ip(p) {
                vm.topTreatmentsChart.data.rows.push({
                    c:[{
                        v: p.name
                    }, {
                        v: p.count
                    }]
                })
            }
            
            function sortByCount(lhs, rhs) {
                return (rhs.count - lhs.count);
            }
            
            function iterateProblems(problem) {
                sp.push({
                    name: problem,
                    count: res.problems[problem]
                });
            }
        }

        function generateNcpData(res) {
            vm.totalNewCustomers = res.newCustomers.length;
            vm.totalPendingPayments = 0;
            ubServices = $.extend([], res.unbilledServices);
            nwCustomers = $.extend([], res.newCustomers);
            res.unbilledServices.forEach(iterateUnbilledServices);
            if ($state.params.openDialog == 'duepayments')
                openDuePayments();

            function iterateUnbilledServices(ubs) {
                vm.totalPendingPayments += (ubs.srvc_payreceived) ? (parseFloat(ubs.srvc_cost) - parseFloat(ubs.srvc_payreceived)) : parseFloat(ubs.srvc_cost);
            }
        }

        function generateTcsData(res) {
            var uids = [],
                spd = {},
                dates = [];
            vm.totalCustomersServed = 0;
            vm.totalRevenueEarned = 0;
            vm.totalServicesDone = 0;
            res.forEach(iterateServices);
            vm.totalRevenueEarned = parseFloat(vm.totalRevenueEarned);
            vm.totalRevenueEarned = (vm.totalRevenueEarned % 1 != 0) ? vm.totalRevenueEarned.toFixed(2) : parseInt(vm.totalRevenueEarned);
            if (spd) {
                vm.perDayServiceChart.data.rows = [];
                Object.keys(spd).forEach(calculateSpd);
            }
            dates.sort(sortDates);
            vm.perDayServiceChart.options['zoomStartTime'] = dates[0];
            vm.perDayServiceChart.options['zoomEndTime'] = dates[dates.length - 1];

            function sortDates(lhs, rhs) {
                return lhs.getTime() - rhs.getTime();
            }

            function calculateSpd(d) {
                var tempdate = new Date(moment(d, 'DD MMM YYYY').format('YYYY'), moment(d, 'DD MMM YYYY').format('MM') - 1, moment(d, 'DD MMM YYYY').format('DD'));
                dates.push(tempdate);
                vm.perDayServiceChart.data.rows.push({
                    c: [{
                        v: tempdate
                    }, {
                        v: spd[d]
                    }]
                })
            }

            function iterateServices(service) {
                ++vm.totalServicesDone;
                if (service.srvc_status == 'Paid')
                    vm.totalRevenueEarned += parseFloat(service.srvc_cost);
                else
                    vm.totalRevenueEarned += (service.srvc_payreceived ? parseFloat(service.srvc_payreceived) : 0);
                var d = moment(service.srvc_date).format('DD MMM YYYY');
                if (!spd[d]) {
                    spd[d] = 0;
                }
                spd[d]++;
                var found = $filter('filter')(uids, service.cstmr_id, true);

                if (found.length == 0) {
                    uids.push(service.cstmr_id);
                    ++vm.totalCustomersServed;
                }
            }
        }

        function failure(err) {
            //  do nothing
        }
    }
})();;