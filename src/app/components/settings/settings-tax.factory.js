/**
 * Factory to fetch and retrieve service tax settings from database
 * @author ndkcha
 * @since 0.5.0
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amTaxSettings', TaxSettings);
    
    TaxSettings.$inject = ['$q', '$amRoot', 'utils', 'pdbConfig'];
    
    function TaxSettings($q, $amRoot, utils, pdbConfig) {
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
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObj).catch(failure);
            }

            function getSettingsObj(res) {
                if (res.settings && res.settings.tax && res.settings.tax[tax.name]) {
                    delete res.settings.tax[tax.name];
                    pdbConfig.save(res).then(success).catch(failure);
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
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObj).catch(writeSettingsDoc);
            }

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
                pdbConfig.save(res).then(success).catch(failure);
            }

            function writeSettingsDoc(err) {
                var doc = {
                    _id: utils.generateUUID('sttngs'),
                    creator: $amRoot.username,
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
                pdbConfig.save(doc).then(success).catch(failure);
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
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObj).catch(failure);
            }

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