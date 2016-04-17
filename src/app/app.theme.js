/*
 * Closure to define app theme
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .config(AppTheme);

    AppTheme.$inject = ['$mdThemingProvider'];

    function AppTheme($mdThemingProvider) {
        $mdThemingProvider.theme('default')
            .primaryPalette('blue')
            .accentPalette('orange');
    }
})();