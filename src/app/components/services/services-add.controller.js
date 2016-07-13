/**
 * Controller for Add Service module
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.4
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlSeCI', ServiceAddController)
        .controller('amCtrlMeD', MembershipEditDialogController);

    ServiceAddController.$inject = ['$scope', '$state', '$q', '$log', '$filter', '$timeout', '$mdEditDialog', '$mdDialog', '$mdSidenav', 'utils', 'amServices'];
    MembershipEditDialogController.$inject = ['$mdDialog', '$filter', 'membership', 'treatments'];

    /*
    ====== NOTE =======
    > Do not create new method named moment() since it is used by moment.js
    */

    function ServiceAddController($scope, $state, $q, $log, $filter, $timeout, $mdEditDialog, $mdDialog, $mdSidenav, utils, amServices) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var autofillVehicle = false,
            flagGetUserBasedOnMobile = true,
            olInvoiceNo = 1,
            olJobCardNo = 1,
            olEstimateNo = 1,
            transitIds = undefined,
            transitInterState = undefined,
            forceStopCalCost = false,
            serviceTcRo = 0,
            serviceTcDc = 0;

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
            problems: []
        };
        vm.problem = {
            details: '',
            rate: '',
            tax: '',
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
        vm.discountPercentage = 0;
        vm.discountValue = 0;
        vm.inventories = [];
        vm.selectedInventories = [];
        vm.inventory = {
            name: '',
            rate: '',
            tax: '',
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
        vm.calculateCost = calculateCost;
        vm.OnAddMembershipChip = OnAddMembershipChip;
        vm.navigateToSubscribeMembership = navigateToSubscribeMembership;
        vm.goBack = goBack;
        vm.changeProblemRate = changeProblemRate;
        vm.changeServiceTax = changeServiceTax;
        vm.OnServiceTaxEnabledChange = OnServiceTaxEnabledChange;
        vm.convertPbToTitleCase = convertPbToTitleCase;
        vm.calculateTax = calculateTax;
        vm.convertInToTitleCase = convertInToTitleCase;
        vm.changeVat = changeVat;
        vm.onInventorySelected = onInventorySelected;
        vm.onInventoryDeselected = onInventoryDeselected;
        vm.changeInventoryRate = changeInventoryRate;
        vm.inventoryQuerySearch = inventoryQuerySearch;
        vm.updateInventoryDetails = updateInventoryDetails;
        vm.finalizeNewInventory = finalizeNewInventory;
        vm.calculateVat = calculateVat;
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
        vm.IsTreatmentAmountEditable = IsTreatmentAmountEditable;
        vm.IsTreatmentAmountText = IsTreatmentAmountText;
        vm.IsPackageEnabled = IsPackageEnabled;
        vm.changeDisplayAsList = changeDisplayAsList;
        vm.IsTreatmentRateDisplayed = IsTreatmentRateDisplayed;
        vm.changeInventoryAsList = changeInventoryAsList;
        vm.IsInventoryTotalEditable = IsInventoryTotalEditable;
        vm.IsInventoryTotalText = IsInventoryTotalText;
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

        //  default execution steps
        setCoverPic();
        changeUserInfoState(true);   //  ammToDo: Enable this while commiting
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
            return (vm.isDiscountApplied || vm.isRoundOffVal || (vm.sTaxSettings && vm.sTaxSettings.applyTax) || (vm.vatSettings && vm.vatSettings.applyTax));
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
            vm.service.problems.forEach(iterateProblem);
            vm.selectedInventories.forEach(iterateInventories);
            if (vm.serviceType == vm.serviceTypeList[1]) {
                vm.packages.forEach(iteratePackages);
            }
            totalCost = (totalCost % 1 != 0) ? totalCost.toFixed(2) : parseInt(totalCost);
            return totalCost;

            function iterateProblem(element) {
                totalCost += parseFloat(element.rate ? (element.rate * (element.checked ? 1 : 0)) : 0);
            }

            function iterateInventories(element) {
                totalCost += parseFloat(element.rate ? ((element.rate * element.qty) * (element.checked ? 1 : 0)) : 0);
            }

            function iteratePackages(package) {
                if (!package.checked)
                    return;
                package.selectedTreatments.forEach(ipt);
            }

            function ipt(treatment) {
                totalCost += treatment.rate[vm.vehicle.type.toLowerCase().replace(' ', '-')];
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

        function IsInventoryTotalText() {
            return (vm.vatSettings && !vm.vatSettings.inclusive && vm.vatSettings.applyTax);
        }

        function IsInventoryTotalEditable() {
            return (vm.vatSettings && (vm.vatSettings.inclusive || !vm.vatSettings.applyTax));
        }

        function changeInventoryAsList(bool) {
            vm.displayInventoriesAsList = bool;
            setTimeout(focusShowAllInventoriesButton, 300);
        }

        function IsTreatmentRateDisplayed() {
            return (vm.sTaxSettings && vm.sTaxSettings.applyTax && !vm.sTaxSettings.inclusive);
        }

        function changeDisplayAsList(bool) {
            vm.displayTreatmentAsList = bool;
            setTimeout(focusShowAllTreatmentsButton, 300);
        }

        function IsPackageEnabled() {
            return (vm.packages.length < 1);
        }

        function IsTreatmentAmountText() {
            return (vm.sTaxSettings && !vm.sTaxSettings.inclusive && vm.sTaxSettings.applyTax);
        }

        function IsTreatmentAmountEditable() {
            return (vm.sTaxSettings && (vm.sTaxSettings.inclusive || !vm.sTaxSettings.applyTax));
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

        function calculateVat() {
            var totalTax = 0.0;
            vm.selectedInventories.forEach(iterateInventories);
            totalTax = (totalTax % 1 != 0) ? totalTax.toFixed(2) : totalTax;
            return totalTax;

            function iterateInventories(element) {
                if ((vm.vatSettings && !vm.vatSettings.applyTax) || !element.tax || !element.checked)
                    return;
                totalTax += parseFloat(element.tax * element.qty);
            }
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

        function finalizeNewInventory(btnClicked) {
            vm.inventory.name = vm.inventory.name.trim();
            if (vm.inventory.name != '') {
                var found = $filter('filter')(vm.inventories, {
                    name: vm.inventory.name
                }, true);
                if (found.length == 1) {
                    found[0].checked = true;
                    found[0].rate = vm.inventory.rate;
                    found[0].tax = vm.inventory.tax;
                    found[0].qty = vm.inventory.qty;
                    found[0].amount = vm.inventory.amount;
                    found[0].total = vm.inventory.total;
                    vm.selectedInventories.push(found[0]);
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
                calculateCost();
                setTimeout(focusNewInventoryName, 300);
            }
            if (btnClicked)
                setTimeout(focusNewInventoryName, 300);

            function focusNewInventoryName() {
                $('#new-inventory-name input').focus();
            }
        }

        function updateInventoryDetails() {
            var found = $filter('filter')(vm.inventories, {
                name: vm.inventory.name
            });
            vm.inventory.amount = (vm.inventory.rate == '') ? 0 : vm.inventory.rate;
            if (found.length == 1) {
                var rate;
                if (vm.vatSettings.applyTax)
                    rate = (vm.vatSettings.inclusive) ? found[0].amount : found[0].rate;
                else
                    rate = found[0].rate;
                vm.inventory.amount = (rate == '' || rate == undefined ? vm.inventory.amount : rate);
                if (vm.vatSettings.applyTax) {
                    if (vm.vatSettings.inclusive) {
                        vm.inventory.rate = (vm.inventory.amount * 100) / (vm.vatSettings.tax + 100);
                        vm.inventory.tax = (vm.inventory.rate * vm.vatSettings.tax / 100);
                    } else {
                        vm.inventory.rate = (rate == '' || rate == undefined ? vm.inventory.rate : rate);
                        vm.inventory.tax = (vm.inventory.rate * vm.vatSettings.tax / 100);
                        vm.inventory.amount = Math.round(vm.inventory.rate + vm.inventory.tax);
                    }
                } else {
                    if (vm.vatSettings.inclusive)
                        vm.inventory.rate = (rate == '' || rate == undefined ? vm.inventory.rate : rate);
                    else {
                        vm.inventory.amount = (rate == '' || rate == undefined ? vm.inventory.amount : rate);
                        vm.inventory.rate = (rate == '' || rate == undefined ? vm.inventory.rate : rate);
                    }
                }
                vm.inventory.total = vm.inventory.amount * vm.inventory.qty;
            } else {
                vm.inventory.rate = '';
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
                getVatSettings();
            }

            function failure(err) {
                vm.inventories = [];
                getVatSettings();
            }
        }

        function getVatSettings() {
            amServices.getVatSettings().then(success).catch(failure);

            function success(res) {
                vm.vatSettings = res;
                vm.orgApplyVat = res.applyTax;
                changeVat();
            }

            function failure(err) {
                vm.vatSettings = {};
            }
        }

        function convertInToTitleCase() {
            vm.inventory.name = utils.autoCapitalizeWord(vm.inventory.name);
        }

        function changeVat() {
            vm.inventories.forEach(iterateInventories);
            changeInventoryRate(vm.inventory, true);

            function iterateInventories(inventory) {
                changeInventoryRate(inventory, true);
            }
        }

        function changeQty(inventory) {
            inventory.total = ((vm.vatSettings.applyTax ? inventory.amount : inventory.rate) * inventory.qty);
            calculateCost();

            if (!vm.vatSettings.applyTax)
                inventory.amount = inventory.rate;
        }

        function changeInventoryRate(inventory, force) {
            if (vm.vatSettings.applyTax) {
                if (vm.vatSettings.inclusive) {
                    inventory.rate = (inventory.amount * 100) / (vm.vatSettings.tax + 100);
                    inventory.tax = (inventory.rate * vm.vatSettings.tax / 100);
                } else {
                    if (!inventory.rate)
                        inventory.rate = inventory.amount;
                    inventory.tax = (inventory.rate * vm.vatSettings.tax / 100);
                    inventory.amount = inventory.rate + inventory.tax;
                }
            } else if (force) {
                if (vm.vatSettings.inclusive)
                    inventory.rate = inventory.amount;
                else
                    inventory.amount = inventory.rate;
            } else
                inventory.rate = inventory.amount;
            changeQty(inventory);
            calculateCost();
        }

        function convertPbToTitleCase() {
            vm.problem.details = utils.autoCapitalizeWord(vm.problem.details);
        }

        function OnServiceTaxEnabledChange() {
            vm.service.problems.forEach(iterateProblems);
            calculatePackageTax();

            function iterateProblems(problem) {
                changeProblemRate(problem, true);
            }
        }

        function changeServiceTax() {
            vm.service.problems.forEach(iterateProblems);
            changeProblemRate(vm.problem, true);
            calculatePackageTax();

            function iterateProblems(problem) {
                changeProblemRate(problem, true);
            }
        }

        function changeProblemRate(problem, force) {
            if (vm.sTaxSettings.applyTax) {
                if (vm.sTaxSettings.inclusive) {
                    problem.rate = (problem.amount * 100) / (vm.sTaxSettings.tax + 100);
                    problem.tax = (problem.rate * vm.sTaxSettings.tax / 100);
                } else {
                    if (!problem.rate)
                        problem.rate = problem.amount;
                    problem.tax = (problem.rate * vm.sTaxSettings.tax / 100);
                    problem.amount = problem.rate + problem.tax;
                }
            } else if (force) {
                if (vm.sTaxSettings.inclusive)
                    problem.rate = problem.amount;
                else
                    problem.amount = problem.rate;
            } else
                problem.rate = problem.amount;
            calculateCost();
        }

        function getServiceTaxSettings() {
            amServices.getServiceTaxSettings().then(success).catch(failure);

            function success(res) {
                vm.sTaxSettings = res;
                vm.orgApplyTax = res.applyTax;
                changeServiceTax();
                getPackages();
                OnServiceTaxEnabledChange();
            }

            function failure(err) {
                vm.sTaxSettings = {};
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
                templateUrl: 'app/components/services/service_membership.edit-template.html',
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
                        calculateCost();
                        return total;

                        function it(t) {
                            total += t.amount[vm.vehicle.type.toLowerCase().replace(' ', '-')];
                        }
                    }

                    function changeTreatmentTax(treatment, force) {
                        var cvt = vm.vehicle.type.toLowerCase().replace(' ', '-');
                        if (vm.sTaxSettings.applyTax) {
                            if (treatment.tax == undefined)
                                treatment.tax = {};
                            if (vm.sTaxSettings.inclusive) {
                                treatment.rate[cvt] = (treatment.amount[cvt] * 100) / (vm.sTaxSettings.tax + 100);
                                treatment.tax[cvt] = (treatment.rate[cvt] * vm.sTaxSettings.tax / 100);
                            } else {
                                treatment.tax[cvt] = (treatment.rate[cvt] * vm.sTaxSettings.tax / 100);
                                treatment.amount[cvt] = treatment.rate[cvt] + treatment.tax[cvt];
                            }
                        } else if (force) {
                            if (vm.sTaxSettings.inclusive)
                                treatment.rate[cvt] = treatment.amount[cvt];
                            else
                                treatment.amount[cvt] = treatment.rate[cvt];
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
            vm.service.problems.forEach(iterateProblem);
            calculatePackageTax();
            calculateCost();

            function iterateProblem(problem) {
                var found = $filter('filter')(vm.treatments, {
                    name: problem.details
                });
                if (found.length == 1) {
                    var rate = found[0].rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')];
                    if (vm.sTaxSettings.applyTax) {
                        if (vm.sTaxSettings.inclusive) {
                            problem.amount = (rate == '' || rate == undefined ? problem.amount : rate);
                            problem.rate = (problem.amount * 100) / (vm.sTaxSettings.tax + 100);
                            problem.tax = (problem.rate * vm.sTaxSettings.tax / 100);
                        } else {
                            problem.rate = (rate == '' || rate == undefined ? problem.rate : rate);
                            problem.tax = (problem.rate * vm.sTaxSettings.tax / 100);
                            problem.amount = problem.rate + problem.tax;
                        }
                    } else {
                        problem.rate = (rate == '' || rate == undefined ? problem.rate : rate);
                        problem.amount = (rate == '' || rate == undefined ? problem.rate : rate);
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
            getServiceTaxSettings();

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
            if (vm.isDiscountApplied) {
                vm.discountValue =  serviceTcDc - vm.service.cost;
                calculateDiscount(false);
            } else if (vm.isRoundOffVal)
                vm.roundedOffVal = vm.service.cost - serviceTcRo;
        }

        function calculateRoundOff(isRoundOffManual) {
            if (!isRoundOffManual) {
                var ot = totalCost = vm.service.cost;
                totalCost = vm.isRoundOffVal ? Math.floor(totalCost * 0.1) * 10 : totalCost;
                vm.roundedOffVal = (totalCost - ot);
            }
            calculateCost();
        }

        function calculateDiscount(isDiscountByPercent) {
            var totalCost = vm.service.cost;
            if (isDiscountByPercent) {
                vm.discountValue = totalCost * parseFloat(vm.discountPercentage) / 100;
                vm.discountValue = (isNaN(vm.discountValue) || vm.discountValue == null) ? '' : vm.discountValue;
            } else if (vm.discountValue != '')
                vm.discountPercentage = 100 * parseFloat(vm.discountValue) / totalCost;
            calculateCost();
        }

        function changeForceStopCalCost(bool) {
            forceStopCalCost = bool;
        }

        function calculateCost() {
            if (forceStopCalCost)
                return;
            var totalCost = 0;
            vm.service.problems.forEach(iterateProblem);
            vm.selectedInventories.forEach(iterateInventories);
            if (vm.serviceType == vm.serviceTypeList[1]) {
                vm.packages.forEach(iteratePackages);
            }
            serviceTcDc = totalCost;
            if (vm.isDiscountApplied) {
                totalCost = vm.isDiscountApplied && !isNaN(vm.discountValue) ? totalCost - vm.discountValue : totalCost;
            }
            serviceTcRo = totalCost;
            if (vm.isRoundOffVal) {
                totalCost += parseFloat(vm.roundedOffVal);
                serviceTcDc += parseFloat(vm.roundedOffVal);
            }
            totalCost = (totalCost % 1 != 0) ? totalCost.toFixed(2) : totalCost;
            totalCost = (totalCost % 1).toFixed(2) == 0.00 ? Math.round(totalCost) : totalCost;
            vm.service.cost = totalCost;

            function iterateProblem(element) {
                totalCost += parseFloat(element.amount ? (element.amount * (element.checked ? 1 : 0)) : 0);
            }

            function iterateInventories(element) {
                totalCost += parseFloat(element.total ? (element.total * (element.checked ? 1 : 0)) : 0);
            }

            function iteratePackages(package) {
                if (!package.checked)
                    return;
                package.selectedTreatments.forEach(ipt);
            }

            function ipt(treatment) {
                totalCost += treatment.amount[vm.vehicle.type.toLowerCase().replace(' ', '-')];
            }
        }

        function calculateTax() {
            var totalTax = 0.0;
            vm.service.problems.forEach(iterateProblems);
            if (vm.serviceType == vm.serviceTypeList[1])
                vm.packages.forEach(iteratePackages);
            totalTax = (totalTax % 1 != 0) ? totalTax.toFixed(2) : parseInt(totalTax);
            return totalTax;

            function iterateProblems(problem) {
                if ((vm.sTaxSettings && !vm.sTaxSettings.applyTax) || !problem.tax || !problem.checked)
                    return;
                totalTax += parseFloat(problem.tax);
            }

            function iteratePackages(package) {
                if (!package.checked)
                    return;
                package.selectedTreatments.forEach(ipt);
            }

            function ipt(treatment) {
                if ((vm.sTaxSettings && !vm.sTaxSettings.applyTax) || !treatment.tax)
                    return;
                totalTax += parseFloat(treatment.tax[vm.vehicle.type.toLowerCase().replace(' ', '-')]);
            }
        }

        function finalizeNewProblem(btnClicked) {
            vm.problem.details = vm.problem.details.trim();
            if (vm.problem.details != '') {
                var found = $filter('filter')(vm.service.problems, {
                    details: vm.problem.details
                }, true);
                if (found.length == 1) {
                    found[0].checked = true;
                    found[0].rate = vm.problem.rate;
                    found[0].tax = vm.problem.tax;
                    found[0].amount = vm.problem.amount;
                    vm.selectedProblems.push(found[0]);
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
                vm.problem.tax = '';
                calculateCost();
                setTimeout(focusNewProblemDetails, 300);
            }
            if (btnClicked)
                setTimeout(focusNewProblemDetails, 300);

            function focusNewProblemDetails() {
                $('#new-problem-details input').focus();
            }
        }

        function updateTreatmentDetails() {
            var found = $filter('filter')(vm.treatments, {
                name: vm.problem.details
            });
            vm.problem.amount = (vm.problem.rate == '') ? 0 : vm.problem.rate;
            if (found.length == 1) {
                var rate = found[0].rate[angular.lowercase(vm.vehicle.type).replace(/\s/g, '-')];
                vm.problem.amount = (rate == '' || rate == undefined ? vm.problem.amount : rate);
                if (vm.sTaxSettings.applyTax) {
                    if (vm.sTaxSettings.inclusive) {
                        vm.problem.rate = (vm.problem.amount * 100) / (vm.sTaxSettings.tax + 100);
                        vm.problem.tax = (vm.problem.rate * vm.sTaxSettings.tax / 100);
                    } else {
                        vm.problem.rate = (rate == '' || rate == undefined ? vm.problem.rate : rate);
                        vm.problem.tax = (vm.problem.rate * vm.sTaxSettings.tax / 100);
                        vm.problem.amount = vm.problem.rate + vm.problem.tax;
                    }
                } else {
                    if (vm.sTaxSettings.inclusive)
                        vm.problem.rate = (rate == '' || rate == undefined ? vm.problem.rate : rate);
                    else
                        vm.problem.amount = (rate == '' || rate == undefined ? vm.problem.amount : rate);
                }
            } else
                vm.problem.rate = '';
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
            if (vm.isDiscountApplied) {
                vm.service['discount'] = {
                    percent: parseFloat(vm.discountPercentage),
                    amount: parseFloat(vm.discountValue)
                }
            }
            if (vm.isRoundOffVal) {
                vm.service['roundoff'] = vm.roundedOffVal;
            }
            vm.service.problems.forEach(iterateProblems);
            if (vm.sTaxSettings != undefined) {
                vm.service.serviceTax = {
                    applyTax: vm.sTaxSettings.applyTax,
                    taxIncType: (vm.sTaxSettings.inclusive) ? 'inclusive' : 'exclusive',
                    tax: vm.sTaxSettings.tax
                };
            }
            if (vm.vatSettings != undefined) {
                vm.service.vat = {
                    applyTax: vm.vatSettings.applyTax,
                    taxIncType: (vm.vatSettings.inclusive) ? 'inclusive' : 'exclusive',
                    tax: vm.vatSettings.tax
                }
            }
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
                if (!vm.sTaxSettings || (vm.sTaxSettings && !vm.sTaxSettings.applyTax && vm.sTaxSettings.inclusive))
                    problem.rate = problem.amount;
                delete problem.checked;
                delete problem['amount'];
                delete problem['$$hashKey'];
            }

            function iterateInventories(inventory) {
                if (!vm.vatSettings || (vm.vatSettings && vm.vatSettings.applyTax && vm.vatSettings.inclusive))
                    inventory.rate = inventory.amount;
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

    function MembershipEditDialogController($mdDialog, $filter, membership, treatments) {
        var editMsVm = this;
        editMsVm.treatment = {
            details: ''
        };
        editMsVm.membership = {
            name: membership.name,
            occurences: membership.occurences,
            duration: membership.duration
        };
        editMsVm.selectedTreatments = [];
        editMsVm.treatments = treatments;
        editMsVm.confirmDialog = confirmDialog;
        editMsVm.treatmentQuerySearch = treatmentQuerySearch;
        editMsVm.finalizeNewTreatment = finalizeNewTreatment;
        editMsVm.updateTreatmentDetails = updateTreatmentDetails;

        loadDefaultOccDur();
        loadMemberships();

        function loadMemberships() {
            membership.treatments.forEach(iterateTreatments);

            function iterateTreatments(treatment) {
                var found = $filter('filter')(editMsVm.treatments, {
                    name: treatment.name
                }, true);

                if (found.length == 1) {
                    found[0].given.occurences = treatment.given.occurences;
                    found[0].given.duration = treatment.given.duration;
                    found[0].used.occurences = treatment.used.occurences;
                    found[0].used.duration = treatment.used.duration;
                    editMsVm.selectedTreatments.push(found[0]);
                } else {
                    editMsVm.treatments.push(treatment);
                    editMsVm.selectedTreatments.push(editMsVm.treatments[editMsVm.treatments.length - 1]);
                }
            }
        }

        function updateTreatmentDetails() {
            var found = $filter('filter')(editMsVm.treatments, {
                name: editMsVm.treatment.details
            });
            if (found.length == 1 && found[0].name == editMsVm.treatment.details) {
                editMsVm.treatment.occurences = found[0].given.occurences;
                editMsVm.treatment.duration = found[0].given.duration;
            } else {
                editMsVm.treatment.occurences = editMsVm.membership.occurences
                editMsVm.treatment.duration = editMsVm.membership.duration;
            }
        }

        //  query search for treatments [autocomplete]
        function treatmentQuerySearch() {
            var tracker = $q.defer();
            var results = (editMsVm.treatment.details ? editMsVm.treatments.filter(createFilterForTreatments(editMsVm.treatment.details)) : editMsVm.treatments);

            return results;
        }

        //  create filter for users' query list
        function createFilterForTreatments(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                return (angular.lowercase(item.name).indexOf(lcQuery) === 0);
            }
        }

        function finalizeNewTreatment(btnClicked) {
            editMsVm.treatment.details = editMsVm.treatment.details.trim();
            if (editMsVm.treatment.details != '') {
                var found = $filter('filter')(editMsVm.treatments, {
                    name: editMsVm.treatment.details
                }, true);
                if (found.length == 1 && found[0].name == editMsVm.treatment.details) {
                    found[0].checked = true;
                    found[0].rate = editMsVm.treatment.rate;
                    found[0].given.duration = editMsVm.treatment.duration;
                    found[0].given.occurences = editMsVm.treatment.occurences;
                    found[0].used.duration = 0;
                    found[0].used.occurences = 0;
                    editMsVm.selectedTreatments.push(found[0]);
                } else {
                    editMsVm.treatments.push({
                        name: editMsVm.treatment.details,
                        rate: editMsVm.treatment.rate,
                        given: {
                            duration: editMsVm.treatment.duration,
                            occurences: editMsVm.treatment.occurences,
                        },
                        used: {
                            duration: 0,
                            occurences: 0
                        },
                        checked: true
                    });
                    editMsVm.selectedTreatments.push(editMsVm.treatments[editMsVm.treatments.length - 1]);
                }
                editMsVm.treatment.details = '';
                editMsVm.treatment.rate = {};
                editMsVm.treatment.occurences = editMsVm.membership.occurences;
                editMsVm.treatment.duration = editMsVm.membership.duration;
                angular.element('#new-treatment-details').find('input')[0].focus();
            }
            if (btnClicked)
                angular.element('#new-treatment-details').find('input')[0].focus();
        }

        function loadDefaultOccDur() {
            editMsVm.treatments.forEach(iterateTreatments);

            function iterateTreatments(treatment) {
                if (!treatment.given) {
                    treatment.given = {
                        occurences: membership.occurences,
                        duration: membership.duration
                    }
                }
                if (!treatment.used) {
                    treatment.used = {
                        occurences: 0,
                        duration: 0
                    }
                }
            }
        }

        function confirmDialog() {
            membership.treatments = editMsVm.selectedTreatments;
            membership.selectedTreatments = [];
            membership.treatments.forEach(makeSelectedTreatments);
            $mdDialog.hide();

            function makeSelectedTreatments(treatment) {
                if (membership.calculateTOccurenceLeft(treatment) != 0 && membership.calculateTDurationLeft(treatment) != 0) {
                    treatment.checked = true;
                    membership.selectedTreatments.push(treatment);
                } else
                    treatment.checked = false;
            }
        }
    }
})();