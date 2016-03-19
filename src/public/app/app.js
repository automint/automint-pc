/*
 *  Altair Admin AngularJS
 */
;
"use strict";

var altairApp = angular.module('altairApp', [
    'ui.router',
    'oc.lazyLoad',
    'ngSanitize',
    'ngAnimate',
    'ngRetina',
    'ncy-angular-breadcrumb',
    'ConsoleLogger'
]);

altairApp.constant('variables', {
    api_url: "http://localhost:8081",
    api_version: "0.3",
    db_url: "http://{bucket}.cruzer.io:4984/",
    db_commons: "cruzer-test-common",
    localKeys: {
        login: "loginFlag",
        bucket: "bucketName"
    }
});


altairApp.config(function ($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        'https://www.youtube.com/**',
        'https://w.soundcloud.com/**'
    ]);
});

// breadcrumbs
altairApp.config(function ($breadcrumbProvider) {
    $breadcrumbProvider.setOptions({
        prefixStateName: 'restricted.dashboard',
        templateUrl: 'app/templates/breadcrumbs.tpl.html'
    });
});

/* Run Block */
altairApp
    .run([
        '$rootScope',
        '$state',
        '$stateParams',
        '$http',
        '$window',
        '$timeout',
        'preloaders',
        'loginService',
        'variables',
        '$pouchDB',
        function ($rootScope, $state, $stateParams, $http, $window, $timeout, preloaders, loginService, variables, $pouchDB) {

            $rootScope.$state = $state;
            $rootScope.$stateParams = $stateParams;

            loginService.isLogin().then(function (res) {
                debugger;
                if (res) {
                    loginService.runDB().then(function () {
                        debugger;
                        $state.go('restricted.services.all');
                    }, function (err) {
                        debugger;
                        console.log("DB Sync fail redirect to login page");
                        $state.go('login');
                    });
                } else {
                    $state.go('login');
                }
            }, function (errr) {
                debugger;
            });


            $rootScope.$on('$stateChangeSuccess', function () {
                // scroll view to top
                $("html, body").animate({
                    scrollTop: 0
                }, 200);

                $("body").resize(function () {
                    $("#main_view").height(($("body").height()));
                });

                $timeout(function () {
                    $rootScope.pageLoading = false;
                    $($window).resize();
                }, 300);

                $timeout(function () {
                    $rootScope.pageLoaded = true;
                    $rootScope.appInitialized = true;
                    // wave effects
                    $window.Waves.attach('.md-btn-wave,.md-fab-wave', ['waves-button']);
                    $window.Waves.attach('.md-btn-wave-light,.md-fab-wave-light', ['waves-button', 'waves-light']);
                }, 600);

            });

            $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
                // main search
                $rootScope.mainSearchActive = false;
                // single card
                $rootScope.headerDoubleHeightActive = false;
                // top bar
                $rootScope.toBarActive = false;
                // page heading
                $rootScope.pageHeadingActive = false;
                // top menu
                $rootScope.topMenuActive = false;
                // full header
                $rootScope.fullHeaderActive = false;
                // full height
                $rootScope.page_full_height = false;
                // secondary sidebar
                $rootScope.sidebar_secondary = false;
                $rootScope.secondarySidebarHiddenLarge = false;
                // footer
                $rootScope.footerActive = false;

                if ($($window).width() < 1220) {
                    // hide primary sidebar
                    $rootScope.primarySidebarActive = false;
                    $rootScope.hide_content_sidebar = false;
                }
                if (!toParams.hasOwnProperty('hidePreloader')) {
                    $rootScope.pageLoading = true;
                    $rootScope.pageLoaded = false;
                }

            });

            // fastclick (eliminate the 300ms delay between a physical tap and the firing of a click event on mobile browsers)
            FastClick.attach(document.body);

            // get version from package.json
            $http.get('./package.json').success(function (response) {
                $rootScope.appVer = response.version;
            });

            // modernizr
            $rootScope.Modernizr = Modernizr;

            // get window width
            var w = angular.element($window);
            $rootScope.largeScreen = w.width() >= 1220;

            w.on('resize', function () {
                return $rootScope.largeScreen = w.width() >= 1220;
            });

            // show/hide main menu on page load
            $rootScope.primarySidebarOpen = ($rootScope.largeScreen) ? true : false;

            $rootScope.pageLoading = true;

            // wave effects
            $window.Waves.init();

        }
    ])
    .run([
        'PrintToConsole',
        function (PrintToConsole) {
            // app debug
            PrintToConsole.active = false;
        }
    ]);