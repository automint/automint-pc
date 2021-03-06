/**
 * Root level service
 * @author ndkcha
 * @since 0.4.1
 * @version 0.9.0
 */

(function() {
    const ipcRenderer = require('electron').ipcRenderer;

    angular.module('automintApp').service('$amRoot', AutomintService);

    AutomintService.$inject = ['$rootScope', '$state', '$q', '$mdDialog', 'constants', 'pdbMain', 'pdbCache', 'pdbLocal'];

    function AutomintService($rootScope, $state, $q, $mdDialog, constants, pdbMain, pdbCache, pdbLocal) {
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
        if ($rootScope.busyApp == undefined) {
            $rootScope.busyApp = {
                show: false,
                message: ''
            }
        }
        
        //  named assignments to keep track of current configuration of application service

        //  map functions
        $rootScope.amGlobals.IsConfigDoc = IsConfigDoc;
        $rootScope.isAllFranchiseOSelected = isAllFranchiseOSelected;
        vm.initDb = initDb;
        vm.syncDb = syncDb;
        vm.dbAfterLogin = dbAfterLogin;
        vm.generateCacheDocs = generateCacheDocs;

        //  function definitions

        function isAllFranchiseOSelected() {
            return ($rootScope.amGlobals.channel == 'all');
        }

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

        function syncDb() {
            var username = $rootScope.amGlobals.credentials.username, password = $rootScope.amGlobals.credentials.password;
            if ((username == '') || (username == undefined) || (password == '') || (password == undefined)) {
                console.error('No Username or Password provided for database sync');
                return;
            }
            var url = "";
            if ((url == undefined) || (url == '')) {
                console.error('Username/Password/Database name missing from url');
                return;
            }
            
            $rootScope.amDbSync = pdbMain.sync(url);
            $rootScope.amDbSync.on('complete', onCompleteDb);
            $rootScope.amDbSync.on('paused', onPausedDb);
            $rootScope.amDbSync.on('error', onErrorDb);
            $rootScope.amDbSync.on('denied', onDeniedDb);
            $rootScope.amDbSync.on('change', onChangedDb);
            $rootScope.amDbSync.on('active', onActiveDb);

            function onChangedDb(info) {
                //  listen to on change event
                console.info('pdbSync change', info);
            }

            function onPausedDb(err) {
                //  listen to on pause event\
                console.warn('pdbSync pause', err);

                if ($rootScope.isSyncCalledFromSettings == true) {
                    setTimeout(loadSb, 1000);
                    $rootScope.isSyncCalledFromSettings = false;

                    function loadSb() {
                        generateCacheDocs(true).then(tr).catch(tr);

                        function tr() {
                            $rootScope.loadSettingsBlock();
                            $rootScope.busyApp.show = false;
                        }
                    }
                }
                
                if ($rootScope.isSyncCalledManually == true) {
                    setTimeout(prepraeTransit, 1000);
                    $rootScope.isSyncCalledManually = false;

                    function prepraeTransit() {
                        $rootScope.isOnChangeMainDbBlocked = false;
                        //  handle database migration if any and generate cache docs after the process
                        //  no such migrations right now
                        generateCacheDocs(true).then(transitToDashboard).catch(transitToDashboard); 
                    }
                }
            }

            function onActiveDb() {
                //  listen to on active event
            }

            function onDeniedDb(err) {
                //  listen to on denied event
                if (err.status && (err.status == 401)) {
                    $mdDialog.show({
                        controller: 'amUpdatePwdCtrl',
                        controllerAs: 'vm',
                        templateUrl: 'app/views/updatepassword.tmpl.html',
                        parent: angular.element(document.body),
                        targetEvent: event,
                        clickOutsideToClose: true
                    }).then(success).catch(success);

                    function success(res) {
                        //  do nothing
                    }
                }
                console.error('pdbSync deny', err);
            }

            function onCompleteDb(info) {
                //  listen to on complete event
                console.info('pdbSync complete', info);
            }

            function onErrorDb(err) {
                //  listen to on error event
                if (err.status && (err.status == 401)) {
                    $mdDialog.show({
                        controller: 'amUpdatePwdCtrl',
                        controllerAs: 'vm',
                        templateUrl: 'app/views/updatepassword.tmpl.html',
                        parent: angular.element(document.body),
                        targetEvent: event,
                        clickOutsideToClose: true
                    }).then(success).catch(success);

                    function success(res) {
                        //  do nothing
                    }
                }
                console.error('pdbSync error', err);
            }
        }

        function transitToDashboard() {
            $state.go('restricted.dashboard');
        }

        function dbAfterLogin(wait) {

            //  setup database change listeners
            pdbMain.OnDbChanged({
                since: 'now',
                live: true
            }).on('change', OnChangeMainDb);

            //  handle database migration if any and generate cache docs after the process
            //  no such migrations right now
            generateCacheDocs().then(transitToDashboard).catch(transitToDashboard);
        }

        function OnChangeMainDb(change) {
            if ($rootScope.isOnChangeMainDbBlocked == true)
                return;
            if (IsConfigDoc(change.id))
                return;
            if (change.deleted == true) {
                generateCacheDocs(true);
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
                    if (curdoc.user == undefined)
                        return;
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
                        if ((vehicle._deleted == true) || (lastVehicle && lvcd)) {
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
                            channel: curdoc.channel
                        }
                    }
                }

                function vsuv(cachedoc) {
                    if (cachedoc.error == true) {
                        cachedoc = {
                            _id: constants.pdb_cache_views.view_services
                        }
                    }

                    if (curdoc.user == undefined)
                        return;
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
                            if ((vehicle._deleted == true) || (service._deleted == true)) {
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
                                srvc_payreceived: payreceived,
                                channel: curdoc.channel
                            };
                        }
                    }
                }
            }
        }

        function generateCacheDocs(force) {
            var tracker = $q.defer();
            pdbMain.getAll().then(success).catch(failure);
            return tracker.promise;

            function success(res) {
                var serviceCacheCallback = (force == true) ? generateServicesCache : quitRoutine;
                var nextDueCacheCallback = (force == true) ? generateNextDueCache : quitRoutine;
                pdbCache.get(constants.pdb_cache_views.view_services).then(serviceCacheCallback).catch(generateServicesCache);
                pdbCache.get(constants.pdb_cache_views.view_next_due_vehicles).then(nextDueCacheCallback).catch(generateNextDueCache);

                function quitRoutine() {
                    tracker.resolve(true);
                }

                function generateNextDueCache(vvcdoc) {
                    var vdocToSave = {};
                    res.rows.forEach(iterateRows);
                    vdocToSave._id = constants.pdb_cache_views.view_next_due_vehicles;
                    if (vvcdoc._rev != undefined)
                        vdocToSave._rev = vvcdoc._rev;
                    pdbCache.save(vdocToSave).then(quitRoutine).catch(quitRoutine);

                    function iterateRows(row) {
                        if (IsConfigDoc(row.id))
                            return;
                        if (row.doc.user == undefined)
                            return;
                        if (row.doc.user.vehicles)
                            Object.keys(row.doc.user.vehicles).forEach(iterateVehicles);
                        
                        function iterateVehicles(vId) {
                            var vehicle = row.doc.user.vehicles[vId];
                            if (vehicle._deleted == true)
                                return;
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
                                vhcl_nextdue: vehicle.nextdue,
                                channel: row.doc.channel
                            }
                        }
                    }
                }

                function generateServicesCache(cachedoc) {
                    var docsToSave = {}, isChanged = false;
                    res.rows.forEach(iterateRows);
                    docsToSave._id = constants.pdb_cache_views.view_services;
                    if (cachedoc._rev != undefined)
                        docsToSave._rev = cachedoc._rev;
                    pdbCache.save(docsToSave).then(quitRoutine).catch(quitRoutine);

                    function iterateRows(row) {
                        if (IsConfigDoc(row.id))
                            return;
                        if (row.doc.user == undefined)
                            return;
                        if (row.doc.user.vehicles)
                            Object.keys(row.doc.user.vehicles).forEach(iterateVehicles);

                        function iterateVehicles(vId) {
                            var vehicle = row.doc.user.vehicles[vId];
                            if (vehicle._deleted == true) {
                                isChanged = true;
                                return;
                            }
                            if (vehicle.services)
                                Object.keys(vehicle.services).forEach(iterateServices);

                            function iterateServices(sId) {
                                var service = vehicle.services[sId];
                                var cd = moment(service.date).format('MMM YYYY');
                                var payreceived = (service.partialpayment) ? service.partialpayment.total : ((service.status == "paid") ? service.cost : 0);
                                cd = angular.lowercase(cd).replace(' ', '-');
                                if (service._deleted == true) {
                                    if (cachedoc[cd] && cachedoc[cd][sId] != undefined)
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
                                    srvc_payreceived: payreceived,
                                    channel: row.doc.channel
                                };
                            }
                        }
                    }
                }
            }

            function failure(err) {
                console.warn(err);
            }
        }
    }
})();