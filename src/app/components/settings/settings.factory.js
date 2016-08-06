/**
 * Factory to fetch and retrieve service tax settings from database
 * @author ndkcha
 * @since 0.6.4
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amSettings', SettingsFactory);

    SettingsFactory.$inject = ['$q', '$amRoot', 'utils', 'pdbConfig'];

    function SettingsFactory($q, $amRoot, utils, pdbConfig) {
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
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(failure);
            }

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
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(writeSettingsObject);
            }

            function getSettingsObject(res) {
                res.currency = currency;
                pdbConfig.save(res).then(success).catch(failure);
            }

            function writeSettingsObject(err) {
                var doc = {
                    _id: utils.generateUUID('sttngs'),
                    creator: $amRoot.username,
                    currency: currency
                }
                pdbConfig.save(doc).then(success).catch(failure);
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
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(failure);
            }

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
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(writeSettingsObject);
            } 

            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                res.settings.servicestate = servicestate;
                pdbConfig.save(res).then(success).catch(failure);
            }

            function writeSettingsObject(err) {
                var doc = {
                    _id: utils.generateUUID('sttngs'),
                    creator: $amRoot.username,
                    settings: {
                        servicestate: servicestate
                    }
                }
                pdbConfig.save(doc).then(success).catch(failure);
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