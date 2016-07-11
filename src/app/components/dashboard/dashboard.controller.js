/**
 * Controller for dashboard view
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.4
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('dashboardCtrl', DashboardController);

    DashboardController.$inject = ['$state', '$filter', '$log', '$mdDialog', '$amRoot', 'utils', 'amDashboard'];

    function DashboardController($state, $filter, $log, $mdDialog, $amRoot, utils, amDashboard) {
        //  initialize view model
        var vm = this;
        var ubServices = [], nwCustomers = [], filterRange = [];;

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
        vm.displayIncome = false

        //  function maps
        vm.addNewService = addNewService;
        vm.viewAllServices = viewAllServices;
        vm.openDuePayments = openDuePayments;
        vm.openNewCustomers = openNewCustomers;
        vm.openTimeFilter = openTimeFilter;

        //  default execution steps
        initCurrentTimeSet();
        getFilterMonths();
        $amRoot.ccViews();
        amDashboard.getTotalCustomerServed(vm.currentTimeSet).then(generateTcsData).catch(failure);
        amDashboard.getNewCustomers(vm.currentTimeSet).then(generateNcpData).catch(failure);
        amDashboard.getProblemsAndVehicleTypes(vm.currentTimeSet).then(sortProblemsAndVehicleTypes).catch(failure);

        //  function definitions

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
                console.info('failed to get filter months');
            }
        }

        function openTimeFilter(event) {
            $mdDialog.show({
                controller: 'amCtrlDashTmFl',
                controllerAs: 'vm',
                templateUrl: 'app/components/dashboard/tmpl/dashboard_timefilter.tmpl.html',
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
                displayCurrentTimeSet();
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
                vm.totalPendingPayments += ubs.srvc_cost;
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
            console.warn(err);
        }
    }
})();;