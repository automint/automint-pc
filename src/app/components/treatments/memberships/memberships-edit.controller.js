/**
 * Controller for Edit Membership component
 * @author ndkcha
 * @since 0.5.0
 * @version 0.7.2
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlMsUI', MembershipEditController);

    MembershipEditController.$inject = ['$rootScope', '$q', '$filter', '$state', 'utils', 'amTreatments'];

    function MembershipEditController($rootScope, $q, $filter, $state, utils, amTreatments) {
        //  initialize view model
        var vm = this, oMembershipName;

        //  named assignments to keep track of UI elements
        vm.label_name = "Enter Membership Name:";
        vm.label_occurences = "Enter Number of Services:";
        vm.label_duration = "Enter Duration (months):";
        vm.label_amount = "Enter Amount:";
        vm.label_description = "Enter Description:";
        vm.operationMode = 'edit';
        vm.membership = {
            name: '',
            occurences: 1,
            duration: 1,
            amount: '',
            description: ''
        };
        vm.treatment = {
            details: '',
            rate: '',
            occurences: vm.membership.occurences,
            duration: vm.membership.duration
        };
        vm.treatments = [];
        vm.vehicletypes = [];
        vm.selectedTreatments = [];

        //  default execution steps
        if ($state.params.name == undefined || $state.params.name == '') {
            errorAndExit();
            return;
        }
        $rootScope.isCUSection = true;
        changeOccurencesLabel();
        changeDurationLabel();
        getVehicleTypes(getTreatments, getMembershipInfo);

        //  function maps
        vm.goBack = goBack;
        vm.changeNameLabel = changeNameLabel;
        vm.changeOccurencesLabel = changeOccurencesLabel;
        vm.changeDurationLabel = changeDurationLabel;
        vm.changeAmountLabel = changeAmountLabel;
        vm.changeDescriptionLabel = changeDescriptionLabel;
        vm.changeDuration = changeDuration;
        vm.changeOccurences = changeOccurences;
        vm.isAddOperation = isAddOperation;
        vm.finalizeNewTreatment = finalizeNewTreatment;
        vm.treatmentQuerySearch = treatmentQuerySearch;
        vm.save = save;
        vm.convertNameToTitleCase = convertNameToTitleCase;
        vm.convertTnToTitleCase = convertTnToTitleCase;

        //  function definitions
        
        function convertTnToTitleCase() {
            vm.treatment.details = utils.autoCapitalizeWord(vm.treatment.details);
        }
        
        function convertNameToTitleCase() {
            vm.membership.name = utils.autoCapitalizeWord(vm.membership.name);
        }
        
        function goBack() {
            $state.go('restricted.treatments.master', {
                openTab: 'memberships'
            });
        }

        //  listen to changes in input fields [BEGIN]
        function changeNameLabel(force) {
            vm.isName = (force != undefined) || (vm.membership.name != '');
            vm.label_name = (vm.isName) ? "Membership Name:" : "Enter Membership Name:";
        }
        function changeOccurencesLabel(force) {
            vm.isOccurences = (force != undefined) || (vm.membership.occurences != '');
            vm.label_occurences = (vm.isOccurences) ? "Number of Services:" : "Enter Number of Services:";
        }
        function changeDurationLabel(force) {
            vm.isDuration = (force != undefined) || (vm.membership.duration != '');
            vm.label_duration = (vm.isDuration) ? "Duration (months):" : "Enter Duration (months):";
        }
        function changeAmountLabel(force) {
            vm.isAmount = (force != undefined) || (vm.membership.amount != '');
            vm.label_amount = (vm.isAmount) ? "Amount:" : "Enter Amount:";
        }
        function changeDescriptionLabel(force) {
            vm.isDescription = (force != undefined) || (vm.membership.description != '');
            vm.label_description = (vm.isDescription) ? "Description:" : "Enter Description:";
        }
        //  listen to changes in input fields [END]

        //  check current operation mode if it is 'add' or not
        function isAddOperation() {
            return (vm.operationMode == 'add');
        }
        
        //  display error message and exit from state
        function errorAndExit() {
            utils.showSimpleToast('Something went wrong! Please Try Again!');
            $state.go('restricted.treatments.master', {
                openTab: 'memberships'
            });
        }
        
        //  change master occurences that changes individual occurences
        function changeOccurences() {
            vm.treatments.forEach(iterateTreatments);
            vm.treatment.occurences = vm.membership.occurences;
            
            function iterateTreatments(treatment) {
                treatment.occurences = vm.membership.occurences;
            }
        }
        
        //  change master durations that changes individual duration
        function changeDuration() {
            vm.treatments.forEach(iterateTreatments);
            vm.treatment.duration = vm.membership.duration;
            
            function iterateTreatments(treatment) {
                treatment.duration = vm.membership.duration;
            }
        }
        
        //  get membership info
        function getMembershipInfo() {
            amTreatments.getMembershipInfo($state.params.name).then(success).catch(failure);
            
            function success(res) {
                vm.membership.name = res.name;
                oMembershipName = res.name;
                vm.membership.occurences = res.occurences;
                vm.membership.duration = res.duration;
                vm.membership.amount = res.amount;
                vm.membership.description = res.description;
                changeNameLabel();
                changeOccurences();
                changeDuration();
                Object.keys(res.treatments).forEach(iterateTreatments);
                
                function iterateTreatments(treatment) {
                    
                    var found = $filter('filter')(vm.treatments, {
                        name: treatment
                    }, true);
                    
                    if (found.length == 1) {
                        found[0].checked = true;
                        found[0].occurences = res.treatments[treatment].occurences;
                        found[0].duration = res.treatments[treatment].duration;
                        vm.selectedTreatments.push(found[0]);
                    } else {
                        vm.treatments.push({
                            checked: true,
                            name: treatment,
                            occurences: res.treatments[treatment].occurences,
                            duration: res.treatments[treatment].duration
                        });
                        vm.selectedTreatments.push(vm.treatments[vm.treatments.length-1]);
                    }
                }
            }
            function failure(err) {
                errorAndExit();
            }
        }
        
        //  get treatment from database
        function getTreatments() {
            var callback = arguments[0];
            vm.treatmentPromise = amTreatments.getTreatments().then(success).catch(failure);

            function success(res) {
                res.treatments.forEach(itreateTreatments);
                vm.treatments = res.treatments;
                callback();
                
                function itreateTreatments(treatment) {
                    treatment.occurences = 1;
                    treatment.duration = 1;
                    vm.treatments.push(treatment);
                }
            }

            function failure(err) {
                vm.treatments = [];
            }
        }

        //  get vehicle types to display headers on datatable
        function getVehicleTypes() {
            var callback = arguments[0];
            var callingFunction = this;
            var callbackArgs = arguments;
            
            amTreatments.getVehicleTypes().then(success).catch(failure);
            delete callingFunction, callbackArgs, callback;

            function success(res) {
                res.forEach(iterateVehicleType);
                callback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 1));

                function iterateVehicleType(type) {
                    vm.vehicletypes.push(utils.convertToTitleCase(type.replace(/-/g, ' ')));
                }
            }

            function failure(err) {
                vm.vehicletypes.push('Default');
                callback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 1));
            }
        }

        function finalizeNewTreatment(btnClicked) {
            vm.treatment.details = vm.treatment.details.trim();
            if (vm.treatment.details != '') {
                var found = $filter('filter')(vm.treatments, {
                    name: vm.treatment.details
                });
                if (found.length == 1 && found[0].name == vm.treatment.details) {
                    found[0].checked = true;
                    found[0].duration = vm.treatment.duration;
                    found[0].occurences = vm.treatment.occurences;
                    vm.selectedTreatments.push(found[0]);
                } else {
                    vm.treatments.push({
                        name: vm.treatment.details,
                        duration: vm.treatment.duration,
                        occurences: vm.treatment.occurences,
                        checked: true
                    });
                    vm.selectedTreatments.push(vm.treatments[vm.treatments.length - 1]);
                }
                vm.treatment.occurences = vm.membership.occurences;
                vm.treatment.duration = vm.membership.duration;
                angular.element('#new-treatment-details').find('input')[0].focus();
            }
            if (btnClicked)
                angular.element('#new-treatment-details').find('input')[0].focus();
        }

        //  query search for treatments [autocomplete]
        function treatmentQuerySearch() {
            var tracker = $q.defer();
            var results = (vm.treatment.details ? vm.treatments.filter(createFilterForTreatments(vm.treatment.details)) : vm.treatments);

            return results;
        }

        //  create filter for users' query list
        function createFilterForTreatments(query) {
            var lcQuery = angular.lowercase(query);
            return function filterFn(item) {
                return (angular.lowercase(item.name).indexOf(lcQuery) === 0);
            }
        }

        function save() {
            vm.selectedTreatments.forEach(iterateTreatments);
            amTreatments.saveMembership(vm.membership, oMembershipName).then(success).catch(failure);

            function iterateTreatments(treatment) {
                vm.membership[treatment.name] = treatment;
                delete vm.membership[treatment.name]['$$hashKey']
                delete vm.membership[treatment.name].name;
            }
            
            function success(res) {
                utils.showSimpleToast('Membership has been saved successfully!');
                $state.go('restricted.treatments.master', {
                    openTab: 'memberships'
                });
            }
            
            function failure(err) {
                utils.showSimpleToast('Could not save membership at moment. Please Try Again!');
            }
        }
    }
})();