/**
 * Factory to fetch and retrieve service tax settings from database
 * @author ndkcha
 * @since 0.6.4
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amSettings', SettingsFactory);

    SettingsFactory.$inject = ['$q', '$rootScope', 'pdbMain'];

    function SettingsFactory($q, $rootScope, pdbMain) {
        var factory = {
            getDefaultServiceType: getDefaultServiceType,
            saveDefaultServiceType: saveDefaultServiceType,
            getCurrencySymbol: getCurrencySymbol,
            saveCurrencySymbol: saveCurrencySymbol
        }

        return factory;

        // function definitions

        function getCurrencySymbol() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;

            function getSettingsObject(res) {
                if (res.currency)
                    tracker.resolve(res.currency);
                else
                    failure('No Currency Symbol Found!');
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function saveCurrencySymbol(currency) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(writeSettingsObject);
            return tracker.promise;

            function getSettingsObject(res) {
                res.currency = currency;
                pdbMain.save(res).then(success).catch(failure);
            }

            function writeSettingsObject(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    currency: currency
                }
                pdbMain.save(doc).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function getDefaultServiceType() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;

            function getSettingsObject(res) {
                if (res.settings && res.settings.servicestate)
                    tracker.resolve(res.settings.servicestate);
                else
                    failure();
            }

            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'Could not find service state'
                    }
                }
                tracker.reject(err);
            }
        }

        function saveDefaultServiceType(servicestate) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(writeSettingsObject);
            return tracker.promise;

            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                res.settings.servicestate = servicestate;
                pdbMain.save(res).then(success).catch(failure);
            }

            function writeSettingsObject(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    settings: {
                        servicestate: servicestate
                    }
                }
                pdbMain.save(doc).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }
    }
})();