/*
 * Closure for root level controllers
 * @author ndkcha
 * @since 0.4.1
 * @version 0.9.0
 */

(function() {

    angular.module('automintApp').controller('amCtrl', HomeController);

    HomeController.$inject = ['$rootScope', '$amRoot'];

    function HomeController($rootScope, $amRoot) {
        //  initialize view model
        var vm = this;

        $amRoot.dbAfterLogin(false);
    }
})();