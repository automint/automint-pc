/**
 * Factory to backup pouchDb dump to local storage
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amBackup', BackupFactory);

    BackupFactory.$inject = ['$q', 'pdbMain', 'pdbLocal'];

    function BackupFactory($q, pdbMain, pdbLocal) {
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
                pdbMain.getAll(),
                pdbLocal.getAll()
            ]).then(foundDocsToBackup).catch(noDocsToBackup);
            return tracker.promise;
        }

        function foundDocsToBackup(data) {
            backupDocument.backupTime = Date.now();
            backupDocument.main = {}
            backupDocument.main.doc = [];
            backupDocument.local = {};
            backupDocument.local.doc = [];
            data[0].rows.forEach(iterateMain);
            data[1].rows.forEach(iterateLocal);
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
        
        //  iterate through main docs to add into backup document
        function iterateMain(intr_customer) {
            backupDocument.main.doc.push(intr_customer.doc);
        }
        
        //  iterate through local docs to add into backup document
        function iterateLocal(intr_config) {
            backupDocument.local.doc.push(intr_config.doc);
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