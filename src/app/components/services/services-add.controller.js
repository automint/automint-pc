/**
 * Controller for Add Service module
 * @author ndkcha
 * @since 0.4.1
 * @version 0.5.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlSeCI', ServiceAddController)
        .controller('amCtrlMeD', MembershipEditDialogController);

    ServiceAddController.$inject = ['$state', '$q', '$log', '$filter', '$mdEditDialog', '$mdDialog', 'utils', 'amServices'];
    MembershipEditDialogController.$inject = ['$mdDialog', '$filter', 'membership', 'treatments'];

    /*
    ====== NOTE =======
    > Do not create new method named moment() since it is used by moment.js
    */

    function ServiceAddController($state, $q, $log, $filter, $mdEditDialog, $mdDialog, utils, amServices) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var autofillVehicle = false,
            flagGetUserBasedOnMobile = true,
            olInvoiceNo = 1;

        //  vm assignments to keep track of UI related elements
        vm.label_userMobile = 'Enter Mobile Number:';
        vm.label_userEmail = 'Enter Email:';
        vm.label_userAddress = 'Enter Address:';
        vm.label_vehicleReg = 'Enter Vehicle Reg Number:';
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
            type: ''
        };
        vm.service = {
            date: new Date(),
            odo: 0,
            cost: 0,
            status: '',
            invoiceno: 1,
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
        vm.changeUserMobileLabel = changeUserMobileLabel;
        vm.changeUserEmailLabel = changeUserEmailLabel;
        vm.changeVehicleRegLabel = changeVehicleRegLabel;
        vm.changeVehicleTab = changeVehicleTab;
        vm.changeUserTab = changeUserTab;
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

        //  default execution steps
        // vm.serviceTab = true; //  testing purposes [amTODO: remove it]
        getTreatmentDisplayFormat();
        getVehicleTypes();
        getRegularTreatments();
        getMemberships();
        getLastInvoiceNo();

        //  function definitions
        
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
            changeProblemRate(vm.problem, true);
            calculatePackageTax();
            
            function iterateProblems(problem) {
                changeProblemRate(problem, true);
            }
        }
        
        function changeProblemRate(problem, force) {
            if (vm.sTaxSettings.applyTax) {
                if (vm.sTaxSettings.inclusive) {
                    problem.rate = (problem.amount*100)/(vm.sTaxSettings.tax + 100);
                    problem.tax = (problem.rate*vm.sTaxSettings.tax/100);
                } else {
                    problem.tax = (problem.rate*vm.sTaxSettings.tax/100);
                    problem.amount = Math.round(problem.rate + problem.tax);
                }
            } else if (force) {
                if (vm.sTaxSettings.inclusive)
                    problem.rate = problem.amount;
                else
                    problem.amount = problem.rate;
            }
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
            $state.go('restricted.services.all');
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
            if (vm.membershipChips.length > 0)
                vm.serviceType = vm.serviceTypeList[2];
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
                                treatment.rate[cvt] = (treatment.amount[cvt]*100)/(vm.sTaxSettings.tax + 100);
                                treatment.tax[cvt] = (treatment.rate[cvt]*vm.sTaxSettings.tax/100);
                            } else {
                                treatment.tax[cvt] = (treatment.rate[cvt]*vm.sTaxSettings.tax/100);
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
                    if (Object.keys(res.memberships).length > 0)
                        vm.serviceType = vm.serviceTypeList[2];
                    Object.keys(res.memberships).forEach(iterateMemberships);
                }
                changeUserMobileLabel();
                changeUserEmailLabel();
                changeUserAddressLabel();
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
                changeUserMobileLabel();
                changeUserEmailLabel();
                changeUserAddressLabel();
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
                changeUserMobileLabel();
                changeUserEmailLabel();
                changeUserAddressLabel();
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
                changeUserMobileLabel();
                vm.possibleVehicleList = [];
                changeVehicle();
            }
        }

        //  change vehicle related details when changed from UI
        function changeVehicle(id) {
            if (!id) {
                setDefaultVehicle();
                return;
            }
            var found = $filter('filter')(vm.possibleVehicleList, {
                id: id
            }, true);
            if (found.length > 0) {
                vm.currentVehicle = found[0].name;
                vm.vehicle.id = found[0].id;
                vm.vehicle.reg = found[0].reg;
                vm.vehicle.manuf = found[0].manuf;
                vm.vehicle.model = found[0].model;
                vm.vehicle.type = (found[0].type == undefined) ? vm.vehicleTypeList[0] : found[0].type;
                changeVehicleRegLabel();
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
            if (vm.vehicleTypeList.length > 0)
                vm.vehicle.type = vm.vehicleTypeList[0];
            changeVehicleRegLabel();
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
                            problem.rate = (problem.amount*100)/(vm.sTaxSettings.tax + 100);
                            problem.tax = (problem.rate*vm.sTaxSettings.tax/100);
                        } else {
                            problem.rate = (rate == '' || rate == undefined ? problem.rate : rate);
                            problem.tax = (problem.rate*vm.sTaxSettings.tax/100);
                            problem.amount = Math.round(problem.rate + problem.tax);
                        }
                    } else {
                        if (vm.sTaxSettings.inclusive)
                            problem.rate = (rate == '' || rate == undefined ? problem.rate : rate);
                        else
                            problem.amount = (rate == '' || rate == undefined ? problem.amount : rate);
                    }
                }
            }
        }

        //  return boolean response to different configurations [BEGIN]
        function isAddOperation() {
            return true;
        }
        //  return boolean response to different configurations [END]

        //  change user tab selector variable
        function changeUserTab(bool) {
            vm.userTab = bool;
        }

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
            vm.isUserMobile = (force != undefined || vm.user.mobile != '');
            vm.label_userMobile = vm.isUserMobile ? 'Mobile:' : 'Enter Mobile Number:';
        }

        function changeUserEmailLabel(force) {
            vm.isUserEmail = (force != undefined || vm.user.email != '');
            vm.label_userEmail = vm.isUserEmail ? 'Email:' : 'Enter Email:';
        }

        function changeUserAddressLabel(force) {
            vm.isUserAddress = (force != undefined || vm.user.address != '');
            vm.label_userAddress = vm.isUserAddress ? 'Address:' : 'Enter Address:';
        }

        function changeVehicleRegLabel(force) {
            vm.isVehicleReg = (force != undefined || vm.vehicle.reg != '');
            vm.label_vehicleReg = vm.isVehicleReg ? 'Vehicle Registration Number:' : 'Enter Vehicle Reg Number:';
        }
        //  listen to changes in input fields [END]

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

        function calculateCost() {
            var totalCost = 0;
            vm.service.problems.forEach(iterateProblem);
            if (vm.serviceType == vm.serviceTypeList[1]) {
                vm.packages.forEach(iteratePackages);
            }
            vm.service.cost = totalCost;
            return totalCost;

            function iterateProblem(element) {
                totalCost += parseInt(Math.round(element.amount ? (element.amount * (element.checked ? 1 : 0)) : 0));
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

        function finalizeNewProblem(btnClicked) {
            vm.problem.details = vm.problem.details.trim();
            if (vm.problem.details != '') {
                var found = $filter('filter')(vm.service.problems, {
                    details: vm.problem.details
                });
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
                $('#new-problem-details').focus();
            }
            if (btnClicked)
                $('#new-problem-details').focus();
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
                        vm.problem.rate = (vm.problem.amount*100)/(vm.sTaxSettings.tax + 100);
                        vm.problem.tax = (vm.problem.rate*vm.sTaxSettings.tax/100);
                    } else {
                        vm.problem.rate = (rate == '' || rate == undefined ? vm.problem.rate : rate);
                        vm.problem.tax = (vm.problem.rate*vm.sTaxSettings.tax/100);
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
            if (vm.user.name == '') {
                changeUserTab(true);
                setTimeout(doFocus, 300);
                utils.showSimpleToast('Please Enter Name');

                function doFocus() {
                    $('#ami-user-name').focus();
                }
                return false
            }
            var isVehicleBlank = (vm.vehicle.manuf == undefined || vm.vehicle.manuf == '') && (vm.vehicle.model == undefined || vm.vehicle.model == '') && (vm.vehicle.reg == undefined || vm.vehicle.reg == '');
            
            if (isVehicleBlank) {
                changeVehicleTab(true);
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
                    if (checkTreatments() == false) {
                        utils.showSimpleToast('Please select treatment(s)');
                        return;
                    }
                    break;
                case vm.serviceTypeList[1]:
                    if (checkPackage() == false && checkTreatments() == false) {
                        utils.showSimpleToast('Please select package(s) or treatment(s)');
                        return;
                    }
                    break;
                case vm.serviceTypeList[2]:
                    if (checkMembership() == false && checkTreatments() == false) {
                        utils.showSimpleToast('Please select membership(s) or treatment(s)');
                        return;
                    }
                    break;
            }
            vm.service.problems = vm.selectedProblems;
            var options = {
                isLastInvoiceNoChanged: (vm.service.invoiceno == olInvoiceNo)
            }
            if (vm.membershipChips)
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
            if (vm.sTaxSettings != undefined) {
                vm.service.serviceTax = {
                    applyTax: vm.sTaxSettings.applyTax,
                    taxIncType: (vm.sTaxSettings.inclusive) ? 'inclusive' : 'exclusive',
                    tax: vm.sTaxSettings.tax
                };
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
                if (!vm.sTaxSettings || (vm.sTaxSettings && !vm.sTaxSettings.applyTax))
                    problem.rate = problem.amount;
                delete problem.checked;
                delete problem['amount'];
                delete problem['$$hashKey'];
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
            function checkTreatments() {
                var isTreatmentsSelected = false;
                for (var i = 0; i < vm.service.problems.length; i++) {
                    if (vm.service.problems[i].checked) {
                        isTreatmentsSelected = true;
                        break;
                    }
                }
                return isTreatmentsSelected;
            }

            //  (save successfull)
            function success(res) {
                switch (redirect) {
                    case vm.redirect.invoice:
                        $state.go('restricted.invoices.view', {
                            userId: res.id.userId,
                            vehicleId: res.id.vehicleId,
                            serviceId: res.id.serviceId
                        });
                        break;
                    default:
                        $state.go('restricted.services.all');
                        break;
                }
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
                });
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