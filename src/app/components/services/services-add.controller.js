/**
 * Controller for Add Service module
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlSeCI', ServiceAddController);

    ServiceAddController.$inject = ['$scope', '$state', '$q', '$log', '$filter', '$timeout', '$mdEditDialog', '$mdDialog', '$mdSidenav', 'utils', 'amServices'];

    /*
    ====== NOTE =======
    > Do not create new method named moment() since it is used by moment.js
    */

    function ServiceAddController($scope, $state, $q, $log, $filter, $timeout, $mdEditDialog, $mdDialog, $mdSidenav, utils, amServices) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var autofillVehicle = false;
	    var flagGetUserBasedOnMobile = true;
        var olInvoiceNo = 1, olJobCardNo = 1, olEstimateNo = 1;
        var transitIds = undefined, transitInterState = undefined;
        var forceStopCalCost = false;
        var serviceTcRo = 0, serviceTcDc = 0;
        var treatmentTotal = 0, inventoryTotal = 0;
        var dTreatmentTax, dInventoryTax, dTreatment, dInventory;

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
            type: ''
        };
        vm.service = {
            date: new Date(),
            odo: 0,
            cost: 0,
            status: '',
            state: '',
            invoiceno: 1,
            jobcardno: 1,
            estimateno: 1,
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
        vm.servicestatus = true;
        vm.manufacturers = [];
        vm.models = [];
        vm.possibleUserList = [];
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
        vm.service.state = vm.serviceStateList[2];
        vm.label_invoice = 'Invoice';
        vm.isNextDueService = false;
        vm.nextDueDate = new Date(); 
        vm.nextDueDate.setMonth(vm.nextDueDate.getMonth() + 3);
        vm.problemFocusIndex = -1;
        vm.inventoryFocusIndex = -1;
        vm.discount = {
            treatment: 0,
            part: 0,
            total: 0
        };
        vm.taxSettings = [];

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
        vm.changeVehicle = changeVehicle;
        vm.isAddOperation = isAddOperation;
        vm.chooseVehicle = chooseVehicle;
        vm.userQuerySearch = userQuerySearch;
        vm.selectedUserChange = selectedUserChange;
        vm.changeUserMobile = changeUserMobile;
        vm.selectUserBasedOnMobile = selectUserBasedOnMobile;
        vm.changeVehicleType = changeVehicleType;
        vm.treatmentsQuerySearch = treatmentsQuerySearch;
        vm.onProblemSelected = onProblemSelected;
        vm.onProblemDeselected = onProblemDeselected;
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
        vm.IsPackageEnabled = IsPackageEnabled;
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

        //  default execution steps
        setCoverPic();
        changeUserInfoState(true);   //  ammToDo: Enable this while commiting
        setTimeout(focusUserName, 700);
        // changeServiceInfoState(true);   //  ammToDo: Testing Purpose, Disable while commiting
        buildDelayedToggler('service-details-left');
        getDefaultServiceType();
        getTreatmentDisplayFormat();
        getInventoriesSettings();
        getVehicleTypes();
        getRegularTreatments();
        getInventories();
        getMemberships();
        getLastInvoiceNo();
        getLastEstimateNo();
        getLastJobCardNo();

        //  watchers
        $(window).on('resize', OnWindowResize);

        //  function definitions

        function calculate() {
            calculateSubtotal();
            calculateTotalDiscount();
            calculateTaxes();
            calculateCost();
        }

        function calculateTaxes() {
            vm.taxSettings.forEach(iterateTaxes);
            vm.service.problems.forEach(iterateProblems);
            iterateProblem(vm.problem);
            if (vm.packages)
                vm.packages.forEach(iteratePackages);
            vm.selectedInventories.forEach(iterateProblems);
            iterateProblem(vm.inventory);
            if (vm.isDiscountApplied)
                vm.taxSettings.forEach(iterateTaxesAfter);

            function iterateTaxesAfter(tax) {
                if (tax.isTaxApplied && tax.isForTreatments)
                    tax.tax = (dTreatment * tax.percent / 100);
                if (tax.isTaxApplied && tax.isForInventory)
                    tax.tax = (dInventory * tax.percent / 100);
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
                    if ((vm.service.partialpayment.total - vm.service.cost) != 0)
                        vm.service.partialpayment[moment().format()] = vm.service.cost - vm.service.partialpayment.total;
                }
            } else
                openPartialPaymentBox();
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
            totalCost += (vm.problem.rate) ? parseFloat(vm.problem.rate) : 0;
            vm.selectedInventories.forEach(iterateInventories);
            totalCost += (vm.inventory.rate) ? (parseFloat(vm.inventory.rate) * parseFloat(vm.inventory.qty)) : 0;
            if (vm.serviceType == vm.serviceTypeList[1]) {
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
                var temp = treatment.rate[vm.vehicle.type.toLowerCase().replace(' ', '-')];
                totalCost += temp;
                treatmentTotal += temp;
            }
        }

        function getDefaultServiceType() {
            amServices.getDefaultServiceType().then(success).catch(failure);

            function success(res) {
                vm.service.state = res;
                vm.label_invoice = (vm.service.state == vm.serviceStateList[2]) ? 'Invoice' : 'Send';
            }

            function failure(err) {
                vm.service.state = vm.serviceStateList[2];
                vm.label_invoice = (vm.service.state == vm.serviceStateList[2]) ? 'Invoice' : 'Send';
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

        function WhichServiceStateEnabled(index) {
            return (IsServiceStateSelected(vm.serviceStateList[index]));
        }

        function selectServiceState(state) {
            vm.service.state = state;
            vm.label_invoice = (vm.service.state == vm.serviceStateList[2]) ? 'Invoice' : 'Send';
        }

        function IsServiceStateSelected(state) {
            return (vm.service.state == state);
        }

        function focusShowAllInventoriesButton() {
            $('#ami-display-inventory-as').focus();
        }

        function focusShowAllTreatmentsButton() {
            $('#ami-display-as').focus();
        }

        function changeInventoryAsList(bool) {
            vm.displayInventoriesAsList = bool;
            setTimeout(focusShowAllInventoriesButton, 300);
        }

        function changeDisplayAsList(bool) {
            vm.displayTreatmentAsList = bool;
            setTimeout(focusShowAllTreatmentsButton, 300);
        }

        function IsPackageEnabled() {
            return (vm.packages.length < 1);
        }

        function convertVehicleTypeToAF() {
            return (vm.vehicle.type.toLowerCase().replace(' ', '-'));
        }

        function IsPackageEnabled() {
            return (vm.serviceType == vm.serviceTypeList[1]);
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
                    setTimeout(focusInvoiceNo, 300);
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
                console.info('deleted');
            }

            function ignoreDelete() {
                vm.membershipChips.push(chip);
            }
        }

        function changeInventoryTotal(inventory) {
            inventory.amount = inventory.total / inventory.qty;
            changeInventoryRate(inventory);
        }

        function getInventoriesSettings() {
            amServices.getInventoriesSettings().then(success).catch(failure);

            function success(res) {
                vm.displayInventoriesAsList = res;
            }

            function failure(err) {
                vm.displayInventoriesAsList = false;
            }
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
                vm.inventory.tax = '';
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

        function getInventories() {
            vm.inventoryPromise = amServices.getInventories().then(success).catch(failure);

            function success(res) {
                vm.inventories = res;
                getInventoryTax();
            }

            function failure(err) {
                vm.inventories = [];
                getInventoryTax();
            }
        }

        function getInventoryTax() {
            amServices.getInventoryTax().then(success).catch(failure);

            function success(res) {
                res.forEach(iterateTaxes);
                OnTaxEnabledChange();

                function iterateTaxes(tax) {
                    tax.tax = 0;
                    var found = $filter('filter')(vm.taxSettings, {
                        name: tax.name
                    }, true);

                    if (found.length == 0)
                        vm.taxSettings.push(tax);
                }
            }

            function failure(err) {
                console.warn(err);
            }
        }

        function convertInToTitleCase() {
            vm.inventory.name = utils.autoCapitalizeWord(vm.inventory.name);
        }

        function changeQty(inventory) {
            inventory.total = (inventory.amount * inventory.qty);
            calculate();
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
                getPackages();
                OnTaxEnabledChange();

                function iterateTaxes(tax) {
                    tax.tax = 0;
                    var found = $filter('filter')(vm.taxSettings, {
                        name: tax.name
                    }, true);

                    if (found.length == 0)
                        vm.taxSettings.push(tax);
                }
            }

            function failure(err) {
                getPackages();
            }
        }

        function goBack() {
            var transitState = 'restricted.services.all';
            var transitParams = undefined;
            if ($state.params.fromState != undefined) {
                switch ($state.params.fromState) {
                    case 'dashboard':
                        transitState = 'restricted.dashboard';
                        break;
                    case 'invoice':
                        transitState = 'restricted.invoices.view';
                        transitParams = {
                            userId: transitIds.userId,
                            vehicleId: transitIds.vehicleId,
                            serviceId: transitIds.serviceId,
                            fromState: transitInterState
                        }
                        break;
                    case 'locked':
                        transitState = 'locked';
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
            membership.IsExpired = IsExpired;
            membership.calculateTDurationLeft = calculateTDurationLeft;
            delete m;

            function iterateTreatments(treatment) {
                delete treatment['$$hashKey'];
                m[treatment].name = treatment;
                m[treatment].checked = true;
                membership.treatments.push(m[treatment]);
            }

            function expandMembership() {
                membership.expanded = (membership.expanded == undefined ? true : !membership.expanded);
            }

            function makeSelectedTreatments(treatment) {
                if (calculateTOccurenceLeft(treatment) != 0 && calculateTDurationLeft(treatment) != 0) {
                    treatment.checked = true;
                    membership.selectedTreatments.push(treatment);
                } else
                    treatment.checked = false;
            }

            function calculateTOccurenceLeft(item) {
                return (item.given.occurences - item.used.occurences);
            }

            function calculateTDurationLeft(item) {
                return (item.given.duration - item.used.duration);
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

            function onTreatmentSelected(item) {
                item.checked = true;
            }

            function onTreatmentDeselected(item) {
                item.checked = false;
            }
        }

        function OnAddMembershipChip(chip) {
            vm.serviceType = (vm.membershipChips.length > 0) ? vm.serviceTypeList[2] : vm.serviceTypeList[0];
            var m = $.extend({}, chip.treatments, false);
            if (!angular.isArray(chip.treatments)) {
                chip.treatments = [];
                Object.keys(m).forEach(iterateTreatments);
            }
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
                m[treatment].checked = true;
                chip.treatments.push(m[treatment]);
            }

            function expandMembership() {
                chip.expanded = (chip.expanded == undefined ? true : !chip.expanded);
            }

            function makeSelectedTreatments(treatment) {
                if (calculateTOccurenceLeft(treatment) != 0 && calculateTDurationLeft(treatment) != 0) {
                    treatment.checked = true;
                    chip.selectedTreatments.push(treatment);
                } else
                    treatment.checked = false;
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

        //  get packages
        function getPackages() {
            vm.packagePromise = amServices.getPackages().then(success).catch(failure);

            function success(res) {
                vm.packages = [];
                res.forEach(iteratePackages);

                function iteratePackages(package) {
                    var treatments = [];
                    Object.keys(package.treatments).forEach(iterateTreatments);
                    package.treatments = treatments;
                    package.treatments.forEach(changeTreatmentTax);
                    package.selectedTreatments = $.extend([], package.treatments);
                    package.onTreatmentSelected = onTreatmentSelected;
                    package.onTreatmentDeselected = onTreatmentDeselected;
                    package.calculatePackageTotal = calculatePackageTotal;
                    package.expandPackage = expandPackage;
                    package.changeTreatmentTax = changeTreatmentTax;
                    vm.packages.push(package);
                    delete treatments;

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
                        var taxable = problem.amount;
                        problem.tax = {};
                        vm.taxSettings.forEach(iterateTaxes);
                        problem.rate = parseFloat(taxable);

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

                    function iterateTreatments(treatment) {
                        treatments.push({
                            name: treatment,
                            rate: package.treatments[treatment].rate,
                            amount: $.extend({}, package.treatments[treatment].rate),
                            checked: true
                        });
                    }

                    function onTreatmentSelected(item) {
                        item.checked = true;
                    }

                    function onTreatmentDeselected(item) {
                        item.checked = false;
                    }
                }
            }

            function failure(err) {
                vm.packages = [];
            }
        }

        function getLastJobCardNo() {
            amServices.getLastJobCardNo().then(success).catch(failure);

            function success(res) {
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
                vm.service.invoiceno = ++res;
                olInvoiceNo = res;
            }

            function failure(err) {
                vm.service.invoiceno = 1;
                olInvoiceNo = 1;
            }
        }

        //  get treatment settings
        function getTreatmentDisplayFormat() {
            amServices.getTreatmentSettings().then(success);

            //  set treatment flag according to response
            function success(response) {
                if (response) {
                    vm.displayTreatmentAsList = response.displayAsList;
                }
            }
        }

        //  get vehicle types from database
        function getVehicleTypes() {
            amServices.getVehicleTypes().then(success).catch(failure);

            function success(res) {
                res.forEach(iterateVehicleType);
                setDefaultVehicle();

                function iterateVehicleType(type) {
                    vm.vehicleTypeList.push(utils.convertToTitleCase(type.replace(/-/g, ' ')));
                }
            }

            function failure(err) {
                console.log(err);
                setDefaultVehicle();
            }
        }

        //  query search for users [autocomplete]
        function userQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.user.name ? vm.possibleUserList.filter(createFilterForUsers(vm.user.name)) : vm.possibleUserList);

            if (results.length > 0) {
                return results;
            }

            amServices.getCustomerNames().then(populateUserList).catch(noUser);
            return tracker.promise;

            function populateUserList(res) {
                vm.possibleUserList = res;
                results = (vm.user.name ? vm.possibleUserList.filter(createFilterForUsers(vm.user.name)) : vm.possibleUserList);
                tracker.resolve(results);
            }

            function noUser(error) {
                results = [];
                tracker.resolve(results);
            }
        }

        //  create filter for users' query list
        function createFilterForUsers(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                return (angular.lowercase(item.name).indexOf(lcQuery) === 0);
            }
        }

        //  auto fill user details to entire service form when user name is selected
        function selectedUserChange() {
            if (vm.currentUser == null) {
                failure();
                return;
            }
            amServices.getCustomerChain(vm.currentUser.id).then(success).catch(failure);

            function success(res) {
                vm.user.id = res.id;
                vm.user.mobile = res.mobile;
                vm.user.email = res.email;
                vm.user.name = res.name;
                vm.user.address = (res.address == undefined) ? '' : res.address;
                if (res.memberships) {
                    vm.serviceType = (Object.keys(res.memberships).length > 0) ? vm.serviceTypeList[2] : vm.serviceTypeList[0];
                    Object.keys(res.memberships).forEach(iterateMemberships);
                }
                vm.possibleVehicleList = res.possibleVehicleList;
                vm.changeUserMobile(false);
                changeVehicle(vm.possibleVehicleList.length > 0 ? vm.possibleVehicleList[0].id : undefined);

                function iterateMemberships(membership) {
                    res.memberships[membership].name = membership;
                    vm.membershipChips.push(res.memberships[membership]);
                    adjustExistingMembership(res.memberships[membership]);
                }
            }

            function failure(err) {
                vm.user.id = '';
                vm.user.name = '';
                vm.user.mobile = '';
                vm.user.email = '';
                vm.user.address = '';
                vm.membershipChips = [];
                vm.possibleVehicleList = [];
                changeVehicle();
            }
        }

        //  change flagGetUserBasedOnMobile
        function changeUserMobile(bool) {
            flagGetUserBasedOnMobile = bool;
        }

        //  change user based on mobile number
        function selectUserBasedOnMobile() {
            if (vm.user.mobile != '' && (vm.user.id == '' || flagGetUserBasedOnMobile)) {
                vm.changeUserMobile(false);
                vm.loadingBasedOnMobile = true;
                amServices.getCustomerByMobile(vm.user.mobile).then(success).catch(failure);
            }

            function success(res) {
                vm.loadingBasedOnMobile = false;
                vm.user.id = res.id;
                vm.user.mobile = res.mobile;
                vm.user.email = res.email;
                vm.user.name = res.name;
                vm.user.address = (res.address == undefined) ? '' : res.address;
                if (res.memberships) {
                    if (Object.keys(res.memberships).length > 0)
                        vm.serviceType = vm.serviceTypeList[2];
                    Object.keys(res.memberships).forEach(iterateMemberships);
                }
                vm.possibleVehicleList = res.possibleVehicleList;
                changeVehicle(vm.possibleVehicleList.length > 0 ? vm.possibleVehicleList[0].id : undefined);

                function iterateMemberships(membership) {
                    res.memberships[membership].name = membership;
                    vm.membershipChips.push(res.memberships[membership]);
                    adjustExistingMembership(res.memberships[membership]);
                }
            }

            function failure(err) {
                vm.loadingBasedOnMobile = false;
                vm.user.id = '';
                vm.possibleVehicleList = [];
                changeVehicle();
            }
        }

        //  change vehicle related details when changed from UI
        function changeVehicle(id, manual) {
            if (!id) {
                setDefaultVehicle();
                setTimeout(focusVehicleManuf, 500);
                return;
            }
            var found = $filter('filter')(vm.possibleVehicleList, {
                id: id
            }, true);
            if (found.length > 0) {
                if (manual)
                    changeServiceInfoState(true);
                vm.currentVehicle = found[0].name;
                vm.vehicle.id = found[0].id;
                vm.vehicle.reg = found[0].reg;
                vm.vehicle.manuf = found[0].manuf;
                vm.vehicle.model = found[0].model;
                vm.vehicle.type = (found[0].type == undefined || found[0].type == '') ? vm.vehicleTypeList[0] : found[0].type;
                if (found[0].nextdue && (found[0].nextdue.localeCompare(moment().format()) > 0)) {
                    vm.isNextDueService = true;
                    vm.nextDueDate = new Date(found[0].nextdue);
                }
                changeVehicleType();
                autofillVehicle = true;
            } else
                setDefaultVehicle();
        }

        //  fail-safe mechanism for vehicle miss in database as well as currently loaded vehicle list
        function setDefaultVehicle() {
            vm.currentVehicle = 'New Vehicle';
            vm.vehicle.id = undefined;
            vm.vehicle.reg = '';
            vm.vehicle.manuf = '';
            vm.vehicle.model = '';
            if (vm.vehicleTypeList.length > 0) {
                vm.vehicle.type = vm.vehicleTypeList[0];
                changeVehicleType();
            }
            vm.isNextDueService = false;
            vm.nextDueDate = new Date();
            vm.nextDueDate.setMonth(vm.nextDueDate.getMonth() + 3);
            autofillVehicle = false;
        }

        //  choose different existing vehicle
        function chooseVehicle($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
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
            }
        }

        //  replace all the treatment values with updated vehicle type
        function changeVehicleType() {
            if (vm.vehicleTypeList.length < 1)
                return;
            vm.service.problems.forEach(iterateProblem);
            iterateProblem(vm.problem);
            calculatePackageTax();
            calculate();

            function iterateProblem(problem) {
                var found = $filter('filter')(vm.treatments, {
                    name: problem.details
                });
                if (found.length == 1) {
                    var rate = found[0].rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')];
                    var taxable = problem.amount;
                    problem.tax = {};
                    vm.taxSettings.forEach(iterateTaxes);
                    problem.rate = parseFloat(taxable);

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
            return true;
        }
        //  return boolean response to different configurations [END]

        //  populate regular treatment list
        function getRegularTreatments() {
            vm.problemPromise = amServices.getRegularTreatments().then(success).catch(failure);

            function success(res) {
                vm.treatments = res;
                loadTreatmentIntoProblems();
            }

            function failure(err) {
                vm.treatments = [];
                loadTreatmentIntoProblems();
            }
        }

        //  load treatment list into problem list
        function loadTreatmentIntoProblems() {
            vm.treatments.forEach(iterateTreatment);
            getTreatmentsTax();

            function iterateTreatment(treatment) {
                vm.service.problems.push({
                    details: treatment.name,
                    rate: treatment.rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')],
                    amount: treatment.rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')],
                    checked: false
                });
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

        function calculateDiscount() {
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

        function calculateCost() {
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
                vm.problem.amount = '';
                vm.problem.rate = '';
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
                changeUserInfoState(true);
                setTimeout(doFocus, 300);
                utils.showSimpleToast('Please Enter Name');

                function doFocus() {
                    $('#ami-user-name').focus();
                }
                return false
            }
            var isVehicleBlank = (vm.vehicle.manuf == undefined || vm.vehicle.manuf == '') && (vm.vehicle.model == undefined || vm.vehicle.model == '') && (vm.vehicle.reg == undefined || vm.vehicle.reg == '');

            if (isVehicleBlank) {
                changeVehicleInfoState(true);
                utils.showSimpleToast('Please Enter At Least One Vehicle Detail');
                return false;
            }
            return true;
        }

        //  save to database
        function save(redirect) {
            if (!validate()) return;
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
            if (vm.problem.details)
                finalizeNewProblem();
            vm.service.problems = vm.selectedProblems;
            var options = {
                isLastInvoiceNoChanged: (vm.service.invoiceno == olInvoiceNo),
                isLastEstimateNoChanged: (vm.service.estimateno == olEstimateNo),
                isLastJobCardNoChanged: (vm.service.jobcardno == olJobCardNo)
            }
            vm.user.memberships = vm.membershipChips;
            switch (vm.serviceType) {
                case vm.serviceTypeList[1]:
                    vm.packages.forEach(addPkToService);
                    break;
                case vm.serviceTypeList[2]:
                    vm.membershipChips.forEach(addMsToService);
                    break;
            }
            vm.service.status = vm.servicestatus ? 'paid' : 'due';
            vm.service.date = moment(vm.service.date).format();
            if (vm.isNextDueService)
                vm.vehicle.nextdue = moment(vm.nextDueDate).format();
            if (vm.isDiscountApplied)
                vm.service.discount = vm.discount;
            if (vm.isRoundOffVal) {
                vm.service['roundoff'] = vm.roundedOffVal;
            }
            vm.service.problems.forEach(iterateProblems);
            vm.service.taxes = {};
            vm.taxSettings.forEach(iterateTaxes);
            if (vm.inventory.name)
                finalizeNewInventory();
            vm.selectedInventories.forEach(iterateInventories);
            vm.service.inventories = vm.selectedInventories;
            switch (vm.service.state) {
                case vm.serviceStateList[0]:
                    delete vm.service.invoiceno;
                    delete vm.service.estimateno;
                    break;
                case vm.serviceStateList[1]:
                    delete vm.service.jobcardno;
                    delete vm.service.invoiceno;
                    break;
                case vm.serviceStateList[2]:
                    delete vm.service.jobcardno;
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
                delete problem['amount'];
                delete problem['$$hashKey'];
            }

            function iterateInventories(inventory) {
                delete inventory.checked;
                delete inventory['total'];
                delete inventory['amount'];
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
                        transitInterState = $state.params.fromState;
                        $state.params.fromState = 'invoice';
                        transitIds = {
                            userId: res.id.userId,
                            vehicleId: res.id.vehicleId,
                            serviceId: res.id.serviceId
                        }
                        break;
                }
                setTimeout(goBack, 100);
                utils.showSimpleToast('Successfully Added!');
            }

            //  !(save successfull)
            function failure(err) {
                utils.showSimpleToast('Failed to add. Please Try Again!');
            }
        }
    }
})();