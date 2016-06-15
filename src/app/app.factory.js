/*
 * Closure for root level factories
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.1
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('amRootFactory', RootFactory)
        .factory('utils', UtilsFactory);
    
    RootFactory.$inject = ['$q', '$amRoot', 'pdbConfig'];
    UtilsFactory.$inject = ['$mdToast'];

    function RootFactory($q, $amRoot, pdbConfig) {
        //  initialize factory object and map functions
        var factory = {
            getPasscode: getPasscode
        }

        return factory;

        //  function definitions

        function getPasscode() {
            var tracker = $q.defer();
            $amRoot.isSettingsId().then(getSettingsDoc).catch(failure);
            return tracker.promise;

            function getSettingsDoc(res) {
                pdbConfig.get($amRoot.docIds.settings).then(getSettingsObj).catch(failure);
            }

            function getSettingsObj(res) {
                tracker.resolve(res.passcode);
            }

            function failure(err) {
                tracker.reject(err);
            }
        }
    }
    
    function UtilsFactory($mdToast) {
        //  temporary named assignments
        var toastSimple = $mdToast.simple().position('bottom right').hideDelay(3000);
        
        // initialize factory object and map functions
        var factory = {
            generateUUID: generateUUID,
            convertToTitleCase: convertToTitleCase,
            showSimpleToast: showSimpleToast,
            showActionToast: showActionToast
        }
        
        return factory;
        
        //  generate UUID for deriving unique keys
        function generateUUID(prefix) {
            var d = new Date().getTime();
            var raw = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
            
            return (prefix + '-' + raw.replace(/[xy]/g, constructString));
            
            function constructString(c) {
                var r = (d + Math.random() * 16) % 16 | 0;
                d = Math.floor(d/16);
                return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            }
        }
        
        //  convert input to Title Case
        function convertToTitleCase(input) {
            return input.replace(/\w\S*/g, constructReplacement);
            
            function constructReplacement(intermediate) {
                return intermediate.charAt(0).toUpperCase() + intermediate.substr(1).toLowerCase();
            }
        }
        
        //  display toast message
        function showSimpleToast(content) {
            toastSimple.textContent(content);
            $mdToast.show(toastSimple);
        }
        
        //  show action wala toast
        function showActionToast(content, actionText, actionCallback) {
            var callbackArgs = arguments;
            var callingFunction = this;
            toastSimple.textContent(content);
            toastSimple.action(actionText);
            toastSimple.highlightAction(true);
            $mdToast.show(toastSimple).then(performAction);
            
            function performAction(res) {
                if (res == 'ok') 
                    actionCallback.apply(callingFunction, Array.prototype.slice.call(callbackArgs, 3));
            }
        }
    }
})();