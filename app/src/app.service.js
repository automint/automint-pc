/*
 * Closure for root level service
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0
 */

/// <reference path="../typings/main.d.ts" />

(function () {
    angular.module('automintApp')
        .service('$amRoot', AutomintService);
    
    AutomintService.$inject = ['$q', '$log', 'constants', 'pdbCustomers', 'pdbConfig', 'pdbCommon', 'amFactory'];
    
    // function AutomintService($q:angular.IQService, $log:angular.ILogService,constants, pdbCustomers, pdbConfig, pdbCommon, amFactory) {
    function AutomintService($q, $log, constants, pdbCustomers, pdbConfig, pdbCommon, amFactory) {
        //  set up service object
        var sVm = this;
        
        //  keep track of current configuration of application
        sVm.docIds = {};
        sVm.username = '';
        
        //  map functions
        sVm.initDb = initDb;
        sVm.syncDb = syncDb;
        sVm.isWorkshopId = isWorkshopId;
        sVm.isTreatmentId = isTreatmentId;
        sVm.isSettingsId = isSettingsId;
        sVm.updateConfigReferences = updateConfigReferences;
        
        //  named assignments
        var successResponse = {
            success: true
        }
        var failureResponse = {
            success: false
        }
        
        //  initialize databases
        function initDb() {
            //  setup local databases
            pdbConfig.setDatabase(constants.pdb_w_config);
            pdbCustomers.setDatabase(constants.pdb_w_customers);
            pdbCommon.setDatabase(constants.pdb_common);
            
            //  setup server iteraction
            // oneWayReplication();
            // syncDb();
        }
        
        function updateConfigReferences() {
            var tracker = $q.defer();
            pdbConfig.getAll().then(successQuery).catch(failedQuery);
            return tracker.promise;
            
            //  if promise returns with all documents, update configurations
            function successQuery(res) {
                res.rows.forEach(iterateDocuments);
                tracker.resolve(successResponse);
                
                //  iterate through documents to match id(s) of documents
                function iterateDocuments(element) {
                    if (element.id.match(/\btreatment-/i))
                        sVm.docIds.treatment = element.id;
                    if (element.id.match(/\bworkshop-/i))
                        sVm.docIds.workshop = element.id;
                    if (element.id.match(/\bsettings-/i))
                        sVm.docIds.settings = element.id;
                }
            }
            
            //  if promise returns with error
            function failedQuery(err) {
                tracker.reject(failureResponse);
            }
        }
        
        //  check if database is syncable to remote
        function isSyncable() {
            var tracker = $q.defer();
            var workshopUser = $.extend({}, successResponse);
            
            isWorkshopId().then(setCredentials).catch(noWorkshopUser);
            return tracker.promise;
            
            //  if workshop document is tracker, look for username and password inside document
            function setCredentials(res) {
                pdbConfig.get(sVm.docIds.workshop).then(setWorkshopUser).catch(noWorkshopUser);
                
                //  if workshop users existing, return with username and password
                function setWorkshopUser(res) {
                    if (res.user) {
                        workshopUser.username = res.user.username;
                        workshopUser.password = res.user.password;
                        tracker.resolve(workshopUser);
                    } else
                        noWorkshopUser();
                }
            }
            
            //  if no workshop, return with failed response bool    
            function noWorkshopUser(error) {
                tracker.reject(failureResponse);
            }
        }
        
        //  setup sync (bidirectional replication)
        function syncDb() {
            isSyncable().then().catch();
            
            //  if sync details found
            function runSync(res) {
                if (res.success) {
                    sVm.username = res.username;
                    //  construct database url for workshop configuration and customers' db
                    dbConfigUrl = amFactory.generateDbUrl(res.username, res.password, constants.sgw_w_config);
                    dbCustomersUrl = amFactory.generateDbUrl(res.username, res.password, constants.sgw_w_customers);
                    
                    //  sync database
                    pdbConfig.sync(dbConfigUrl)
                        .on('change', onChangedDb)
                        .on('paused', onPausedDb)
                        .on('active', onActiveDb)
                        .on('denied', onDeniedDb)
                        .on('complete', onCompleteDb)
                        .on('error', onErrorDb);

                    pdbCustomers.sync(dbCustomersUrl)
                        .on('change', onChangedDb)
                        .on('paused', onPausedDb)
                        .on('active', onActiveDb)
                        .on('denied', onDeniedDb)
                        .on('complete', onCompleteDb)
                        .on('error', onErrorDb);
                }
            }
            
            //  no sync details found
            function noSync(error) {
                $log.debug('cannot sync at moment! no sync details found');
            }
        }
        
        //  setup one-way replication
        function oneWayReplication() {
            //  setup common database replication
            pdbCommon.replicate(constants.db_url + constants.sgw_common)
                .on('change', onChangedDb)
                .on('paused', onPausedDb)
                .on('active', onActiveDb)
                .on('denied', onDeniedDb)
                .on('complete', onCompleteDb)
                .on('error', onErrorDb);
        }
        
        //  check if treatment's document id is loaded to current docId object
        function isTreatmentId() {
            return isDocId('treatment');
        }
        
        //  check if workshop's document id is loaded to current docId object
        function isWorkshopId() {
            return isDocId('workshop');
        }
        
        //  check if settings' document id is loaded to current docId object
        function isSettingsId() {
            return isDocId('settings');
        }
        
        //  the check function
        function isDocId(query) {
            var tracker = $q.defer();
            if (sVm.docIds[query] == '' || sVm.docIds[query] == undefined)
                sVm.updateConfigReferences().then(configUpdated).catch(updateFailed);
            else
                updateFailed();
            return tracker.promise;
                
            function configUpdated(res) {
                tracker.resolve(successResponse);
            }
            
            function updateFailed(err) {
                tracker.resolve(failureResponse);
            }
        }
        
        //  database listeners

        function onChangedDb(info) {
            //  listen to on change event
        }

        function onPausedDb(err) {
            //  listen to on pause event
        }

        function onActiveDb() {
            //  listen to on active event
        }

        function onDeniedDb(err) {
            //  listen to on denied event
        }

        function onCompleteDb(info) {
            //  listen to on complete event
            updateConfigReferences();
        }

        function onErrorDb(err) {
            //  listen to on error event
        }
    }
})();