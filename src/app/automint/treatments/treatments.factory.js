(function() {
    angular.module('altairApp')
        .factory('treatmentFactory', TreatmentFactory);

    TreatmentFactory.$inject = ['pdbConfig', '$q', '$automintService', 'utils'];

    function TreatmentFactory(pdbConfig, $q, $automintService, utils) {
        var factory = {
            treatmentsAsArray: treatmentsAsArray,
            treatmentDetails: treatmentDetails,
            saveTreatment: saveTreatment,
            deleteTreatment: deleteTreatment,
            changeDisplayAs: changeDisplayAs,
            currentTreatmentSettings: currentTreatmentSettings
        }

        //  return treatments list in form of an array
        function treatmentsAsArray() {
            var differed = $q.defer();
            $automintService.checkTreatmentId().then(function(configRes) {
                pdbConfig.get($automintService.currentConfig.treatment).then(function(res) {
                    var treatments = [];
                    if (res.regular) {
                        Object.keys(res.regular).forEach(function(details) {
                            if (!res.regular[details]._deleted) {
                                treatments.push({
                                    name: details,
                                    rate: res.regular[details].rate
                                });
                            }
                        });
                    }
                    differed.resolve(treatments);
                }, function(err) {
                    differed.reject(err);
                });
            }, function(error) {
                differed.reject(error);
            });
            return differed.promise;
        }

        //  return particular treatment
        function treatmentDetails(treatmentName) {
            var differed = $q.defer();
            $automintService.checkTreatmentId().then(function(configRes) {
                pdbConfig.get($automintService.currentConfig.treatment).then(function(res) {
                    var treatment = {
                        details: treatmentName,
                        rate: res.regular[treatmentName].rate
                    }
                    differed.resolve(treatment);
                }, function(err) {
                    differed.reject(err);
                });
            }, function(error) {
                differed.reject(error);
            });
            return differed.promise;
        }

        //  delete treatment from database
        function deleteTreatment(treatmentName) {
            var differed = $q.defer();
            $automintService.checkTreatmentId().then(function(configRes) {
                pdbConfig.get($automintService.currentConfig.treatment).then(function(res) {
                    res.regular[treatmentName]._deleted = true;
                    pdbConfig.save(res).then(function(success) {
                        differed.resolve(success);
                    }, function(failure) {
                        differed.resolve(failure);
                    });
                }, function(err) {
                    differed.reject(err);
                });
            }, function(error) {
                differed.reject(error);
            });
            return differed.promise;
        }

        //  store treatment to database
        function saveTreatment(treatment, method) {
            var differed = $q.defer();
            var i = {
                rate: treatment.rate
            }
            $automintService.checkTreatmentId().then(function(configRes) {
                pdbConfig.get($automintService.currentConfig.treatment).then(function(res) {
                    if (!res.regular)
                        res.regular = {};
                    if (!(res.regular[treatment.details] && method == 'add')) {
                        res.regular[treatment.details] = i;
                    }
                    pdbConfig.save(res).then(function(status) {
                        differed.resolve(status);
                    }, function(fail) {
                        differed.reject(fail);
                    });
                }, function(err) {
                    var doc = {};
                    doc['_id'] = utils.generateUUID('treatment');
                    doc['creator'] = $automintService.username;
                    doc.regular = {};
                    doc.regular[treatment.details] = i;
                    pdbConfig.save(doc).then(function(success) {
                        differed.resolve(success);
                        $automintService.updateConfigReferences();
                    }, function(error) {
                        differed.reject(error);
                    });
                });
            }, function(configError) {
                differed.reject(configError);
            });
            return differed.promise;
        }

        function currentTreatmentSettings() {
            var differed = $q.defer();
            $automintService.checkSettingsId().then(function(configRes) {
                pdbConfig.get($automintService.currentConfig.settings).then(function(res) {
                    differed.resolve(res.settings);
                }, function(err) {
                    differed.reject(err);
                });
            }, function(configError) {
                differed.reject(configError);
            });
            return differed.promise;
        }

        //  change display format setting of treatments
        function changeDisplayAs(displayAsList) {
            var differed = $q.defer();
            $automintService.checkSettingsId().then(function(configRes) {
                pdbConfig.get($automintService.currentConfig.settings).then(function(res) {
                    if (!res.settings)
                        res.settings = {};
                    res.settings['displayAsList'] = displayAsList;
                    pdbConfig.save(res).then(function(status) {
                        differed.resolve(status);
                    }, function(fail) {
                        differed.reject(fail);
                    });
                }, function(err) {
                    var doc = {};
                    doc['_id'] = utils.generateUUID('settings');
                    doc['creator'] = $automintService.username;
                    doc.settings = {};
                    doc.settings['displayAsList'] = displayAsList;
                    pdbConfig.save(doc).then(function(status) {
                        differed.resolve(status);
                        $automintService.updateConfigReferences();
                    }, function(fail) {
                        differed.reject(fail);
                    });
                });
            }, function(configError) {
                differed.reject(configError);
            });
            return differed.promise;
        }

        return factory;
    }
})();