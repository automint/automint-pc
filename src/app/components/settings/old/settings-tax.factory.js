/**
 * Factory to fetch and retrieve service tax settings from database
 * @author ndkcha
 * @since 0.5.0
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amTaxSettings', TaxSettings);
    
    TaxSettings.$inject = ['$q', '$rootScope', 'pdbMain'];
    
    function TaxSettings($q, $rootScope, pdbMain) {
        //  intialize factory variable and function maps
        var factory = {
            getAllTaxSettings: getAllTaxSettings,
            saveTaxSettings: saveTaxSettings,
            deleteTaxSettings: deleteTaxSettings
        }
        
        return factory;
        
        //  function definitions

        function deleteTaxSettings(tax) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObj).catch(failure);
            return tracker.promise;

            function getSettingsObj(res) {
                if (res.settings && res.settings.tax && res.settings.tax[tax.name]) {
                    delete res.settings.tax[tax.name];
                    pdbMain.save(res).then(success).catch(failure);
                }
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function saveTaxSettings(tax) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObj).catch(writeSettingsDoc);
            return tracker.promise;

            function getSettingsObj(res) {
                if (!res.settings)
                    res.settings = {};
                if (res.settings && !res.settings.tax)
                    res.settings.tax = {};
                res.settings.tax[tax.name] = {
                    type: (tax.inclusive) ? "inclusive" : "exclusive",
                    isTaxApplied: tax.isTaxApplied,
                    isForTreatments: tax.isForTreatments,
                    isForInventory: tax.isForInventory,
                    percent: tax.percent
                };
                pdbMain.save(res).then(success).catch(failure);
            }

            function writeSettingsDoc(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    settings: {
                        tax: {}
                    }
                }
                doc.settings.tax[tax.name] = {
                    type: (tax.inclusive) ? "inclusive" : "exclusive",
                    isTaxApplied: tax.isTaxApplied,
                    isForTreatments: tax.isForTreatments,
                    isForInventory: tax.isForInventory,
                    percent: tax.percent
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

        function getAllTaxSettings() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObj).catch(failure);
            return tracker.promise;

            function getSettingsObj(res) {
                var result = [];
                if (res.settings && res.settings.tax) {
                    Object.keys(res.settings.tax).forEach(iterateTax);

                    function iterateTax(tax) {
                        var t = res.settings.tax[tax];
                        result.push({
                            inclusive: (t.type == "inclusive"),
                            isTaxApplied: t.isTaxApplied,
                            isForTreatments: t.isForTreatments,
                            isForInventory: t.isForInventory,
                            percent: t.percent,
                            name: tax
                        });
                    }
                }
                tracker.resolve(result);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }
    }
})();