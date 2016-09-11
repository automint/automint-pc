/**
 * Factory for Appbar Components
 * @author ndkcha
 * @since 0.7.0
 * @version 0.7.3
 */

/// <reference path="../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('amAppbar', AppbarFactory);

    AppbarFactory.$inject = ['$q', '$rootScope', 'pdbMain', 'pdbLocal', 'constants'];

    function AppbarFactory($q, $rootScope, pdbMain, pdbLocal, constants) {
        //  initialize factory object and function maps
        var factory = {
            getPasscode: getPasscode,
            getCloudChannelNames: getCloudChannelNames
        }

        return factory;

        //  function definitions

        function getCloudChannelNames() {
            var tracker = $q.defer();
            pdbLocal.get(constants.pdb_local_docs.login).then(getLoginDoc).catch(failure);
            return tracker.promise;

            function getLoginDoc(res) {
                if (res.localchannelmaps)
                    tracker.resolve(res.localchannelmaps);
                else
                    failure();
            }

            function failure(err) {
                tracker.reject(404);
            }
        }

        function getPasscode() {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObj).catch(failure);
            return tracker.promise;

            function getSettingsObj(res) {
                tracker.resolve(res.passcode);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }
    }
})();