/**
 * Controller for Edit Customer component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlCuUI', CustomerEditController)
        .controller('amCtrlMeD', MembershipEditDialogController);

    CustomerEditController.$inject = ['$rootScope', '$scope', '$state', '$q', '$log', '$filter', '$mdDialog', 'utils', 'amCustomers'];
    MembershipEditDialogController.$inject = ['$mdDialog', '$filter', 'membership', 'treatments'];

    function CustomerEditController($rootScope, $scope, $state, $q, $log, $filter, $mdDialog, utils, amCustomers) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var autofillVehicle = false;
        var userDbInstance, userMobile;
        var nextDueDate = new Date(); 

        //  vm assignments to keep track of UI related elements
        vm.user = {
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

        };
        vm.manufacturers = [];
        vm.models = [];
        vm.membershipChips = [];
        vm.vehicleTypeList = [];
        vm.services = [];
        vm.serviceQuery = {
            limit: 10,
            page: 1,
            total: 0
        };
        vm.serviceStateList = ['Job Card', 'Estimate', 'Bill'];
        vm.vNextDue = {};
        vm.customerTypeList = ['Lead', 'Customer', 'Agency'];
        vm.paymentDone = 0;
        vm.paymentDue = 0;
        vm.currencySymbol = "Rs.";

        //  function maps
        vm.changeVehicle = changeVehicle;
        vm.save = save;
        vm.queryMembershipChip = queryMembershipChip;
        vm.OnClickMembershipChip = OnClickMembershipChip;
        vm.OnAddMembershipChip = OnAddMembershipChip;
        vm.changeMembershipTab = changeMembershipTab;
        vm.goBack = goBack;
        vm.getServiceDate = getServiceDate;
        vm.editService = editService;
        vm.goToInvoice = goToInvoice;
        vm.autoCapitalizeCustomerAddress = autoCapitalizeCustomerAddress;
        vm.unsubscribeMembership = unsubscribeMembership;
        vm.IsServiceDue = IsServiceDue;
        vm.IsServiceStateIv = IsServiceStateIv;
        vm.IsServiceStateEs = IsServiceStateEs;
        vm.IsServiceStateJc = IsServiceStateJc;
        vm.getDate = getDate;
        vm.IsVehicleSelected = IsVehicleSelected;
        vm.editVehicle = editVehicle;
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.checkExistingCustomerMobile = checkExistingCustomerMobile;
        vm.IsVehicleAnonymous = IsVehicleAnonymous;

        //  default execution steps
        if ($state.params.id != undefined) {
            getCurrencySymbol();
            getMemberships(getRegularTreatments, getVehicleTypes, getCustomer);
            setTimeout(focusCustomerMobile, 300);
        } else {
            utils.showSimpleToast('Something went wrong!');
            $state.go('restricted.customers.all');
        }

        //  function definitions
        function IsVehicleAnonymous(service) {
            return (service.vhcl_reg == 'Vehicle');
        }


        function checkExistingCustomerMobile(ev) {
            if (vm.user.mobile == '')
                return;
            vm.loadingBasedOnMobile = true;
            amCustomers.getCustomerByMobile(vm.user.mobile).then(success).catch(failure);

            function success(res) {
                vm.loadingBasedOnMobile = false;
                if (vm.user.id == res.id)
                    return;
                var confirm = $mdDialog.confirm()
                    .title('Do you want to edit customer details ?')
                    .textContent('Customer record for  ' + res.name + ' with ' + vm.user.mobile + ' already exists')
                    .ariaLabel('Edit Customer')
                    .targetEvent(ev)
                    .ok('Yes')
                    .cancel('No');
                
                $mdDialog.show(confirm).then(doEdit, ignore);
                
                function doEdit() {
                    $state.go('restricted.customers.edit', {
                        id: res.id
                    });
                }
                
                function ignore() {
                    vm.user.mobile = userMobile;
                }                
            }

            function failure(err) {
                vm.loadingBasedOnMobile = false;
            }
        }

        function convertNameToTitleCase() {
            vm.user.name = utils.convertToTitleCase(vm.user.name);
        }

        function getCurrencySymbol() {
            amCustomers.getCurrencySymbol().then(success).catch(failure);

            function success(res) {
                vm.currencySymbol = res;
            }

            function failure(err) {
                vm.currencySymbol = "Rs.";
            }
        }

        function editVehicle(id) {
            changeVehicle(id);
            $mdDialog.show({
                controller: 'amCtrlCuVeCRUD',
                controllerAs: 'vm',
                templateUrl: 'app/components/customers/tmpl/vehicle-crud.tmpl.html',
                parent: angular.element(document.body),
                targetEvent: event,
                locals: {
                    vehicle: vm.vehicle
                },
                clickOutsideToClose: true
            }).then(closeVehicleDialog).catch(closeVehicleDialog);

            function closeVehicleDialog(res) {
                if (!res)
                    return;
                var vId = res.id;
                if (res.id == undefined)
                    res.id = '';
                if (!userDbInstance.user.vehicles)
                    userDbInstance.user.vehicles = {};

                var prefixVehicle = 'vhcl';

                if (vId == undefined)
                    vId = utils.generateUUID(prefixVehicle);
                
                if (userDbInstance.user.vehicles[vId]) {
                    var tv = userDbInstance.user.vehicles[vId];
                    if ((tv.manuf != res.manuf) || (tv.model != res.model)) {
                        vId = utils.generateUUID(prefixVehicle);
                        userDbInstance.user.vehicles[vId] = tv;
                        vm.vNextDue[vId] = vm.vNextDue[res.id];
                        delete userDbInstance.user.vehicles[res.id];
                        delete vm.vNextDue[res.id];
                    }
                } else
                    userDbInstance.user.vehicles[vId] = {};
                var intermvehicle = userDbInstance.user.vehicles[vId];
                intermvehicle.reg = res.reg;
                intermvehicle.manuf = res.manuf;
                intermvehicle.model = res.model;

                var longname = (intermvehicle.manuf ? intermvehicle.manuf + ' ' : '') + (intermvehicle.model ? intermvehicle.model + ' ' : '') + (intermvehicle.reg ? ((intermvehicle.manuf || intermvehicle.model) ? ' - ' : '') + intermvehicle.reg : '');
                var shortname = (longname.length <= 45) ? longname : longname.substr(0, 45) + '...';
                var isLongName = (longname.length > 45);

                var vfound = $filter('filter')(vm.possibleVehicleList, {
                    id: res.id
                }, true);

                if (vfound.length == 1) {
                    vfound[0].id = vId
                    vfound[0].reg = res.reg;
                    vfound[0].manuf = res.manuf;
                    vfound[0].model = res.model;
                    vfound[0].name = longname;
                    vfound[0].shortname = shortname;
                    vfound[0].isLongName = isLongName;
                } else {
                    vm.possibleVehicleList.push({
                        id: vId,
                        reg: res.reg,
                        manuf: res.manuf,
                        model: res.model,
                        name: longname,
                        shortname: shortname,
                        isLongName: isLongName
                    });
                    vm.vNextDue[vId] = {
                        isNextDue: false,
                        nextdue: nextDueDate
                    }
                }
                changeVehicle(vId);
            }
        }

        function IsVehicleSelected(id) {
            return (vm.currentVehicleId == id);
        }

        function getDate(date) {
            return moment(date).format('DD MMM YYYY');
        }

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

        function focusCustomerMobile() {
            $('#ami-customer-mobile').focus();
        }

        function autoCapitalizeCustomerAddress() {
            vm.user.address = utils.autoCapitalizeWord(vm.user.address);
        }

        //  edit service
        function editService(service) {
            $state.go('restricted.services.edit', {
                serviceId: service.srvc_id,
                vehicleId: service.vhcl_id,
                userId: service.cstmr_id,
                fromState: 'customers.edit.services'
            });
        }
        
        //  transit to state to view selected invoice
        function goToInvoice(service) {
            $state.go('restricted.invoices.view', {
                userId: service.cstmr_id,
                vehicleId: service.vhcl_id,
                serviceId: service.srvc_id,
                fromState: 'customers.edit.services'
            });
        }

        function getServiceDate(date) {
            return moment(date).format('DD MMM YYYY');
        }
        
        function goBack() {
            var transitState = 'restricted.customers.all';
            var transitParams = undefined;
            if ($state.params.fromState != undefined) {
                switch ($state.params.fromState) {
                    case 'dashboard.nextdueservices':
                        transitState = 'restricted.dashboard';
                        transitParams = {
                            openDialog: 'nextdueservices'
                        }
                        break;
                }
            }
            $state.go(transitState, transitParams);
        }
        
        function changeMembershipTab(bool) {
            vm.membershipTab = bool;
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
            membership.calculateMembershipTotal = calculateMembershipTotal;
            membership.onTreatmentSelected = onTreatmentSelected;
            membership.onTreatmentDeselected = onTreatmentDeselected;
            membership.calculateTOccurenceLeft = calculateTOccurenceLeft;
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
            function calculateMembershipTotal() {
                var total = 0;
                membership.selectedTreatments.forEach(it);
                membership.total = total;
                return total;

                function it(t) {
                    total += t.rate[vm.vehicle.type.toLowerCase().replace(' ', '-')];
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
            chip.calculateMembershipTotal = calculateMembershipTotal;
            chip.onTreatmentSelected = onTreatmentSelected;
            chip.onTreatmentDeselected = onTreatmentDeselected;
            chip.calculateTOccurenceLeft = calculateTOccurenceLeft;
            chip.calculateTDurationLeft = calculateTDurationLeft;
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
            function calculateMembershipTotal() {
                var total = 0;
                chip.selectedTreatments.forEach(it);
                chip.total = total;
                return total;

                function it(t) {
                    total += t.rate[vm.vehicle.type.toLowerCase().replace(' ', '-')];
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
            var callback = arguments[0];
            var callingFunction = this;
            var callbackArgs = arguments;
            
            amCustomers.getMemberships().then(success).catch(failure);
            
            function success(res) {
                vm.allMemberships = res.memberships;
                if (callback)
                    callback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 1));
            }

            function failure(error) {
                vm.allMemberships = [];
                if (callback)
                    callback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 1));
            }
        }
        
        function getRegularTreatments() {
            var callback = arguments[0];
            var callingFunction = this;
            var callbackArgs = arguments;
            
            amCustomers.getRegularTreatments().then(success).catch(failure);

            function success(res) {
                vm.treatments = res;
                if (callback)
                    callback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 1));
            }

            function failure(err) {
                vm.treatments = [];
                if (callback)
                    callback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 1));
            }
        }
        
        function getVehicleTypes() {
            var callback = arguments[0];
            var callingFunction = this;
            var callbackArgs = arguments;
            
            amCustomers.getVehicleTypes().then(success).catch(failure);

            function success(res) {
                res.forEach(iterateVehicleType);
                if (callback)
                    callback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 1));

                function iterateVehicleType(type) {
                    vm.vehicleTypeList.push(utils.convertToTitleCase(type.replace(/-/g, ' ')));
                }
            }

            function failure(err) {
                vm.vehicleTypeList.push('Default');
                if (callback)
                    callback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 1));
            }
        }

        function getCustomer() {
            amCustomers.getCustomer($state.params.id).then(success).catch(failure);

            function success(res) {
                userDbInstance = res;
                var pvl = [];
                vm.user.id = res._id;
                vm.user.mobile = res.user.mobile;
                userMobile = res.user.mobile;
                vm.user.email = res.user.email;
                vm.user.name = res.user.name;
                vm.user.address = res.user.address;
                if (res.user.type)
                    vm.user.type = res.user.type;
                if (res.user.memberships)
                    Object.keys(res.user.memberships).forEach(iterateMemberships);
                if (res.user.vehicles)
                    Object.keys(res.user.vehicles).forEach(iterateVehicle, this);
                vm.serviceQuery.total = vm.services.length;
                vm.possibleVehicleList = pvl;
                changeVehicle(undefined);
                $scope.$apply();

                function iterateVehicle(vId) {
                    var vehicle = res.user.vehicles[vId];
                    var longname = (vehicle.manuf ? vehicle.manuf + ' ' : '') + (vehicle.model ? vehicle.model + ' ' : '') + (vehicle.reg ? ((vehicle.manuf || vehicle.model) ? ' - ' : '') + vehicle.reg : '');
                    var shortname = (longname.length <= 45) ? longname : longname.substr(0, 45) + '...';
                    var isLongName = (longname.length > 45);
                    vm.vNextDue[vId] = {
                        isNextDue: (vehicle.nextdue != undefined),
                        nextdue: (vehicle.nextdue ? new Date(vehicle.nextdue) : nextDueDate)
                    }
                    pvl.push({
                        id: vId,
                        reg: vehicle.reg,
                        manuf: vehicle.manuf,
                        model: vehicle.model,
                        name: longname,
                        shortname: shortname,
                        isLongName: isLongName,
                        nextdue: vehicle.nextdue
                    });
                }
                function iterateMemberships(membership) {
                    res.user.memberships[membership].name = membership;
                    vm.membershipChips.push(res.user.memberships[membership]);
                    adjustExistingMembership(res.user.memberships[membership]);
                }
            }

            function failure(err) {
                utils.showSimpleToast('Something went wrong!');
                $state.go('restricted.customers.all');
            }
        }

        function loadServices() {
            vm.services = [];
            vm.paymentDone = 0;
            vm.paymentDue = 0;
            if (vm.vehicle.id) {
                if (userDbInstance.user && userDbInstance.user.vehicles && userDbInstance.user.vehicles[vm.vehicle.id])
                    iterateVehicle(vm.vehicle.id);
            } else {
                if (userDbInstance.user && userDbInstance.user.vehicles)
                    Object.keys(userDbInstance.user.vehicles).forEach(iterateVehicle);
            }
            vm.services.sort(dateSort);

            function dateSort(lhs, rhs) {
                return rhs.srvc_date.localeCompare(lhs.srvc_date);
            }

            function iterateVehicle(vId) {
                var vehicle = userDbInstance.user.vehicles[vId];
                if (vehicle.services)
                    Object.keys(vehicle.services).forEach(iterateServices);

                function iterateServices(sId) {
                    var service = vehicle.services[sId];
                    var payreceived = (service.partialpayment) ? service.partialpayment.total : ((service.status == "paid") ? service.cost : 0);
                    vm.paymentDone += parseFloat(payreceived);
                    vm.paymentDue += ((service.status != "paid") ? (parseFloat(service.cost) - parseFloat(payreceived)) : 0);
                    vm.services.push({
                        cstmr_id: userDbInstance._id,
                        vhcl_manuf: vehicle.manuf,
                        vhcl_model: vehicle.model,
                        vhcl_reg: vehicle.reg,
                        vhcl_id: vId,
                        srvc_id: sId,
                        srvc_date: service.date,
                        srvc_cost: service.cost,
                        srvc_status: utils.convertToTitleCase(service.status),
                        srvc_state: service.state
                    });
                }
            }
        }

        function changeVehicle(id) {
            if (!id) {
                setDefaultVehicle();
                loadServices();
                return;
            }
            var found = $filter('filter')(vm.possibleVehicleList, {
                id: id
            }, true);
            if (found.length > 0) {
                vm.currentVehicleId = found[0].id;
                vm.vehicle.id = found[0].id;
                vm.vehicle.reg = found[0].reg;
                vm.vehicle.manuf = found[0].manuf;
                vm.vehicle.model = found[0].model;
                autofillVehicle = true;
            } else
                setDefaultVehicle();
            loadServices();
        }

        function setDefaultVehicle() {
            vm.currentVehicleId = undefined;
            vm.vehicle.id = undefined;
            vm.vehicle.reg = '';
            vm.vehicle.manuf = '';
            vm.vehicle.model = '';
            autofillVehicle = false;
        }

        function isSame() {
            var checkuser = userDbInstance.user.mobile == vm.user.mobile && userDbInstance.user.name == vm.user.name && userDbInstance.user.email == vm.user.email && userDbInstance.user.address == vm.user.address;
            var checkvehicle = (userDbInstance.user.vehicles && userDbInstance.user.vehicles[vm.vehicle.id] && userDbInstance.user.vehicles[vm.vehicle.id].reg == vm.vehicle.reg && userDbInstance.user.vehicles[vm.vehicle.id].manuf == vm.vehicle.manuf && userDbInstance.user.vehicles[vm.vehicle.id].model == vm.vehicle.model) || (vm.vehicle.reg == '' && vm.vehicle.manuf == '' && vm.vehicle.model == '');
            return checkuser && checkvehicle && !isMembershipAltered;
        }

        //  save to database
        function save() {
            if (vm.user.name == '')
                vm.user.name = "Anonymous";
            userDbInstance.user.mobile = vm.user.mobile;
            userDbInstance.user.name = vm.user.name;
            userDbInstance.user.email = vm.user.email;
            userDbInstance.user.address = vm.user.address;
            userDbInstance.user.type = vm.user.type;

            if (userDbInstance.user.name != vm.user.name) {
                userDbInstance._deleted = true;
                amCustomers.saveCustomer(userDbInstance).then(doNothing).catch(doNothing);
                var prefixUser = 'usr-' + angular.lowercase(vm.user.name).replace(' ', '-');
                userDbInstance._id = utils.generateUUID(prefixUser);
                delete userDbInstance._deleted;
                delete userDbInstance._rev;
            }
            
            if (vm.membershipChips != undefined) {
                var smArray = $.extend([], vm.membershipChips);
                userDbInstance.user.memberships = {};
                smArray.forEach(addMembershipsToUser);
            }

            if (Object.keys(vm.vNextDue))
                Object.keys(vm.vNextDue).forEach(iterateDueDates);
            
            if (vm.user.id)
                amCustomers.saveCustomer(userDbInstance).then(successfullSave).catch(failedSave);
            else
                failedSave();

            function iterateDueDates(vId) {
                var t = vm.vNextDue[vId];
                if (t.isNextDue)
                    userDbInstance.user.vehicles[vId].nextdue = moment(t.nextdue).format();
                else if (!t.isNextDue)
                    delete userDbInstance.user.vehicles[vId].nextdue;
            }
                
            function addMembershipsToUser(membership) {
                var mTreatments = $.extend([], membership.treatments);
                membership.treatments = {};
                mTreatments.forEach(iterateTreatments);
                userDbInstance.user.memberships[membership.name] = {
                    occurences: membership.occurences,
                    duration: membership.duration,
                    treatments: membership.treatments,
                    startdate: membership.startdate
                }
                delete mTreatments;
                
                function iterateTreatments(treatment) {
                    membership.treatments[treatment.name] = $.extend({}, treatment);
                    delete membership.treatments[treatment.name].name;
                    delete membership.treatments[treatment.name].checked;
                    delete membership.treatments[treatment.name]['$$hashKey'];
                }
            }

            function doNothing(res) {
                //  do nothing
            }
        }

        function successfullSave(res) {
            $state.go('restricted.customers.all');
            utils.showSimpleToast('Customer has been updated successfully!');
        }

        function failedSave(err) {
            utils.showSimpleToast('Failed to update customer. Please Try Again!');
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
                });
                if (found.length == 1 && found[0].name == editMsVm.treatment.details) {
                    found[0].checked = true;
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
                } else
                    treatment.checked = false;
            }
        }
    }
})();