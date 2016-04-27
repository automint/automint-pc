/*
 * Closure for root level factories
 * @author ndkcha
 * @since 0.4.1
 * @version 0.4.1
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('utils', UtilsFactory);
    
    UtilsFactory.$inject = ['$mdToast']
    
    function UtilsFactory($mdToast) {
        //  temporary named assignments
        var toastSimple = $mdToast.simple().position('bottom right').hideDelay(3000);
        
        // initialize factory object and map functions
        var factory = {
            generateUUID: generateUUID,
            convertToTitleCase: convertToTitleCase,
            showSimpleToast: showSimpleToast
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
    }
})();