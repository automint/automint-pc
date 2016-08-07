/**
 * Factory that handles database interactions between invoices database and controller
 * @author ndkcha
 * @since 0.5.0
 * @version 0.7.0
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
            getIvSettings: getIvSettings,
            getIvAlignMargins: getIvAlignMargins,
            saveCustomerEmail: saveCustomerEmail,
            getCurrencySymbol: getCurrencySymbol,
            getInvoicePageSize: getInvoicePageSize
        }

        return factory;

        //  function definitions

        function getInvoicePageSize() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(failure);
            }

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

        function saveCustomerEmail(userId, email) {
            var tracker = $q.defer();
            pdbCustomers.get(userId).then(getUserObject).catch(failure);
            return tracker.promise;

            function getUserObject(res) {
                res.user.email = email;
                pdbCustomers.save(res).then(success).catch(failure);
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
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObject).catch(failure);
            }

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
                makeInventoriesArray();
                if (response.service.packages)
                    makePackageArray();
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

                function makeInventoriesArray() {
                    var inventories = $.extend({}, response.service.inventories);
                    response.service.inventories = [];
                    Object.keys(inventories).forEach(iterateInventories);
                    
                    function iterateInventories(inventory) {
                        response.service.inventories.push({
                            name: inventory,
                            rate: inventories[inventory].rate,
                            tax: inventories[inventory].tax,
                            qty: inventories[inventory].qty
                        });
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
                
                function makePackageArray() {
                    var packages = $.extend({}, response.service.packages);
                    response.service.packages = [];
                    Object.keys(packages).forEach(iteratePackages);
                    
                    function iteratePackages(package) {
                        var p = {
                            name: package,
                            rate: packages[package].rate,
                            treatments: []
                        }
                        Object.keys(packages[package].treatments).forEach(iterateTreatments);
                        response.service.packages.push(p);
                        
                        function iterateTreatments(treatment) {
                            p.treatments.push({
                                name: treatment,
                                rate: packages[package].treatments[treatment].rate,
                                tax: packages[package].treatments[treatment].tax
                            })
                        }
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