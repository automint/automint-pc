/**
 * Factory that handles database interactions between invoices database and controller
 * @author ndkcha
 * @since 0.5.0
 * @version 0.5.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amInvoices', InvoicesFactory);

    InvoicesFactory.$inject = ['$q', '$amRoot', 'pdbCustomers', 'pdbConfig'];

    function InvoicesFactory($q, $amRoot, pdbCustomers, pdbConfig) {
        //  initialize factory variable and function mappings
        var factory = {
            getServiceDetails: getServiceDetails,
            getWorkshopDetails: getWorkshopDetails,
            getIvSettings: getIvSettings
        }

        return factory;

        //  function definitions

        //  get service details from database
        function getServiceDetails(userId, vehicleId, serviceId) {
            var tracker = $q.defer();
            pdbCustomers.get(userId).then(getUserObject).catch(failure);
            return tracker.promise;

            function getUserObject(res) {
                var response = {};
                Object.keys(res.user.vehicles).forEach(iterateVehicles);
                delete res.user.vehicles;
                response.user = res.user;
                response.service.date = moment(response.service.date).format('MMMM DD YYYY');
                makeProblemsArray();
                tracker.resolve(response);

                function iterateVehicles(vId) {
                    if (vehicleId != vId)
                        delete res.user.vehicles[vId];
                    else {
                        Object.keys(res.user.vehicles[vId].services).forEach(iterateServices);
                        delete res.user.vehicles[vId].services;
                        response.vehicle = res.user.vehicles[vId];
                    }

                    function iterateServices(sId) {
                        if (serviceId != sId)
                            delete res.user.vehicles[vId].services[sId];
                        else
                            response.service = res.user.vehicles[vId].services[sId];
                    }
                }
                
                function makeProblemsArray() {
                    var problems = $.extend({}, response.service.problems);
                    response.service.problems = [];
                    Object.keys(problems).forEach(iterateProblems);
                    
                    function iterateProblems(problem) {
                        response.service.problems.push({
                            details: problem,
                            rate: problems[problem].rate,
                            tax: problems[problem].tax
                        })
                    }
                }
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        //  get workshop details from database
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
        
        //  get display configurations
        function getIvSettings() {
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
                        message: 'No Display Configs Found!'
                    }
                }
                tracker.reject(err);
            }
        }
    }
})();