/*
 * Closure for root level controllers
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {

    angular.module('automintApp').controller('amCtrl', HomeController);

    HomeController.$inject = ['$rootScope', '$state', '$amRoot', '$amLicense', 'utils'];

    function HomeController($rootScope, $state, $amRoot, $amLicense, utils, amLogin) {
        //  initialize view model
        var vm = this;

        //  default execution steps
        $rootScope.isFirstLoad = true;
        $amLicense.checkLogin().then(success).catch(failure);

        //  function definitions

        function success(res) {
            if (res.isLoggedIn) {
                if (res.isCloudEnabled) {
                    if (res.isCloudForceEnabled != false)
                        $amRoot.syncDb();
                }
                $amRoot.dbAfterLogin(false);
            } else
                failure();
        }

        function failure(err) {
            $rootScope.hidePreloader = true;
            $state.go('login');
        }
    }
})();