/// <reference path="../typings/main.d.ts" />

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
                                'app/automint/services/services.factory.js'
                            ])
                        }]
                    }
                })
                .state('restricted.services.all', {
                    url: '/all',
                    templateUrl: 'app/automint/services/services_viewAll.html',
                    controller: 'servicesViewAllCtrl',
                    controllerAs: 'serviceVm',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/automint/services/controllers/services-viewall.controller.js',
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
                    templateUrl: 'app/automint/services/services_add.html',
                    controller: 'servicesAddCtrl',
                    controllerAs: 'serviceFormVm',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/automint/services/controllers/services-add.controller.js',
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
                        serviceId: undefined,
                        vehicleId: undefined,
                        userId: undefined
                    },
                    templateUrl: 'app/automint/services/services_add.html',
                    controller: 'servicesEditCtrl',
                    controllerAs: 'serviceFormVm',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/automint/services/controllers/services-edit.controller.js',
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
                                'app/automint/customers/customers.factory.js'
                            ])
                        }]
                    }
                })
                .state('restricted.customers.all', {
                    url: '/all',
                    templateUrl: 'app/automint/customers/customers_viewAll.html',
                    controller: 'customersViewAllCtrl',
                    controllerAs: 'customerVm',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/automint/customers/controllers/customers-viewall.controller.js',
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
                    templateUrl: 'app/automint/customers/customers_add.html',
                    controller: 'customersAddCtrl',
                    controllerAs: 'customerFormVm',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/automint/customers/controllers/customers-add.controller.js',
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
                    templateUrl: 'app/automint/customers/customers_add.html',
                    controller: 'customersEditCtrl',
                    controllerAs: 'customerFormVm',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/automint/customers/controllers/customers-edit.controller.js',
                                'lazy_wizard',
                                'lazy_KendoUI'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'Edit Customer'
                    }
                })
                .state('restricted.treatments', {
                    url: '/treatments',
                    template: '<div ui-view autoscroll="false" />',
                    abstract: true,
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/automint/treatments/treatments.factory.js'
                            ])
                        }]
                    }
                })
                .state('restricted.treatments.all', {
                    url: '/all',
                    templateUrl: 'app/automint/treatments/treatments_viewAll.html',
                    controller: 'treatmentsViewAllCtrl',
                    controllerAs: 'treatmentsVm',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/automint/treatments/controllers/treatments-viewall.controller.js',
                                'bower_components/angular-resource/angular-resource.min.js',
                                'lazy_datatables'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'All Treatments'
                    }
                })
                .state('restricted.treatments.add', {
                    url: '/add',
                    templateUrl: 'app/automint/treatments/treatments_add.html',
                    controller: 'treatmentsAddCtrl',
                    controllerAs: 'treatmentsFormVm',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/automint/treatments/controllers/treatments-add.controller.js',
                                'lazy_KendoUI'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'Add a Treatment'
                    }
                })
                .state('restricted.treatments.edit', {
                    url: '/edit',
                    templateUrl: 'app/automint/treatments/treatments_add.html',
                    params: {
                        name: undefined
                    },
                    controller: 'treatmentsEditCtrl',
                    controllerAs: 'treatmentsFormVm',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/automint/treatments/controllers/treatments-edit.controller.js',
                                'lazy_KendoUI'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'Edit Treatment'
                    }
                })
                .state('restricted.settings', {
                    url: '/settings',
                    templateUrl: 'app/automint/settings/settings.html',
                    controller: 'settingsCtrl',
                    controllerAs: 'settingsVm',
                    resolve: {
                        deps: ['$ocLazyLoad', function ($ocLazyLoad) {
                            return $ocLazyLoad.load([
                                'app/automint/settings/settings.factory.js',
                                'app/automint/settings/settings.controller.js',
                                'app/automint/settings/settings-importdata.service.js',
                                'assets/js/jquery.csv.min.js'
                            ])
                        }]
                    },
                    data: {
                        pageTitle: 'Settings'
                    }
                })
        }
    ]);