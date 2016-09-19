/**
 * Factory component for Invoice to interact with database
 * @author ndkcha
 * @since 0.5.0
 * @version 0.8.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amInvoice', InvoiceFactory);

    //  dependency injections for Invoice factory
    InvoiceFactory.$inject = ['$q', '$rootScope', 'pdbMain'];

    function InvoiceFactory($q, $rootScope, pdbMain) {
        //  initialize factory object and function maps
        var factory = {
            getCurrencySymbol: getCurrencySymbol,
            getWorkshopDetails: getWorkshopDetails,
            getServiceDetails: getServiceDetails,
            getInvoiceSettings: getInvoiceSettings
        }

        //  return factory object to root
        return factory;

        //  function definitions

        function getInvoiceSettings(channel) {
            var tracker = $q.defer();
            var docId = ($rootScope.isAllFranchiseOSelected() == true) ? ('settings-' + channel) : $rootScope.amGlobals.configDocIds.settings;
            pdbMain.get(docId).then(getSettingsObject).catch(failure);
            return tracker.promise;

            function getSettingsObject(res) {
                if (res.settings && res.settings.invoices)
                    tracker.resolve(res.settings.invoices);
                else
                    failure('No Invoice Settings Found!');
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function getServiceDetails(userId, vehicleId, serviceId) {
            var tracker = $q.defer();
            pdbMain.get(userId).then(getUserObject).catch(failure);
            return tracker.promise;

            function getUserObject(res) {
                var response = {};
                response.user = $.extend({}, res.user);
                delete response.user.vehicles;
                response.vehicle = vehicle = $.extend({}, res.user.vehicles[vehicleId]);
                response.vehicle.name = response.vehicle.manuf + ' ' + response.vehicle.model;
                delete response.vehicle.services;
                response.service = $.extend({}, res.user.vehicles[vehicleId].services[serviceId]);
                response.service.date = moment(response.service.date).format('MMMM DD, YYYY');
                response.service.odo = (response.service.odo && response.service.odo != '') ? response.service.odo + ' km.' : '';
                response.channel = res.channel;
                tracker.resolve(response);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function getWorkshopDetails(channel) {
            var tracker = $q.defer();
            var docId = ($rootScope.isAllFranchiseOSelected() == true) ? ('workshop-' + channel) : $rootScope.amGlobals.configDocIds.workshop;
            pdbMain.get(docId).then(getWorkshopObject).catch(failure);
            return tracker.promise;

            function getWorkshopObject(res) {
                if (res.workshop) {
                    tracker.resolve(res.workshop);
                } else
                    failure('Workshop details not Found!');
            }

            function failure(err) {
                tracker.reject(err);
            }
        }
        
        function getCurrencySymbol(channel) {
            var tracker = $q.defer();
            var docId = ($rootScope.isAllFranchiseOSelected() == true) ? ('settings-' + channel) : $rootScope.amGlobals.configDocIds.settings;
            pdbMain.get(docId).then(getSettingsObject).catch(failure);
            return tracker.promise;

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
    }
})();