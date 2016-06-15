/*
 * Closure for root level service
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.1
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .service('$amRoot', AutomintService);

    AutomintService.$inject = ['$rootScope', '$state', '$q', '$log', 'utils', 'constants', 'pdbCustomers', 'pdbConfig', 'pdbCommon', 'amFactory', 'pdbCache'];

    function AutomintService($rootScope, $state, $q, $log, utils, constants, pdbCustomers, pdbConfig, pdbCommon, amFactory, pdbCache) {
        //  set up service object
        var sVm = this;
        var blockViews = true;

        //  keep track of current configuration of application
        sVm.docIds = {};
        sVm.username = '';

        //  map functions
        sVm.initDb = initDb;
        sVm.syncDb = syncDb;
        sVm.ccViews = ccViews;
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
            pdbCache.setDatabase(constants.pdb_cache);

            //  check and create views
            ccViews();

            //  listen to changes in local db
            OnCustomerDbChanged();
            OnConfigDbChanged();

            //  setup server iteraction
            // oneWayReplication();
            // syncDb();
        }

        function ccViews(force) {
            //  service module

            pdbCache.get(constants.pdb_cache_views.view_services).then(vsuv).catch(vsuv);

            //  view service
            function vsuv(cachedoc) {
                pdbCustomers.getAll().then(success).catch(failure);

                function success(res) {
                    var docsToSave = {}, isChanged = false;
                    res.rows.forEach(iterateRows);
                    docsToSave._id = constants.pdb_cache_views.view_services;
                    if (cachedoc._rev)
                        docsToSave._rev = cachedoc._rev;
                    pdbCache.save(docsToSave);

                    function iterateRows(row) {
                        if (row.doc.user.vehicles)
                            Object.keys(row.doc.user.vehicles).forEach(iterateVehicles);

                        function iterateVehicles(vId) {
                            var vehicle = row.doc.user.vehicles[vId];
                            if (vehicle.services)
                                Object.keys(vehicle.services).forEach(iterateServices);

                            function iterateServices(sId) {
                                var service = vehicle.services[sId];
                                var cd = moment(service.date).format('MMM YYYY');
                                cd = angular.lowercase(cd).replace(' ', '-');
                                if (service._deleted == true) {
                                    if (cachedoc[cd][sId] != undefined)
                                        isChanged = true;
                                    return;
                                }
                                if (docsToSave[cd] == undefined)
                                    docsToSave[cd] = {};
                                docsToSave[cd][sId] = {
                                    cstmr_id: row.id,
                                    cstmr_name: row.doc.user.name,
                                    cstmr_mobile: row.doc.user.mobile,
                                    vhcl_id: vId,
                                    vhcl_reg: vehicle.reg,
                                    vhcl_manuf: vehicle.manuf,
                                    vhcl_model: vehicle.model,
                                    srvc_date: service.date,
                                    srvc_cost: service.cost,
                                    srvc_status: service.status
                                };
                            }
                        }
                    }
                }
            }

            function failure(err) {
                console.log(err);
            }
        }

        function OnCustomerDbChanged() {
            pdbCustomers.OnDbChanged({
                since: 'now',
                live: true
            }).on('change', onChange).on('complete', onComplete).on('error', onError);

            function onChange(change) {
                if (change.deleted == true) {
                    ccViews();
                    return;
                }
                var curdoc;
                pdbCache.get(constants.pdb_cache_views.view_services).then(vsuv).catch(vsuv);

                function vsuv(cachedoc) {
                    if (cachedoc.error == true) {
                        cachedoc = {
                            _id: constants.pdb_cache_views.view_services
                        }
                    }

                    pdbCustomers.get(change.id, {
                        revs_info: true
                    }).then(getCurrentVersion);

                    function getCurrentVersion(cdoc) {
                        curdoc = cdoc;
                        if (cdoc._revs_info.length > 1) {
                            pdbCustomers.get(change.id, {
                                rev: cdoc._revs_info[1].rev
                            }).then(getLastVersion);
                        } else
                            getLastVersion();
                    }

                    function getLastVersion(ldoc) {
                        if (curdoc.user.vehicles)
                            Object.keys(curdoc.user.vehicles).forEach(iterateVehicles);
                        pdbCache.save(cachedoc);

                        function iterateVehicles(vId) {
                            var vehicle = curdoc.user.vehicles[vId];
                            if (vehicle.services)
                                Object.keys(vehicle.services).forEach(iterateServices);

                            function iterateServices(sId) {
                                var service = vehicle.services[sId];
                                var cd = moment(service.date).format('MMM YYYY');
                                cd = angular.lowercase(cd).replace(' ', '-');
                                if (service._deleted == true) {
                                    if (cachedoc[cd] && cachedoc[cd][sId])
                                        delete cachedoc[cd][sId];
                                    return;
                                }
                                if (ldoc && ldoc.user && ldoc.user.vehicles && ldoc.user.vehicles[vId] && ldoc.user.vehicles[vId].services && ldoc.user.vehicles[vId].services[sId]) {
                                    var lvd = moment(ldoc.user.vehicles[vId].services[sId].date).format('MMM YYYY');
                                    lvd = angular.lowercase(lvd).replace(' ', '-');
                                    if (cachedoc[lvd][sId] != undefined)
                                        delete cachedoc[lvd][sId];
                                }
                                if (cachedoc[cd] == undefined)
                                    cachedoc[cd] = {};
                                cachedoc[cd][sId] = {
                                    cstmr_id: change.id,
                                    cstmr_name: curdoc.user.name,
                                    cstmr_mobile: curdoc.user.mobile,
                                    vhcl_id: vId,
                                    vhcl_reg: vehicle.reg,
                                    vhcl_manuf: vehicle.manuf,
                                    vhcl_model: vehicle.model,
                                    srvc_date: service.date,
                                    srvc_cost: service.cost,
                                    srvc_status: service.status
                                };
                            }
                        }
                    }
                }
            }

            function onComplete(info) {
                // console.log(info);
            }

            function onError(error) {
                // console.log(error);
            }
        }

        function OnConfigDbChanged() {
            pdbConfig.OnDbChanged({
                since: 'now',
                live: true,
                include_docs: true
            }).on('change', onChange).on('complete', onComplete).on('error', onError);

            function onChange(change) {
                // console.log(change);
            }

            function onComplete(info) {
                // console.log(info);
            }

            function onError(error) {
                // console.log(error);
            }
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
                    if (element.id.match(/\btrtmnt-/i))
                        sVm.docIds.treatment = element.id;
                    if (element.id.match(/\bwrkshp-/i))
                        sVm.docIds.workshop = element.id;
                    if (element.id.match(/\bsttngs-/i))
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
            return isDocId('trtmnt');
        }

        //  check if workshop's document id is loaded to current docId object
        function isWorkshopId() {
            return isDocId('wrkshp');
        }

        //  check if settings' document id is loaded to current docId object
        function isSettingsId() {
            return isDocId('sttngs');
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
            //  listen to on pause event\
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