/*
 * Closure to define app theme
 * @author ndkcha
 * @since 0.4.1
 * @version 0.4.1
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .config(AppTheme);

    AppTheme.$inject = ['$mdThemingProvider'];

    function AppTheme($mdThemingProvider) {
        /*$mdThemingProvider.definePalette('automintCyan', {
            '50': ''
        })*/
        $mdThemingProvider.theme('default')
            .primaryPalette('grey', {
                'default': '900'
            })
            .accentPalette('light-blue', {
                'default': '700'
            });
    }
})();