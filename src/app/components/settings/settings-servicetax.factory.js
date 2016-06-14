/**
 * Factory to fetch and retrieve service tax settings from database
 * @author ndkcha
 * @since 0.5.0
 * @version 0.6.1
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amSeTaxSettings', ServiceTaxSettings);
    
    ServiceTaxSettings.$inject = ['$q', '$amRoot', 'utils', 'pdbConfig'];
    
    function ServiceTaxSettings($q, $amRoot, utils, pdbConfig) {
        //  intialize factory variable and function maps
        var factory = {
            getServiceTaxSettings: getServiceTaxSettings,
            saveServiceTaxSettings: saveServiceTaxSettings,
            getVatSettings: getVatSettings,
            saveVatSettings: saveVatSettings
        }
        
        return factory;
        
        //  function definitions
        
        function getServiceTaxSettings() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;
            
            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObj).catch(failure);
            }
            
            function getSettingsObj(res) {
                if (res.settings && res.settings.servicetax) {
                    tracker.resolve({
                        applyTax: res.settings.servicetax.applyTax,
                        inclusive: (res.settings.servicetax.taxIncType == 'inclusive') ? true : false,
                        tax: res.settings.servicetax.tax
                    });
                } else
                    failure();
            }
            
            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'Service Tax Settings Not Found!'
                    }
                }
                tracker.reject(err);
            }
        }
        
        function saveServiceTaxSettings(taxObject) {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;
            
            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObj).catch(writeSettingsDoc);
            }
            
            function getSettingsObj(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.servicetax)
                    res.settings.servicetax = {};
                if (taxObject.applyTax != undefined)
                    res.settings.servicetax.applyTax = taxObject.applyTax;
                if (taxObject.inclusive != undefined)
                    res.settings.servicetax.taxIncType = (taxObject.inclusive) ? 'inclusive' : 'exclusive';
                if (taxObject.tax != undefined)
                    res.settings.servicetax.tax = taxObject.tax;
                pdbConfig.save(res).then(success).catch(failure);
            }
            
            function writeSettingsDoc(err) {
                var doc = {
                    _id: utils.generateUUID('sttngs'),
                    creator: $amRoot.username,
                    settings: {
                        servicetax: {}
                    }
                }
                if (taxObject.applyTax)
                    doc.settings.servicetax.applyTax = taxObject.applyTax;
                if (taxObject.inclusive)
                    doc.settings.servicetax.taxIncType = (taxObject.inclusive) ? 'inclusive' : 'exclusive';
                if (taxObject.tax)
                    doc.settings.servicetax.tax = taxObject.tax;
                pdbConfig.save(doc).then(success).catch(failure);
            }
            
            function success(res) {
                tracker.resolve(res);
            }
            
            function failure(err) {
                tracker.reject(err);
            }
        }

        function getVatSettings() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;
            
            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObj).catch(failure);
            }
            
            function getSettingsObj(res) {
                if (res.settings && res.settings.vat) {
                    tracker.resolve({
                        applyTax: res.settings.vat.applyTax,
                        inclusive: (res.settings.vat.taxIncType == 'inclusive') ? true : false,
                        tax: res.settings.vat.tax
                    });
                } else
                    failure();
            }
            
            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'VAT Settings Not Found!'
                    }
                }
                tracker.reject(err);
            }
        }

        function saveVatSettings(taxObject) {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;
            
            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObj).catch(writeSettingsDoc);
            }
            
            function getSettingsObj(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.vat)
                    res.settings.vat = {};
                if (taxObject.applyTax != undefined)
                    res.settings.vat.applyTax = taxObject.applyTax;
                if (taxObject.inclusive != undefined)
                    res.settings.vat.taxIncType = (taxObject.inclusive) ? 'inclusive' : 'exclusive';
                if (taxObject.tax != undefined)
                    res.settings.vat.tax = taxObject.tax;
                pdbConfig.save(res).then(success).catch(failure);
            }
            
            function writeSettingsDoc(err) {
                var doc = {
                    _id: utils.generateUUID('sttngs'),
                    creator: $amRoot.username,
                    settings: {
                        vat: {}
                    }
                }
                if (taxObject.applyTax)
                    doc.settings.vat.applyTax = taxObject.applyTax;
                if (taxObject.inclusive)
                    doc.settings.vat.taxIncType = (taxObject.inclusive) ? 'inclusive' : 'exclusive';
                if (taxObject.tax)
                    doc.settings.vat.tax = taxObject.tax;
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