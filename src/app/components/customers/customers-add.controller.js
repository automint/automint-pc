/**
 * Controller for Add Customer component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.5.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlCuCI', CustomerAddController)
        .controller('amCtrlMeD', MembershipEditDialogController);

    CustomerAddController.$inject = ['$state', '$filter', '$q', '$log', '$mdDialog', 'utils', 'amCustomers'];
    MembershipEditDialogController.$inject = ['$mdDialog', '$filter', 'membership', 'treatments'];

    function CustomerAddController($state, $filter, $q, $log, $mdDialog, utils, amCustomers) {
        //  initialize view model
        var vm = this;

        //  vm assignments to keep track of UI related elements
        vm.label_userName = 'Enter Full Name:'; 
        vm.label_userMobile = 'Enter Mobile Number:'; 
        vm.label_userEmail = 'Enter Email:';
        vm.label_userAddress = 'Enter Address:';
        vm.label_vehicleReg = 'Enter Vehicle Registration Number:'; 
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
        vm.changeUserTab = changeUserTab;
        vm.isAddOperation = isAddOperation;
        vm.save = save;
        vm.queryMembershipChip = queryMembershipChip;
        vm.OnClickMembershipChip = OnClickMembershipChip;
        vm.OnAddMembershipChip = OnAddMembershipChip;
        vm.changeMembershipTab = changeMembershipTab;
        vm.goBack = goBack;
        
        //  default execution steps
        getMemberships();
        getRegularTreatments();
        getVehicleTypes();

        //  function definitions
        
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
        
        function searchVehicleChange() {
            vm.models = [];
            vm.vehicle.model = '';
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
        
        function validate() {
            if (vm.user.name == '') {
                changeUserTab(true);
                setTimeout(doFocus, 300);
                utils.showSimpleToast('Please Enter Name');
                
                function doFocus() {
                    $('#ami-user-name').focus();
                }
                return false;
            }
            return true;
        }

        //  save to database
        function save() {
            if (!validate()) return;
            if (vm.membershipChips)
                vm.user.memberships = vm.membershipChips;
            if (!(vm.vehicle.reg == '' && vm.vehicle.manuf == '' && vm.vehicle.model == '')) {
                vm.vehicle.reg = vm.vehicle.reg.replace(/\s/g, '');
                amCustomers.addNewCustomer(vm.user, vm.vehicle).then(successfullSave).catch(failedSave);
            } else
                amCustomers.addNewCustomer(vm.user).then(successfullSave).catch(failedSave);
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