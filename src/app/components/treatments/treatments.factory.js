/**
 * Factory that handles database interactions between treatments database and controller
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
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
            changeDisplayAsList: changeDisplayAsList,
            getPackages: getPackages,
            getPackageInfo: getPackageInfo,
            deletePackage: deletePackage,
            savePackage: savePackage,
            getMemberships: getMemberships,
            getMembershipInfo: getMembershipInfo,
            deleteMembership: deleteMembership,
            saveMembership: saveMembership,
            getCurrencySymbol: getCurrencySymbol
        }
        
        return factory;

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
                    var found = $filter('filter')(res.vehicletypes, type, true);
                    if (found.length == 1 && found[0] == type)
                        totalMatch++;
                    else
                        res.vehicletypes.push(type);
                }
                if (totalMatch == vehicleTypes.length)
                    tracker.resolve('Duplicate Entries');
                else
                    pdbConfig.save(res).then(success).catch(failure);
            }
            
            function writeNewConfig(err) {
                var doc = {};
                doc['_id'] = utils.generateUUID('sttngs');
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
        function getTreatments() {
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
                if (res.regular)
                    Object.keys(res.regular).forEach(iterateRegularTreatments);
                tracker.resolve(response);
                
                function iterateRegularTreatments(treatment) {
                    if (res.regular[treatment]._deleted == true)
                        return;
                    response.treatments.push({
                        name: treatment,
                        rate: res.regular[treatment].rate
                    });
                }
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
                if (res.regular[treatment.name])
                    delete res.regular[treatment.name]['._deleted'];
                res.regular[treatment.name] = i;
                pdbConfig.save(res).then(success).catch(failure);
            }

            function noTreatmentDoc(err) {
                var doc = {};
                doc['_id'] = utils.generateUUID('trtmnt');
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
                doc['_id'] = utils.generateUUID('sttngs');
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
        
        function getPackageInfo(name) {
            var tracker = $q.defer();
            $amRoot.isTreatmentId().then(getTreatmentsDoc).catch(failure);
            return tracker.promise;
            
            function getTreatmentsDoc(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(getTreatmentObject).catch(failure);
            }
            
            function getTreatmentObject(res) {
                if (res.packages && res.packages[name]) {
                    tracker.resolve({
                        name: name,
                        treatments: res.packages[name]
                    });
                } else
                    failure();
            }
            
            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'Package not found!'
                    }
                }
                tracker.reject(err);
            }
        }
        
        function getPackages() {
            var tracker = $q.defer();
            var response = {
                packages: [],
                total: 0
            }
            $amRoot.isTreatmentId().then(getTreatmentsDoc).catch(failure);
            return tracker.promise;
            
            function getTreatmentsDoc(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(getTreatmentObject).catch(failure);
            }
            
            function getTreatmentObject(res) {
                if (res.packages)
                    Object.keys(res.packages).forEach(iteratePackages);
                tracker.resolve(response);
                
                function iteratePackages(package) {
                    if (res.packages[package]._deleted == true)
                        return;
                    response.packages.push({
                        name: package,
                        treatments: res.packages[package]
                    });
                    response.total++;
                }
            }
            
            function failure(err) {
                tracker.reject(response);
            }
        }
        
        function deletePackage(name) {
            var tracker = $q.defer();
            $amRoot.isTreatmentId().then(getTreatmentsDoc).catch(failure);
            return tracker.promise;
            
            function getTreatmentsDoc(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(getTreatmentObject).catch(failure);
            }
            
            function getTreatmentObject(res) {
                if (res.packages && res.packages[name]) {
                    res.packages[name]._deleted = true;
                    pdbConfig.save(res).then(success).catch(failure);
                } else
                    failure();
            }
            
            function success(res) {
                tracker.resolve(res);
            }
            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'Could not find ' + name
                    }
                }
                tracker.reject(err);
            }
        }
        
        function savePackage(package, oldName) {
            var tracker = $q.defer();
            $amRoot.isTreatmentId().then(getTreatmentsDoc).catch(failure);
            return tracker.promise;
            
            function getTreatmentsDoc(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(getTreatmentObject).catch(writeTreatmentDoc);
            }
            
            function getTreatmentObject(res) {
                if (!res.packages)
                    res.packages = {};
                if (res.packages[oldName])
                    delete res.packages[oldName];
                res.packages[package.name] = package;
                delete res.packages[package.name].name;
                pdbConfig.save(res).then(success).catch(failure);
            }
            
            function writeTreatmentDoc(err) {
                var doc = {
                    _id: utils.generateUUID('trtmnt'),
                    creator: $amRoot.username
                }
                doc.packages = {};
                doc.packages[package.name] = package;
                delete doc.packages[package.name].name;
                pdbConfig.save(doc).then(success).catch(failure);
            }
            
            function success(res) {
                tracker.resolve(res);
            }
            
            function failure(err) {
                tracker.reject(err);
            }
        }
        
        function getMembershipInfo(name) {
            var tracker = $q.defer();
            $amRoot.isTreatmentId().then(getTreatmentsDoc).catch(failure);
            return tracker.promise;
            
            function getTreatmentsDoc(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(getTreatmentObject).catch(failure);
            }
            
            function getTreatmentObject(res) {
                if (res.memberships && res.memberships[name]) {
                    var m = $.extend({}, res.memberships[name]);
                    delete res.memberships[name].occurences;
                    delete res.memberships[name].duration;
                    delete res.memberships[name].amount;
                    delete res.memberships[name].description;
                    tracker.resolve({
                        name: name,
                        treatments: res.memberships[name],
                        occurences: m.occurences,
                        duration: m.duration,
                        amount: m.amount,
                        description: m.description
                    });
                    delete m;
                } else
                    failure();
            }
            
            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'Membership not found'
                    }
                }
                tracker.reject(err);
            }
        }
        
        function getMemberships() {
            var tracker = $q.defer();
            var response = {
                memberships: [],
                total: 0
            }
            $amRoot.isTreatmentId().then(getTreatmentsDoc).catch(failure);
            return tracker.promise;
            
            function getTreatmentsDoc(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(getTreatmentObject).catch(failure);
            }
            
            function getTreatmentObject(res) {
                if (res.memberships)
                    Object.keys(res.memberships).forEach(iterateMemberships);
                tracker.resolve(response);
                
                function iterateMemberships(membership) {
                    if (res.memberships[membership]._deleted == true)
                        return;
                    delete res.memberships[membership].occurences
                    delete res.memberships[membership].duration;
                    response.memberships.push({
                        name: membership,
                        treatments: res.memberships[membership],
                        amount: res.memberships[membership].amount,
                        description: res.memberships[membership].description
                    });
                    delete res.memberships[membership].amount;
                    delete res.memberships[membership].description;
                    response.total++;
                }
            }
            
            function failure(err) {
                tracker.reject(response);
            }
        }
        
        function deleteMembership(name) {
            var tracker = $q.defer();
            $amRoot.isTreatmentId().then(getTreatmentsDoc).catch(failure);
            return tracker.promise;
            
            function getTreatmentsDoc(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(getTreatmentObject).catch(failure);
            }
            
            function getTreatmentObject(res) {
                if (res.memberships && res.memberships[name]) {
                    res.memberships[name]._deleted = true;
                    pdbConfig.save(res).then(success).catch(failure);
                } else
                    failure();
            }
            
            function success(res) {
                tracker.resolve(res);
            }
            
            function failure(err) {
                if (!err) {
                    err = {
                        success: false,
                        message: 'No Membership Found!'
                    }
                }
                tracker.reject(err);
            }
        }
        
        function saveMembership(membership, oldName) {
            var tracker = $q.defer();
            $amRoot.isTreatmentId().then(getTreatmentsDoc).catch(failure);
            return tracker.promise;
            
            function getTreatmentsDoc(res) {
                pdbConfig.get($amRoot.docIds.treatment).then(getTreatmentObject).catch(writeTreatmentDoc);
            }
            
            function getTreatmentObject(res) {
                if (!res.memberships)
                    res.memberships = {};
                if (res.memberships[oldName])
                    delete res.memberships[oldName];
                res.memberships[membership.name] = membership;
                delete res.memberships[membership.name].name;
                pdbConfig.save(res).then(success).catch(failure);
            }
            
            function writeTreatmentDoc(err) {
                var doc = {
                    _id: utils.generateUUID('trtmnt'),
                    creator: $amRoot.username
                }
                doc.memberships = {};
                doc.memberships[membership.name] = membership;
                delete doc.memberships[membership.name].name;
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