/*
 * Closure for root level directives
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0 
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .directive('pageTitle', PageTitleDirective);
    
    PageTitleDirective.$inject = ['$rootScope', '$timeout'];
    
    //  directive for updating page title
    function PageTitleDirective($rootScope, $timeout) {
        return {
            restrict: 'A',
            link: link
        }
        
        function link() {
            $rootScope.$on('$stateChangeSuccess', listener);
            
            function listener(event, toState) {
                var default_title = 'Automint';
                $timeout(callback);
                
                function callback() {
                    var checkTitle = (toState.data && toState.data.pageTitle);
                    $rootScope.module_title = checkTitle ? toState.data.pageTitle : '';
                    $rootScope.page_title = checkTitle ? toState.data.pageTitle + ' - ' + default_title : default_title;
                }
            }
        }
    }
})();