/**
 * Factory to fetch and retrieve service tax settings from database
 * @author ndkcha
 * @since 0.6.4
 * @version 0.8.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    //  define angular factory
    angular.module('automintApp').factory('amSettings', SettingsFactory);

    //  inject external dependencies
    SettingsFactory.$inject = ['$q', '$rootScope', 'pdbMain'];

    function SettingsFactory($q, $rootScope, pdbMain) {
        //  initialize factory holder
        var factory = {
            fetchSettings: fetchSettings,
            fetchWorkshopDetails: fetchWorkshopDetails,
            saveInvoicePageSize: saveInvoicePageSize,
            saveCurrencySymbol: saveCurrencySymbol,
            saveTaxSettings: saveTaxSettings,
            deleteTaxSettings: deleteTaxSettings,
            saveDefaultServiceType: saveDefaultServiceType,
            changeLastEstimateNo: changeLastEstimateNo,
            changeLastInvoiceNo: changeLastInvoiceNo,
            changeLastJobCardNo: changeLastJobCardNo,
            saveIvAlignMargins: saveIvAlignMargins,
            savePasscode: savePasscode,
            saveWorkshopDetails: saveWorkshopDetails,
            saveIvDisplaySettings: saveIvDisplaySettings,
            saveIvEmailSubject: saveIvEmailSubject,
            getInvoiceSettings: getInvoiceSettings,
            getAllTaxSettings: getAllTaxSettings
        }

        // return the holder
        return factory;

        //  function definitions

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

        function getInvoiceSettings() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;
            
            function getSettingsObject(res) {
                if (res.settings && res.settings.invoices)
                    tracker.resolve(res.settings.invoices);
                else
                    failure();
            }
            
            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'No invoice settings found!'
                    }
                }
                tracker.reject(err);
            }
        }

        function saveIvEmailSubject(emailsubject) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(writeSettingsDoc);
            return tracker.promise;
            
            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.emailsubject = emailsubject;
                pdbMain.save(res).then(success).catch(failure);
            }
            
            function writeSettingsDoc(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    settings: {
                        invoices: {
                            emailsubject: emailsubject
                        }
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

        function saveIvDisplaySettings(display) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(writeSettingsDoc);
            return tracker.promise;
            
            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.display = display;
                pdbMain.save(res).then(success).catch(failure);
            }
            
            function writeSettingsDoc(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    settings: {
                        invoices: {
                            display: display
                        }
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

        function saveWorkshopDetails(workshop) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.workshop).then(updateWorkshopDoc).catch(createWorkshopDoc);
            return tracker.promise;
            
            function updateWorkshopDoc(res) {
                res.workshop = workshop;
                pdbMain.save(res).then(success).catch(failure);
            }
            
            function createWorkshopDoc(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.workshop,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    workshop: workshop
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

        function savePasscode(passcode, enabled) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObj).catch(writeSettingsObj);
            return tracker.promise;

            function getSettingsObj(res) {
                res.passcode = {
                    enabled: enabled,
                    code: passcode
                };
                pdbMain.save(res).then(success).catch(failure);
            }

            function writeSettingsObj(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    passcode: {
                        enabled: enabled,
                        code: passcode
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

        function saveIvAlignMargins(margin) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(writeSettingsDoc);
            return tracker.promise;

            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.margin = margin;
                pdbMain.save(res).then(success).catch(failure);
            }

            function writeSettingsDoc(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    settings: {
                        invoices: {
                            margin: margin
                        }
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

        function changeLastJobCardNo(jobcardno) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(writeSettingsDoc);
            return tracker.promise;

            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.lastJobCardNo = jobcardno;
                pdbMain.save(res).then(success).catch(failure);
            }

            function writeSettingsDoc(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    settings: {
                        invoices: {
                            lastJobCardNo: jobcardno
                        }
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

        function changeLastEstimateNo(estimateno) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(writeSettingsDoc);
            return tracker.promise;

            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.lastEstimateNo = estimateno;
                pdbMain.save(res).then(success).catch(failure);
            }

            function writeSettingsDoc(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    settings: {
                        invoices: {
                            lastEstimateNo: estimateno
                        }
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
        
        //  change last invoice number in database
        function changeLastInvoiceNo(invoiceno) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(writeSettingsDoc);
            return tracker.promise;
            
            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.lastInvoiceNumber = invoiceno;
                pdbMain.save(res).then(success).catch(failure);
            }
            
            function writeSettingsDoc(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    settings: {
                        invoices: {
                            lastInvoiceNumber: invoiceno
                        }
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

        function saveInvoicePageSize(pageSize) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(writeSettingsDoc);
            return tracker.promise;

            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.pageSize = pageSize;
                pdbMain.save(res).then(success).catch(failure);
            }

            function writeSettingsDoc(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    settings: {
                        invoices: {
                            pageSize: pageSize
                        }
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

        function fetchWorkshopDetails() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.workshop).then(getWorkshopObject).catch(failure);
            return tracker.promise;
            
            function getWorkshopObject(res) {
                if (res.workshop)
                    tracker.resolve(res.workshop);
                else
                    failure('No Workshop Details Found!');
            }
            
            function failure(err) {
                tracker.reject(err);
            }
        }
        
        function fetchSettings() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;

            function getSettingsObject(res) {
                tracker.resolve(res);
            } 

            function failure(err) {
                tracker.reject(err);
            }
        }
    }
})();