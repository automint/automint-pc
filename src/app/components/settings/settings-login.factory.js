/**
 * Factory to handle login events
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.3
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amLoginSettings', LoginFactory);

    LoginFactory.$inject = ['$q', '$rootScope', 'pdbMain', 'pdbLocal', 'constants'];

    function LoginFactory($q, $rootScope, pdbMain, pdbLocal, constants) {
        //  initialize factory variable and funtion maps
        var factory = {
            getPasscode: getPasscode,
            savePasscode: savePasscode,
            getCloudChannelNames: getCloudChannelNames,
            saveCloudChannelName: saveCloudChannelName,
            saveDefaultFranchiseChannel: saveDefaultFranchiseChannel
        }
        
        return factory;
        
        //  function definitions

        function saveDefaultFranchiseChannel(channel) {
            var tracker = $q.defer();
            pdbLocal.get(constants.pdb_local_docs.login).then(getLoginDoc).catch(failure);
            return tracker.promise;

            function getLoginDoc(res) {
                res.defaultlocalchannel = channel;
                pdbLocal.save(res).then(success).catch(failure);
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function saveCloudChannelName(channels) {
            var tracker = $q.defer();
            pdbLocal.get(constants.pdb_local_docs.login).then(getLoginDoc).catch(failure);
            return tracker.promise;

            function getLoginDoc(res) {
                if (res.localchannelmaps == undefined)
                    res.localchannelmaps = {};
                channels.forEach(iterateChannels);
                pdbLocal.save(res).then(success).catch(failure);

                function iterateChannels(channel) {
                    res.localchannelmaps[channel.id] = channel.name;
                }
            }

            function success(res) {
                tracker.resolve(res);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }

        function getCloudChannelNames() {
            var tracker = $q.defer();
            pdbLocal.get(constants.pdb_local_docs.login).then(getLoginDoc).catch(failure);
            return tracker.promise;

            function getLoginDoc(res) {
                if (res.localchannelmaps) {
                    var response = {
                        channels: res.localchannelmaps
                    };
                    if (res.defaultlocalchannel != undefined)
                        response.default = res.defaultlocalchannel;
                    tracker.resolve(response);
                } else
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

        function savePasscode(passcode, enabled) {
            var tracker = $q.defer();
            pdbMain.get($rootScope.amGlobals.configDocIds.settings).then(getSettingsObj).catch(writeSettingsObj);
            return tracker.promise;

            function getSettingsObj(res) {
                res.passcode = {
                    enabled: enabled,
                    code: passcode
                };
                pdbMain.save(res).then(success).catch(failure);
            }

            function writeSettingsObj(err) {
                var doc = {
                    _id: $rootScope.amGlobals.configDocIds.settings,
                    creator: $rootScope.amGlobals.creator,
                    channel: $rootScope.amGlobals.channel,
                    passcode: {
                        enabled: enabled,
                        code: passcode
                    }
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
    }
})();