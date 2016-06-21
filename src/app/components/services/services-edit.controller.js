/**
 * Controller for Edit Service component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.1
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlSeUI', ServiceEditController)
        .controller('amCtrlMeD', MembershipEditDialogController);

    ServiceEditController.$inject = ['$state', '$q', '$log', '$filter', '$mdEditDialog', '$mdDialog', 'utils', 'amServices'];
    MembershipEditDialogController.$inject = ['$mdDialog', '$filter', 'membership', 'treatments'];

    /*
    ====== NOTE =======
    > Do not create new method named moment() since it is used by moment.js
    */

    function ServiceEditController($state, $q, $log, $filter, $mdEditDialog, $mdDialog, utils, amServices) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var autofillVehicle = false,
            isDiscountByPercent = true,
            isManualRoundOff = false,
            isFirstTimeLoad = true,
            serviceTotalCost = 0,
            forceStopCalCost = false;

        //  vm assignments to keep track of UI related elements
        vm.label_userMobile = 'Enter Mobile Number:';
        vm.label_userEmail = 'Enter Email:';
        vm.label_userAddress = 'Enter Address:';
        vm.label_vehicleReg = 'Enter Vehicle Registration Number:';
        vm.label_vehicleManuf = 'Manufacturer:';
        vm.label_vehicleModel = 'Model:';
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
            invoiceno: 1,
            status: '',
            problems: []
        };
        vm.problem = {
            details: '',
            rate: '',
            tax: '',
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

        //  function maps
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.convertRegToCaps = convertRegToCaps;
        vm.searchVehicleChange = searchVehicleChange;
        vm.manufacturersQuerySearch = manufacturersQuerySearch;
        vm.modelQuerySearch = modelQuerySearch;
        vm.changeUserMobileLabel = changeUserMobileLabel;
        vm.changeUserEmailLabel = changeUserEmailLabel;
        vm.changeVehicleRegLabel = changeVehicleRegLabel;
        vm.changeVehicleTab = changeVehicleTab;
        vm.changeVehicleType = changeVehicleType;
        vm.treatmentsQuerySearch = treatmentsQuerySearch;
        vm.onProblemSelected = onProblemSelected;
        vm.onProblemDeselected = onProblemDeselected;
        vm.isAddOperation = isAddOperation;
        vm.changeServiceTab = changeServiceTab;
        vm.updateTreatmentDetails = updateTreatmentDetails;
        vm.finalizeNewProblem = finalizeNewProblem;
        vm.save = save;
        vm.changeUserAddressLabel = changeUserAddressLabel;
        vm.queryMembershipChip = queryMembershipChip;
        vm.OnClickMembershipChip = OnClickMembershipChip;
        vm.calculateCost = calculateCost;
        vm.OnAddMembershipChip = OnAddMembershipChip;
        vm.navigateToSubscriptMembership = navigateToSubscriptMembership;
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
        vm.populateRoundOffVal = populateRoundOffVal;
        vm.changeForceStopCalCost = changeForceStopCalCost;

        //  default execution steps
        getVehicleTypes();
        changeServiceTab(true);
        getPackages();
        getMemberships();

        //  function definitions

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
                totalTax += parseFloat(element.tax.toFixed(2) * (element.qty ? element.qty : 1));
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
                $('#new-inventory-name').focus();
            }
            if (btnClicked)
                $('#new-inventory-name').focus();
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
                    else
                        vm.inventory.amount = (rate == '' || rate == undefined ? vm.inventory.amount : rate);
                }
                vm.inventory.total = vm.inventory.amount * vm.inventory.qty;
            } else {
                vm.inventory.rate = '';
                vm.inventory.total = '';
            }
        }

        function changeQty(inventory) {
            inventory.total = (inventory.rate * inventory.qty) + (inventory.tax * inventory.qty);
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
                existingInventories.forEach(iterateInventories);
                getVatSettings();

                function iterateInventories(inventory) {
                    if (inventory.name != '') {
                        if (inventory.qty == undefined)
                            inventory.qty = 1;
                        var found = $filter('filter')(vm.inventories, {
                            name: inventory.name
                        }, true);
                        if (found.length == 1) {
                            found[0].checked = true;
                            found[0].amount = inventory.rate;
                            found[0].qty = inventory.qty;
                            vm.selectedInventories.push(found[0]);
                        } else {
                            vm.inventories.push({
                                name: inventory.name,
                                amount: inventory.rate,
                                qty: inventory.qty,
                                checked: true
                            });
                            vm.selectedInventories.push(vm.inventories[vm.inventories.length - 1]);
                        }
                    }
                }
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
                if (vm.service.vat != undefined) {
                    vm.vatSettings.applyTax = vm.service.vat.applyTax;
                    vm.vatSettings.tax = vm.service.vat.tax;
                    if (!res.applyTax)
                        vm.orgApplyVat = vm.service.vat.applyTax;
                    vm.vatSettings.inclusive = (vm.service.vat.taxIncType == 'inclusive') ? true : false;
                }
                changeVat();
            }

            function failure(err) {
                vm.vatSettings = {};
            }
        }

        function convertInToTitleCase() {
            vm.inventory.name = utils.convertToTitleCase(vm.inventory.name);
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
            if (vm.vatSettings.applyTax) {
                if (vm.vatSettings.inclusive) {
                    inventory.rate = (inventory.amount * 100) / (vm.vatSettings.tax + 100);
                    inventory.tax = (inventory.rate * vm.vatSettings.tax / 100);
                } else {
                    if (!inventory.rate)
                        inventory.rate = inventory.amount;
                    inventory.tax = (inventory.rate * vm.vatSettings.tax / 100);
                    inventory.amount = Math.round(inventory.rate + inventory.tax);
                }
            } else if (force) {
                if (vm.vatSettings.inclusive)
                    inventory.rate = inventory.amount;
                else
                    inventory.amount = inventory.rate;
            }
            changeQty(inventory);
            calculateCost();
        }

        function convertPbToTitleCase() {
            vm.problem.details = utils.convertToTitleCase(vm.problem.details);
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
            calculatePackageTax();
            changeProblemRate(vm.problem, true);

            function iterateProblems(problem) {
                changeProblemRate(problem, true);
            }
        }

        function changeProblemRate(problem, force) {
            if (vm.sTaxSettings.applyTax) {
                if (vm.sTaxSettings.inclusive) {
                    if (!problem.amount) {
                        var r = parseFloat(problem.rate)
                        problem.amount = Math.round(r + (r * vm.sTaxSettings.tax / 100));
                    }
                    problem.rate = (problem.amount * 100) / (vm.sTaxSettings.tax + 100);
                    problem.tax = (problem.rate * vm.sTaxSettings.tax / 100);
                } else {
                    if (!problem.rate)
                        problem.rate = problem.amount;
                    problem.tax = (problem.rate * vm.sTaxSettings.tax / 100);
                    problem.amount = Math.round(problem.rate + problem.tax);
                }
            } else if (force) {
                if (vm.sTaxSettings.inclusive) {
                    if (!problem.amount)
                        problem.amount = parseFloat(problem.rate);
                    problem.rate = problem.amount;
                } else
                    problem.amount = problem.rate;
            }
            calculateCost();
        }

        function getServiceTaxSettings() {
            amServices.getServiceTaxSettings().then(success).catch(failure);

            function success(res) {
                vm.sTaxSettings = res;
                vm.orgApplyTax = res.applyTax;
                if (vm.service.serviceTax != undefined) {
                    vm.sTaxSettings.applyTax = vm.service.serviceTax.applyTax;
                    vm.sTaxSettings.tax = vm.service.serviceTax.tax;
                    if (!res.applyTax)
                        vm.orgApplyTax = vm.service.serviceTax.applyTax;
                    vm.sTaxSettings.inclusive = (vm.service.serviceTax.taxIncType == 'inclusive') ? true : false;
                }
                vm.service.problems.forEach(iterateProblems);
                changeServiceTax();
                OnServiceTaxEnabledChange();

                function iterateProblems(problem) {
                    if (problem.checked)
                        delete problem.amount;
                }
            }

            function failure(err) {
                vm.sTaxSettings = {};
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
                            id: $state.params.userId,
                            openTab: 'services'
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

        function navigateToSubscriptMembership() {
            vm.userTab = true;
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
                    package.selectedTreatments = [];
                    package.onTreatmentSelected = onTreatmentSelected;
                    package.onTreatmentDeselected = onTreatmentDeselected;
                    package.calculatePackageTotal = calculatePackageTotal;
                    package.changeTreatmentTax = changeTreatmentTax;
                    package.expandPackage = expandPackage;
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
                                treatment.amount[cvt] = Math.round(treatment.rate[cvt] + treatment.tax[cvt]);
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
                vm.user.name = res.name;
                vm.user.email = res.email;
                vm.user.mobile = res.mobile;
                vm.user.address = res.address;
                changeUserEmailLabel();
                changeUserMobileLabel();
                changeUserAddressLabel();
                if (res.memberships)
                    Object.keys(res.memberships).forEach(iterateMemberships);
                vm.vehicle.id = $state.params.vehicleId;
                vm.vehicle.reg = res.vehicle.reg;
                changeVehicleRegLabel();
                vm.vehicle.manuf = res.vehicle.manuf;
                vm.vehicle.model = res.vehicle.model;
                vm.vehicle.type = res.vehicle.type;
                if (res.vehicle.service.packages) {
                    vm.serviceType = vm.serviceTypeList[1];
                    Object.keys(res.vehicle.service.packages).forEach(iteratePackages);
                }
                if (res.vehicle.service.memberships) {
                    vm.serviceType = vm.serviceTypeList[2];
                    Object.keys(res.vehicle.service.memberships).forEach(addMemberships);
                }
                vm.service.id = $state.params.serviceId;
                vm.service.date = new Date(res.vehicle.service.date);
                vm.service.cost = res.vehicle.service.cost;
                vm.service.odo = res.vehicle.service.odo;
                vm.service.invoiceno = res.vehicle.service.invoiceno;
                vm.service.status = res.vehicle.service.status;
                if (res.vehicle.service.discount) {
                    vm.isDiscountApplied = true;
                    vm.discountPercentage = res.vehicle.service.discount.percent;
                    vm.discountValue = res.vehicle.service.discount.amount;
                }
                if (res.vehicle.service.roundoff) {
                    vm.isRoundOffVal = true;
                    vm.roundedOffVal = res.vehicle.service.roundoff;
                }
                if (res.vehicle.service.serviceTax != undefined)
                    vm.service.serviceTax = res.vehicle.service.serviceTax;
                if (res.vehicle.service.vat != undefined)
                    vm.service.vat = res.vehicle.service.vat;
                vm.servicestatus = (res.vehicle.service.status == 'paid');
                getRegularTreatments(res.vehicle.service.problems);
                getInventories(res.vehicle.service.inventories);

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
                            var ft = $filter('filter')(found[0].treatments, {
                                name: treatment
                            }, true);

                            if (ft.length == 1) {
                                ft[0].checked = true;
                                found[0].selectedTreatments.push(ft[0]);
                            }
                        }
                    } else {
                        $log.info('Something with package');
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
                            problem.amount = Math.round(problem.rate + problem.tax);
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
            return false;
        }
        //  return boolean response to different configurations [END]

        //  change vehicle tab selector variable
        function changeVehicleTab(bool) {
            vm.vehicleTab = bool;
        }

        //  change service tab selector variable
        function changeServiceTab(bool) {
            vm.serviceTab = bool;
        }

        //  listen to changes in input fields [BEGIN]
        function changeUserMobileLabel(force) {
            vm.largeUserMobileLabel = (force != undefined || vm.user.mobile != '');
            vm.label_userMobile = vm.largeUserMobileLabel ? 'Mobile:' : 'Enter Mobile Number:';
        }

        function changeUserEmailLabel(force) {
            vm.largeUserEmailLabel = (force != undefined || vm.user.email != '');
            vm.label_userEmail = vm.largeUserEmailLabel ? 'Email:' : 'Enter Email:';
        }

        function changeUserAddressLabel(force) {
            vm.isUserAddress = (force != undefined || vm.user.address != '');
            vm.label_userAddress = vm.isUserAddress ? 'Address:' : 'Enter Address:';
        }

        function changeVehicleRegLabel(force) {
            vm.largeVehicleRegLabel = (force != undefined || vm.vehicle.reg != '');
            vm.label_vehicleReg = vm.largeVehicleRegLabel ? 'Vehicle Registration Number:' : 'Enter Vehicle Registration Number:';
        }
        //  listen to changes in input fields [END]

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
            getServiceTaxSettings();

            function iterateProblem(problem) {
                var found = $filter('filter')(vm.service.problems, {
                    details: problem.details
                });
                if (found.length == 1) {
                    found[0].checked = true;
                    found[0].rate = problem.rate;
                    found[0].amount = Math.round(problem.rate);
                    found[0].tax = problem.tax;
                    vm.selectedProblems.push(found[0]);
                } else {
                    vm.service.problems.push({
                        details: problem.details,
                        rate: problem.rate,
                        amount: Math.round(problem.rate),
                        tax: problem.tax,
                        checked: true
                    });
                    vm.selectedProblems.push(vm.service.problems[vm.service.problems.length - 1]);
                }
            }

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

        function populateRoundOffVal() {
            vm.roundedOffVal = vm.service.cost - serviceTotalCost;
        }

        function changeForceStopCalCost(bool) {
            forceStopCalCost = bool;
            isManualRoundOff = true; 
        }

        function calculateCost(isDbp, isMro) {
            if (forceStopCalCost)
                return;
            isDiscountByPercent = (isDbp != undefined) ? isDbp : isDiscountByPercent;
            isManualRoundOff = (isMro != undefined) ? isMro : isManualRoundOff;
            var totalCost = 0;
            serviceTotalCost = 0;
            vm.service.problems.forEach(iterateProblem);
            vm.selectedInventories.forEach(iterateInventories);
            if (vm.serviceType == vm.serviceTypeList[1]) {
                vm.packages.forEach(iteratePackages);
            }
            if (vm.isDiscountApplied) {
                if (isDiscountByPercent) {
                    var dv = totalCost * parseFloat(vm.discountPercentage) / 100;
                    totalCost = vm.isDiscountApplied && !isNaN(dv) ? totalCost - dv : totalCost;
                    vm.discountValue = (dv % 1 != 0) ? dv.toFixed(2) : dv;
                    vm.discountValue = (vm.discountValue % 1).toFixed(2) == 0.00 ? Math.round(vm.discountValue) : vm.discountValue;
                    vm.discountValue = (isNaN(vm.discountValue) || vm.discountValue == null) ? '' : vm.discountValue;
                    totalCost = (totalCost % 1).toFixed(2) == 0.00 ? Math.round(totalCost) : totalCost;
                    delete dv;
                } else if (vm.discountValue != '') {
                    var dv = parseFloat(vm.discountValue);
                    vm.discountPercentage = 100 * dv / totalCost;
                    vm.discountPercentage = (vm.discountPercentage % 1 != 0) ? vm.discountPercentage.toFixed(2) : vm.discountPercentage;
                    totalCost -= dv;
                    delete dv;
                }
            }
            serviceTotalCost = totalCost;
            if (vm.isRoundOffVal) {
                if (!isManualRoundOff) {
                    var ot = totalCost;
                    totalCost = vm.isRoundOffVal ? Math.floor(totalCost * 0.1) * 10 : totalCost;
                    vm.roundedOffVal = (totalCost - ot);
                    vm.roundedOffVal = (vm.roundedOffVal % 1 != 0) ? vm.roundedOffVal.toFixed(2) : vm.roundedOffVal;
                    delete ot;
                } else {
                    totalCost += parseFloat(vm.roundedOffVal);
                }
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
            return totalTax;

            function iterateProblems(problem) {
                if ((vm.sTaxSettings && !vm.sTaxSettings.applyTax) || !problem.tax || !problem.checked)
                    return;
                totalTax += parseFloat(problem.tax.toFixed(2));
            }

            function iteratePackages(package) {
                if (!package.checked)
                    return;
                package.selectedTreatments.forEach(ipt);
            }

            function ipt(treatment) {
                if ((vm.sTaxSettings && !vm.sTaxSettings.applyTax) || !treatment.tax)
                    return;
                totalTax += parseFloat(treatment.tax[vm.vehicle.type.toLowerCase().replace(' ', '-')].toFixed(2));
            }
        }

        function finalizeNewProblem() {
            vm.problem.details = vm.problem.details.trim();
            if (vm.problem.details != '') {
                var found = $filter('filter')(vm.service.problems, {
                    details: vm.problem.details
                }, true);
                if (found.length == 1) {
                    found[0].checked = true;
                    found[0].rate = (vm.sTaxSettings && vm.sTaxSettings.applyTax) ? vm.problem.rate : vm.problem.amount;
                    found[0].tax = vm.problem.tax;
                    found[0].amount = vm.problem.amount;
                    vm.selectedProblems.push(found[0]);
                } else {
                    vm.service.problems.push({
                        details: vm.problem.details,
                        rate: (vm.sTaxSettings && vm.sTaxSettings.applyTax) ? vm.problem.rate : vm.problem.amount,
                        tax: vm.problem.tax,
                        amount: vm.problem.amount,
                        checked: true
                    });
                    vm.selectedProblems.push(vm.service.problems[vm.service.problems.length - 1]);
                }
                vm.problem.details = '';
                vm.problem.amount = '';
                vm.problem.rate = '';
                $('#new-problem-details').focus();
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
                        vm.problem.amount = Math.round(vm.problem.rate + vm.problem.tax);
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
            var isVehicleBlank = (vm.vehicle.manuf == undefined || vm.vehicle.manuf == '') && (vm.vehicle.model == undefined || vm.vehicle.model == '') && (vm.vehicle.reg == undefined || vm.vehicle.reg == '');

            if (isVehicleBlank) {
                changeVehicleTab(true);
                utils.showSimpleToast('Please Enter At Least One Vehicle Detail');
                return false;
            }
            return true;
        }

        //  save to database
        function save() {
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
            vm.user.memberships = vm.membershipChips;
            switch (vm.serviceType) {
                case vm.serviceTypeList[1]:
                    vm.packages.forEach(addPkToService);
                    break;
                case vm.serviceTypeList[2]:
                    vm.membershipChips.forEach(addMsToService);
                    break;
            }
            vm.service.status = vm.servicestatus ? 'paid' : 'billed';
            vm.service.date = moment(vm.service.date).format();
            vm.service.problems.forEach(iterateProblems);
            if (vm.isDiscountApplied) {
                vm.service['discount'] = {
                    percent: parseFloat(vm.discountPercentage),
                    amount: parseFloat(vm.discountValue)
                }
            }
            if (vm.isRoundOffVal) {
                vm.service['roundoff'] = vm.roundedOffVal;
            }
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
            amServices.saveService(vm.user, vm.vehicle, vm.service).then(success).catch(failure);

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
        }

        //  (save successfull)
        function success(res) {
            setTimeout(goBack, 100);
            utils.showSimpleToast('Successfully Updated!');
        }

        //  !(save successfull)
        function failure(err) {
            utils.showSimpleToast('Failed to update. Please Try Again!');
        }
    }

    function MembershipEditDialogController($mdDialog, $filter, membership, treatments) {
        var editMsVm = this;

        editMsVm.treatment = {
            details: '',
            rate: ''
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
                    found[0].duration = editMsVm.treatment.duration;
                    found[0].occurences = editMsVm.treatment.occurences;
                    editMsVm.selectedTreatments.push(found[0]);
                } else {
                    editMsVm.treatments.push({
                        name: editMsVm.treatment.details,
                        duration: editMsVm.treatment.duration,
                        occurences: editMsVm.treatment.occurences,
                        checked: true
                    });
                    editMsVm.selectedTreatments.push(editMsVm.treatments[editMsVm.treatments.length - 1]);
                }
                editMsVm.treatment.details = '';
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
                }
            }
        }
    }
})();