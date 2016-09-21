/**
 * Factory to fetch and retrieve invoice settings from database
 * @author ndkcha
 * @since 0.5.0
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amIvSettings', IvSettingsFactory);

    IvSettingsFactory.$inject = ['$q', '$rootScope', 'pdbMain'];

    function IvSettingsFactory($q, $rootScope, pdbMain) {
        //  initialize factory and function mappings
        var factory = {
            getWorkshopDetails: getWorkshopDetails,
            saveWorkshopDetails: saveWorkshopDetails,
            getInvoiceSettings: getInvoiceSettings,
            changeLastInvoiceNo: changeLastInvoiceNo,
            saveIvDisplaySettings: saveIvDisplaySettings,
            saveIvEmailSubject: saveIvEmailSubject,
            saveIvAlignMargins : saveIvAlignMargins,
            getIvAlignMargins: getIvAlignMargins,
            changeLastJobCardNo: changeLastJobCardNo,
            changeLastEstimateNo: changeLastEstimateNo,
            saveInvoicePageSize: saveInvoicePageSize,
            getInvoicePageSize: getInvoicePageSize
        }
        
        return factory;
        
        //  function definitions

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

        function getInvoicePageSize() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;

            function getSettingsObject(res) {
                if (res.settings && res.settings.invoices && res.settings.invoices.pageSize)
                    tracker.resolve(res.settings.invoices.pageSize);
                else
                    failure('No PageSize Found!');
            }

            function failure(err) {
                tracker.reject(err);
            }
        }
        
        //  get workshop details from config database
        function getWorkshopDetails() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.workshop).then(getWorkshopObject).catch(failure);
            return tracker.promise;
            
            function getWorkshopObject(res) {
                if (res.workshop)
                    tracker.resolve(res.workshop);
                else
                    failure();
            }
            
            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'No workshop details found!'
                    }
                }
                tracker.reject(err);
            }
        }
        
        //  save workshop details to config database
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
        
        //  get invoice settings
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
        
        //  save invoice display settings
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

        function getIvAlignMargins() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
            return tracker.promise;

            function getSettingsObject(res) {
                if (res.settings && res.settings.invoices && res.settings.invoices.margin)
                    tracker.resolve(res.settings.invoices.margin);
                else
                    failure();
            }

            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'No Margin Settings Found!'
                    }
                }
                tracker.reject(err);
            }
        }
    }
})();