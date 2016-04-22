/*
 * Closure for state definitions and mappings to template files
 * @author ndkcha
 * @since 0.4.1
 * @version 0.4.1
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .config(StateConfigs);

    StateConfigs.$inject = ['$stateProvider', '$urlRouterProvider'];

    function StateConfigs($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.when('/', '/services/all').otherwise('/services/all');

        $stateProvider
            .state('restricted', {
                abstract: true,
                url: '',
                views: {
                    'header_bar': {
                        templateUrl: 'src/appbar/headerView.html',
                        controller: 'appBarHeaderCtrl',
                        controllerAs: 'headerVm'
                    },
                    'side_bar': {
                        templateUrl: 'src/appbar/sidebarView.html',
                        controller: 'appSideBarCtrl',
                        controllerAs: 'sidebarVm'
                    },
                    '': {
                        templateUrl: 'src/views/restricted.html'
                    }
                }
            })
            //  dashboard
            .state('restricted.dashboard', {
                url: '/',
                templateUrl: 'src/components/dashboard/dashboard.html',
                controller: 'dashboardCtrl',
                resolve: {
                    deps: ['$ocLazyLoad', loadDashboardDeps]
                },
                data: {
                    pageTitle: 'Dashboard'
                }
            })
            .state('restricted.customers', {
                url: '/customers',
                template: '<div ui-view autoscroll="false"></div>',
                abstract: true,
                resolve: {
                    deps: ['$ocLazyLoad', loadCustomersDeps]
                }
            })
            .state('restricted.customers.all', {
                url: '/all',
                templateUrl: 'src/components/customers/customers_viewAll.html',
                controller: 'amCtrlCuRA',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadCuRADeps]
                },
                data: {
                    pageTitle: 'All Customers'
                }
            })
            .state('restricted.customers.add', {
                url: '/add',
                templateUrl: 'src/components/customers/customers_add.html',
                controller: 'amCtrlCuCI',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadCuCIDeps]
                },
                data: {
                    pageTitle: 'Add a Customer'
                }
            })
            .state('restricted.customers.edit', {
                url: '/edit',
                templateUrl:'src/components/customers/customers_add.html',
                controller: 'amCtrlCuUI',
                controllerAs: 'vm',
                params: {
                    id: undefined
                },
                resolve: {
                    deps: ['$ocLazyLoad', loadCuUIDeps]
                },
                data: {
                    pageTitle: 'Edit Customer'
                }
            })
            .state('restricted.treatments', {
                url: '/treatments',
                template: '<div ui-view autoscroll="false"></div>',
                abstract: true,
                resolve: {
                    deps: ['$ocLazyLoad', loadTreatmentDeps]
                }
            })
            .state('restricted.treatments.all', {
                url: '/all',
                templateUrl: 'src/components/treatments/treatments_viewAll.html',
                controller: 'amCtrlTrRA',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadTrRADeps]
                },
                data: {
                    pageTitle: 'All Treatments'
                }
            })
            .state('restricted.treatments.add', {
                url: '/add',
                templateUrl: 'src/components/treatments/treatments_add.html',
                controller: 'amCtrlTrCI',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadTrCIDeps]
                },
                data: {
                    pageTitle: 'Add a Treatment'
                }
            })
            .state('restricted.treatments.edit', {
                url: '/edit',
                templateUrl: 'src/components/treatments/treatments_add.html',
                controller: 'amCtrlTrUI',
                controllerAs: 'vm',
                params: {
                    name: undefined
                },
                resolve: {
                    deps: ['$ocLazyLoad', loadTrUIDeps]
                },
                data: {
                    pageTitle: 'Edit Treatment'
                }
            })
            .state('restricted.services', {
                url: '/services',
                template: '<div ui-view autoscroll="fase"></div>',
                abstract: true,
                resolve: {
                    deps: ['$ocLazyLoad', loadServicesDeps]
                }
            })
            .state('restricted.services.all', {
                url: '/all',
                templateUrl: 'src/components/services/services_viewAll.html',
                controller: 'amCtrlSeRA',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadSeRADeps]
                },
                data: {
                    pageTitle: 'All Services'
                }
            })
            .state('restricted.services.add', {
                url: '/add',
                templateUrl: 'src/components/services/services_add.html',
                controller: 'amCtrlSeCI',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadSeCIDeps]
                },
                data: {
                    pageTitle: 'Add a Service'
                }
            })
            .state('restricted.services.edit', {
                url: '/edit',
                templateUrl: 'src/components/services/services_add.html',
                controller: 'amCtrlSeUI',
                controllerAs: 'vm',
                params: {
                    userId: undefined,
                    vehicleId: undefined,
                    serviceId: undefined
                },
                resolve: {
                    deps: ['$ocLazyLoad', loadSeUIDeps]
                },
                data: {
                    pageTitle: 'Edit Service'
                }
            })
            .state('restricted.settings', {
                url: '/settings',
                templateUrl: 'src/components/settings/settings.html',
                controller: 'amCtrlSettings',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadSettingsDeps]
                },
                data: {
                    pageTitle: 'Settings'
                }
            })

        function loadDashboardDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'src/components/dashboard/dashboard.controller.js'
            ]);
        }
        function loadCustomersDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'src/components/customers/customers.factory.js'
            ])
        }
        function loadCuRADeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'src/components/customers/customers-viewall.controller.js'
            ])
        }
        function loadCuCIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'src/components/customers/customers-add.controller.js'
            ])
        }
        function loadCuUIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'src/components/customers/customers-edit.controller.js'
            ])
        }
        function loadTreatmentDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'src/components/treatments/treatments.factory.js'
            ])
        }
        function loadTrCIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'src/components/treatments/treatments-add.controller.js'
            ])
        }
        function loadTrRADeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'src/components/treatments/treatments-viewall.controller.js'
            ])
        }
        function loadTrUIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'src/components/treatments/treatments-edit.controller.js'
            ])
        }
        function loadServicesDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'src/components/services/services.factory.js'
            ])
        }
        function loadSeCIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'src/components/services/services-add.controller.js'
            ])
        }
        function loadSeRADeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'src/components/services/services-viewall.controller.js'
            ])
        }
        function loadSeUIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'src/components/services/services-edit.controller.js'
            ])
        }
        function loadSettingsDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'src/components/settings/settings.controller.js',
                'src/components/settings/settings-backup.factory.js',
                'src/components/settings/settings-login.factory.js',
                'src/components/settings/settings-importdata.service.js',
                'assets/js/jquery.csv.min.js'
            ])
        }
    }
})();