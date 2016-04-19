/**
 * Factory to backup pouchDb dump to local storage
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amBackup', BackupFactory);

    BackupFactory.$inject = ['$q', 'pdbCustomers', 'pdbConfig', 'constants'];

    function BackupFactory($q, pdbCustomers, pdbConfig, constants) {
        //  temporary named assignments
        var backupDocument = {};
        var tracker;

        //  initialize factory object and function mappings
        var factory = {
            doBackup: doBackup,
            clearReferences: clearReferences
        }

        return factory;

        //  function definitions

        function doBackup() {
            tracker = $q.defer();

            $q.all([
                pdbCustomers.getAll(),
                pdbConfig.getAll()
            ]).then(foundDocsToBackup).catch(noDocsToBackup);
            return tracker.promise;
        }

        function foundDocsToBackup(data) {
            backupDocument.backAppVersion = constants.automint_version;
            backupDocument.backupTime = Date.now();
            backupDocument.customers = {}
            backupDocument.customers.doc = [];
            backupDocument.config = {};
            backupDocument.config.doc = [];
            data[0].rows.forEach(iterateCustomers);
            data[1].rows.forEach(iterateConfigs);
            //  content dispostion
            var docText = JSON.stringify(backupDocument);
            var date = new Date();
            //  download content
            var a = document.createElement('a');
            var file = new Blob([docText], {
                type: 'text/plain'
            });
            a.href = URL.createObjectURL(file);
            a.download = 'backup-' + date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + '-' + date.getHours() + '-' + date.getMinutes() + '-auto.mint';
            a.click();
            tracker.resolve({
                status: 1,
                message: 'Backup file has been created.'
            });
        }
        
        //  iterate through customers to add into backup document
        function iterateCustomers(intr_customer) {
            backupDocument.customers.doc.push(intr_customer.doc);
        }
        
        //  iterate through configs to add into backup document
        function iterateConfigs(intr_config) {
            backupDocument.config.doc.push(intr_config.doc);
        }

        //  error fetching from database
        function noDocsToBackup(err) {
            tracker.reject({
                status: 0,
                message: 'Failed to create backup'
            });
        }
        
        function clearReferences() {
            backupDocument = {};
            tracker = undefined;
        }
    }
})();