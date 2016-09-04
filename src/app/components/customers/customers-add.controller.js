/**
 * Controller for Add Customer component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlCuCI', CustomerAddController)
        .controller('amCtrlMeD', MembershipEditDialogController);

    CustomerAddController.$inject = ['$rootScope', '$state', '$filter', '$q', '$log', '$mdDialog', 'utils', 'amCustomers'];
    MembershipEditDialogController.$inject = ['$mdDialog', '$filter', 'membership', 'treatments'];

    function CustomerAddController($rootScope, $state, $filter, $q, $log, $mdDialog, utils, amCustomers) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments
        var nextDueDate = new Date(); 
        var vehicles;

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
            model: ''
        };
        vm.manufacturers = [];
        vm.models = [];
        vm.membershipChips = [];
        vm.vehicleTypeList = [];
        vm.loadingBasedOnMobile = false;
        vm.customerTypeList = ['Lead', 'Customer', 'Agency'];
        vm.possibleVehicleList = [];
        vm.vNextDue = {};

        //  function maps
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.save = save;
        vm.queryMembershipChip = queryMembershipChip;
        vm.OnClickMembershipChip = OnClickMembershipChip;
        vm.OnAddMembershipChip = OnAddMembershipChip;
        vm.goBack = goBack;
        vm.autoCapitalizeCustomerAddress = autoCapitalizeCustomerAddress;
        vm.checkExistingCustomerMobile = checkExistingCustomerMobile;
        vm.unsubscribeMembership = unsubscribeMembership;
        vm.getDate = getDate;
        vm.editVehicle = editVehicle;
        vm.blurAddVehicle = blurAddVehicle;
        vm.IsVehicleSelected = IsVehicleSelected;
        vm.changeVehicle = changeVehicle;
        
        //  default execution steps
        setTimeout(focusCustomerName, 300);
        getMemberships();
        getRegularTreatments();
        getVehicleTypes();
        
        //  function definitions

        function IsVehicleSelected(id) {
            return (vm.currentVehicleId == id);
        }

        function blurAddVehicle(event) {
            if (event.keyCode == 9)
                setTimeout(focusToSave, 100);    
            }

        function focusToSave() {
            $('#amb-save').focus();
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
                vm.currentVehicleId = found[0].id;
                vm.vehicle.id = found[0].id;
                vm.vehicle.reg = found[0].reg;
                vm.vehicle.manuf = found[0].manuf;
                vm.vehicle.model = found[0].model;
                autofillVehicle = true;
            } else
                setDefaultVehicle();
        }

        function setDefaultVehicle() {
            vm.currentVehicleId = undefined;
            vm.vehicle.id = undefined;
            vm.vehicle.reg = '';
            vm.vehicle.manuf = '';
            vm.vehicle.model = '';
            autofillVehicle = false;
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
                if (!vehicles)
                    vehicles = {};

                var prefixVehicle = 'vhcl';

                if (vId == undefined)
                    vId = utils.generateUUID(prefixVehicle);
                
                if (vehicles[vId]) {
                    var tv = vehicles[vId];
                    if ((tv.manuf != res.manuf) || (tv.model != res.model)) {
                        vId = utils.generateUUID(prefixVehicle);
                        vehicles[vId] = tv;
                        vm.vNextDue[vId] = vm.vNextDue[res.id];
                        delete vehicles[res.id];
                        delete vm.vNextDue[res.id];
                    }
                } else
                    vehicles[vId] = {};
                var intermvehicle = vehicles[vId];
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

        function getDate(date) {
            return moment(date).format('DD MMM YYYY');
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

        function focusCustomerName() {
            $('#ami-customer-name').focus();
        }

        function checkExistingCustomerMobile(ev) {
            if (vm.user.mobile == undefined || vm.user.mobile == '')
                return;
            vm.loadingBasedOnMobile = true;
            amCustomers.getCustomerByMobile(vm.user.mobile).then(success).catch(failure);

            function success(res) {
                vm.loadingBasedOnMobile = false;
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
                    vm.user.mobile = '';
                }                
            }

            function failure(err) {
                vm.loadingBasedOnMobile = false;
            }
        }

        function autoCapitalizeCustomerAddress() {
            vm.user.address = utils.autoCapitalizeWord(vm.user.address);
        }
        
        function goBack() {
            $state.go('restricted.customers.all');
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
            amCustomers.getMemberships().then(success).catch(failure);
            
            function success(res) {
                vm.allMemberships = res.memberships;
            }

            function failure(error) {
                vm.allMemberships = [];
            }
        }
        
        function getRegularTreatments() {
            amCustomers.getRegularTreatments().then(success).catch(failure);

            function success(res) {
                vm.treatments = res;
            }

            function failure(err) {
                vm.treatments = [];
            }
        }
        
        function getVehicleTypes() {
            amCustomers.getVehicleTypes().then(success).catch(failure);

            function success(res) {
                res.forEach(iterateVehicleType);

                function iterateVehicleType(type) {
                    vm.vehicleTypeList.push(utils.convertToTitleCase(type.replace(/-/g, ' ')));
                }
            }

            function failure(err) {
                vm.vehicleTypeList.push('Default');
            }
        }
        
        function convertNameToTitleCase() {
            vm.user.name = utils.convertToTitleCase(vm.user.name);
        }
        
        function validate() {
            if (vm.user.name == '') {
                vm.user.name = "Anonymous";
            }
        }

        //  save to database
        function save() {
            validate();
            var ndKeys = Object.keys(vm.vNextDue);
            if (ndKeys.length > 0)
                ndKeys.forEach(iterateNextDue);
            if (vm.membershipChips.length > 0)
                vm.user.memberships = vm.membershipChips;
            if (vehicles && Object.keys(vehicles.length > 0))
                amCustomers.addNewCustomer(vm.user, vehicles).then(successfullSave).catch(failedSave);
            else
                amCustomers.addNewCustomer(vm.user).then(successfullSave).catch(failedSave);

            function iterateNextDue(nd) {
                if (vm.vNextDue[nd].isNextDue)
                    vehicles[nd].nextdue = moment(vm.vNextDue[nd].nextdue).format();
            }
        }
        
        function successfullSave(res) {
            $state.go('restricted.customers.all');
            utils.showSimpleToast('Customer has been added successfully!');
        }
        
        function failedSave(err) {
            utils.showSimpleToast('Failed to add customer. Please Try Again!');
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
                    found[0].rate = treatment.rate;
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