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
            if (res && res.username && res.password) {
                amLogin.loadCredentials(res.username, res.password);
                amLogin.login(success, failure);
            } else
                doLogin();

            function success(response) {
                if (response.data && (response.statusText == "OK")) {
                    if (response.data.userCtx && (response.data.userCtx.name != null) && response.data.userCtx.channels && (Object.keys(response.data.userCtx.channels).length > 0)) {
                        if (Object.keys(response.data.userCtx.channels).length > 1) {
                            amLogin.saveLoginCredentials(true, res.username, res.password, Object.keys(response.data.userCtx.channels)[1]).then(proceed).catch(doLogin);
                            return;
                        }
                    }
                }
                utils.showSimpleToast('Please Login Again!');
                doLogin();     
            }

            function failure(err) {
                if (err.status == -1) {
                    if (res.isLoggedIn == true) {
                        proceed();
                        return;
                    }
                }
                utils.showSimpleToast('Please Login Again!');
                doLogin();
            }

            function proceed() {
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
                $amRoot.dbAfterLogin();
            }
        }

        function doLogin(err) {
            $rootScope.hidePreloader = true;
            $state.go('login');
        }
    }
})();