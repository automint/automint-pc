/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('altairApp')
        .controller('settingsCtrl', SettingsCtrl);
        
    SettingsCtrl.$inject = ['backupRestore', 'settingsFactory', '$automintService', 'importDataService'];
    
    function SettingsCtrl(backupRestore, settingsFactory, $automintService, importDataService) {
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
        
        //  import data components
        var progressbar = $('#file_upload-progressbar'),
            bar = progressbar.find('.uk-progress-bar'),
            settings = {
                //  upload URL
                action: '',
                //  restrict file type
                allow: '*.csv',
                //  restrict number of uploads per trial
                filelimit: 1,
                //  callbacks
                loadstart: progressbarLoadStart,
                before: beforeLoadingIntoImport,
                progress: progressbarProgress,
                loadend: progressbarLoadEnd,
                allcomplete: progressbarAllComplete
            };
        var selectFile = UIkit.uploadSelect($('#file_upload-select'), settings),
            dropFile = UIkit.uploadDrop($('#file_upload-drop'), settings);
        
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
                    $automintService.syncDb();
                    vm.isLoggedIn = true;
                    UIkit.notify("You have successfully logged in!", {
                        status: 'success',
                        timeout: 3000
                    });
                }
            });
        }
        
        //  import data functions
        function progressbarLoadStart(event) {
            bar.css('width', '0%').text('0%');
            progressbar.removeClass('uk-hidden');
        }
        function beforeLoadingIntoImport(settings, files) {
            importDataService.compileCSVFile(files);
        }
        function progressbarProgress(percent) {
            percent = Math.ceil(percent);
            bar.css('width', percent + '%').text(percent + '%');
        }
        function progressbarLoadEnd(e) {
            //  load end
        }
        function progressbarAllComplete(response) {
            bar.css('width', '100%').text('100%');
            setTimeout(hideProgressbar, 250);
            
            function hideProgressbar() {
                progressbar.addClass('uk-hidden')
            }
            UIkit.notify("File has been uploaded!", {
                status: 'success',
                timeout: 3000
            });
        }
    }
})();