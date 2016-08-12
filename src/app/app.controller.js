/*
 * Closure for root level controllers
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {

    angular.module('automintApp').controller('amCtrl', HomeController);

    HomeController.$inject = ['$rootScope', '$state', '$amRoot', 'utils', 'amLogin'];

    function HomeController($rootScope, $state, $amRoot, utils, amLogin) {
        //  initialize view model
        var vm = this;

        //  default execution steps
        $amRoot.IsAutomintLoggedIn().then(checkLoginState).catch(doLogin);

        //  function definitions

        function checkLoginState(res) {
            if (res.username && res.password) {
                amLogin.loadCredentials(res.username, res.password);
                if (res.isLoggedIn == true) {
                    $rootScope.hidePreloader = true;
                    if (res.channel)
                        $rootScope.amGlobals.channel = res.channel;
                    if (res.username)
                        $rootScope.amGlobals.creator = res.username;
                    $rootScope.amGlobals.configDocIds = {
                        settings: 'settings' + (res.channel ? '-' + res.channel : ''),
                        treatment: 'treatments' + (res.channel ? '-' + res.channel : ''),
                        inventory: 'inventory' + (res.channel ? '-' + res.channel : ''),
                        workshop: 'workshop' + (res.channel ? '-' + res.channel : '')
                    }
                    if ((res.username != undefined) && (res.username != '') && (res.password != undefined) && (res.password != ''))
                        $amRoot.syncDb(res.username, res.password);
                    $amRoot.dbAfterLogin();
                    return;
                }
            }
            doLogin();
        }

        function doLogin(err) {
            $rootScope.hidePreloader = true;
            $state.go('login');
        }
    }
})();