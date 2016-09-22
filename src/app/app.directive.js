/*
 * Closure for root level directives
 * @author ndkcha
 * @since 0.4.1
 * @version 0.8.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .directive('pageTitle', PageTitleDirective)
        .directive('amDropFiles', amDropFilesDirective)
        .directive('amUploadFiles', amUploadFilesDirective)
        .directive('amOnEnter', OnEnterDirective)
        .directive('amCustomAutofocus', amCustomAutofocusDirective)
        .directive('amElasticTextArea', amElasticTextArea);

    PageTitleDirective.$inject = ['$rootScope', '$timeout'];
    amElasticTextArea.$inject = ['$timeout'];

    function OnEnterDirective() {
        return onEnter;

        function onEnter(scope, element, attrs) {
            element.bind("keydown keypress", performAction);

            function performAction() {
                if(event.which === 13) {
                    scope.$apply(evaluteScope);

                    event.preventDefault();

                    function evaluteScope() {
                        scope.$eval(attrs.amOnEnter);
                    }
                }
            }
        }
    }

    //  directive for updating page title
    function PageTitleDirective($rootScope, $timeout) {
        return {
            restrict: 'A',
            link: link
        }

        function link() {
            $rootScope.$on('$stateChangeSuccess', listener);

            function listener(event, toState) {
                var default_title = 'Automint';
                $timeout(callback);

                function callback() {
                    var checkTitle = (toState.data && toState.data.pageTitle);
                    $rootScope.sidebarItemIndex = (toState.data && (toState.data.sidebarItemIndex != undefined)) ? toState.data.sidebarItemIndex : -1;
                    $rootScope.module_title = checkTitle ? toState.data.pageTitle : '';
                    $rootScope.page_title = checkTitle ? (default_title + ' | ' + toState.data.pageTitle) : default_title;
                }
            }
        }
    }

    //  listeners for 'drop to upload file' feature (used in input[type='file'] element)
    function amDropFilesDirective() {
        return {
            restrict: 'A',
            scope: {
                callback: '&amDropFiles'
            },
            link: link
        }

        function link(scope, elem, attr) {
            var callbackDrop = scope.callback();
            var xhr = new XMLHttpRequest();
            if (xhr.upload) {
                elem.bind('dragover', handleDragHoverEvent);
                elem.bind('dragleave', handleDragHoverEvent);
                elem.bind('drop', handleDropEvent);
            }

            function handleDropEvent(e) {
                handleDragHoverEvent(e);
                callbackDrop(e);
            }
        }

        function handleDragHoverEvent(e) {
            e.stopPropagation();
            e.preventDefault();
            e.target.className = (e.type == "dragover" ? "am-file-uploader hover" : "am-file-uploader");
        }
    }
    
    //  listeners for 'upload file in realtime' feature (used in input[type='file'] element)
    function amUploadFilesDirective() {
        return {
            restrict: 'A',
            scope: {
                callback: '&amUploadFiles'
            },
            link: link
        }
        
        function link(scope, elem, attr) {
            var callbackChange = scope.callback();
            var xhr = new XMLHttpRequest();
            if (xhr.upload) {
                elem.bind('change', handleChangeEvent);
            }
            
            function handleChangeEvent(e) {
                callbackChange(e);
            }
        }
    }

    function amCustomAutofocusDirective() {
        return {
            restrict: 'A',
            link: link
        }

        function link(scope, element, attrs) {
            scope.$watch(watchKey, watcher);
            
            function watchKey() {
                return scope.$eval(attrs.amCustomAutofocus);
            }

            function watcher(newValue) {
                if (newValue === true){
                    element[0].focus();
               }
            }
        }
    }

    function amElasticTextArea($timeout) {
        return {
            restrict: 'A',
            link: link
        };

        function link($scope, element) {
            $scope.initialHeight = $scope.initialHeight || element[0].style.height;
            element.on("input change", resize);
            $timeout(resize, 0);

            function resize() {
                element[0].style.height = $scope.initialHeight;
                element[0].style.height = "" + element[0].scrollHeight + "px";
            }
        }
    }
})();