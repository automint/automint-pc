/*
 * Closure for root level controllers
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.3
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrl', HomeController);

    HomeController.$inject = ['$rootScope', '$amRoot'];

    function HomeController($rootScope, $amRoot) {
        //  initialize view model
        var vm = this;

        //  default execution steps
        $rootScope.firstTimers = {
            isFranchise: true
        };
        $amRoot.dbAfterLogin();
    }
})();