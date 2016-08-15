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
        $rootScope.isFirstLoad = true;
        $amRoot.IsAutomintLoggedIn().then(checkLoginState).catch(doLogin);

        //  function definitions

        function checkLoginState(res) {
            var curdate = moment().format(), isLoggedIn = false;
            if (res.username && res.password) {
                res.isLoggedIn = isLoggedIn;
                if (!res.license) {
                    doLogin();
                    return;
                } else {
                    if ((res.license.starts == undefined) || (res.license.ends == undefined)) {
                        doLogin();
                        return;
                    }
                    var startdate = moment(res.license.starts, 'YYYY-MM-DD').format();
                    var enddate = moment(res.license.ends, 'YYYY-MM-DD').format();
                    if ((startdate.localeCompare(curdate) < 0) && (enddate.localeCompare(curdate) > 0))
                        isLoggedIn = true;
                }
                if (isLoggedIn == true) {
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
                    var isSyncableDb = ((res.username != undefined) && (res.username != '') && (res.password != undefined) && (res.password != ''));
                    if (!res.cloud)
                        isSyncableDb = false;
                    else if ((res.cloud.starts == undefined) || (res.cloud.ends == undefined))
                        isSyncableDb = false;
                    else {
                        var cloudstart = moment(res.cloud.starts, 'YYYY-MM-DD').format();
                        var cloudend = moment(res.cloud.ends, 'YYYY-MM-DD').format();
                        isSyncableDb = ((cloudstart.localeCompare(curdate) < 0) && (cloudend.localeCompare(curdate) > 0));
                        if (!isSyncableDb)
                            utils.showSimpleToast('Your cloud services have expired! Please Contact Automint Care!');
                    }
                    if (isSyncableDb)
                        $amRoot.syncDb(res.username, res.password);
                    $amRoot.dbAfterLogin();
                    return;
                }
            }
            if (res.activation) {
                res.isLoggedIn = isLoggedIn;
                if ((res.activation.startdate == undefined) || (res.activation.enddate == undefined)) {
                    doLogin();
                    return;
                }
                var activationstart = moment(res.activation.startdate, 'YYYY-MM-DD').format();
                var activationend = moment(res.activation.enddate, 'YYYY-MM-DD').format();
                if ((activationstart.localeCompare(curdate) < 0) && (activationend.localeCompare(curdate) > 0))
                    isLoggedIn = true;
                if (isLoggedIn == true) {
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