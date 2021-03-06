/**
 * Factory that handles database interactions between dashboard dataset and controller
 * @author ndkcha
 * @since 0.6.0
 * @version 0.7.2
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amDashboard', DashboardFactory);
    
    DashboardFactory.$inject = ['$q', '$filter', '$rootScope', 'utils', 'constants', 'pdbMain', 'pdbCache'];
    
    function DashboardFactory($q, $filter, $rootScope, utils, constants, pdbMain, pdbCache) {
        //  initialize dashboard factory and funtion mappings
        var factory = {
            getTotalCustomerServed: getTotalCustomerServed,
            getNewCustomers: getNewCustomers,
            getProblemsAndVehicleTypes: getProblemsAndVehicleTypes,
            getFilterMonths: getFilterMonths,
            getNextDueCustomers: getNextDueCustomers,
            deleteServiceReminder: deleteServiceReminder,
            changeServiceReminderDate: changeServiceReminderDate,
            getCurrencySymbol: getCurrencySymbol,
            saveCurrencySymbol: saveCurrencySymbol
        }
        
        return factory;
        
        //  function definitions

        function saveCurrencySymbol(currency) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds).then(getSettingsObject).catch(writeSettingsObject);
            return tracker.promise;

            function getSettingsObject(res) {
                res.currency = currency;
                pdbMain.save(res).then(success).catch(failure);
            }

            function writeSettingsObject(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    currency: currency
                }
                pdbMain.save(doc).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function getCurrencySymbol() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObject).catch(failure);
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

        function changeServiceReminderDate(cId, vId, nextdue) {
            var tracker = $q.defer();
            pdbMain.get(cId).then(getCustomerDoc).catch(failure);
            return tracker.promise;

            function getCustomerDoc(res) {
                res.user.vehicles[vId].nextdue = nextdue;
                pdbMain.save(res).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function deleteServiceReminder(cId, vId) {
            var tracker = $q.defer();
            pdbMain.get(cId).then(getCustomerDoc).catch(failure);
            return tracker.promise;

            function getCustomerDoc(res) {
                delete res.user.vehicles[vId].nextdue;
                pdbMain.save(res).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function getNextDueCustomers(dateRange) {
            var tracker = $q.defer();
            pdbCache.get(constants.pdb_cache_views.view_next_due_vehicles).then(generateNextDueCustomers).catch(failure);
            return tracker.promise;

            function generateNextDueCustomers(res) {
                var startdate, enddate, dateFormat, result = [];
                switch (dateRange) {
                    case "Today":
                        dateFormat = 'YYYY-MM-DD';
                        startdate = moment().format(dateFormat);
                        enddate = moment().format(dateFormat);
                        break;
                    case "This Week":
                        dateFormat = 'w';
                        startdate = moment().format(dateFormat);
                        enddate = moment().format(dateFormat);
                        break;
                    case "This Month":
                        dateFormat = 'M';
                        startdate = moment().format(dateFormat);
                        enddate = moment().format(dateFormat);
                        break;
                }
                Object.keys(res).forEach(iterateDateRange);
                result.sort(dateSort);
                tracker.resolve(result);

                function dateSort(lhs, rhs) {
                    return lhs.vhcl_nextdue.localeCompare(rhs.vhcl_nextdue);
                }

                function iterateDateRange(dr) {
                    if (dr.match(/_id|_rev/g))
                        return;
                    Object.keys(res[dr]).forEach(iterateVehicles);

                    function iterateVehicles(vId) {
                        if ($rootScope.amGlobals.channel && res[dr][vId].channel && ($rootScope.amGlobals.channel != '') && ($rootScope.amGlobals.channel != 'all') && (res[dr][vId].channel != '') && ($rootScope.amGlobals.channel != res[dr][vId].channel))
                            return;
                        res[dr][vId].vhcl_id = vId;
	                    if (res[dr][vId].vhcl_nextdue && ((dateRange == 'All') || ((moment(res[dr][vId].vhcl_nextdue).format(dateFormat).localeCompare(startdate) >= 0) && (moment(res[dr][vId].vhcl_nextdue).format(dateFormat).localeCompare(enddate) <= 0)))) {
                            var cfound = $filter('filter')(result, {
                                cstmr_id: res[dr][vId].cstmr_id
                            }, true);

                            if (cfound.length == 0)
                                result.push(res[dr][vId]);
                        } 
                    }
                }
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function getFilterMonths() {
            var tracker = $q.defer();
            pdbCache.get(constants.pdb_cache_views.view_services).then(generateMonthsUsed).catch(failure);
            return tracker.promise;

            function generateMonthsUsed(res) {
                var result = [];
                Object.keys(res).forEach(iterateDateRange);
                tracker.resolve(result);

                function iterateDateRange(dr) {
                    if (dr.match(/_id|_rev/g))
                        return;
                    var temp = dr.split('-');
                    result.push({
                        month: utils.convertToTitleCase(temp[0]),
                        year: temp[1]
                    });
                }
            }

            function failure(err) {
                tracker.reject(err);
            }
        }
        
        function getTotalCustomerServed(dateRange) {
            var tracker = $q.defer();
            pdbCache.get(constants.pdb_cache_views.view_services).then(generateChartValues).catch(failure);
            return tracker.promise;
            
            function generateChartValues(res) {
                var result = [], cd;
                dateRange.forEach(iterateDateRange);
                tracker.resolve(result);

                function iterateDateRange(dr) {
                    cd = moment(dr.month + ' ' + dr.year, 'MMM YYYY').format('MMM YYYY');
                    cd = angular.lowercase(cd).replace(' ', '-');
                    if (res && res[cd]) {
                        Object.keys(res[cd]).forEach(iterateService);
                    }
                }
                
                function iterateService(sId) {
                    var target = res[cd][sId];
                    if ($rootScope.amGlobals.channel && target.channel && ($rootScope.amGlobals.channel != '') && ($rootScope.amGlobals.channel != 'all') && (target.channel != '') && (target.channel != $rootScope.amGlobals.channel))
                        return;
                    target.srvc_status = utils.convertToTitleCase(target.srvc_status);
                    target.srvc_id = sId;
                    result.push(target);
                }
            }
            function failure(err) {
                tracker.reject(err);
            }
        }
        
        function getProblemsAndVehicleTypes(dateRange) {
            var problems = {}, vehicleTypes = {};
            var tracker = $q.defer();
            pdbMain.getAll().then(success).catch(failure);
            return tracker.promise;
            
            function success(res) {
                res.rows.forEach(iterateRows);
                tracker.resolve({
                    vehicletypes: vehicleTypes,
                    problems: problems
                });
                
                function iterateRows(row) {
                    if ($rootScope.amGlobals.IsConfigDoc(row.id))
                        return;
                    if ($rootScope.amGlobals.channel && row.doc.channel && ($rootScope.amGlobals.channel != '') && ($rootScope.amGlobals.channel != 'all') && (row.doc.channel != '') && (row.doc.channel != $rootScope.amGlobals.channel))
                        return;
                    if (row.doc.user.vehicles)
                        Object.keys(row.doc.user.vehicles).forEach(iterateVehicles);
                        
                    function iterateVehicles(vId) {
                        var vt = row.doc.user.vehicles[vId].type;
                        var vtc = 0; 
                        if (vt)
                            vtc = (vehicleTypes[vt] != undefined) ? vehicleTypes[vt] : 0;
                        if (row.doc.user.vehicles[vId].services)
                            Object.keys(row.doc.user.vehicles[vId].services).forEach(iterateService);
                            
                        function iterateService(sId) {
                            if (row.doc.user.vehicles[vId].services[sId]._deleted == true)
                                return;
                            var csd = moment(row.doc.user.vehicles[vId].services[sId].date).format('MMM YYYY').split(' ');
                            var sdfound = $filter('filter')(dateRange, {
                                month: csd[0],
                                year: csd[1]
                            }, true);

                            if (sdfound.length > 0)
                                vehicleTypes[vt] = vtc + 1;
                            else
                                return;
                            if (row.doc.user.vehicles[vId].services[sId].problems)
                                Object.keys(row.doc.user.vehicles[vId].services[sId].problems).forEach(iterateProblems);
                            
                            function iterateProblems(problem) {
                                if (!problems[problem])
                                    problems[problem] = 0;
                                problems[problem]++;
                            }
                        }
                    }
                }
            }
            
            function failure(err) {
                tracker.reject(err);
            }
        }
        
        function getNewCustomers(dateRange) {
            var tracker = $q.defer();
            pdbCache.get(constants.pdb_cache_views.view_services).then(getDoc).catch(failure);
            return tracker.promise;
            
            function getDoc(res) {
                var result = [], ub = [], unbilled = [], cd;
                dateRange.forEach(iterateDateSetRange);
                tracker.resolve({
                    unbilledServices: ub,
                    newCustomers: result
                });

                function iterateDateSetRange(drange) {
                    cd = moment(drange.month + ' ' + drange.year, 'MMM YYYY').format('MMM YYYY');
                    cd = angular.lowercase(cd).replace(' ', '-');
                    if (res[cd])
                        Object.keys(res[cd]).forEach(iservice);
                    unbilled.forEach(iterateUnbilled);
                    if (res)
                        Object.keys(res).forEach(iterateDateRange);
                }
                
                function iterateUnbilled(s) {
                    if ($rootScope.amGlobals.channel && s.channel && ($rootScope.amGlobals.channel != '') && ($rootScope.amGlobals.channel != 'all') && (s.channel != '') && ($rootScope.amGlobals.channel != s.channel))
                        return;
                    if (s.srvc_status != 'Paid') {
                        var found = $filter('filter')(ub, {
                            srvc_id: s.srvc_id
                        }, true);
                        if (found.length == 0)
                            ub.push(s);
                    }
                }
                
                function iservice(s) {
                    var target = res[cd][s];
                    if ($rootScope.amGlobals.channel && target.channel && ($rootScope.amGlobals.channel != '') && ($rootScope.amGlobals.channel != 'all') && (target.channel != '') && ($rootScope.amGlobals.channel != target.channel))
                        return;
                    target.srvc_id = s;
                    target.srvc_status = utils.convertToTitleCase(target.srvc_status);
                    unbilled.push(target);
                    var found = $filter('filter')(result, {
                        cstmr_id: target.cstmr_id
                    }, true);

                    if (found == 0)
                        result.push(target);
                }
                
                function iterateDateRange(dr) {
                    if (dr.match(/_id|_rev/g))
                        return;
                    var temp = dr.split('-');
                    var td = utils.convertToTitleCase(temp[0]) + ' ' + temp[1];
                    var f = $filter('filter')(dateRange, {
                        month: moment(td, 'MMM YYYY').format('MMM'),
                        year: moment(td, 'MMM YYYY').format('YYYY')
                    }, true);

                    if (f.length == 1)
                        return;

                    if (res[dr])
                        Object.keys(res[dr]).forEach(iterateService);
                        
                    function iterateService(sId) {
                        var target = res[dr][sId];
                        if ($rootScope.amGlobals.channel && target.channel && ($rootScope.amGlobals.channel != '') && ($rootScope.amGlobals.channel != 'all') && (target.channel != '') && ($rootScope.amGlobals.channel != target.channel))
                            return;
                        if (dr != cd) {
                            var found = $filter('filter')(result, {
                                cstmr_id: target.cstmr_id
                            }, true);
                            
                            if (found.length == 1) {
                                var i = result.indexOf(found[0]);
                                result.splice(i, 1);
                            }
                        }
                    }
                }
            }
            
            function failure(err) {
                tracker.reject(err);
            }
        }
    }
})();