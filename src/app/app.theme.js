/*
 * Closure to define app theme
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .config(AppTheme);

    AppTheme.$inject = ['$mdThemingProvider'];

    function AppTheme($mdThemingProvider) {
        var amBackGrey = $mdThemingProvider.extendPalette('grey', {
            '50': 'ffffff'
        });
        $mdThemingProvider.definePalette('amBackGrey', amBackGrey);
        $mdThemingProvider.theme('default')
            .primaryPalette('blue-grey', {
                'default': '900',
                'hue-1': '50'
            })
            .accentPalette('light-blue', {
                'default': '700'
            })
            .warnPalette('green', {
                'default': '600'
            })
            .backgroundPalette('amBackGrey', {
                'default': '100',
                'hue-1': '50'
            })
    }
})();