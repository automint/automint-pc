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
    InvoiceFactory.$inject = [];

    function InvoiceFactory() {
        //  initialize factory object and function maps
        var factory = {

        }

        //  return factory object to root
        return factory;

        //  function definitions
        //  no such definitions
    }
})();