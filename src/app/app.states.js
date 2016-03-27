altairApp
    .config([
        '$stateProvider',
        '$urlRouterProvider',
        function($stateProvider, $urlRouterProvider) {

            // Use $urlRouterProvider to configure any redirects (when) and invalid urls (otherwise).
            $urlRouterProvider
                .when('/', '/services/all')
                .otherwise('/services/all');

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
                    templateUrl: 'app/components/pages/loginView.html',
                    controller: 'loginCtrl',
                    resolve: {
                        deps: ['$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'lazy_iCheck',
                                'app/components/pages/loginController.js'
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
                            templateUrl: 'app/views/restricted.html'
                        }
                    },
                    resolve: {
                        deps: ['$ocLazyLoad', function($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'lazy_uikit',
                                'lazy_selectizeJS',
                                'lazy_switchery',
                                'lazy_prismJS',
                                'lazy_autosize',
                                'lazy_iCheck'
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
                        deps: ['$ocLazyLoad', function($ocLazyLoad) {
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
                        sale_chart_data: function($http) {
                            return $http({
                                    method: 'GET',
                                    url: 'data/mg_dashboard_chart.min.json'
                                })
                                .then(function(data) {
                                    return data.data;
                                });
                        },
                        user_data: function($http) {
                            return $http({
                                    method: 'GET',
                                    url: 'data/user_data.json'
                                })
                                .then(function(data) {
                                    return data.data;
                                });
                        }
                    },
                    data: {
                        pageTitle: 'Dashboard'
                    },
                    ncyBreadcrumb: {
                        label: 'Home'
                    }
                })
                // ----- SERVICES -----
                .state('restricted.services', {
                    url: '/services',
                    template: '<div ui-view autoscroll="false" />',
                    abstract: true,
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/cruzer/services/servicesController.js'
                            ])
                        }]
                    }
                })
                .state('restricted.services.all', {
                    url: '/all',
                    templateUrl: 'app/cruzer/services/services_viewAll.html',
                    controller: 'servicesViewAllCtrl',
                    controllerAs: 'serviceData',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'bower_components/angular-resource/angular-resource.min.js',
                                'lazy_datatables'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'All Services'
                    }
                })
                .state('restricted.services.add', {
                    url: '/add',
                    templateUrl: 'app/cruzer/services/services_add.html',
                    controller: 'servicesAddCtrl',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'lazy_wizard',
                                'lazy_KendoUI'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'Add a Service'
                    }
                })
                .state('restricted.services.edit', {
                    url: '/edit',
                    params: {
                        id: undefined,
                        vehicleId: undefined,
                        userId: undefined
                    },
                    templateUrl: 'app/cruzer/services/services_add.html',
                    controller: 'servicesEditCtrl',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'lazy_wizard',
                                'lazy_KendoUI'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'Edit Service'
                    }
                })
                .state('restricted.customers', {
                    url: '/customers',
                    template: '<div ui-view autoscroll="false" />',
                    abstract: true,
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/cruzer/customers/customersController.js'
                            ])
                        }]
                    }
                })
                .state('restricted.customers.all', {
                    url: '/all',
                    templateUrl: 'app/cruzer/customers/customers_viewAll.html',
                    controller: 'customersViewAllCtrl',
                    controllerAs: 'customerData',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'bower_components/angular-resource/angular-resource.min.js',
                                'lazy_datatables'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'All Customers'
                    }
                })
                .state('restricted.customers.add', {
                    url: '/add',
                    templateUrl: 'app/cruzer/customers/customers_add.html',
                    controller: 'customersAddCtrl',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'lazy_wizard',
                                'lazy_KendoUI'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'Add a Customer'
                    }
                })
                .state('restricted.customers.edit', {
                    url: '/edit',
                    params: {
                        id: undefined,
                        vehicleId: undefined,
                        userId: undefined
                    },
                    templateUrl: 'app/cruzer/customers/customers_add.html',
                    controller: 'customersEditCtrl',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'lazy_wizard',
                                'lazy_KendoUI'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'Edit Customer'
                    }
                })
                .state('restricted.inventories', {
                    url: '/inventories',
                    template: '<div ui-view autoscroll="false" />',
                    abstract: true,
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/cruzer/inventories/inventoriesController.js'
                            ])
                        }]
                    }
                })
                .state('restricted.inventories.all', {
                    url: '/all',
                    templateUrl: 'app/cruzer/inventories/inventories_viewAll.html',
                    controller: 'inventoriesViewAllCtrl',
                    controllerAs: 'inventoryData',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'bower_components/angular-resource/angular-resource.min.js',
                                'lazy_datatables'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'All Treatments'
                    }
                })
                .state('restricted.inventories.add', {
                    url: '/add',
                    templateUrl: 'app/cruzer/inventories/inventories_add.html',
                    controller: 'inventoriesAddCtrl',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'lazy_KendoUI'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'Add a Treatment'
                    }
                })
                .state('restricted.inventories.edit', {
                    url: '/edit',
                    templateUrl: 'app/cruzer/inventories/inventories_add.html',
                    params: {
                        name: undefined
                    },
                    controller: 'inventoriesEditCtrl',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'lazy_KendoUI'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'Edit Treatment'
                    }
                })
        }
    ]);