/**
 * Root level service
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp').service('$amRoot', AutomintService);

    AutomintService.$inject = ['$rootScope', '$state', '$location', 'constants', 'pdbMain', 'pdbCache', 'pdbLocal'];

    function AutomintService($rootScope, $state, $location, constants, pdbMain, pdbCache, pdbLocal) {
        //  set up service view model
        var vm = this;

        //  named assignments to rootScope
        if (!$rootScope.amGlobals)
            $rootScope.amGlobals = {};
        if ($rootScope.amGlobals.configDocIds == undefined) {
            $rootScope.amGlobals.configDocIds = {
                settings: 'settings',
                treatment: 'treatments',
                inventory: 'inventory',
                workshop: 'workshop'
            }
        }
        if ($rootScope.amGlobals.creator == undefined)
            $rootScope.amGlobals.creator = '';
        if ($rootScope.amGlobals.channel == undefined)
            $rootScope.amGlobals.channel = '';
        
        //  named assignments to keep track of current configuration of application service

        //  map functions
        $rootScope.amGlobals.IsConfigDoc = IsConfigDoc;
        vm.initDb = initDb;
        vm.IsAutomintLoggedIn = IsAutomintLoggedIn;
        vm.dbAfterLogin = dbAfterLogin;

        //  function definitions

        function IsConfigDoc(id) {
            if (id.match(/\bsettings/i))
                return true;
            if (id.match(/\btreatments/i))
                return true;
            if (id.match(/\binventory/i))
                return true;
            if (id.match(/\bworkshop/i))
                return true;
            return false;
        }

        //  initialize databases
        function initDb() {
            //  setup local databases
            pdbMain.setDatabase(constants.pdb_main);
            pdbCache.setDatabase(constants.pdb_cache);
            pdbLocal.setDatabase(constants.pdb_local);
        }

        //  check for login
        function IsAutomintLoggedIn() {
            return pdbLocal.get(constants.pdb_local_docs.login);
        }

        function dbAfterLogin() {
            //  handle database migration if any and generate cache docs after the process
            //  no such migrations right now
            generateCacheDocs();

            //  setup database change listeners
            pdbMain.OnDbChanged({
                since: 'now',
                live: true
            }).on('change', OnChangeMainDb);

            $location.path('/dashboard');
        }

        function OnChangeMainDb(change) {
            if (IsConfigDoc(change.id))
                return;
            if (change.deleted == true) {
                generateCacheDocs(force);
                return;
            }
            var curdoc;

            pdbMain.get(change.id, {
                revs_info: true
            }).then(getCurrentVersion);

            function getCurrentVersion(cdoc) {
                curdoc = cdoc;
                if (cdoc._revs_info.length > 1) {
                    pdbMain.get(change.id, {
                        rev: cdoc._revs_info[1].rev
                    }).then(getLastVersion);
                } else
                    getLastVersion();
            }

            function getLastVersion(ldoc) {
                pdbCache.get(constants.pdb_cache_views.view_services).then(vsuv).catch(vsuv);
                pdbCache.get(constants.pdb_cache_views.view_next_due_vehicles).then(vndvs).catch(vndvs);

                function vndvs(cachedoc) {
                    if (cachedoc.error == true) {
                        cachedoc = {
                            _id: constants.pdb_cache_views.view_services
                        }
                    }
                    if (curdoc.user.vehicles)
                        Object.keys(curdoc.user.vehicles).forEach(iterateVehicles);
                    pdbCache.save(cachedoc);

                    function iterateVehicles(vId) {
                        var vehicle = curdoc.user.vehicles[vId];
                        var lastVehicle = undefined, lvcd = undefined;
                        if (ldoc && ldoc.user && ldoc.user.vehicles && ldoc.user.vehicles[vId])
                            lastVehicle = ldoc.user.vehicles[vId];
                        if (lastVehicle && lastVehicle.nextdue)
                            lvcd = moment(lastVehicle.nextdue).format('MMM YYYY');
                        if (!vehicle.nextdue) {
                            if (lastVehicle) {
                                if (lastVehicle.nextdue) {
                                    if (lvcd && cachedoc[lvcd] && cachedoc[lvcd][vId])
                                        delete cachedoc[lvcd][vId];
                                }
                            }
                            return;
                        }
                        var cd = moment(vehicle.nextdue).format('MMM YYYY');
                        if (lastVehicle && lvcd) {
                            if ((cachedoc[lvcd] != undefined) && (cachedoc[lvcd][vId] != undefined))
                                delete cachedoc[lvcd][vId];
                        }
                        if (cachedoc[cd] == undefined)
                            cachedoc[cd] = {};
                        cachedoc[cd][vId] = {
                            cstmr_id: change.id,
                            cstmr_name: curdoc.user.name,
                            cstmr_mobile: curdoc.user.mobile,
                            vhcl_reg: vehicle.reg,
                            vhcl_manuf: vehicle.manuf,
                            vhcl_model: vehicle.model,
                            vhcl_nextdue: vehicle.nextdue,
                        }
                    }
                }

                function vsuv(cachedoc) {
                    if (cachedoc.error == true) {
                        cachedoc = {
                            _id: constants.pdb_cache_views.view_services
                        }
                    }

                    if (curdoc.user.vehicles)
                        Object.keys(curdoc.user.vehicles).forEach(iterateVehicles);
                    pdbCache.save(cachedoc);

                    function iterateVehicles(vId) {
                        var vehicle = curdoc.user.vehicles[vId];
                        if (vehicle.services)
                            Object.keys(vehicle.services).forEach(iterateServices);

                        function iterateServices(sId) {
                            var service = vehicle.services[sId];
                            var payreceived = (service.partialpayment) ? service.partialpayment.total : ((service.status == "paid") ? service.cost : 0);
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
                                vhcl_nextdue: vehicle.nextdue,
                                srvc_date: service.date,
                                srvc_cost: service.cost,
                                srvc_status: service.status,
                                srvc_state: service.state,
                                srvc_payreceived: payreceived
                            };
                        }
                    }
                }
            }
        }

        function generateCacheDocs(force) {
            pdbMain.getAll().then(success).catch(failure);

            function success(res) {
                var serviceCacheCallback = (force == true) ? generateServicesCache : ignore;
                var nextDueCacheCallback = (force == true) ? generateNextDueCache : ignore;
                pdbCache.get(constants.pdb_cache_views.view_services).then(serviceCacheCallback).catch(generateServicesCache);
                pdbCache.get(constants.pdb_cache_views.view_next_due_vehicles).then(nextDueCacheCallback).catch(generateNextDueCache);

                function generateNextDueCache(vvcdoc) {
                    var vdocToSave = {};
                    res.rows.forEach(iterateRows);
                    vdocToSave._id = constants.pdb_cache_views.view_next_due_vehicles;
                    pdbCache.save(vdocToSave);

                    function iterateRows(row) {
                        if (IsConfigDoc(row.id))
                            return;
                        if (row.doc.user.vehicles)
                            Object.keys(row.doc.user.vehicles).forEach(iterateVehicles);
                        
                        function iterateVehicles(vId) {
                            var vehicle = row.doc.user.vehicles[vId];
                            if (!vehicle.nextdue)
                                return;
                            var cd = moment(vehicle.nextdue).format('MMM YYYY');
                            if (vdocToSave[cd] == undefined)
                                vdocToSave[cd] = {};
                            vdocToSave[cd][vId] = {
                                cstmr_id: row.id,
                                cstmr_name: row.doc.user.name,
                                cstmr_mobile: row.doc.user.mobile,
                                vhcl_reg: vehicle.reg,
                                vhcl_manuf: vehicle.manuf,
                                vhcl_model: vehicle.model,
                                vhcl_nextdue: vehicle.nextdue
                            }
                        }
                    }
                }

                function generateServicesCache(cachedoc) {
                    var docsToSave = {}, isChanged = false;
                    res.rows.forEach(iterateRows);
                    docsToSave._id = constants.pdb_cache_views.view_services;
                    pdbCache.save(docsToSave);

                    function iterateRows(row) {
                        if (row.id == $rootScope.amGlobals.configDocIds.settings)
                            return;
                        if (row.doc.user.vehicles)
                            Object.keys(row.doc.user.vehicles).forEach(iterateVehicles);

                        function iterateVehicles(vId) {
                            var vehicle = row.doc.user.vehicles[vId];
                            if (vehicle.services)
                                Object.keys(vehicle.services).forEach(iterateServices);

                            function iterateServices(sId) {
                                var service = vehicle.services[sId];
                                var cd = moment(service.date).format('MMM YYYY');
                                var payreceived = (service.partialpayment) ? service.partialpayment.total : ((service.status == "paid") ? service.cost : 0);
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
                                    vhcl_nextdue: vehicle.nextdue,
                                    srvc_date: service.date,
                                    srvc_cost: service.cost,
                                    srvc_status: service.status,
                                    srvc_state: service.state,
                                    srvc_payreceived: payreceived
                                };
                            }
                        }
                    }
                }

                function ignore(res) {
                    //  do nothing
                }
            }

            function failure(err) {
                console.warn(err);
            }
        }
    }
})();