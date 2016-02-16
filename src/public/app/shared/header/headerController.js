angular
    .module('altairApp')
    .controller('main_headerCtrl', ['$scope', 'authFactory', function ($scope, authFactory) {
        console.log("main_headerCtrl call");
        var _this = this;


        $scope.resetToLogin = function () {
            console.log("do logout....");
            authFactory.logout();
        }
    }]);