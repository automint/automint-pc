altairApp
    .config([
        '$stateProvider',
        '$urlRouterProvider',
        function ($stateProvider, $urlRouterProvider) {

            // Use $urlRouterProvider to configure any redirects (when) and invalid urls (otherwise).
            $urlRouterProvider
                .when('/dashboard', '/')
                .otherwise('/login');

            $stateProvider
            // -- ERROR PAGES --
                .state("error", {
                    url: "/error",
                    templateUrl: 'app/views/error.html'
                })
                .state("error.404", {
                    url: "/404",
                    templateUrl: 'app/components/pages/error_404View.html'
                })
                .state("error.500", {
                    url: "/500",
                    templateUrl: 'app/components/pages/error_500View.html'
                })
                // -- LOGIN PAGE --
                .state("login", {
                    url: "/login",
                    templateUrl: 'app/pages/loginView.html',
                    controller: 'loginCtrl',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'lazy_iCheck',

                                'app/pages/loginController.js'
                            ]);
                        }]
                    }
                })
                // -- RESTRICTED --
                .state("restricted", {
                    abstract: true,
                    url: "",
                    views: {
                        'main_header': {
                            templateUrl: 'app/shared/header/headerView.html',
                            controller: 'main_headerCtrl'
                        },
                        'main_sidebar': {
                            templateUrl: 'app/shared/main_sidebar/main_sidebarView.html',
                            controller: 'main_sidebarCtrl'
                        },
                        '': {
                            templateUrl: 'app/views/restricted.html',
                            controller: 'restrictedCtrl'
                        }
                    },
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'lazy_selectizeJS',
                                'lazy_switchery',
                                'lazy_prismJS',
                                'lazy_autosize',
                                'lazy_iCheck',

                                'app/shared/header/headerController.js',
                                'app/views/restrictedController.js'
                            ], {
                                serie: true
                            });
                        }]
                    }
                })
                // -- DASHBOARD --
                .state("restricted.dashboard", {
                    url: "/",
                    templateUrl: 'app/components/dashboard/dashboardView.html',
                    controller: 'dashboardCtrl',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                // ocLazyLoad config (app/app.js)
                                'lazy_countUp',
                                'lazy_charts_peity',
                                'lazy_charts_easypiechart',
                                'lazy_charts_metricsgraphics',
                                'lazy_charts_chartist',
                                'lazy_weathericons',
                                'lazy_google_maps',
                                'lazy_clndr',
                                'app/components/dashboard/dashboardController.js'
                            ], {
                                serie: true
                            });
                        }],
                        sale_chart_data: function ($http) {
                            return $http({
                                    method: 'GET',
                                    url: 'data/mg_dashboard_chart.min.json'
                                })
                                .then(function (data) {
                                    return data.data;
                                });
                        },
                        user_data: function ($http) {
                            return $http({
                                    method: 'GET',
                                    url: 'data/user_data.json'
                                })
                                .then(function (data) {
                                    return data.data;
                                });
                        }
                    },
                    data: {
                        pageTitle: 'Dashboard'
                    }

                })
                .state("restricted.services", {
                    url: "/services",
                    templateUrl: 'app/pages/services/serviceView.html',
                    controller: 'serviceListCtrl as showCase',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'bower_components/angular-resource/angular-resource.min.js',
                                'lazy_datatables',
                                'app/pages/services/serviceController.js'
                            ]);
                        }]
                    },
                    data: {
                        pageTitle: 'Services - List'
                    }
                })
                .state("restricted.servicesadd", {
                    url: "/servicesadd",
                    templateUrl: 'app/pages/services/serviceAddEdit.html',
                    controller: 'serviceAddEditCtrl',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'bower_components/jquery-ui/ui/autocomplete.js',
                                'app/pages/services/serviceController.js'
                            ])
                        }],
                        manufectures: function (apiCall) {
                            apiCall.all("manufacturers").success(function (data) {
                                return data;
                            });
                        }
                    },
                    data: {
                        pageTitle: 'Services - List'
                    }
                })


        }
    ]);