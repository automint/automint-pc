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
        $mdThemingProvider.theme('default')
            .primaryPalette('blue')
            .accentPalette('orange');
    }
})();