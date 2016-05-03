/**
 * Controller for View All Packages compoenent
 * @author ndkcha
 * @since 0.5.0
 * @version 0.5.0
 */

/// <reference path="../../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp').controller('amCtrlPkRA', PackagesViewAllController);

    PackagesViewAllController.$inject = ['$state'];

    function PackagesViewAllController($state) {
        //  initialize view model
        var vm = this;
        
        //  function maps
        vm.addPackage = addPackage;
        
        //  function definitions
        
        function addPackage() {
            $state.go('restricted.packages.add');
        }
    }
})();