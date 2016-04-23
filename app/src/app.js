/*
 * Automint Application
 * @author ndkcha
 * @since 0.4.1
 * @version 0.4.1
 */

/// <reference path="../typings/main.d.ts" />

/*
 *  This closure contains initialization of angular application
 *  Do not update this file unless app level changes are required
 *  When necessary, ask @ndkcha before updating
 */

(function() {
    angular.module('automintApp', ['ui.router', 'oc.lazyLoad', 'ngSanitize', 'ngAnimate', 'ngMaterial'])
        .config(sceConfig)
        .config(DateFormatConfig)
        .run(RunMainBlock);
    
    sceConfig.$inject = ['$sceDelegateProvider'];
    DateFormatConfig.$inject = ['$mdDateLocaleProvider'];
    RunMainBlock.$inject = ['$rootScope', '$state', '$stateParams', '$window', '$amRoot'];
    
    //  configure rules for strict contextual escpaing
    function sceConfig($sceDelegateProvider) {
        $sceDelegateProvider.resourceUrlWhitelist([
            'self'
        ]);
    }
    
    //  configure date formats for the application
    function DateFormatConfig($mdDateLocaleProvider) {
        $mdDateLocaleProvider.formatDate = formatDate;
        
        function parseDate(dateString) {
            return moment(dateString).format('DD/MM/YYYY');
        }
        
        function formatDate(date) {
            return moment(date).format('DD/MM/YYYY');
        }
    }
    
    //  it's called when all the modules are loaded
    function RunMainBlock($rootScope, $state, $stateParams, $window, $amRoot) {
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        
        $rootScope.setCoverPic = setCoverPic;
        
        //  initialize database and default syncing mechanism with automint server
        $amRoot.initDb();
        
        //  set cover photo
        function setCoverPic() {
            var source = localStorage.getItem('cover-pic');
            $('#am-cover-pic').attr('src', (source) ? source : 'assets/img/logo-250x125px.jpg').width(250).height(125);
        }
    }
})();