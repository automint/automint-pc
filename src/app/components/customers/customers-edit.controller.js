/**
 * Controller for Edit Customer component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.4
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlCuUI', CustomerEditController)
        .controller('amCtrlMeD', MembershipEditDialogController);

    CustomerEditController.$inject = ['$state', '$q', '$log', '$filter', '$mdDialog', 'utils', 'amCustomers'];
    MembershipEditDialogController.$inject = ['$mdDialog', '$filter', 'membership', 'treatments'];

    function CustomerEditController($state, $q, $log, $filter, $mdDialog, utils, amCustomers) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var autofillVehicle = false, isMembershipAltered = false;
        var userDbInstance;

        //  vm assignments to keep track of UI related elements
        vm.label_userName = 'Enter Full Name';
        vm.label_userMobile = 'Enter Mobile Number';
        vm.label_userEmail = 'Enter Email:';
        vm.label_userAddress = 'Enter Address:';
        vm.label_vehicleReg = 'Enter Vehicle Registration Number';
        vm.label_vehicleManuf = 'Manufacturer:';
        vm.label_vehicleModel = 'Model:';
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
            model: ''
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

        //  function maps
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.convertRegToCaps = convertRegToCaps;
        vm.searchVehicleChange = searchVehicleChange;
        vm.manufacturersQuerySearch = manufacturersQuerySearch;
        vm.modelQuerySearch = modelQuerySearch;
        vm.changeUserNameLabel = changeUserNameLabel;
        vm.changeUserMobileLabel = changeUserMobileLabel;
        vm.changeUserEmailLabel = changeUserEmailLabel;
        vm.changeUserAddressLabel = changeUserAddressLabel;
        vm.changeVehicleRegLabel = changeVehicleRegLabel;
        vm.changeVehicleTab = changeVehicleTab;
        vm.changeVehicle = changeVehicle;
        vm.isAddOperation = isAddOperation;
        vm.chooseVehicle = chooseVehicle;
        vm.save = save;
        vm.queryMembershipChip = queryMembershipChip;
        vm.OnClickMembershipChip = OnClickMembershipChip;
        vm.OnAddMembershipChip = OnAddMembershipChip;
        vm.changeMembershipTab = changeMembershipTab;
        vm.goBack = goBack;
        vm.changeServicesTab = changeServicesTab;
        vm.getServiceDate = getServiceDate;
        vm.editService = editService;
        vm.deleteService = deleteService;
        vm.goToInvoice = goToInvoice;
        vm.autoCapitalizeCustomerAddress = autoCapitalizeCustomerAddress;
        vm.autoCapitalizeVehicleModel = autoCapitalizeVehicleModel;
        vm.unsubscribeMembership = unsubscribeMembership;
        
        //  default execution steps
        if ($state.params.id != undefined) {
            getMemberships(getRegularTreatments, getVehicleTypes, getCustomer);
            if ($state.params.openTab == 'services')
                changeServicesTab(true);
            else
                setTimeout(focusCustomerMobile, 300);
        } else {
            utils.showSimpleToast('Something went wrong!');
            $state.go('restricted.customers.all');
        }

        //  function definitions

        function unsubscribeMembership(ev, chip) {
            var confirm = $mdDialog.confirm()
                .textContent('Unsubscribe to ' + chip.name + ' ?')
                .ariaLabel('Unsubscribe to ' + chip.name)
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');

            $mdDialog.show(confirm).then(performDelete, ignoreDelete);

            function performDelete() {
                OnRemoveMembershipChip();
            }

            function ignoreDelete() {
                vm.membershipChips.push(chip);
            }
        }

        function focusCustomerMobile() {
            $('#ami-customer-mobile').focus();
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

        //  edit service
        function editService(service) {
            $state.go('restricted.services.edit', {
                serviceId: service.srvc_id,
                vehicleId: service.vhcl_id,
                userId: service.cstmr_id,
                fromState: 'customers.edit.services'
            });
        }

        //  delete service from UI
        function deleteService(service, ev) {
            var confirm = $mdDialog.confirm()
                .textContent('Are you sure you want to delete the service ?')
                .ariaLabel('Delete Customer')
                .targetEvent(ev)
                .ok('Yes')
                .cancel('No');

            $mdDialog.show(confirm).then(performDelete, ignoreDelete);

            function performDelete() {
                amServices.deleteService(service.cstmr_id, service.vhcl_id, service.srvc_id).then(success).catch(failure);
            }

            function ignoreDelete() {
                console.log('nope');
            }
            

            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast('Service has been deleted.');
                    setTimeout(getServices, 200);
                } else
                    failure();
            }

            function failure(err) {
                console.log(err);
                utils.showSimpleToast('Service can not be deleted at moment. Please Try Again!');
            }
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

        function changeServicesTab(bool) {
            vm.servicesTab = bool;
        }
        
        function goBack() {
            $state.go('restricted.customers.all');
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
                isMembershipAltered = true;
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
        
        function OnRemoveMembershipChip() {
            isMembershipAltered = true;
        }

        function OnAddMembershipChip(chip) {
            isMembershipAltered = true;
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
                vm.user.email = res.user.email;
                vm.user.name = res.user.name;
                vm.user.address = res.user.address;
                changeUserMobileLabel();
                changeUserEmailLabel();
                changeUserNameLabel();
                changeUserAddressLabel();
                if (res.user.memberships)
                    Object.keys(res.user.memberships).forEach(iterateMemberships);
                if (res.user.vehicles)
                    Object.keys(res.user.vehicles).forEach(iterateVehicle, this);
                vm.serviceQuery.total = vm.services.length;
                vm.possibleVehicleList = pvl;
                changeVehicle(pvl.length > 0 ? pvl[0].id : undefined);
                vm.services.sort(dateSort);

                function dateSort(lhs, rhs) {
                    return rhs.srvc_date.localeCompare(lhs.srvc_date);
                }

                function iterateVehicle(vId) {
                    var vehicle = res.user.vehicles[vId];
                    pvl.push({
                        id: vId,
                        reg: vehicle.reg,
                        manuf: vehicle.manuf,
                        model: vehicle.model,
                        name: vehicle.manuf + ' - ' + vehicle.model + (vehicle.reg == '' ? '' : ', ' + vehicle.reg)
                    });
                    if (vehicle.services)
                        Object.keys(vehicle.services).forEach(iterateServices);

                    function iterateServices(sId) {
                        var service = vehicle.services[sId];
                        vm.services.push({
                            cstmr_id: res._id,
                            vhcl_manuf: vehicle.manuf,
                            vhcl_model: vehicle.model,
                            vhcl_reg: vehicle.reg,
                            vhcl_id: vId,
                            srvc_id: sId,
                            srvc_date: service.date,
                            srvc_cost: service.cost,
                            srvc_status: utils.convertToTitleCase(service.status)
                        });
                    }
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
                changeVehicleRegLabel();
                autofillVehicle = true;
            } else
                setDefaultVehicle();
        }

        function setDefaultVehicle() {
            vm.currentVehicle = 'New Vehicle';
            vm.vehicle.id = undefined;
            vm.vehicle.reg = '';
            vm.vehicle.manuf = '';
            vm.vehicle.model = '';
            autofillVehicle = false;
        }

        //  choose different existing vehicle
        function chooseVehicle($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        }

        function convertNameToTitleCase() {
            vm.user.name = utils.convertToTitleCase(vm.user.name);
        }

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

            amCustomers.getManufacturers().then(allotManufacturers).catch(noManufacturers);
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

            amCustomers.getModels(vm.vehicle.manuf).then(allotModels).catch(noModels);
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

        function searchVehicleChange(e) {
            autoCapitalizeVehicleManuf();
            if (!autofillVehicle) {
                vm.models = [];
                vm.vehicle.model = '';
                autofillVehicle = false;
            } else
                autofillVehicle = false;
        }

        //  return boolean response to different configurations [BEGIN]
        function isAddOperation() {
            return false;
        }
        //  return boolean response to different configurations [END]

        //  change vehicle table selector variable
        function changeVehicleTab(bool) {
            vm.vehicleTab = bool;
        }

        //  listen to changes in input fields [BEGIN]
        function changeUserNameLabel(force) {
            vm.isUserName = (force != undefined || vm.user.name != '');
            vm.label_userName = vm.isUserName ? 'Name:' : 'Enter Full Name:';
        }
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
            vm.label_vehicleReg = vm.isVehicleReg ? 'Vehcile Registration Number:' : 'Enter Vehicle Registration Number:';
        }
        //  listen to changes in input fields [END]

        function isSame() {
            var checkuser = userDbInstance.user.mobile == vm.user.mobile && userDbInstance.user.name == vm.user.name && userDbInstance.user.email == vm.user.email && userDbInstance.user.address == vm.user.address;
            var checkvehicle = (userDbInstance.user.vehicles && userDbInstance.user.vehicles[vm.vehicle.id] && userDbInstance.user.vehicles[vm.vehicle.id].reg == vm.vehicle.reg && userDbInstance.user.vehicles[vm.vehicle.id].manuf == vm.vehicle.manuf && userDbInstance.user.vehicles[vm.vehicle.id].model == vm.vehicle.model) || (vm.vehicle.reg == '' && vm.vehicle.manuf == '' && vm.vehicle.model == '');
            return checkuser && checkvehicle && !isMembershipAltered;
        }

        //  save to database
        function save() {
            $log.info('same = ' + isSame());
            if (isSame() == true) {
                successfullSave();
                return;
            }
            userDbInstance.user.mobile = vm.user.mobile;
            userDbInstance.user.name = vm.user.name;
            userDbInstance.user.email = vm.user.email;
            userDbInstance.user.address = vm.user.address;
            
            if (vm.membershipChips != undefined) {
                var smArray = $.extend([], vm.membershipChips);
                userDbInstance.user.memberships = {};
                smArray.forEach(addMembershipsToUser);
            }

            if (!((vm.vehicle.reg == '' || vm.vehicle.reg == undefined) && (vm.vehicle.manuf == '' || vm.vehicle.manuf == undefined) && (vm.vehicle.model == '' || vm.vehicle.model == undefined))) {
                if (!userDbInstance.user.vehicles)
                    userDbInstance.user.vehicles = {}
                var vehicleDbInstance = userDbInstance.user.vehicles[vm.vehicle.id];
                if (vehicleDbInstance) {
                    vehicleDbInstance.reg = vm.vehicle.reg;
                    vehicleDbInstance.manuf = vm.vehicle.manuf;
                    vehicleDbInstance.model = vm.vehicle.model;
                } else {
                    var prefixVehicle = 'vhcl' + ((vm.vehicle.manuf && vm.vehicle.model) ? '-' + angular.lowercase(vm.vehicle.manuf).replace(' ', '-') + '-' + angular.lowercase(vm.vehicle.model).replace(' ', '-') : '');
                    userDbInstance.user.vehicles[utils.generateUUID(prefixVehicle)] = {
                        reg: (vm.vehicle.reg == undefined ? '' : vm.vehicle.reg),
                        manuf: (vm.vehicle.manuf == undefined ? '' : vm.vehicle.manuf),
                        model: (vm.vehicle.model == undefined ? '' : vm.vehicle.model)
                    };
                }
            }
            
            if (vm.user.id)
                amCustomers.saveCustomer(userDbInstance).then(successfullSave).catch(failedSave);
            else
                failedSave();
                
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