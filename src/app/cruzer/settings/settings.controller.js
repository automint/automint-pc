(function() {
    angular.module('altairApp')
        .controller('settingsCtrl', SettingsCtrl);
        
    SettingsCtrl.$inject = ['backupRestore', 'settingsFactory', '$cruzerService'];
    
    function SettingsCtrl(backupRestore, settingsFactory, $cruzerService) {
        var vm = this;
        //  keep track of UI variables
        vm.loginTitle = 'Sign In';
        vm.isLoggedIn = false;
        vm.username = '';
        vm.password = '';
        //  function declaration and mapping
        vm.backup = backup;
        vm.login = login;
        
        //  default execution steps
        checkLogin();
        
        //  calls backup function from main factory
        function backup() {
            backupRestore.backup().then(function(res) {
                console.log(res);
            }, function(err) {
                console.log(err);
            });
        }
        
        //  check if user is already logged in
        function checkLogin() {
            settingsFactory.loginDetails().then(function(res) {
                if (res.success) {
                    vm.isLoggedIn = true;
                    vm.loginTitle = 'You have already signed in';
                    vm.username = res.username;
                } else {
                    vm.isLoggedIn = false;
                    vm.loginTitle = 'Sign In';
                }
            }, function(err) {
                vm.isLoggedIn = false;
                vm.loginTitle = 'Sign In';
            });
        }
        
        //  login to cloud services
        function login() {
            settingsFactory.login(vm.username, vm.password).then(function(res) {
                if (res.ok) {
                    $cruzerService.syncDb();
                    vm.isLoggedIn = true;
                    UIkit.notify("You have successfully logged in!", {
                        status: 'success',
                        timeout: 3000
                    });
                }
            });
        }
    }
})();