/**
 * Controller for Edit Service component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.8.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlSeUI', ServiceEditController);

    ServiceEditController.$inject = ['$rootScope', '$scope', '$state', '$q', '$log', '$filter', '$timeout', '$mdEditDialog', '$mdDialog', '$mdSidenav', 'utils', 'amServices'];

    /*
    ====== NOTE =======
    > Do not create new method named moment() since it is used by moment.js
    */

    function ServiceEditController($rootScope, $scope, $state, $q, $log, $filter, $timeout, $mdEditDialog, $mdDialog, $mdSidenav, utils, amServices) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var autofillVehicle = false;
        var isDiscountByPercent = true, isManualRoundOff = false;
        var isFirstTimeLoad = true;
        var serviceTcRo = 0, serviceTcDc = 0;
        var forceStopCalCost = false;
        var olInvoiceNo = 0, olJobCardNo = 0, olEstimateNo = 0;
        var isInvoice = false, isEstimate = false, isJobCard = false;
        var wasNextDueService = false;
        var treatmentTotal = 0, inventoryTotal = 0;
        var dTreatmentTax, dInventoryTax, dTreatment, dInventory;
        var taxSettingsSnap = [], lastServiceState;
        var orgVehicle = {}, userMobile = undefined;
        var isPackageAvailInService = false;

        //  vm assignments to keep track of UI related elements
        vm.vehicleTypeList = [];
        vm.user = {
            id: '',
            mobile: '',
            name: '',
            email: '',
            address: ''
        };
        vm.vehicle = {
            id: '',
            reg: '',
            manuf: '',
            model: '',
            type: 'default'
        };
        vm.service = {
            date: new Date(),
            odo: 0,
            cost: 0,
            status: '',
            state: '',
            invoiceno: undefined,
            jobcardno: undefined,
            estimateno: undefined,
            problems: [],
            taxes: {
                inventory: 0,
                treatments: 0
            },
            subtotal: 0
        };
        vm.problem = {
            details: '',
            rate: '',
            tax: {},
            amount: ''
        };
        vm.manufacturers = [];
        vm.models = [];
        vm.treatments = [];
        vm.selectedProblems = [];
        vm.selectedPackages = [];
        vm.allMemberships = [];
        vm.membershipChips = [];
        vm.serviceTypeList = ['Treatments', 'Package', 'Membership'];
        vm.roundedOffVal = 0;
        vm.inventories = [];
        vm.selectedInventories = [];
        vm.inventory = {
            name: '',
            rate: '',
            tax: {},
            qty: 1,
            amount: '',
            total: ''
        };
        vm.totalCost = 0;
        vm.isUserInfoExpanded = true;
        vm.isVehicleInfoExpanded = false;
        vm.isServiceInfoExpanded = false;
        vm.serviceStateList = ['Job Card', 'Estimate', 'Bill'];
        vm.service.state = vm.serviceStateList[0];
        vm.label_invoice = 'Invoice';
        vm.isNextDueService = false;
        vm.nextDueDate = new Date(); 
        vm.problemFocusIndex = -1;
        vm.inventoryFocusIndex = -1;
        vm.discount = {
            treatment: 0,
            part: 0,
            total: 0
        };
        vm.taxSettings = [];
        vm.currencySymbol = "Rs.";
        vm.areTaxesHidden = false;

        //  named assignments to handle behaviour of UI elements
        vm.redirect = {
            invoice: 'invoice'
        }

        //  function maps
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.convertRegToCaps = convertRegToCaps;
        vm.searchVehicleChange = searchVehicleChange;
        vm.manufacturersQuerySearch = manufacturersQuerySearch;
        vm.modelQuerySearch = modelQuerySearch;
        vm.changeVehicleType = changeVehicleType;
        vm.treatmentsQuerySearch = treatmentsQuerySearch;
        vm.onProblemSelected = onProblemSelected;
        vm.onProblemDeselected = onProblemDeselected;
        vm.isAddOperation = isAddOperation;
        vm.updateTreatmentDetails = updateTreatmentDetails;
        vm.finalizeNewProblem = finalizeNewProblem;
        vm.save = save;
        vm.queryMembershipChip = queryMembershipChip;
        vm.OnClickMembershipChip = OnClickMembershipChip;
        vm.OnAddMembershipChip = OnAddMembershipChip;
        vm.navigateToSubscribeMembership = navigateToSubscribeMembership;
        vm.goBack = goBack;
        vm.changeProblemRate = changeProblemRate;
        vm.OnTaxEnabledChange = OnTaxEnabledChange;
        vm.convertPbToTitleCase = convertPbToTitleCase;
        vm.convertInToTitleCase = convertInToTitleCase;
        vm.onInventorySelected = onInventorySelected;
        vm.onInventoryDeselected = onInventoryDeselected;
        vm.changeInventoryRate = changeInventoryRate;
        vm.inventoryQuerySearch = inventoryQuerySearch;
        vm.updateInventoryDetails = updateInventoryDetails;
        vm.finalizeNewInventory = finalizeNewInventory;
        vm.changeQty = changeQty;
        vm.changeInventoryTotal = changeInventoryTotal;
        vm.populateRoD = populateRoD;
        vm.changeForceStopCalCost = changeForceStopCalCost;
        vm.unsubscribeMembership = unsubscribeMembership;
        vm.label_titleCustomerMoreInfo = label_titleCustomerMoreInfo;
        vm.changeUserInfoState = changeUserInfoState;
        vm.changeVehicleInfoState = changeVehicleInfoState;
        vm.changeServiceInfoState = changeServiceInfoState;
        vm.openCustomerMoreDetails = buildDelayedToggler('customer-more-right');
        vm.closeCustomerMoreDetails = closeCustomerMoreDetails;
        vm.openServiceDetailsPanel = buildDelayedToggler('service-details-left');
        vm.fetchFocusItemAfterSS = fetchFocusItemAfterSS;
        vm.lockServiceNavbar = lockServiceNavbar;
        vm.IsMembershipTreatmentsDisabled = IsMembershipTreatmentsDisabled;
        vm.IsNoMembershipSubscribed = IsNoMembershipSubscribed;
        vm.IsMembershipEnabled = IsMembershipEnabled;
        vm.IsPackageEnabled = IsPackageEnabled;
        vm.convertVehicleTypeToAF = convertVehicleTypeToAF;
        vm.changeDisplayAsList = changeDisplayAsList;
        vm.changeInventoryAsList = changeInventoryAsList;
        vm.IsServiceStateSelected = IsServiceStateSelected;
        vm.selectServiceState = selectServiceState;
        vm.WhichServiceStateEnabled = WhichServiceStateEnabled;
        vm.autoCapitalizeCustomerAddress = autoCapitalizeCustomerAddress;
        vm.autoCapitalizeVehicleModel = autoCapitalizeVehicleModel;
        vm.calculateSubtotal = calculateSubtotal;
        vm.doRoundOff = doRoundOff;
        vm.calculateRoundOff = calculateRoundOff;
        vm.calculateDiscount = calculateDiscount;
        vm.isRoD = isRoD;
        vm.IsSubtotalEnabled = IsSubtotalEnabled;
        vm.IsServiceStateJc = IsServiceStateJc;
        vm.IsServiceStateEs = IsServiceStateEs;
        vm.IsServiceStateIv = IsServiceStateIv;
        vm.getDate = getDate;
        vm.IsProblemFocusIndex = IsProblemFocusIndex;
        vm.IsInventoryFocusIndex = IsInventoryFocusIndex;
        vm.openPartialPaymentBox = openPartialPaymentBox;
        vm.calculateDue = calculateDue;
        vm.IsPartialPayment = IsPartialPayment;
        vm.changeServiceStatus = changeServiceStatus;
        vm.openDiscountBox = openDiscountBox;
        vm.OnDiscountStateChange = OnDiscountStateChange;
        vm.selectUserBasedOnMobile = selectUserBasedOnMobile;
        vm.IsCustomerNotAnonymus = IsCustomerNotAnonymus;
        vm.goToDashboard = goToDashboard;
        vm.IsCustomerSelected = IsCustomerSelected;
        vm.openCustomerProfile = openCustomerProfile;
        vm.openTd = openTd;
        vm.openId = openId;

        //  watchers
        $(window).on('resize', OnWindowResize);

        //  default execution steps

        $rootScope.isCUSection = true;
        setCoverPic();
        buildDelayedToggler('service-details-left');
        changeServiceInfoState(true);
        getCurrencySymbol();
        getVehicleTypes();
        getPackages();
        getMemberships();

        //  function definitions

        function openId(event, inventory) {
            $mdDialog.show({
                controller: 'amCtrlSeId',
                controllerAs: 'vm',
                templateUrl: 'app/components/services/tmpl2/dialog-id.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    inventory: inventory
                },
                clickOutsideToClose: true
            }).then(success).catch(success);

            function success(res) {
                //  do nothing
            }
        }

        function openTd(event, problem) {
            $mdDialog.show({
                controller: 'amCtrlSeTd',
                controllerAs: 'vm',
                templateUrl: 'app/components/services/tmpl2/dialog-td.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    problem: problem
                },
                clickOutsideToClose: true
            }).then(success).catch(success);

            function success(res) {
                if (!res)
                    return;
                problem.orgcost = res.orgcost;
            }
        }

        function openCustomerProfile() {
            $state.go('restricted.customers.edit', {
                id: vm.user.id
            });
        }

        function IsCustomerSelected() {
            if (vm.user.id == undefined)
                return false;
            return (vm.user.id != '');
        }

        function goToDashboard() {
            $mdSidenav('main-nav-left').close()
            $state.go('restricted.dashboard');
        }

        function IsCustomerNotAnonymus() {
            return (vm.user.name != 'Anonymous');
        }

        function selectUserBasedOnMobile() {
            if (vm.user.mobile != undefined || vm.user.mobile != '') {
                vm.loadingBasedOnMobile = true;
                amServices.getCustomerByMobile(vm.user.mobile).then(success).catch(failure);
            }

            function success(res) {
                vm.loadingBasedOnMobile = false;
                if (vm.user.id != res.id) {
                    utils.showSimpleToast('This mobile number is already in registered with ' + res.name);
                    vm.user.mobile = userMobile;
                }
            }

            function failure(err) {
                vm.loadingBasedOnMobile = false;
            }
        }

        function getCurrencySymbol() {
            if ($rootScope.isAllFranchiseOSelected() == true) {
                vm.currencySymbol = $rootScope.currencySymbol;
                return;
            }
            amServices.getCurrencySymbol().then(success).catch(failure);

            function success(res) {
                vm.currencySymbol = res;
                $rootScope.currencySymbol = res;
            }

            function failure(err) {
                vm.currencySymbol = "Rs.";
            }
        }

        function calculate() {
            calculateSubtotal();
            calculateTotalDiscount();
            calculateTaxes();
            calculateCost();
        }

        function calculateTaxes() {
            vm.taxSettings.forEach(iterateTaxes);
            vm.service.problems.forEach(iterateProblems);
            if (vm.problem.details != '')
                iterateProblem(vm.problem);
            if (vm.packages)
                vm.packages.forEach(iteratePackages);
            vm.selectedInventories.forEach(iterateInventories);
            if (vm.inventory.name != '')
                iterateInventory(vm.inventory);
            if (vm.isDiscountApplied && (parseFloat(vm.discount.total) > 0)) {
                vm.taxSettings.forEach(iterateTaxes);
                vm.taxSettings.forEach(iterateTaxesAfter);
            }

            function iterateTaxesAfter(tax) {
                if (tax.isTaxApplied && tax.isForTreatments)
                    tax.tax += (dTreatment * tax.percent / 100);
                if (tax.isTaxApplied && tax.isForInventory)
                    tax.tax += (dInventory * tax.percent / 100);
                tax.tax = (tax.tax % 1 != 0) ? parseFloat(tax.tax.toFixed(2)) : parseInt(tax.tax);
            }

            function iterateTaxes(tax) {
                tax.tax = 0;
            }            

            function iteratePackages(package) {
                if (!package.checked)
                    return;
                package.selectedTreatments.forEach(iterateProblems);
            }

            function iterateInventories(inventory) {
                if (!inventory.checked)
                    return;
                if (inventory.tax) {
                    Object.keys(inventory.tax).forEach(iterateTaxes);

                    function iterateTaxes(tax) {
                        var found = $filter('filter')(vm.taxSettings, {
                            name: tax
                        }, true);
                        
                        if (found.length == 1) {
                            if (!found[0].isTaxApplied)
                                return;
                            if (!found[0].tax)
                                found[0].tax = 0;
                            found[0].tax += (inventory.tax[tax] * (inventory.qty ? inventory.qty : 1));
                            found[0].tax = (found[0].tax % 1 != 0) ? parseFloat(found[0].tax.toFixed(2)) : parseInt(found[0].tax);
                        }
                    }
                }
            }

            function iterateProblems(problem) {
                if (!problem.checked)
                    return;
                if (problem.tax) {
                    Object.keys(problem.tax).forEach(iterateTaxes);

                    function iterateTaxes(tax) {
                        var found = $filter('filter')(vm.taxSettings, {
                            name: tax
                        }, true);
                        
                        if (found.length == 1) {
                            if (!found[0].isTaxApplied)
                                return;
                            if (!found[0].tax)
                                found[0].tax = 0;
                            found[0].tax += problem.tax[tax];
                            found[0].tax = (found[0].tax % 1 != 0) ? parseFloat(found[0].tax.toFixed(2)) : parseInt(found[0].tax);
                        }
                    }
                }
            }

            function iterateProblem(problem) {
                if (problem.tax) {
                    Object.keys(problem.tax).forEach(iterateTaxes);

                    function iterateTaxes(tax) {
                        if (problem.tax[tax] > 0) {
                            var found = $filter('filter')(vm.taxSettings, {
                                name: tax
                            }, true);
                            
                            if (found.length == 1) {
                                if (!found[0].isTaxApplied)
                                    return;
                                if (!found[0].tax)
                                    found[0].tax = 0;
                                found[0].tax += problem.tax[tax];
                                found[0].tax = (found[0].tax % 1 != 0) ? parseFloat(found[0].tax.toFixed(2)) : parseInt(found[0].tax);
                            }
                        }
                    }
                }
            }

            function iterateInventory(inventory) {
                if (inventory.tax) {
                    Object.keys(inventory.tax).forEach(iterateTaxes);

                    function iterateTaxes(tax) {
                        if (inventory.tax[tax] > 0) {
                            var found = $filter('filter')(vm.taxSettings, {
                                name: tax
                            }, true);
                            
                            if (found.length == 1) {
                                if (!found[0].isTaxApplied)
                                    return;
                                if (!found[0].tax)
                                    found[0].tax = 0;
                                found[0].tax += (inventory.tax[tax] * (inventory.qty ? inventory.qty : 1));
                                found[0].tax = (found[0].tax % 1 != 0) ? parseFloat(found[0].tax.toFixed(2)) : parseInt(found[0].tax);
                            }
                        }
                    }
                }
            }
        }

        function OnDiscountStateChange() {
            calculateDiscount();
            calculate();
        }

        function openDiscountBox() {
            $mdDialog.show({
                controller: 'amCtrlSeDc',
                controllerAs: 'vm',
                templateUrl: 'app/components/services/tmpl/dialog_discount.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    currencySymbol: vm.currencySymbol,
                    treatmentLength: (vm.selectedProblems.length ? vm.selectedProblems.length : 0) + ((parseFloat(vm.problem.amount) > 0) ? 1 : 0),
                    partLength: (vm.selectedInventories.length ? vm.selectedInventories.length : 0) + ((parseFloat(vm.inventory.amount) > 0) ? 1 : 0),
                    discountObj: vm.discount,
                    partTotal: inventoryTotal,
                    treatmentTotal: treatmentTotal
                },
                clickOutsideToClose: true
            }).then(success).catch(success);

            function success(res) {
                if (!res)
                    return;
                vm.discount.treatment = res.treatment;
                vm.discount.part = res.part;
                vm.discount.total = res.total;
                calculate();
            }
        }

        function changeServiceStatus() {
            if (vm.servicestatus) {
                if (vm.service.partialpayment) {
                    if ((vm.service.partialpayment.total - vm.service.cost) != 0) {
                        vm.service.partialpayment[moment().format()] = vm.service.cost - vm.service.partialpayment.total;
                        vm.service.partialpayment.total = vm.service.cost;
                    }
                }
            } else {
                vm.service.partialpayment = {
                    total: 0
                }
            }
        }

        function IsPartialPayment() {
            return (vm.service.partialpayment && !vm.servicestatus);
        }

        function calculateDue() {
            return (vm.service.cost - vm.service.partialpayment.total);
        }

        function openPartialPaymentBox() {
            $mdDialog.show({
                controller: 'amCtrlSePp',
                controllerAs: 'vm',
                templateUrl: 'app/components/services/tmpl/dialog_partialpayment.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    currencySymbol: vm.currencySymbol,
                    totalCost: vm.service.cost,
                    partialPayments: vm.service.partialpayment
                },
                clickOutsideToClose: true
            }).then(success).catch(success);

            function success(res) {
                if (!res) {
                    vm.servicestatus = vm.service.partialpayment ? ((vm.service.partialpayment.total - vm.service.cost) == 0) : true;
                    return;
                }
                if (res.total)
                    vm.servicestatus = ((parseFloat(res.total) - parseFloat(vm.service.cost)) == 0);
                vm.service.partialpayment = res;
            }
        }

        function IsInventoryFocusIndex(index) {
            return (vm.inventoryFocusIndex == index);
        }

        function IsProblemFocusIndex(index) {
            return (vm.problemFocusIndex == index);
        }

        function getDate(date) {
            return moment(date).format('DD MMM YYYY');
        }

        function IsServiceStateIv(state) {
            if (!IsServiceStateSelected(state))
                return false;
            return (vm.service.state == vm.serviceStateList[2]);
        }

        function IsServiceStateEs(state) {
            if (!IsServiceStateSelected(state))
                return false;
            return (vm.service.state == vm.serviceStateList[1]);
        }

        function IsServiceStateJc(state) {
            if (!IsServiceStateSelected(state))
                return false;
            return (vm.service.state == vm.serviceStateList[0]);
        }

        function OnWindowResize() {
            if (vm.isServiceInfoExpanded)
                setServicesVpHeight();
        }

        function setServicesVpHeight() {
            $('#am-service-viewport').height($(window).height() - ($('#am-service-viewport').offset().top + 15));
        }

        function IsSubtotalEnabled() {
            var isTaxEnabled = false;
            vm.taxSettings.forEach(iterateTaxes);
            return (vm.isDiscountApplied || vm.isRoundOffVal || isTaxEnabled);

            function iterateTaxes(tax) {
                if (tax.isTaxApplied)
                    isTaxEnabled = true;
            }
        }

         function isRoD() {
            return (vm.isDiscountApplied || vm.isRoundOffVal);
        }

        function doRoundOff(input) {
            if (input == '')
                return 0;
            return ((input % 1 != 0) ? input.toFixed(2) : parseInt(input));
        }

        function calculateSubtotal() {
            var totalCost = 0;
            treatmentTotal = 0, inventoryTotal = 0;
            vm.service.problems.forEach(iterateProblem);
            if (vm.problem.details != '')
                totalCost += (vm.problem.rate) ? parseFloat(vm.problem.rate) : 0;
            vm.selectedInventories.forEach(iterateInventories);
            if (vm.inventory.name != '')
                totalCost += (vm.inventory.rate) ? (parseFloat(vm.inventory.rate) * parseFloat(vm.inventory.qty)) : 0;
            if (vm.packages) {
                vm.packages.forEach(iteratePackages);
            }
            totalCost = (totalCost % 1 != 0) ? totalCost.toFixed(2) : parseInt(totalCost);
            vm.service.subtotal = parseFloat(totalCost);

            function iterateProblem(element) {
                var temp = parseFloat(element.rate ? (element.rate * (element.checked ? 1 : 0)) : 0);
                totalCost += temp;
                treatmentTotal += temp;
            }

            function iterateInventories(element) {
                var temp = parseFloat(element.rate ? ((element.rate * element.qty) * (element.checked ? 1 : 0)) : 0);
                totalCost += temp;
                inventoryTotal += temp;
            }

            function iteratePackages(package) {
                if (!package.checked)
                    return;
                package.selectedTreatments.forEach(ipt);
            }

            function ipt(treatment) {
                var temp = treatment.amount[convertVehicleTypeToAF()];
                totalCost += temp;
                treatmentTotal += temp;
            }
        }

        function autoCapitalizeVehicleModel() {
            vm.vehicle.model = utils.autoCapitalizeWord(vm.vehicle.model);
        }

        function autoCapitalizeVehicleManuf() {
            vm.vehicle.manuf = utils.autoCapitalizeWord(vm.vehicle.manuf);
        }

        function autoCapitalizeCustomerAddress() {
            vm.user.address = utils.autoCapitalizeWord(vm.user.address);
        }

        function getLastJobCardNo() {
            amServices.getLastJobCardNo().then(success).catch(failure);

            function success(res) {
                if (vm.service.jobcardno != undefined)
                    return;
                vm.service.jobcardno = ++res;
                olJobCardNo = res;
            }

            function failure(err) {
                vm.service.jobcardno = 1;
                olJobCardNo = 1;
            }
        }

        function getLastEstimateNo() {
            amServices.getLastEstimateNo().then(success).catch(failure);

            function success(res) {
                if (vm.service.estimateno != undefined)
                    return;
                vm.service.estimateno = ++res;
                olEstimateNo = res;
            }

            function failure(err) {
                vm.service.estimateno = 1;
                olEstimateNo = 1;
            }
        }

        //  get last invoice number from database
        function getLastInvoiceNo() {
            amServices.getLastInvoiceNo().then(success).catch(failure);

            function success(res) {
                if (vm.service.invoiceno != undefined)
                    return;
                vm.service.invoiceno = ++res;
                olInvoiceNo = res;
            }

            function failure(err) {
                vm.service.invoiceno = 1;
                olInvoiceNo = 1;
            }
        }

        function WhichServiceStateEnabled(index) {
            return (IsServiceStateSelected(vm.serviceStateList[index]));
        }

        function selectServiceState(state) {
            vm.service.state = state;
            vm.label_invoice = (vm.service.state == vm.serviceStateList[2]) ? 'Invoice' : 'Send';
            if (vm.service.state != vm.serviceStateList[2]) {
                vm.areTaxesHidden = true;
                if ((lastServiceState == vm.serviceStateList[2]) || !lastServiceState) {
                    taxSettingsSnap = []; //
                    vm.taxSettings.forEach(iterateTaxes);
                }
            } else {
                vm.areTaxesHidden = false;
                vm.taxSettings = [];
                taxSettingsSnap.forEach(restoreTaxes);
            }
            lastServiceState = vm.service.state;
            OnTaxEnabledChange();

            function restoreTaxes(tax) {
                vm.taxSettings.push(tax);
            }

            function iterateTaxes(tax) {
                var t = $.extend({}, tax)
                taxSettingsSnap.push(t);
                tax.isTaxApplied = false;
            }
        }

        function IsServiceStateSelected(state) {
            return (vm.service.state == state);
        }

        function changeInventoryAsList(bool) {
            vm.displayInventoriesAsList = bool;
        }

        function changeDisplayAsList(bool) {
            vm.displayTreatmentAsList = bool;
        }

        function IsPackageEnabled() {
            return isPackageAvailInService;
            // return (vm.packages && (vm.packages.length > 0));
        }

        function convertVehicleTypeToAF() {
            return (vm.vehicle.type.toLowerCase().replace(' ', '-'));
        }

        function IsMembershipEnabled() {
            return (vm.serviceType == vm.serviceTypeList[2]);
        }

        function IsNoMembershipSubscribed() {
            return (vm.membershipChips.length < 1);
        }

        function IsMembershipTreatmentsDisabled(membership, treatment) {
            return (membership.calculateTOccurenceLeft(treatment) <= 0 || membership.calculateTDurationLeft(treatment) <= 0);
        }

        function lockServiceNavbar() {
            return $mdMedia('gt-md');
        }

        function fetchFocusItemAfterSS() {
            changeServiceInfoState(true, null, true);
        }

        function setCoverPic() {
            var source = localStorage.getItem('cover-pic');
            $('#am-sp-cover-pic').attr('src', (source) ? source : 'assets/img/logo-250x125px.png').width(250).height(125);
        }

        function label_titleCustomerMoreInfo() {
            return (vm.user.name ? vm.user.name + "'s" : "Customer");
        }

        function closeCustomerMoreDetails() {
            $mdSidenav('customer-more-right').close();
            setTimeout(cvis, 800);

            function cvis() {
                changeVehicleInfoState(true);
            }
        }

        //  Supplies a function that will continue to operate until the time is up.
        function debounce(func, wait, context) {
            var timer;
            return function debounced() {
                var context = $scope,
                    args = Array.prototype.slice.call(arguments);
                $timeout.cancel(timer);
                timer = $timeout(function() {
                    timer = undefined;
                    func.apply(context, args);
                }, wait || 10);
            };
        }

        //  Build handler to open/close a SideNav; when animation finishes report completion in console
        function buildDelayedToggler(navID) {
            return debounce(function() {
                $mdSidenav(navID).toggle();
            }, 200);
        }

        function focusServiceState() {
            $('#ami-service-state').focus();
        }

        function focusInvoiceNo() {
            $('#ami-service-invoice-no').focus();
        }

        function focusUserName() {
            $('#ami-user-name input').focus();
        }

        function focusVehicleManuf() {
            $('#ami-vehicle-manuf input').focus();
        }

        function changeUserInfoState(expanded) {
            vm.isUserInfoExpanded = expanded;
            if (expanded)
                setTimeout(focusUserName, 300);
            vm.isVehicleInfoExpanded = true;
            vm.isServiceInfoExpanded = false;
        }

        function changeVehicleInfoState(expanded, event) {
            if (event != undefined) {
                if (event.keyCode != 9)
                    return;
            }
            vm.isVehicleInfoExpanded = expanded;
            if (expanded)
                setTimeout(focusVehicleManuf, 300);
            vm.isUserInfoExpanded = true;
            vm.isServiceInfoExpanded = false;
        }

        function changeServiceInfoState(expanded, event, isAlreadyThere) {
            if (event != undefined) {
                if (event.keyCode != 9)
                    return;
            }
            if (expanded) {
                if (!isAlreadyThere)
                    setTimeout(focusInvoiceNo, 1300);
                else
                    setTimeout(focusServiceState, 300);
            }
            vm.isServiceInfoExpanded = expanded;
            if (expanded)
                setTimeout(setServicesVpHeight, 500);
            vm.isUserInfoExpanded = false;
            vm.isVehicleInfoExpanded = false;
        }

        function unsubscribeMembership(ev, chip) {
            var confirm = $mdDialog.confirm()
                .textContent('Unsubscribe to ' + chip.name + ' ?')
                .ariaLabel('Unsubscribe to ' + chip.name)
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');

            $mdDialog.show(confirm).then(performDelete, ignoreDelete);

            function performDelete() {
                //  do nothing
            }

            function ignoreDelete() {
                vm.membershipChips.push(chip);
            }
        }

        function changeInventoryTotal(inventory) {
            inventory.amount = inventory.total / inventory.qty;
            changeInventoryRate(inventory);
        }

        function finalizeNewInventory(isFromAutocomplete) {
            vm.inventory.name = vm.inventory.name.trim();
            vm.inventoryFocusIndex = -1;
            if (vm.inventory.name != '') {
                if (isFromAutocomplete)
                    updateInventoryDetails();
                var found = $filter('filter')(vm.inventories, {
                    name: vm.inventory.name
                }, true);
                var foundExisting = $filter('filter')(vm.selectedInventories, {
                    name: vm.inventory.name
                }, true);
                if (found.length == 1) {
                    found[0].checked = true;
                    found[0].rate = vm.inventory.rate;
                    found[0].tax = vm.inventory.tax;
                    found[0].qty = vm.inventory.qty;
                    found[0].amount = vm.inventory.amount;
                    found[0].total = vm.inventory.total;
                    if (foundExisting.length == 0)
                        vm.selectedInventories.push(found[0]);
                    else
                        foundExisting[0] = found[0];
                } else {
                    vm.inventories.push({
                        name: vm.inventory.name,
                        rate: vm.inventory.rate,
                        tax: vm.inventory.tax,
                        qty: vm.inventory.qty,
                        amount: vm.inventory.amount,
                        total: vm.inventory.total,
                        checked: true
                    });
                    vm.selectedInventories.push(vm.inventories[vm.inventories.length - 1]);
                }
                vm.inventory.name = '';
                vm.inventory.amount = '';
                vm.inventory.rate = '';
                vm.inventory.tax = {};
                vm.inventory.qty = 1;
                vm.inventory.total = '';
                calculate();
                if (isFromAutocomplete || foundExisting.length != 0)
                    vm.inventoryFocusIndex = (foundExisting.length == 0) ? vm.selectedInventories.length - 1 : vm.selectedInventories.indexOf(foundExisting[0]);
                else
                    setTimeout(focusNewInventoryName, 300);
            }

            function focusNewInventoryName() {
                $('#new-inventory-name input').focus();
            }
        }

        function updateInventoryDetails() {
            if (vm.inventory.name != '') {
                var found = $filter('filter')(vm.inventories, {
                    name: vm.inventory.name
                }, true);
                if (found.length == 1) {
                    var taxable = vm.inventory.amount;
                    vm.inventory.tax = {};
                    vm.taxSettings.forEach(iterateTaxes);
                    vm.inventory.rate = taxable;
                    vm.inventory.total = vm.inventory.amount * vm.inventory.qty;
                    vm.inventory.checked = true;
                    calculate();

                    function iterateTaxes(tax) {
                        if (!tax.isForInventory)
                            return;
                        if (tax.isTaxApplied) {
                            if (tax.inclusive) {
                                var temptax = 0;
                                vm.inventory.rate = (taxable * 100) / (tax.percent + 100);
                                temptax = (vm.inventory.rate * tax.percent / 100);
                                vm.inventory.tax[tax.name] = temptax;
                                taxable = vm.inventory.rate;
                            } else {
                                var temptax = 0;
                                temptax = (taxable * tax.percent / 100);
                                vm.inventory.tax[tax.name] = temptax;
                            }
                        }
                    }
                }
            } else {
                vm.inventory.checked = false;
                vm.inventory.rate = '';
                vm.inventory.tax = {};
                vm.inventory.amount = '';
                vm.inventory.total = '';
            }
        }

        function changeQty(inventory) {
            inventory.total = (inventory.amount * inventory.qty);
            calculate();
        }

        function inventoryQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.inventory.name ? vm.inventories.filter(createFilterForInventory(vm.inventory.name)) : vm.inventories);

            return results;
        }

        function createFilterForInventory(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                return (angular.lowercase(item.name).indexOf(lcQuery) >= 0);
            }
        }

        function onInventorySelected(inventory) {
            inventory.checked = true;
            changeInventoryRate(inventory);
        }

        function onInventoryDeselected(inventory) {
            inventory.checked = false;
            changeInventoryRate(inventory);
        }

        function getInventories(existingInventories) {
            vm.inventoryPromise = amServices.getInventories().then(success).catch(failure);

            function success(res) {
                vm.inventories = res;
                addExistingInventories(existingInventories);
                getInventoryTax();
            }

            function failure(err) {
                vm.inventories = [];
                addExistingInventories(existingInventories);
                getInventoryTax();
            }
        }

        function addExistingInventories(existingInventories) {
            existingInventories.forEach(iterateInventories);

            function iterateInventories(inventory) {
                if (inventory.name != '') {
                    if (inventory.qty == undefined)
                        inventory.qty = 1;
                    var found = $filter('filter')(vm.inventories, {
                        name: inventory.name
                    }, true);
                    if (found.length == 1) {
                        found[0].checked = true;
                        found[0].rate = inventory.rate;
                        found[0].amount = (inventory.amount) ? inventory.amount : inventory.rate;
                        found[0].qty = inventory.qty;
                        found[0].orgcost = inventory.orgcost;
                        found[0].vendor = inventory.vendor;
                        found[0].purchasedate = inventory.purchasedate;
                        vm.selectedInventories.push(found[0]);
                    } else {
                        vm.inventories.push({
                            name: inventory.name,
                            rate: inventory.rate,
                            amount: (inventory.amount) ? inventory.amount : inventory.rate,
                            qty: inventory.qty,
                            checked: true,
                            orgcost: inventory.orgcost,
                            vendor: inventory.vendor,
                            purchasedate: inventory.purchasedate
                        });
                        vm.selectedInventories.push(vm.inventories[vm.inventories.length - 1]);
                    }
                }
            }
        }

        function getInventoryTax() {
            amServices.getInventoryTax().then(success).catch(failure);

            function success(res) {
                res.forEach(iterateTaxes);
                OnTaxEnabledChange();

                function iterateTaxes(tax) {
                    tax.tax = 0;
                    tax.isTaxApplied = false;
                    var found = $filter('filter')(vm.taxSettings, {
                        name: tax.name
                    }, true);

                    if (found.length == 0) {
                        vm.taxSettings.push(tax);
                        taxSettingsSnap.push(tax);
                    }
                }
            }

            function failure(err) {
                vm.inventories.forEach(iterateInventories);

                function iterateInventories(inventory) {
                    changeQty(inventory);
                }
            }
        }

        function convertInToTitleCase() {
            vm.inventory.name = utils.autoCapitalizeWord(vm.inventory.name);
        }

        function changeVat() {
            vm.inventories.forEach(iterateInventories);
            changeInventoryRate(vm.inventory);
            if (isFirstTimeLoad == true)
                changeQty(vm.inventory);
            isFirstTimeLoad = false;

            function iterateInventories(inventory) {
                changeInventoryRate(inventory, true);
                if (isFirstTimeLoad == true)
                    changeQty(inventory);
            }
        }

        function changeInventoryRate(inventory, force) {
            var taxable = inventory.amount;
            inventory.tax = {};
            vm.taxSettings.forEach(iterateTaxes);
            inventory.rate = taxable;
            changeQty(inventory);
            calculate();

            function iterateTaxes(tax) {
                if (!tax.isForInventory)
                    return;
                if (tax.isTaxApplied) {
                    if (tax.inclusive) {
                        var temptax = 0;
                        inventory.rate = (taxable * 100) / (tax.percent + 100);
                        temptax = (inventory.rate * tax.percent / 100);
                        inventory.tax[tax.name] = temptax;
                        taxable = inventory.rate;
                    } else {
                        var temptax = 0;
                        temptax = (taxable * tax.percent / 100);
                        inventory.tax[tax.name] = temptax;
                    }
                }
            }
        }

        function convertPbToTitleCase() {
            vm.problem.details = utils.autoCapitalizeWord(vm.problem.details);
        }

        function OnTaxEnabledChange() {
            vm.service.problems.forEach(iterateProblems);
            changeProblemRate(vm.problem, true);
            calculatePackageTax();
            vm.inventories.forEach(iterateInventories);
            changeInventoryRate(vm.inventory, true);

            function iterateInventories(inventory) {
                changeInventoryRate(inventory, true);
            }

            function iterateProblems(problem) {
                changeProblemRate(problem, true);
            }
        }

        function changeServiceTax() {
            vm.service.problems.forEach(iterateProblems);
            calculatePackageTax();
            changeProblemRate(vm.problem, true);

            function iterateProblems(problem) {
                changeProblemRate(problem, true);
            }
        }

        function changeProblemRate(problem, force) {
            var taxable = problem.amount;
            problem.tax = {};
            vm.taxSettings.forEach(iterateTaxes);
            problem.rate = parseFloat(taxable);
            calculate();

            function iterateTaxes(tax) {
                if (!tax.isForTreatments)
                    return;
                if (tax.isTaxApplied) {
                    if (tax.inclusive) {
                        var temptax = 0;
                        problem.rate = (taxable * 100) / (tax.percent + 100);
                        temptax = (problem.rate * tax.percent / 100);
                        problem.tax[tax.name] = temptax;
                        taxable = problem.rate;
                    } else {
                        var temptax = 0;
                        temptax = (taxable * tax.percent / 100);
                        problem.tax[tax.name] = temptax;
                    }
                }
            }
        }

        function getTreatmentsTax() {
            amServices.getTreatmentsTax().then(success).catch(failure);

            function success(res) {
                res.forEach(iterateTaxes);
                OnTaxEnabledChange();

                function iterateTaxes(tax) {
                    tax.tax = 0;
                    tax.isTaxApplied = false;
                    var found = $filter('filter')(vm.taxSettings, {
                        name: tax.name
                    }, true);

                    if (found.length == 0) {
                        vm.taxSettings.push(tax);
                        taxSettingsSnap.push(tax);
                    }
                }
            }

            function failure(err) {
                //  do nothing
            }
        }

        function goBack() {
            var transitState = 'restricted.services.all';
            var transitParams = undefined;
            if ($state.params.fromState != undefined) {
                switch ($state.params.fromState) {
                    case 'dashboard.duepayments':
                        transitState = 'restricted.dashboard';
                        transitParams = {
                            openDialog: 'duepayments'
                        }
                        break;
                    case 'invoice':
                        transitState = 'restricted.invoices.view';
                        transitParams = {
                            userId: $state.params.userId,
                            vehicleId: $state.params.vehicleId,
                            serviceId: $state.params.serviceId
                        }
                        break;
                    case 'customers.edit.services':
                        transitState = 'restricted.customers.edit';
                        transitParams = {
                            id: $state.params.userId
                        }
                        break;
                }
            }
            $state.go(transitState, transitParams);
        }

        function addMembershipChip(chip) {
            vm.membershipChips.push(chip);
            OnAddMembershipChip(chip);
        }

        function navigateToSubscribeMembership() {
            changeUserInfoState(true);
            vm.openCustomerMoreDetails();
        }

        function OnClickMembershipChip(event) {
            var chipIndex = angular.element(event.currentTarget).controller('mdChips').selectedChip;
            if (chipIndex < 0)
                return;
            $mdDialog.show({
                controller: 'amCtrlMeD',
                controllerAs: 'vm',
                templateUrl: 'app/components/services/tmpl/dialog_membership.edit-template.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    membership: vm.membershipChips[chipIndex],
                    treatments: vm.treatments
                },
                clickOutsideToClose: true
            }).then(changeMembershipChip).catch(changeMembershipChip);

            function changeMembershipChip(obj) {
                $log.info('Changes Saved');
            }
        }

        function adjustExistingMembership(membership) {
            var m = $.extend({}, membership.treatments, false);
            membership.treatments = [];
            Object.keys(m).forEach(iterateTreatments);
            membership.selectedTreatments = [];
            membership.treatments.forEach(makeSelectedTreatments);
            membership.expandMembership = expandMembership;
            membership.onTreatmentSelected = onTreatmentSelected;
            membership.onTreatmentDeselected = onTreatmentDeselected;
            membership.calculateTOccurenceLeft = calculateTOccurenceLeft;
            membership.calculateTDurationLeft = calculateTDurationLeft;
            membership.IsExpired = IsExpired;
            delete m;

            function iterateTreatments(treatment) {
                delete treatment['$$hashKey'];
                m[treatment].name = treatment;
                membership.treatments.push(m[treatment]);
            }

            function expandMembership() {
                membership.expanded = (membership.expanded == undefined ? true : !membership.expanded);
            }

            function makeSelectedTreatments(treatment) {
                if (calculateTOccurenceLeft(treatment) != 0 && calculateTDurationLeft(treatment) != 0) {
                    treatment.checked = true;
                    membership.selectedTreatments.push(treatment);
                }
            }

            function IsExpired() {
                var e = true;
                membership.treatments.forEach(it);
                return e;

                function it(t) {
                    if (calculateTOccurenceLeft(t) != 0 && calculateTDurationLeft(t) != 0) {
                        e = false;
                    }
                }
            }

            function calculateTOccurenceLeft(item) {
                return (item.given.occurences - item.used.occurences);
            }

            function calculateTDurationLeft(item) {
                return (item.given.duration - item.used.duration);
            }

            function onTreatmentSelected(item) {
                item.checked = true;
            }

            function onTreatmentDeselected(item) {
                item.checked = false;
            }
        }

        function OnAddMembershipChip(chip) {
            var m = $.extend({}, chip.treatments, false);
            chip.treatments = [];
            Object.keys(m).forEach(iterateTreatments);
            chip.selectedTreatments = [];
            chip.startdate = moment().format();
            chip.treatments.forEach(makeSelectedTreatments);
            chip.expandMembership = expandMembership;
            chip.onTreatmentSelected = onTreatmentSelected;
            chip.onTreatmentDeselected = onTreatmentDeselected;
            chip.calculateTOccurenceLeft = calculateTOccurenceLeft;
            chip.calculateTDurationLeft = calculateTDurationLeft;
            chip.IsExpired = IsExpired;
            delete m;

            function iterateTreatments(treatment) {
                delete treatment['$$hashKey'];
                m[treatment].given = {
                    occurences: m[treatment].occurences,
                    duration: m[treatment].duration
                }
                m[treatment].used = {
                    occurences: 0,
                    duration: 0
                }
                delete m[treatment].occurences;
                delete m[treatment].duration;
                m[treatment].name = treatment;
                m[treatment].checked = false;
                chip.treatments.push(m[treatment]);
            }

            function expandMembership() {
                chip.expanded = (chip.expanded == undefined ? true : !chip.expanded);
            }

            function makeSelectedTreatments(treatment) {
                if (calculateTOccurenceLeft(treatment) != 0 && calculateTDurationLeft(treatment) != 0) {
                    treatment.checked = true;
                    chip.selectedTreatments.push(treatment);
                }
            }

            function IsExpired() {
                var e = true;
                chip.treatments.forEach(it);
                return e;

                function it(t) {
                    if (calculateTOccurenceLeft(t) != 0 && calculateTDurationLeft(t) != 0) {
                        e = false;
                    }
                }
            }

            function calculateTOccurenceLeft(item) {
                return (item.given.occurences - item.used.occurences);
            }

            function calculateTDurationLeft(item) {
                return (item.given.duration - item.used.duration);
            }

            function onTreatmentSelected(item) {
                item.checked = true;
            }

            function onTreatmentDeselected(item) {
                item.checked = false;
            }
        }

        function queryMembershipChip() {
            var tracker = $q.defer();
            var results = (vm.membershipChipText) ? vm.allMemberships.filter(createFilterForMemberships(vm.membershipChipText)) : vm.allMemberships;

            return results;

            function createFilterForMemberships(query) {
                var lcQuery = angular.lowercase(query);
                return function filterFn(item) {
                    return (angular.lowercase(item.name).indexOf(lcQuery) >= 0);
                }
            }
        }

        function getMemberships() {
            amServices.getMemberships().then(success).catch(failure);

            function success(res) {
                vm.allMemberships = res.memberships;
            }

            function failure(error) {
                vm.allMemberships = [];
            }
        }

        function calculatePackageTax() {
            if (vm.packages)
                vm.packages.forEach(iteratePackages);

            function iteratePackages(package) {
                package.treatments.forEach(iterateTreatments);

                function iterateTreatments(treatment) {
                    package.changeTreatmentTax(treatment, true);
                }
            }
        }

        function generatePackage(package) {
            var treatments = [];
            Object.keys(package.treatments).forEach(iterateTreatments);
            package.treatments = treatments;
            package.selectedTreatments = [];
            package.onTreatmentSelected = onTreatmentSelected;
            package.onTreatmentDeselected = onTreatmentDeselected;
            package.calculatePackageTotal = calculatePackageTotal;
            package.changeTreatmentTax = changeTreatmentTax;
            package.expandPackage = expandPackage;
            delete treatments;
            return package;

            function expandPackage() {
                package.expanded = (package.expanded == undefined ? true : !package.expanded);
            }

            function calculatePackageTotal() {
                var total = 0;
                package.selectedTreatments.forEach(it);
                package.total = total;
                calculate();
                return total;

                function it(t) {
                    total += t.amount[vm.vehicle.type.toLowerCase().replace(' ', '-')];
                }
            }

            function changeTreatmentTax(problem, force) {
                var cvt = vm.vehicle.type.toLowerCase().replace(' ', '-');
                var taxable = problem.amount[cvt];
                problem.tax = {};
                vm.taxSettings.forEach(iterateTaxes);
                problem.rate[cvt] = parseFloat(taxable);

                function iterateTaxes(tax) {
                    if (!tax.isForTreatments)
                        return;
                    if (tax.isTaxApplied) {
                        if (tax.inclusive) {
                            var temptax = 0;
                            problem.rate[cvt] = (taxable * 100) / (tax.percent + 100);
                            temptax = (problem.rate[cvt] * tax.percent / 100);
                            problem.tax[tax.name] = temptax;
                            taxable = problem.rate[cvt];
                        } else {
                            var temptax = 0;
                            temptax = (taxable * tax.percent / 100);
                            problem.tax[tax.name] = temptax;
                        }
                    }
                }
            }

            function iterateTreatments(treatment) {
                treatments.push({
                    name: treatment,
                    rate: package.treatments[treatment].rate,
                    amount: $.extend({}, package.treatments[treatment].rate),
                    checked: false
                });
            }

            function onTreatmentSelected(item) {
                item.checked = true;
            }

            function onTreatmentDeselected(item) {
                item.checked = false;
            }
        }

        //  get packages
        function getPackages() {
            vm.packagePromise = amServices.getPackages().then(success).catch(failure);

            function success(res) {
                vm.packages = [];
                res.forEach(iteratePackages);

                function iteratePackages(package) {
                    vm.packages.push(generatePackage(package));
                }
            }

            function failure(err) {
                vm.packages = [];
            }
        }

        //  get vehicle types from database
        function getVehicleTypes() {
            amServices.getVehicleTypes().then(success).catch(failure);

            function success(res) {
                res.forEach(iterateVehicleType);
                getDetails();

                function iterateVehicleType(type) {
                    vm.vehicleTypeList.push(utils.convertToTitleCase(type.replace(/-/g, ' ')));
                }
            }

            function failure(err) {
                getDetails();
            }
        }

        //  fill details
        function getDetails() {
            amServices.serviceTree($state.params.userId, $state.params.vehicleId, $state.params.serviceId).then(success).catch(failure);

            function success(res) {
                autofillVehicle = true;
                vm.user.id = $state.params.userId;
                vm.user.name = (res.name == 'Anonymous') ? '' : res.name;
                vm.user.email = res.email;
                vm.user.mobile = res.mobile;
                userMobile = res.mobile;
                vm.user.address = res.address;
                if (res.memberships)
                    Object.keys(res.memberships).forEach(iterateMemberships);
                vm.vehicle.id = $state.params.vehicleId;
                vm.vehicle.reg = (res.vehicle.reg == 'Vehicle') ? '' : res.vehicle.reg;
                orgVehicle
                vm.vehicle.manuf = res.vehicle.manuf;
                vm.vehicle.model = res.vehicle.model;
                vm.vehicle.type = res.vehicle.type;
                if (res.vehicle.service.packages) {
                    vm.serviceType = vm.serviceTypeList[1];
                    if (Object.keys(res.vehicle.service.packages).length > 0)
                        isPackageAvailInService = true;
                    Object.keys(res.vehicle.service.packages).forEach(iteratePackages);
                }
                if (res.vehicle.service.memberships) {
                    vm.serviceType = vm.serviceTypeList[2];
                    Object.keys(res.vehicle.service.memberships).forEach(addMemberships);
                }
                vm.service.id = $state.params.serviceId;
                vm.service.date = new Date(res.vehicle.service.date);
                if (res.vehicle.nextdue && (res.vehicle.nextdue.localeCompare(moment().format()) > 0)) {
                    wasNextDueService = true;
                    vm.isNextDueService = true;
                    vm.nextDueDate = new Date(res.vehicle.nextdue);
                } else {
                    wasNextDueService = false;
                    vm.isNextDueService = false;
                }
                vm.service.cost = res.vehicle.service.cost;
                vm.service.odo = res.vehicle.service.odo;
                vm.service.status = res.vehicle.service.status;
                if (res.vehicle.service.partialpayment)
                    vm.service.partialpayment = res.vehicle.service.partialpayment;
                if (res.vehicle.service.roundoff) {
                    vm.isRoundOffVal = true;
                    isManualRoundOff = vm.isRoundOffVal;
                    vm.roundedOffVal = parseFloat(res.vehicle.service.roundoff);
                }
                if (res.vehicle.service.taxes) {
                    vm.taxSettings = [];
                    Object.keys(res.vehicle.service.taxes).forEach(iterateTaxes);
                }
                vm.servicestatus = (res.vehicle.service.status == 'paid');
                getRegularTreatments(res.vehicle.service.problems);
                getInventories(res.vehicle.service.inventories);
                if (res.vehicle.service.jobcardno != undefined) {
                    vm.service.jobcardno = res.vehicle.service.jobcardno;
                    isJobCard = true;
                }
                if (res.vehicle.service.estimateno != undefined) {
                    vm.service.estimateno = res.vehicle.service.estimateno;
                    isEstimate = true;
                }
                if (res.vehicle.service.invoiceno != undefined) {
                    vm.service.invoiceno = res.vehicle.service.invoiceno;
                    isInvoice = true;
                }
                getLastJobCardNo();
                getLastEstimateNo();
                getLastInvoiceNo();
                selectServiceState((res.vehicle.service.state == undefined) ? vm.serviceStateList[2] : res.vehicle.service.state)
                vm.label_invoice = (vm.service.state == vm.serviceStateList[2]) ? 'Invoice' : 'Send';
                if (res.vehicle.service.discount) {
                    vm.isDiscountApplied = true;
                    if (res.vehicle.service.discount.amount) {
                        vm.discount.total = res.vehicle.service.discount.amount;
                        calculateDiscount();
                    } else {
                        vm.discount = res.vehicle.service.discount;
                    }
                }

                function iterateTaxes(tax) {
                    var t = res.vehicle.service.taxes[tax];

                    vm.taxSettings.push({
                        tax: t.tax,
                        inclusive: (t.type == "inclusive"),
                        isTaxApplied: t.isTaxApplied,
                        isForTreatments: t.isForTreatments,
                        isForInventory: t.isForInventory,
                        percent: t.percent,
                        name: tax
                    });
                }

                function iterateMemberships(membership) {
                    res.memberships[membership].name = membership;
                    vm.membershipChips.push(res.memberships[membership]);
                    adjustExistingMembership(res.memberships[membership]);
                }

                function iteratePackages(package) {
                    var found = $filter('filter')(vm.packages, {
                        name: package
                    }, true);

                    if (found.length == 1) {
                        found[0].checked = true;
                        Object.keys(res.vehicle.service.packages[package].treatments).forEach(iterateTreatments);
                        vm.selectedPackages.push(found[0]);

                        function iterateTreatments(treatment) {
                            var t = res.vehicle.service.packages[package].treatments[treatment];
                            var ft = $filter('filter')(found[0].treatments, {
                                name: treatment
                            }, true);

                            if (ft.length == 1) {
                                ft[0].checked = true;
                                if (!angular.isObject(ft[0].rate))
                                    ft[0].rate = {};
                                ft[0].rate[vm.vehicle.type.toLowerCase().replace(' ', '-')] = t.rate;
                                ft[0].amount[vm.vehicle.type.toLowerCase().replace(' ', '-')] = t.rate + ((res.vehicle.service.serviceTax && res.vehicle.service.serviceTax.applyTax) ? t.tax : 0);
                                found[0].selectedTreatments.push(ft[0]);
                            }
                        }
                    } else {
                        var tp = $.extend({}, res.vehicle.service.packages[package]);
                        tp.name = package;
                        vm.packages.push(generatePackage(tp));
                        delete tp;
                        iteratePackages(package);
                    }
                }

                function addMemberships(membership) {
                    var found = $filter('filter')(vm.membershipChips, {
                        name: membership
                    }, true);

                    if (found.length == 1) {
                        found[0].checked = true;
                        Object.keys(res.vehicle.service.memberships[membership].treatments).forEach(iterateTreatments);

                        function iterateTreatments(treatment) {
                            var ft = $filter('filter')(found[0].treatments, {
                                name: treatment
                            }, true);

                            if (ft.length == 1) {
                                ft[0].checked = true;
                                --ft[0].used.occurences;
                                found[0].selectedTreatments.push(ft[0]);
                            }
                        }
                    }
                }
            }

            function failure(err) {
                utils.showSimpleToast('Something went wrong!');
                $state.go('restricted.services.all');
            }
        }

        //  convert user name to TitleCase when they are typing
        function convertNameToTitleCase() {
            vm.user.name = utils.convertToTitleCase(vm.user.name);
        }

        //  in order to keep registation field in All Caps mode
        function convertRegToCaps() {
            vm.vehicle.reg = vm.vehicle.reg.toUpperCase();
        }

        //  query search for manufacturers [autocomplete]
        function manufacturersQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.vehicle.manuf ? vm.manufacturers.filter(createFilterForManufacturers(vm.vehicle.manuf)) : vm.manufacturers);

            if (results.length > 0) {
                return results;
            }

            amServices.getManufacturers().then(allotManufacturers).catch(noManufacturers);
            return tracker.promise;

            function allotManufacturers(res) {
                vm.manufacturers = res;
                results = (vm.vehicle.manuf ? vm.manufacturers.filter(createFilterForManufacturers(vm.vehicle.manuf)) : vm.manufacturers);
                tracker.resolve(results);
            }

            function noManufacturers(error) {
                results = [];
                tracker.resolve(results);
            }
        }

        //  create filter for manufacturers' query list
        function createFilterForManufacturers(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                item = angular.lowercase(item);
                return (item.indexOf(lcQuery) === 0);
            }
        }

        //  query search for model [autocomplete]
        function modelQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.vehicle.model ? vm.models.filter(createFilterForModel(vm.vehicle.model)) : vm.models);

            if (results.length > 0)
                return results;

            amServices.getModels(vm.vehicle.manuf).then(allotModels).catch(noModels);
            return tracker.promise;

            function allotModels(res) {
                vm.models = res;
                results = (vm.vehicle.model ? vm.models.filter(createFilterForModel(vm.vehicle.model)) : vm.models);
                tracker.resolve(results);
            }

            function noModels(err) {
                results = [];
                tracker.resolve(results);
            }
        }

        //  create filter for models' query list
        function createFilterForModel(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                item = angular.lowercase(item);
                return (item.indexOf(lcQuery) === 0);
            }
        }

        //  vehicle manufacturer is updated from UI, clear model list to populate new list w.r.t. manufacturer
        function searchVehicleChange() {
            autoCapitalizeVehicleManuf();
            if (!autofillVehicle) {
                vm.models = [];
                vm.vehicle.model = '';
                autofillVehicle = false;
            } else
                autofillVehicle = false;
        }

        //  replace all the treatment values with updated vehicle type
        function changeVehicleType() {
            vm.service.problems.forEach(iterateProblem);
            iterateProblem(vm.problem);
            calculatePackageTax();
            calculate();

            function iterateProblem(problem) {
                var found = $filter('filter')(vm.treatments, {
                    name: problem.details
                });
                if (found.length == 1) {
                    problem.amount = found[0].rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')];
                    var taxable = problem.amount;
                    problem.tax = {};
                    vm.taxSettings.forEach(iterateTaxes);
                    problem.rate = parseFloat(taxable);
                    if (found[0].orgcost && found[0].orgcost[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')])
                        problem.orgcost = found[0].orgcost[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')];

                    function iterateTaxes(tax) {
                        if (!tax.isForTreatments)
                            return;
                        if (tax.isTaxApplied) {
                            if (tax.inclusive) {
                                var temptax = 0;
                                problem.rate = (taxable * 100) / (tax.percent + 100);
                                temptax = (problem.rate * tax.percent / 100);
                                problem.tax[tax.name] = temptax;
                                taxable = problem.rate;
                            } else {
                                var temptax = 0;
                                temptax = (taxable * tax.percent / 100);
                                problem.tax[tax.name] = temptax;
                            }
                        }
                    }
                }
            }
        }

        //  return boolean response to different configurations [BEGIN]
        function isAddOperation() {
            return false;
        }
        //  return boolean response to different configurations [END]

        //  populate regular treatment list
        function getRegularTreatments(existingProblems) {
            amServices.getRegularTreatments().then(success).catch(failure);

            function success(res) {
                vm.treatments = res;
                loadTreatmentIntoProblems(existingProblems);
            }

            function failure(err) {
                vm.treatments = [];
                loadTreatmentIntoProblems(existingProblems);
            }
        }

        //  load treatment list into problem list
        function loadTreatmentIntoProblems(existingProblems) {
            vm.treatments.forEach(iterateTreatment);
            existingProblems.forEach(iterateProblem);
            getTreatmentsTax();

            function iterateProblem(problem) {
                var found = $filter('filter')(vm.service.problems, {
                    details: problem.details
                });
                if (found.length == 1) {
                    found[0].checked = true;
                    found[0].rate = problem.rate;
                    found[0].amount = (problem.amount) ? problem.amount : Math.round(problem.rate);
                    found[0].tax = problem.tax;
                    found[0].orgcost = problem.orgcost;
                    vm.selectedProblems.push(found[0]);
                } else {
                    vm.service.problems.push({
                        details: problem.details,
                        rate: problem.rate,
                        amount: (problem.amount) ? problem.amount : Math.round(problem.rate),
                        tax: problem.tax,
                        checked: true,
                        orgcost: problem.orgcost
                    });
                    vm.selectedProblems.push(vm.service.problems[vm.service.problems.length - 1]);
                }
            }

            function iterateTreatment(treatment) {
                var p = {
                    details: treatment.name,
                    rate: treatment.rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')],
                    amount: (treatment.amount) ? treatment.amount : treatment.rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')],
                    checked: false
                };
                if (treatment.orgcost && treatment.orgcost[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')])
                    p.orgcost = treatment.orgcost[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')];
                vm.service.problems.push(p);
            }
        }

        //  problem table listeners [BEGIN]
        function onProblemSelected(item) {
            item.checked = true;
            changeProblemRate(item);
        }

        function onProblemDeselected(item) {
            item.checked = false;
            changeProblemRate(item);
        }
        //  problem table listeners [END]

        //  query search for problems [autocomplete]
        function treatmentsQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.problem.details ? vm.treatments.filter(createFilterForTreatments(vm.problem.details)) : vm.treatments);

            return results;
        }

        //  create filter for treatments' query list
        function createFilterForTreatments(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                return (angular.lowercase(item.name).indexOf(lcQuery) >= 0);
            }
        }

        function populateRoD() {
            var isTreatmentTaxed = false, isInventoryTaxed = false, treatmentTaxPercent = 0, inventoryTaxPercent = 0;
            vm.taxSettings.forEach(iterateTaxes);
            if (vm.isDiscountApplied) {
                var noTerminate = true, tp = 0.5, ip = 1 - tp;
                if (treatmentTotal == 0) {
                    tp = 0;
                    ip = 1;
                } else if (inventoryTotal == 0) {
                    ip = 0;
                    tp = 1;
                }
                while (noTerminate) {
                    var xt = (tp * vm.service.cost * 100) / (treatmentTaxPercent + 100);
                    if (treatmentTotal < xt) {
                        tp -= 0.1;
                        ip = 1 - tp;
                        if (tp < 0)
                            break;
                        continue;
                    }
                    vm.discount.treatment = treatmentTotal - xt;
                    var xi = (ip * vm.service.cost * 100) / (inventoryTaxPercent + 100);
                    if (inventoryTotal < xi) {
                        ip -= 0.1;
                        tp = 1 - ip;
                        if (ip < 0)
                            break;
                        continue;
                    }
                    vm.discount.part = inventoryTotal - xi;
                    noTerminate = false;
                }

                vm.discount.total = parseFloat(vm.discount.treatment) + parseFloat(vm.discount.part);
                vm.discount.total = (vm.discount.total % 1 != 0) ? parseFloat(vm.discount.total.toFixed(2)) : parseInt(vm.discount.total);
                calculate();
            } else if (vm.isRoundOffVal)
                vm.roundedOffVal = vm.service.cost - serviceTcRo;

            function iterateTaxes(tax) {
                if (tax.isTaxApplied && tax.isForTreatments) {
                    isTreatmentTaxed = true;
                    treatmentTaxPercent += tax.percent;
                }
                if (tax.isTaxApplied && tax.isForInventory) {
                    isInventoryTaxed = true;
                    inventoryTaxPercent += tax.percent;
                }
            }
        }

        function calculateRoundOff(isRoundOffManual) {
            if (!isRoundOffManual) {
                var ot = totalCost = vm.service.cost;
                totalCost = vm.isRoundOffVal ? Math.floor(totalCost * 0.1) * 10 : totalCost;
                vm.roundedOffVal = (totalCost - ot);
                vm.roundedOffVal = (vm.roundedOffVal % 1 != 0) ? parseFloat(vm.roundedOffVal.toFixed(2)) : parseInt(vm.roundedOffVal);
            }
            calculate();
        }

        function calculateDiscount(isDiscountByPercent) {
            var treatmentLength = (vm.selectedProblems.length ? vm.selectedProblems.length : 0) + ((parseFloat(vm.problem.amount) > 0) ? 1 : 0);
            var partLength = (vm.selectedInventories.length ? vm.selectedInventories.length : 0) + ((parseFloat(vm.inventory.amount) > 0) ? 1 : 0);
            if (partLength > 0) {
                var dv2 = vm.discount.total * 0.5;
                var partValue = (dv2 > inventoryTotal) ? inventoryTotal : dv2;
                vm.discount.part = (treatmentLength > 0) ? partValue : vm.discount.total;
            } else
                vm.discount.part = 0;
            if (treatmentLength > 0) {
                var treatmentValue = vm.discount.total - vm.discount.part;
                if (treatmentValue > treatmentTotal) {
                    treatmentValue = treatmentTotal;
                    vm.discount.part = vm.discount.total - treatmentValue;
                }
                vm.discount.treatment = (partLength > 0) ? treatmentValue : vm.discount.total;
            } else
                vm.discount.treatment = 0;
            calculate();
        }

        function calculateTotalDiscount() {
            if (!vm.isDiscountApplied)
                return;
            var isTreatmentTaxed = false, isInventoryTaxed = false, treatmentTaxPercent = 0, inventoryTaxPercent = 0;
            dTreatment = treatmentTotal - vm.discount.treatment;
            dInventory = inventoryTotal - vm.discount.part;

            vm.taxSettings.forEach(iterateTaxes);

            dTreatmentTax = (isTreatmentTaxed) ? (dTreatment * treatmentTaxPercent / 100) : 0;
            dInventoryTax = (isInventoryTaxed) ? (dInventory * inventoryTaxPercent / 100) : 0;
            dTreatmentTax = (dTreatmentTax % 1 != 0) ? parseFloat(dTreatmentTax.toFixed(2)) : dTreatmentTax;    
            dInventoryTax = (dInventoryTax % 1 != 0) ? parseFloat(dInventoryTax.toFixed(2)) : dInventoryTax;

            function iterateTaxes(tax) {
                if (tax.isTaxApplied && tax.isForTreatments) {
                    isTreatmentTaxed = true;
                    treatmentTaxPercent += tax.percent;
                }
                if (tax.isTaxApplied && tax.isForInventory) {
                    isInventoryTaxed = true;
                    inventoryTaxPercent += tax.percent;
                }
            }
        }

        function changeForceStopCalCost(bool) {
            forceStopCalCost = bool; 
        }

        function calculateCost(isDbp) {
            if (forceStopCalCost)
                return;
            var totalCost = 0, taxes = 0;
            var discountedSubtotal = parseFloat(dTreatment + dTreatmentTax) + parseFloat(dInventory + dInventoryTax);
            vm.taxSettings.forEach(iterateTaxes);
            totalCost = (vm.isDiscountApplied && (vm.discount.total > 0)) ? Math.round(discountedSubtotal) : (parseFloat(vm.service.subtotal) + parseFloat(taxes)); 
            serviceTcDc = totalCost;
            serviceTcRo = totalCost;
            if (vm.isRoundOffVal) {
                totalCost += parseFloat(vm.roundedOffVal);
                serviceTcDc += parseFloat(vm.roundedOffVal);
            }
            totalCost = (totalCost % 1 != 0) ? parseFloat(totalCost.toFixed(2)) : totalCost;
            totalCost = (totalCost % 1).toFixed(2) == 0.00 ? Math.round(totalCost) : totalCost;
            totalCost = (totalCost % 1).toFixed(2) == 0.99 ? Math.round(totalCost) : totalCost;
            vm.service.cost = parseFloat(totalCost);

            function iterateTaxes(tax) {
                taxes += tax.tax;
            }
        }

        function finalizeNewProblem(isFromAutocomplete) {
            vm.problem.details = vm.problem.details.trim();
            vm.problemFocusIndex = -1;
            if (vm.problem.details != '') {
                if (isFromAutocomplete)
                    updateTreatmentDetails();
                var found = $filter('filter')(vm.service.problems, {
                    details: vm.problem.details
                }, true);
                var foundExisting = $filter('filter')(vm.selectedProblems, {
                    details: vm.problem.details
                }, true);
                if (found.length == 1) {
                    found[0].checked = true;
                    found[0].rate = vm.problem.rate;
                    found[0].tax = vm.problem.tax;
                    found[0].amount = vm.problem.amount;
                    if (foundExisting.length == 0)
                        vm.selectedProblems.push(found[0]);
                    else
                        foundExisting[0] = found[0];
                } else {
                    vm.service.problems.push({
                        details: vm.problem.details,
                        rate: vm.problem.rate,
                        tax: vm.problem.tax,
                        amount: vm.problem.amount,
                        checked: true
                    });
                    vm.selectedProblems.push(vm.service.problems[vm.service.problems.length - 1]);
                }
                vm.problem.details = '';
                vm.problem.amount = 0;
                vm.problem.rate = 0;
                vm.problem.tax = {};
                calculate();
                if (isFromAutocomplete || foundExisting.length != 0)
                    vm.problemFocusIndex = (foundExisting.length == 0) ? vm.selectedProblems.length - 1 : vm.selectedProblems.indexOf(foundExisting[0]);
                else
                    setTimeout(focusNewProblemDetails, 300);
            }

            function focusNewProblemDetails() {
                $('#new-problem-details input').focus();
            }
        }

        function updateTreatmentDetails() {
            if (vm.problem.details != '') {
                var found = $filter('filter')(vm.treatments, {
                    name: vm.problem.details
                }, true);
                if (found.length == 1) {
                    var rate = found[0].rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')];
                    vm.problem.amount = (rate == '' || rate == undefined ? vm.problem.amount : rate);
                    var taxable = vm.problem.amount;
                    vm.problem.tax = {};
                    vm.taxSettings.forEach(iterateTaxes);
                    vm.problem.rate = taxable;
                    vm.problem.checked = true;
                    calculate();

                    function iterateTaxes(tax) {
                        if (!tax.isForTreatments)
                            return;
                        if (tax.isTaxApplied) {
                            if (tax.inclusive) {
                                var temptax = 0;
                                vm.problem.rate = (taxable * 100) / (tax.percent + 100);
                                temptax = (vm.problem.rate * tax.percent / 100);
                                vm.problem.tax[tax.name] = temptax;
                                taxable = vm.problem.rate;
                            } else {
                                var temptax = 0;
                                temptax = (taxable * tax.percent / 100);
                                vm.problem.tax[tax.name] = temptax;
                            }
                        }
                    }
                }
            } else {
                vm.problem.rate = '';
                vm.problem.tax = {};
                vm.problem.amount = '';
                vm.problem.checked = false;
            }
        }

        function validate() {
            if (vm.user.name == '') {
                vm.user.name = 'Anonymous';
            }
            var isVehicleBlank = (vm.vehicle.manuf == undefined || vm.vehicle.manuf == '') && (vm.vehicle.model == undefined || vm.vehicle.model == '') && (vm.vehicle.reg == undefined || vm.vehicle.reg == '');

            if (isVehicleBlank) {
                vm.vehicle.reg = 'Vehicle';
            }
        }

        //  save to database
        function save(redirect) {
            if (($rootScope.isAllFranchiseOSelected() == true) && (redirect == vm.redirect.invoice)) {
                $state.go('restricted.invoices.view', {
                    userId: $state.params.userId,
                    vehicleId: $state.params.vehicleId,
                    serviceId: $state.params.serviceId
                });
                return;
            }
            validate();
            switch (vm.serviceType) {
                case vm.serviceTypeList[0]:
                    if (checkBasic() == false) {
                        utils.showSimpleToast('Please select treatment(s)');
                        return;
                    }
                    break;
                case vm.serviceTypeList[1]:
                    if (checkPackage() == false && checkBasic() == false) {
                        utils.showSimpleToast('Please select package(s) or treatment(s)');
                        return;
                    }
                    break;
                case vm.serviceTypeList[2]:
                    if (checkMembership() == false && checkBasic() == false) {
                        utils.showSimpleToast('Please select membership(s) or treatment(s)');
                        return;
                    }
                    break;
            }
            vm.service.problems = vm.selectedProblems;
            vm.user.memberships = vm.membershipChips;
            if (vm.packages)
                vm.packages.forEach(addPkToService);
            if (vm.membershipChips)
                vm.membershipChips.forEach(addMsToService);
            vm.service.status = vm.servicestatus ? 'paid' : 'due';
            vm.service.date = moment(vm.service.date).format();
            if (vm.isNextDueService)
                vm.vehicle.nextdue = moment(vm.nextDueDate).format();
            else if (wasNextDueService)
                vm.vehicle.nextdue = undefined;
            if (vm.problem.details)
                vm.service.problems.push(vm.problem);
            vm.service.problems.forEach(iterateProblems);
            if (vm.isDiscountApplied)
                vm.service.discount = vm.discount;
            if (vm.isRoundOffVal) {
                vm.service['roundoff'] = vm.roundedOffVal;
            }
            vm.service.taxes = {};
            vm.taxSettings.forEach(iterateTaxes);
            if (vm.inventory.name)
                vm.selectedInventories.push(vm.inventory);
            vm.selectedInventories.forEach(iterateInventories);
            vm.service.inventories = vm.selectedInventories;
            var options = {
                isLastInvoiceNoChanged: (vm.service.invoiceno == olInvoiceNo),
                isLastEstimateNoChanged: (vm.service.estimateno == olEstimateNo),
                isLastJobCardNoChanged: (vm.service.jobcardno == olJobCardNo)
            }
            switch (vm.service.state) {
                case vm.serviceStateList[0]:
                    if (!isInvoice)
                        delete vm.service.invoiceno;
                    if (!isEstimate)
                        delete vm.service.estimateno;
                    break;
                case vm.serviceStateList[1]:
                    if (!isJobCard)
                        delete vm.service.jobcardno;
                    if (!isInvoice)
                        delete vm.service.invoiceno;
                    break;
                case vm.serviceStateList[2]:
                    if (!isJobCard)
                        delete vm.service.jobcardno;
                    if (!isEstimate)
                        delete vm.service.estimateno;
                    break;
            }
            amServices.saveService(vm.user, vm.vehicle, vm.service, options).then(success).catch(failure);

            function iterateTaxes(tax) {
                vm.service.taxes[tax.name] = {
                    tax: tax.tax,
                    type: (tax.inclusive) ? "inclusive" : "exclusive",
                    isTaxApplied: tax.isTaxApplied,
                    isForTreatments: tax.isForTreatments,
                    isForInventory: tax.isForInventory,
                    percent: tax.percent
                }
            }

            function addMsToService(membership) {
                if (!membership.checked)
                    return;
                if (!vm.service.memberships)
                    vm.service.memberships = [];
                vm.service.memberships.push({
                    name: membership.name,
                    treatments: membership.treatments,
                    rate: membership.total
                });
            }

            function addPkToService(package) {
                if (!package.checked)
                    return;
                if (!vm.service.packages)
                    vm.service.packages = [];
                vm.service.packages.push({
                    name: package.name,
                    treatments: package.treatments,
                    rate: package.total
                });
            }

            function iterateProblems(problem) {
                delete problem.checked;
                delete problem['$$hashKey'];
            }

            function iterateInventories(inventory) {
                delete inventory.checked;
                delete inventory['total'];
                delete inventory['$$hashKey'];
            }

            function checkPackage() {
                var isPackagesSelected = false;
                for (var i = 0; i < vm.packages.length; i++) {
                    if (vm.packages[i].checked) {
                        isPackagesSelected = true;
                        break;
                    }
                }
                return isPackagesSelected;
            }

            function checkMembership() {
                var isMembershipsSelected = false;
                for (var i = 0; i < vm.membershipChips.length; i++) {
                    if (vm.membershipChips[i].checked) {
                        isMembershipsSelected = true;
                        break;
                    }
                }
                return isMembershipsSelected;
            }

            function checkBasic() {
                var isTreatmentsSelected = false;
                for (var i = 0; i < vm.service.problems.length; i++) {
                    if (vm.service.problems[i].checked) {
                        isTreatmentsSelected = true;
                        break;
                    }
                }
                if (vm.problem.details != '')
                    isTreatmentsSelected = true;
                if (vm.inventory.name != '')
                    isTreatmentsSelected = true;
                if (vm.selectedInventories.length > 0)
                    isTreatmentsSelected = true;
                return isTreatmentsSelected;
            }

            //  (save successfull)
            function success(res) {
                switch (redirect) {
                    case vm.redirect.invoice:
                        $state.params.fromState = 'invoice';
                        transitIds = {
                            userId: res.id.userId,
                            vehicleId: res.id.vehicleId,
                            serviceId: res.id.serviceId
                        }
                        break;
                }
                setTimeout(goBack, 100);
                utils.showSimpleToast('Successfully Updated!');
            }

            //  !(save successfull)
            function failure(err) {
                utils.showSimpleToast('Failed to update. Please Try Again!');
            }
        }
    }
})();