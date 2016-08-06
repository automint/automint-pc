/*
 * Closure for state definitions and mappings to template files
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .config(StateConfigs);

    StateConfigs.$inject = ['$stateProvider', '$urlRouterProvider'];

    function StateConfigs($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.when('/', '/locked').otherwise('/locked');

        $stateProvider
            .state('locked', {
                url: '/locked',
                views: {
                    'lockscreen': {
                        templateUrl: 'app/views/lockscreen.html',
                        controller: 'lockScreenCtrl',
                        controllerAs: 'vm'
                    }
                },
                params: {
                    fromState: undefined
                }
            })
            .state('restricted', {
                abstract: true,
                url: '',
                views: {
                    'header_bar': {
                        templateUrl: 'app/appbar/headerView.html',
                        controller: 'appBarHeaderCtrl',
                        controllerAs: 'headerVm'
                    },
                    'side_bar': {
                        templateUrl: 'app/appbar/sidebarView.html',
                        controller: 'appSideBarCtrl',
                        controllerAs: 'sidebarVm'
                    },
                    '': {
                        templateUrl: 'app/views/restricted.html'
                    }
                }
            })
            //  dashboard
            .state('restricted.dashboard', {
                url: '/dashboard',
                templateUrl: 'app/components/dashboard/dashboard.html',
                controller: 'dashboardCtrl',
                controllerAs: 'vm',
                params: {
                    openDialog: undefined
                },
                resolve: {
                    deps: ['$ocLazyLoad', loadDashboardDeps]
                },
                data: {
                    pageTitle: 'Dashboard',
                    sidebarItemIndex: 0
                }
            })
            //  customers
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
                templateUrl: 'app/components/customers/customers_viewAll.html',
                controller: 'amCtrlCuRA',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadCuRADeps]
                },
                data: {
                    pageTitle: 'All Customers',
                    sidebarItemIndex: 1
                }
            })
            .state('restricted.customers.add', {
                url: '/add',
                templateUrl: 'app/components/customers/customers_add.html',
                controller: 'amCtrlCuCI',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadCuCIDeps]
                },
                data: {
                    pageTitle: 'Add a Customer',
                    sidebarItemIndex: 1
                }
            })
            .state('restricted.customers.edit', {
                url: '/edit',
                templateUrl:'app/components/customers/customers_edit.html',
                controller: 'amCtrlCuUI',
                controllerAs: 'vm',
                params: {
                    id: undefined,
                    fromState: undefined
                },
                resolve: {
                    deps: ['$ocLazyLoad', loadCuUIDeps]
                },
                data: {
                    pageTitle: 'Edit Customer',
                    sidebarItemIndex: 1
                }
            })
            //  treatments
            .state('restricted.treatments', {
                url: '/treatments',
                template: '<div ui-view autoscroll="false"></div>',
                abstract: true,
                resolve: {
                    deps: ['$ocLazyLoad', loadTreatmentDeps]
                }
            })
            .state('restricted.treatments.master', {
                url: '/all',
                templateUrl: 'app/components/treatments/treatments_master.html',
                params: {
                    openTab: undefined
                },
                controller: 'amCtrlTrMaster',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadTrMasterDeps]
                },
                data: {
                    pageTitle: 'All Treatments',
                    sidebarItemIndex: 2
                }
            })
            .state('restricted.treatments.add', {
                url: '/add',
                templateUrl: 'app/components/treatments/regular/treatments_add.html',
                controller: 'amCtrlTrCI',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadTrCIDeps]
                },
                data: {
                    pageTitle: 'Add a Treatment',
                    sidebarItemIndex: 2
                }
            })
            .state('restricted.treatments.edit', {
                url: '/edit',
                templateUrl: 'app/components/treatments/regular/treatments_add.html',
                controller: 'amCtrlTrUI',
                controllerAs: 'vm',
                params: {
                    name: undefined
                },
                resolve: {
                    deps: ['$ocLazyLoad', loadTrUIDeps]
                },
                data: {
                    pageTitle: 'Edit Treatment',
                    sidebarItemIndex: 2
                }
            })
            //  services
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
                templateUrl: 'app/components/services/services_viewAll.html',
                controller: 'amCtrlSeRA',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadSeRADeps]
                },
                data: {
                    pageTitle: 'All Services',
                    sidebarItemIndex: -1
                }
            })
            .state('restricted.services.add', {
                url: '/add',
                templateUrl: 'app/components/services/services_add.html',
                controller: 'amCtrlSeCI',
                controllerAs: 'vm',
                params: {
                    fromState: undefined
                },
                resolve: {
                    deps: ['$ocLazyLoad', loadSeCIDeps]
                },
                data: {
                    pageTitle: 'Add a Service',
                    sidebarItemIndex: -1
                }
            })
            .state('restricted.services.edit', {
                url: '/edit',
                templateUrl: 'app/components/services/services_add.html',
                controller: 'amCtrlSeUI',
                controllerAs: 'vm',
                params: {
                    userId: undefined,
                    vehicleId: undefined,
                    serviceId: undefined,
                    fromState: undefined
                },
                resolve: {
                    deps: ['$ocLazyLoad', loadSeUIDeps]
                },
                data: {
                    pageTitle: 'Edit Service',
                    sidebarItemIndex: -1
                }
            })
            //  settings
            .state('restricted.settings', {
                url: '/settings',
                templateUrl: 'app/components/settings/settings.html',
                controller: 'amCtrlSettings',
                controllerAs: 'vm',
                params: {
                    openTab: undefined
                },
                resolve: {
                    deps: ['$ocLazyLoad', loadSettingsDeps]
                },
                data: {
                    pageTitle: 'Settings',
                    sidebarItemIndex: 4
                }
            })
            //  invoices
            .state('restricted.invoices', {
                url: '/invoices',
                template: '<div ui-view autoscroll="false"></div>',
                abstract: true,
                resolve: {
                    deps: ['$ocLazyLoad', loadInvoicesDeps]
                }
            })
            .state('restricted.invoices.view', {
                url: '/view',
                templateUrl: 'app/components/invoices/invoices_view.html',
                params: {
                    userId: undefined,
                    vehicleId: undefined,
                    serviceId: undefined,
                    fromState: undefined
                },
                controller: 'amCtrlIvRI',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadIvRIDeps]
                },
                data: {
                    pageTitle: 'View Invoice',
                    sidebarItemIndex: -1
                }
            })
            //  packages
            .state('restricted.packages', {
                url: '/packages',
                template: '<div ui-view autoscroll="false"></div>',
                abstract: true,
                resolve: {
                    deps: ['$ocLazyLoad', loadPackageDeps]
                }
            })
            .state('restricted.packages.add', {
                url: '/add',
                templateUrl: 'app/components/treatments/packages/packages_add.html',
                controller: 'amCtrlPkCI',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadPkCIDeps]
                },
                data: {
                    pageTitle: 'Add Package',
                    sidebarItemIndex: 2
                }
            })
            .state('restricted.packages.edit', {
                url: '/edit',
                templateUrl: 'app/components/treatments/packages/packages_add.html',
                controller: 'amCtrlPkUI',
                controllerAs: 'vm',
                params: {
                    name: undefined
                },
                resolve: {
                    deps: ['$ocLazyLoad', loadPkUIDeps]
                },
                data: {
                    pageTitle: 'Edit Package',
                    sidebarItemIndex: 2
                }
            })
            .state('restricted.memberships', {
                url: '/memberships',
                template: '<div ui-view autoscroll="false"></div>',
                abstract: true,
                resolve: {
                    deps: ['$ocLazyLoad', loadMembershipDeps]
                }
            })
            .state('restricted.memberships.add', {
                url: '/add',
                templateUrl: 'app/components/treatments/memberships/memberships_add.html',
                controller: 'amCtrlMsCI',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadMsCIDeps]
                },
                data: {
                    pageTitle: 'Add Membership',
                    sidebarItemIndex: 2
                }
            })
            .state('restricted.memberships.edit', {
                url: '/edit',
                templateUrl: 'app/components/treatments/memberships/memberships_add.html',
                controller: 'amCtrlMsUI',
                controllerAs: 'vm',
                params: {
                    name: undefined
                },
                resolve: {
                    deps: ['$ocLazyLoad', loadMsUIDeps]
                },
                data: {
                    pageTitle: 'Edit Membership',
                    sidebarItemIndex: 2
                }
            })
            .state('restricted.inventory', {
                url: '/inventory',
                template: '<div ui-view autoscroll="false"></div>',
                abstract: true,
                resolve: {
                    deps: ['$ocLazyLoad', loadInventoryDeps]
                }
            })
            .state('restricted.inventory.all', {
                url: '/all',
                templateUrl: 'app/components/inventory/inventory_viewall.html',
                controller: 'amCtrlInRA',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadInRADeps]
                },
                data: {
                    pageTitle: 'All Inventories',
                    sidebarItemIndex: 3
                }
            })
            .state('restricted.inventory.add', {
                url: '/add',
                templateUrl: 'app/components/inventory/inventory_add.html',
                controller: 'amCtrlInCI',
                controllerAs: 'vm',
                resolve: {
                    deps: ['$ocLazyLoad', loadInCIDeps]
                },
                data: {
                    pageTitle: 'Add Inventory',
                    sidebarItemIndex: 3
                }
            })
            .state('restricted.inventory.edit', {
                url: '/edit',
                templateUrl: 'app/components/inventory/inventory_add.html',
                controller: 'amCtrlInUI',
                controllerAs: 'vm',
                params: {
                    name: undefined
                },
                resolve: {
                    deps: ['$ocLazyLoad', loadInUIDeps]
                },
                data: {
                    pageTitle: 'Edit Inventory',
                    sidebarItemIndex: 3
                }
            });

        function loadInUIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'app/components/inventory/inventory-edit.controller.js'
            ]);
        }
        function loadInCIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'app/components/inventory/inventory-add.controller.js'
            ]);
        }
        function loadInRADeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/inventory/inventory-viewall.controller.js'
            ]);
        }
        function loadInventoryDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'app/components/inventory/inventory.factory.js'
            ]);
        }
        function loadDashboardDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'google-chart',
                'app/components/dashboard/dashboard.controller-deps.js',
                'app/components/dashboard/dashboard.controller.js',
                'app/components/dashboard/dashboard.factory.js'
            ]);
        }
        function loadCustomersDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'app/components/customers/customers.factory.js'
            ])
        }
        function loadCuRADeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/customers/customers-viewall.controller.js'
            ])
        }
        function loadCuCIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'assets/js/angular-elastic-input.min.js',
                'app/components/customers/customers-add.controller.js',
                'app/components/customers/tmpl/vehicle-crud.controller.js'
            ])
        }
        function loadCuUIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/customers/customers-edit.controller.js',
                'app/components/customers/tmpl/vehicle-crud.controller.js'
            ])
        }
        function loadTreatmentDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'app/components/treatments/treatments.factory.js'
            ])
        }
        function loadTrCIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/treatments/regular/treatments-add.controller.js'
            ])
        }
        function loadTrMasterDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/treatments/treatments-master.controller.js',
                'app/components/treatments/regular/treatments-viewall.controller.js',
                'app/components/treatments/packages/packages-viewall.controller.js',
                'app/components/treatments/memberships/memberships-viewall.controller.js'
            ])
        }
        function loadTrUIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/treatments/regular/treatments-edit.controller.js'
            ])
        }
        function loadServicesDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'app/components/services/services.factory.js'
            ])
        }
        function loadSeCIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/services/tmpl/dialog_membership.edit.controller.js',
                'app/components/services/tmpl/dialog_discount.controller.js',
                'app/components/services/tmpl/dialog_partialpayment.controller.js',
                'app/components/services/services-add.controller.js'
            ])
        }
        function loadSeRADeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/services/tmpl/dialog_timefilter.controller.js',
                'app/components/services/services-viewall.controller.js'
            ])
        }
        function loadSeUIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/services/tmpl/dialog_membership.edit.controller.js',
                'app/components/services/tmpl/dialog_discount.controller.js',
                'app/components/services/tmpl/dialog_partialpayment.controller.js',
                'app/components/services/services-edit.controller.js'
            ])
        }
        function loadSettingsDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'app/components/settings/settings.controller.js',
                'app/components/settings/settings-backup.factory.js',
                'app/components/settings/settings-login.factory.js',
                'app/components/settings/settings-importdata.service.js',
                'app/components/settings/settings-invoices.factory.js',
                'app/components/settings/settings-tax.factory.js',
                'app/components/settings/settings.factory.js',
                'assets/js/angular-elastic-input.min.js',
                'assets/js/jquery.csv.min.js'
            ])
        }
        function loadIvRIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/invoices/invoices-view.controller.js'
            ])
        }
        function loadInvoicesDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'app/components/invoices/invoices.factory.js'
            ])
        }
        function loadPackageDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'app/components/treatments/treatments.factory.js'
            ])
        }
        function loadPkCIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/treatments/packages/packages-add.controller.js'
            ])
        }
        function loadPkUIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/treatments/packages/packages-edit.controller.js'
            ])
        }
        function loadMembershipDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'app/components/treatments/treatments.factory.js'
            ])
        }
        function loadMsCIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/treatments/memberships/memberships-add.controller.js'
            ])
        }
        function loadMsUIDeps($ocLazyLoad) {
            return $ocLazyLoad.load([
                'material-datatable',
                'app/components/treatments/memberships/memberships-edit.controller.js'
            ])
        }
    }
})();