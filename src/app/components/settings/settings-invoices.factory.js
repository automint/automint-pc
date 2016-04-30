/**
 * Factory to fetch and retrieve invoice settings from database
 * @author ndkcha
 * @since 0.5.0
 * @version 0.5.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amIvSettings', IvSettingsFactory);

    IvSettingsFactory.$inject = ['$q', '$amRoot', 'utils', 'pdbConfig'];

    function IvSettingsFactory($q, $amRoot, utils, pdbConfig) {
        //  initialize factory and function mappings
        var factory = {
            getWorkshopDetails: getWorkshopDetails,
            saveWorkshopDetails: saveWorkshopDetails,
            getInvoiceSettings: getInvoiceSettings,
            resetLastInvoiceNo: resetLastInvoiceNo,
            saveIvDisplaySettings: saveIvDisplaySettings
        }
        
        return factory;
        
        //  function definitions
        
        //  get workshop details from config database
        function getWorkshopDetails() {
            var tracker = $q.defer();
            $amRoot.isWorkshopId().then(getWorkshopDoc).catch(failure);
            return tracker.promise;
            
            function getWorkshopDoc(res) {
                pdbConfig.get($amRoot.docIds.workshop).then(getWorkshopObject).catch(failure);
            }
            
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
            $amRoot.isWorkshopId().then(getWorkshopDoc).catch(failure);
            return tracker.promise;
            
            function getWorkshopDoc(res) {
                pdbConfig.get($amRoot.docIds.workshop).then(updateWorkshopDoc).catch(createWorkshopDoc);
            }
            
            function updateWorkshopDoc(res) {
                res.workshop = workshop;
                pdbConfig.save(res).then(success).catch(failure);
            }
            
            function createWorkshopDoc(err) {
                var doc = {
                    _id: utils.generateUUID('wrkshp'),
                    creator: $amRoot.username,
                    workshop: workshop
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
        
        //  get invoice settings
        function getInvoiceSettings() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;
            
            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(failure);
            }
            
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
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;
            
            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(writeSettingsDoc);
            }
            
            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.display = display;
                pdbConfig.save(res).then(success).catch(failure);
            }
            
            function writeSettingsDoc(err) {
                var doc = {
                    _id: utils.generateUUID('sttngs'),
                    creator: $amRoot.username,
                    settings: {
                        invoices: {
                            display: display
                        }
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
        
        //  reset last invoice number in database
        function resetLastInvoiceNo() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;
            
            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(writeSettingsObject);
            }
            
            function getSettingsObject(res) {
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.invoices)
                    res.settings.invoices = {};
                res.settings.invoices.lastInvoiceNumber = 0;
                pdbConfig.save(res).then(success).catch(failure);
            }
            
            function writeSettingsObject(err) {
                var doc = {
                    _id: utils.generateUUID('sttngs'),
                    creator: $amRoot.username,
                    settings: {
                        invoices: {
                            lastInvoiceNumber: 0
                        }
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