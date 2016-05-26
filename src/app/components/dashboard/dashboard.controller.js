/**
 * Controller for dashboard view
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('dashboardCtrl', DashboardController)
        .controller('amCtrlDashDuPy', DuePaymentsController)
        .controller('amCtrlDashNwCu', NewCustomerController);

    DashboardController.$inject = ['$state', '$filter', '$log', '$mdDialog', '$amRoot', 'utils', 'amDashboard'];
    DuePaymentsController.$inject = ['$state', '$mdDialog', 'unbilledServices'];
    NewCustomerController.$inject = ['$mdDialog', 'newCustomers'];

    function DashboardController($state, $filter, $log, $mdDialog, $amRoot, utils, amDashboard) {
        //  initialize view model
        var vm = this;
        var ubServices = [], nwCustomers = [];

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

        //  function maps
        vm.addNewService = addNewService;
        vm.viewAllServices = viewAllServices;
        vm.openDuePayments = openDuePayments;
        vm.openNewCustomers = openNewCustomers;

        //  default execution steps
        $amRoot.ccViews();
        amDashboard.getTotalCustomerServed().then(generateTcsData).catch(failure);
        amDashboard.getNewCustomers().then(generateNcpData).catch(failure);
        amDashboard.getProblemsAndVehicleTypes().then(sortProblemsAndVehicleTypes).catch(failure);

        //  function definitions
        
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
                    if (i == 4) {
                        sortedProblems.push({
                            name: "Others",
                            count: sp[i].count
                        });
                    } else if (i > 4)
                        sortedProblems[4].count += sp[i].count;
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
                spd = {};
            vm.totalCustomersServed = 0;
            vm.totalRevenueEarned = 0;
            vm.totalServicesDone = 0;
            res.forEach(iterateServices);
            if (spd)
                Object.keys(spd).forEach(calculateSpd);

            function calculateSpd(d) {
                vm.perDayServiceChart.data.rows.push({
                    c: [{
                        v: new Date(moment(d, 'DD MMM YYYY').format('YYYY'), moment(d, 'DD MMM YYYY').format('MM') - 1, moment(d, 'DD MMM YYYY').format('DD'))
                    }, {
                        v: spd[d]
                    }]
                })
            }

            function iterateServices(service) {
                ++vm.totalServicesDone;
                if (service.srvc_status == 'Paid')
                    vm.totalRevenueEarned += service.srvc_cost;
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
            // console.log(err);
        }
    }
    
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
})();;