angular
    .module('altairApp')
    .controller('restrictedCtrl', ['authFactory', '$state', function (authFactory, $state) {
        console.log("restricted ctrl call");
        //if (!authFactory.isLoggedIn()) {
        //console.log("User not logged in");


        //console.log("Redirect by restrictedController.js");
        //$state.go("login");

        // } else {
        //   console.log("Logged IN ..... ");
        // }
    }]);