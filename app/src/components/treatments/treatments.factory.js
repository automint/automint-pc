/**
 * Factory that handles database interactions between treatments database and controller
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0 
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amTreatments', TreatmentsFactory);

    TreatmentsFactory.$inject = ['$q', '$filter', '$amRoot', 'utils', 'pdbConfig'];

    function TreatmentsFactory($q, $filter, $amRoot, utils, pdbConfig) {
        //  initialized factory and function maps
        var factory = {
            saveTreatment: saveTreatment,
            getTreatments: getTreatments,
            deleteTreatment: deleteTreatment,
            treatmentDetails: treatmentDetails,
            saveVehicleTypes: saveVehicleTypes,
            getVehicleTypes: getVehicleTypes,
            getTreatmentSettings: getTreatmentSettings,
            changeDisplayAsList: changeDisplayAsList
        }
        
        return factory;
        
        //  retrieve vehicle types from config database
        function getVehicleTypes() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(configFound).catch(noConfigFound);
            return tracker.promise;
            
            function configFound(res) {
                pdbConfig.get($amRoot.docIds.settings).then(settingsDocFound).catch(noConfigFound);
            }
            
            function settingsDocFound(res) {
                if (res.vehicletypes)
                    tracker.resolve(res.vehicletypes);
                else
                    tracker.reject('No vehicle types found!');
            }
            
            function noConfigFound(err) {
                tracker.reject(err);
            }
        }
        
        //  store vehicle types to config database
        function saveVehicleTypes(vehicleTypes) {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(configFound).catch(failure);
            return tracker.promise;
            
            function configFound(res) {
                pdbConfig.get($amRoot.docIds.settings).then(settingsDocFound).catch(writeNewConfig);
            }
            
            function settingsDocFound(res) {
                var totalMatch = 0;
                if (!res.vehicletypes)
                    res.vehicletypes = [];
                vehicleTypes.forEach(iterateNewTypes);
                
                function iterateNewTypes(type) {
                    var found = $filter('filter')(res.vehicletypes, type);
                    if (found.length != 1)
                        res.vehicletypes.push(type);
                    else
                        totalMatch++;
                }
                if (totalMatch == vehicleTypes.length)
                    tracker.resolve('Duplicate Entries');
                else
                    pdbConfig.save(res).then(success).catch(failure);
            }
            
            function writeNewConfig(err) {
                var doc = {};
                doc['_id'] = utils.generateUUID('settings');
                doc['creator'] = $amRoot.username;
                doc.vehicletypes = vehicleTypes;
                pdbConfig.save(doc).then(success).catch(failure);
            }
            
            function success(res) {
                tracker.resolve(res);
            }
            
            function failure(err) {
                tracker.reject(err);
            }
        }
        
        //  return particular treatment
        function treatmentDetails(treatmentName) {
            var tracker = $q.defer();
            $amRoot.isTreatmentId().then(treatmentConfigFound).catch(failure);
            return tracker.promise;
            
            function treatmentConfigFound(response) {
                pdbConfig.get($amRoot.docIds.treatment).then(treatmentDocFound).catch(failure);
            }
            function treatmentDocFound(res) {
                var treatment = {
                    name: treatmentName,
                    rate: res.regular[treatmentName].rate
                }
                tracker.resolve(treatment);
            }
            function failure(error) {
                tracker.reject(error);
            }
        }
        
        //  get treatments for datatable
        function getTreatments(page, limit) {
            var tracker = $q.defer();
            var response = {
                treatments: [],
                total: 0
            };
            $amRoot.isTreatmentId().then(treatmentConfigFound).catch(failure);
            return tracker.promise;
            
            function treatmentConfigFound(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(treatmentDocFound).catch(failure);
            }
            
            function treatmentDocFound(res) {
                if (res.regular) {
                    var keys = Object.keys(res.regular);
                    var i = --page*limit;
                    var j = i + limit;
                    while (i < j && i < keys.length) {
                        response.treatments.push({
                            name: keys[i],
                            rate: res.regular[keys[i]].rate
                        });
                        i++;
                    }
                    response.total = keys.length; 
                }
                tracker.resolve(response);
            }
            
            function failure(err) {
                tracker.reject(response);
            }
        }
        
        //  delete treatment from database
        function deleteTreatment(name) {
            var tracker = $q.defer();
            $amRoot.isTreatmentId().then(treatmentConfigFound).catch(failure);
            return tracker.promise;
            
            function treatmentConfigFound(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(treatmentDocFound).catch(failure);
            }
            
            function treatmentDocFound(res) {
                res.regular[name]._deleted = true;
                pdbConfig.save(res).then(success).catch(failure);
            }
            
            function success(res) {
                tracker.resolve(res);
            }
            
            function failure(err) {
                tracker.reject(err);
            }
        }

        //  store treatment to database
        function saveTreatment(treatment, method) {
            var tracker = $q.defer();
            var i = {
                rate: treatment.rate
            };
            $amRoot.isTreatmentId().then(treatmentConfigFound).catch(failure);
            return tracker.promise;

            function treatmentConfigFound(response) {
                pdbConfig.get($amRoot.docIds.treatment).then(treatmentDocFound).catch(noTreatmentDoc);
            }

            function treatmentDocFound(res) {
                if (!res.regular)
                    res.regular = {};
                if (!(res.regular[treatment.name] && method == 'add')) {
                    res.regular[treatment.name] = i;
                }
                pdbConfig.save(res).then(success).catch(failure);
            }

            function noTreatmentDoc(err) {
                var doc = {};
                doc['_id'] = utils.generateUUID('treatment');
                doc['creator'] = $amRoot.username;
                doc.regular = {};
                doc.regular[treatment.name] = i;
                pdbConfig.save(doc).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(error) {
                tracker.reject(error);
            }
        }
        
        //  current treatment settings
        function getTreatmentSettings() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(treatmentConfigFound).catch(failure);
            return tracker.promise;
            
            function treatmentConfigFound(response) {
                pdbConfig.get($amRoot.docIds.settings).then(treatmentDocFound).catch(failure);
            }
            function treatmentDocFound(res) {
                if (res.settings.treatments)
                    tracker.resolve(res.settings.treatments);
                else {
                    tracker.reject({
                        success: false
                    });
                }
            }
            function failure(error) {
                tracker.reject(error);
            }
        }
        
        //  change display format setting of treatments
        function changeDisplayAsList(displayAsList) {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(configFound).catch(failure);
            return tracker.promise;
            
            function configFound(response) {
                pdbConfig.get($amRoot.docIds.settings).then(configDocFound).catch(writeNewConfig);
            }
            function configDocFound(res) {
                
                if (!res.settings)
                    res.settings = {};
                if (!res.settings.treatments)
                    res.settings.treatments = {};
                res.settings.treatments['displayAsList'] = displayAsList;
                pdbConfig.save(res).then(saveSuccess).catch(failure);
            }
            function writeNewConfig(err) {
                var doc = {};
                doc['_id'] = utils.generateUUID('settings');
                doc['creator'] = $amRoot.username;
                doc.settings = {};
                doc.settings['treatments'] = {}
                doc.settings.treatments['displayAsList'] = displayAsList;
                pdbConfig.save(doc).then(saveSuccess).catch(failure);
            }
            function saveSuccess(response) {
                tracker.resolve(response);
            }
            function failure(error) {
                tracker.reject(error);
            }
        }
    }
})();