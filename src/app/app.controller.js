/*
 *  Altair Admin angularjs
 *  controller
 */

angular
    .module('altairApp')
    .controller('mainCtrl', [
        '$scope',
        '$rootScope',
        function($scope, $rootScope) {}
    ])
    .controller('main_headerCtrl', [
        '$timeout',
        '$scope',
        '$window',
        function($timeout, $scope, $window) {

            $scope.user_data = {
                name: "Lue Feest",
                avatar: "assets/img/avatars/avatar_11_tn.png",
                alerts: [{
                    "title": "Hic expedita eaque.",
                    "content": "Nemo nemo voluptatem officia voluptatum minus.",
                    "type": "warning"
                }, {
                    "title": "Voluptatibus sed eveniet.",
                    "content": "Tempora magnam aut ea.",
                    "type": "success"
                }, {
                    "title": "Perferendis voluptatem explicabo.",
                    "content": "Enim et voluptatem maiores ab fugiat commodi aut repellendus.",
                    "type": "danger"
                }, {
                    "title": "Quod minima ipsa.",
                    "content": "Vel dignissimos neque enim ad praesentium optio.",
                    "type": "primary"
                }],
                messages: [{
                    "title": "Reiciendis aut rerum.",
                    "content": "In adipisci amet nostrum natus recusandae animi fugit consequatur.",
                    "sender": "Korbin Doyle",
                    "color": "cyan"
                }, {
                    "title": "Tenetur commodi animi.",
                    "content": "Voluptate aut quis rerum laborum expedita qui eaque doloremque a corporis.",
                    "sender": "Alia Walter",
                    "color": "indigo",
                    "avatar": "assets/img/avatars/avatar_07_tn.png"
                }, {
                    "title": "At quia quis.",
                    "content": "Fugiat rerum aperiam et deleniti fugiat corporis incidunt aut enim et distinctio.",
                    "sender": "William Block",
                    "color": "light-green"
                }, {
                    "title": "Incidunt sunt.",
                    "content": "Accusamus necessitatibus officia porro nisi consectetur dolorem.",
                    "sender": "Delilah Littel",
                    "color": "blue",
                    "avatar": "assets/img/avatars/avatar_02_tn.png"
                }, {
                    "title": "Porro ut.",
                    "content": "Est vitae magni eum expedita odit quisquam natus vel maiores.",
                    "sender": "Amira Hagenes",
                    "color": "amber",
                    "avatar": "assets/img/avatars/avatar_09_tn.png"
                }]
            };

            $scope.alerts_length = $scope.user_data.alerts.length;
            $scope.messages_length = $scope.user_data.messages.length;


            $('#menu_top').children('[data-uk-dropdown]').on('show.uk.dropdown', function() {
                $timeout(function() {
                    $($window).resize();
                }, 280)
            });


        }
    ])
    .controller('main_sidebarCtrl', [
        '$timeout',
        '$scope',
        '$rootScope',
        function($timeout, $scope, $rootScope) {

            $scope.$on('onLastRepeat', function(scope, element, attrs) {
                $timeout(function() {
                    if (!$rootScope.miniSidebarActive) {
                        // activate current section
                        $('#sidebar_main').find('.current_section > a').trigger('click');
                    } else {
                        // add tooltips to mini sidebar
                        var tooltip_elem = $('#sidebar_main').find('.menu_tooltip');
                        tooltip_elem.each(function() {
                            var $this = $(this);

                            $this.attr('title', $this.find('.menu_title').text());
                            UIkit.tooltip($this, {});
                        });
                    }
                })
            });

            // language switcher
            $scope.langSwitcherModel = 'gb';
            var langData = $scope.langSwitcherOptions = [{
                id: 1,
                title: 'English',
                value: 'gb'
            }, {
                id: 2,
                title: 'French',
                value: 'fr'
            }, {
                id: 3,
                title: 'Chinese',
                value: 'cn'
            }, {
                id: 4,
                title: 'Dutch',
                value: 'nl'
            }, {
                id: 5,
                title: 'Italian',
                value: 'it'
            }, {
                id: 6,
                title: 'Spanish',
                value: 'es'
            }, {
                id: 7,
                title: 'German',
                value: 'de'
            }, {
                id: 8,
                title: 'Polish',
                value: 'pl'
            }];
            $scope.langSwitcherConfig = {
                maxItems: 1,
                render: {
                    option: function(langData, escape) {
                        return '<div class="option">' +
                            '<i class="item-icon flag-' + escape(langData.value).toUpperCase() + '"></i>' +
                            '<span>' + escape(langData.title) + '</span>' +
                            '</div>';
                    },
                    item: function(langData, escape) {
                        return '<div class="item"><i class="item-icon flag-' + escape(langData.value).toUpperCase() + '"></i></div>';
                    }
                },
                valueField: 'value',
                labelField: 'title',
                searchField: 'title',
                create: false,
                onInitialize: function(selectize) {
                    $('#lang_switcher').next().children('.selectize-input').find('input').attr('readonly', true);
                }
            };

            // menu entries
            $scope.sections = [{
                id: 0,
                title: 'Services',
                icon: '&#xE871;',
                link: 'restricted.services.all'
            }, {
                id: 1,
                title: 'Customers',
                icon: '&#xE871',
                link: 'restricted.customers.all'
            }, {
                id: 2,
                title: 'Treatments',
                icon: '&#xE871',
                link: 'restricted.inventories.all'
            }]
        }
    ]);