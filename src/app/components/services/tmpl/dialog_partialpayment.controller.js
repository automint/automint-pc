/**
 * Controller for Partial Payment Dialogbox
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlSePp', PartialPaymentController);

    PartialPaymentController.$inject = ['$mdDialog', '$filter', 'totalCost', 'partialPayments', 'currencySymbol'];

    function PartialPaymentController($mdDialog, $filter, totalCost, partialPayments, currencySymbol) {
        //  initialize view model
        var vm = this;

        //  named assignments for view model
        vm.partialPayments = [];
        vm.tc = totalCost;
        vm.paymentFocusIndex = -1;
        vm.currencySymbol = currencySymbol;

        //  function mappings to view model
        vm.getDate = getDate;
        vm.addPayment = addPayment;
        vm.save = save;
        vm.cancel = cancel;
        vm.calculateRemaining = calculateRemaining;
        vm.calculateReceived = calculateReceived;
        vm.IsPaymentFocusIndex = IsPaymentFocusIndex;

        //  default execution steps
        setTimeout(setViewportHeight, 400);
        feedExistingPayments();

        $(window).on('resize', OnWindowResize);

        //  function definitions

        function feedExistingPayments() {
            var keys = (partialPayments) ? Object.keys(partialPayments) : undefined;
            if (partialPayments && keys && (keys.length > 1)) {
                keys.forEach(iteratePp);
                calculateRemaining();
            } else
                addPayment();

            function iteratePp(pp) {
                if (pp == "total")
                    return;
                vm.partialPayments.push({
                    amount: partialPayments[pp],
                    date: new Date(pp),
                    adjust: false
                });
            }
        }

        function IsPaymentFocusIndex(index) {
            return (vm.paymentFocusIndex == index);
        }

        function calculateTotalReceived() {
            var temptr = 0;
            vm.partialPayments.forEach(iteratePp);
            return temptr;

            function iteratePp(pp) {
                if (!pp.amount || pp.amount == '' || (pp.adjust == true))
                    return;
                temptr += parseFloat(pp.amount);
            }
        }

        function calculateReceived() {
            var x = totalCost - (vm.tc + calculateTotalReceived());
            var found = $filter('filter')(vm.partialPayments, {
                adjust: true
            }, true);

            if (found.length > 0)
                found[0].amount = x;
            else {
                vm.partialPayments.push({
                    amount: x,
                    date: new Date(),
                    adjust: true
                });
            }
        }

        function adjustPaymentCalc() {
            vm.partialPayments.forEach(iteratePp);

            function iteratePp(pp) {
                pp.adjust = (!pp.amount || pp.amount == '');
            }
        }

        function calculateRemaining(payment) {
            adjustPaymentCalc();
            vm.tc = totalCost - calculateTotalReceived();
        }

        function OnWindowResize() {
            setViewportHeight();
        }

        function setViewportHeight() {
            $('#am-dpp').css('max-height', $(window).height() - ($('#am-dpp').offset().top + 15));
        }

        function addPayment() {
            vm.paymentFocusIndex = -1;
            vm.partialPayments.push({
                amount: '',
                date: new Date(),
                adjust: true
            });
            vm.paymentFocusIndex = vm.partialPayments.length - 1;
        }
        
        function getDate(date) {
            return moment(date).format('DD MMM YYYY');
        }

        function save() {
            var temp = {}, total = 0;
            vm.partialPayments.forEach(iteratePp);
            temp.total = parseFloat(total);
            $mdDialog.hide(temp);

            function iteratePp(pp) {
                if (pp.amount == '')
                    return;
                temp[moment(pp.date).format()] = pp.amount; 
                total += pp.amount;
            }
        }

        function cancel() {
            $mdDialog.cancel();
        }
    }
})();