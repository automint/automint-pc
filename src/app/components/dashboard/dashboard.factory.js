/**
 * Factory that handles database interactions between dashboard dataset and controller
 * @author ndkcha
 * @since 0.6.0
 * @version 0.6.4
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amDashboard', DashboardFactory);
    
    DashboardFactory.$inject = ['$q', '$filter', 'utils', 'constants', 'pdbCache', 'pdbCustomers'];
    
    function DashboardFactory($q, $filter, utils, constants, pdbCache, pdbCustomers) {
        //  initialize dashboard factory and funtion mappings
        var factory = {
            getTotalCustomerServed: getTotalCustomerServed,
            getNewCustomers: getNewCustomers,
            getProblemsAndVehicleTypes: getProblemsAndVehicleTypes,
            getFilterMonths: getFilterMonths
        }
        
        return factory;
        
        //  function definitions

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
                    target.srvc_status = utils.convertToTitleCase(target.srvc_status);
                    target.srvc_id = sId;
                    result.push(target);
                }
            }
            function failure(err) {
                tracker.reject(err);
            }
        }
        
        function getProblemsAndVehicleTypes() {
            var problems = {}, vehicleTypes = {};
            var tracker = $q.defer();
            pdbCustomers.getAll().then(success).catch(failure);
            return tracker.promise;
            
            function success(res) {
                res.rows.forEach(iterateRows);
                tracker.resolve({
                    vehicletypes: vehicleTypes,
                    problems: problems
                });
                
                function iterateRows(row) {
                    if (row.doc.user.vehicles)
                        Object.keys(row.doc.user.vehicles).forEach(iterateVehicles);
                        
                    function iterateVehicles(vId) {
                        var vt = row.doc.user.vehicles[vId].type;
                        if (vt) {
                            if (!vehicleTypes[vt])
                                vehicleTypes[vt] = 0;
                            vehicleTypes[vt]++;
                        }
                        if (row.doc.user.vehicles[vId].services)
                            Object.keys(row.doc.user.vehicles[vId].services).forEach(iterateService);
                            
                        function iterateService(sId) {
                            if (row.doc.user.vehicles[vId].services[sId]._deleted == true)
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
                        if (dr != cd) {
                            var found = $filter('filter')(result, {
                                cstmr_id: target.cstmr_id
                            }, true);
                            
                            if (found.length == 1) {
                                // console.log('false', target.cstmr_name, cd, dr, res[dr][sId]);
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