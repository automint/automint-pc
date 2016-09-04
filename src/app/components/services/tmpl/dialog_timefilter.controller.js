/**
 * Controller for Time Filter dialog box
 * @author ndkcha
 * @since 0.6.4
 * @version 0.6.4
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlSeTmFl', TimeFilterController);

    TimeFilterController.$inject = ['$mdDialog', '$filter', 'filterRange', 'currentTimeSet'];

    function TimeFilterController($mdDialog, $filter, filterRange, currentTimeSet) {
        var vm = this;

        vm.currentYearIndex = 0;
        vm.yearRange = [];
        vm.selectedDateSet = $.extend([], currentTimeSet);

        //  default execution steps
        populateYearRange();

        //  function mappings
        vm.IsNextYear = IsNextYear;
        vm.IsPreviousYear = IsPreviousYear;
        vm.changeToNextYear = changeToNextYear;
        vm.changeToPreviousYear = changeToPreviousYear;
        vm.selectDateSet = selectDateSet;
        vm.IsDateSetSelected = IsDateSetSelected;
        vm.IsDateSetDisabled = IsDateSetDisabled;
        vm.confirm = confirm;

        //  function definitions

        function confirm() {
            if (vm.selectedDateSet.length < 1)
                vm.selectedDateSet = currentTimeSet;
            $mdDialog.hide(vm.selectedDateSet);
        }

        function IsDateSetDisabled(month) {
            var temp_m = moment(month, 'M').format('MMM');
            var found = $filter('filter')(filterRange, {
                year: vm.yearRange[vm.currentYearIndex],
                month: temp_m
            }, true);

            return (found.length == 0);
        }

        function IsDateSetSelected(month) {
            var temp_m = moment(month, 'M').format('MMM');
            var found = $filter('filter')(vm.selectedDateSet, {
                year: vm.yearRange[vm.currentYearIndex],
                month: temp_m
            }, true);

            return (found.length == 1);
        }

        function selectDateSet(month) {
            var temp_m = moment(month, 'M').format('MMM');
            var found = $filter('filter')(vm.selectedDateSet, {
                year: vm.yearRange[vm.currentYearIndex],
                month: temp_m
            }, true);

            if (found.length == 0) {
                vm.selectedDateSet.push({
                    year: vm.yearRange[vm.currentYearIndex],
                    month: temp_m
                });
            } else {
                var i = vm.selectedDateSet.indexOf(found[0]);
                vm.selectedDateSet.splice(i, 1);
            }
        }

        function changeToNextYear() {
            vm.currentYearIndex--;
        }

        function changeToPreviousYear() {
            vm.currentYearIndex++;
        }

        function IsNextYear() {
            return (vm.currentYearIndex != 0);
        }

        function IsPreviousYear() {
            return (vm.currentYearIndex != (vm.yearRange.length - 1));
        }

        function populateYearRange() {
            filterRange.forEach(iterateYearRange);
            vm.yearRange.sort(sortYears);

            function sortYears(lhs, rhs) {
                return (rhs - lhs);
            }

            function iterateYearRange(item) {
                var found = $filter('filter')(vm.yearRange, item.year, true);

                if (found == 0)
                    vm.yearRange.push(item.year);
            }
        }
    }
})();