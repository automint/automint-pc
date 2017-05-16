/**
 * Factory for Appbar Components
 * @author ndkcha
 * @since 0.7.0
 * @version 0.9.0
 */

(function() {
    angular.module('automintApp').factory('amAppbar', AppbarFactory);

    AppbarFactory.$inject = ['$q', '$rootScope', 'pdbMain', 'pdbLocal', 'constants'];

    function AppbarFactory($q, $rootScope, pdbMain, pdbLocal, constants) {
        //  initialize factory object and function maps
        var factory = {
            getPasscode: getPasscode
        }

        return factory;

        //  function definitions

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