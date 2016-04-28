/**
 * Controller for Settings component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.5.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlSettings', SettingsController);

    SettingsController.$inject = ['$scope', '$log', 'utils', 'amBackup', 'amLogin', 'amImportdata'];

    function SettingsController($scope, $log, utils, amBackup, amLogin, amImportdata) {
        //  initialize view model
        var vm = this;

        //  named assignments to keep track of UI
        vm.user = {
            username: '',
            password: ''
        }
        vm.label_username = 'Enter Username Here';
        vm.label_password = 'Enter Password Here';

        //  function maps
        vm.changeUsernameLabel = changeUsernameLabel;
        vm.changePasswordLabel = changePasswordLabel;
        vm.doBackup = doBackup;
        vm.doLogin = doLogin;
        vm.onClickUploadCSV = onClickUploadCSV;
        vm.onClickUploadCover = onClickUploadCover;
        vm.doSomething = function() {
            console.log('Anand Log Thayo');
        }
        vm.handleUploadedFile = handleUploadedFile;
        vm.handleUploadedCoverPic = handleUploadedCoverPic;

        //  default execution steps
        checkLogin();

        //  function definitions

        //  store and change existing cover picture in UI as well as local storage
        function handleUploadedCoverPic(e) {
            var files = e.target.files;
            if (!files[0].type.match(/image/g)) {
                utils.showSimpleToast('Please upload photo');
                return;
            }
            if (files && files[0]) {
                var reader = new FileReader();

                reader.onload = loadReader;
                reader.readAsDataURL(files[0]);
            }

            function loadReader(e) {
                $('#am-cover-pic').attr('src', e.target.result).width(250).height(125);
                var coverPicElem = document.getElementById('am-cover-pic');
                var ic = document.createElement('canvas'),
                    icontext = ic.getContext('2d');
                ic.width = coverPicElem.width;
                ic.height = coverPicElem.height;
                icontext.drawImage(coverPicElem, 0, 0, coverPicElem.width, coverPicElem.height);
                localStorage.setItem('cover-pic', ic.toDataURL(files[0].type));
                $('#am-cover-pic').attr('src', localStorage.getItem('cover-pic')).width(250).height(125);
            }
        }

        //  callback function to import csv files
        function handleUploadedFile(e) {
            vm.currentCSVProgress = 0;
            var files = e.target.files || e.originalEvent.dataTransfer.files;
            console.log(files);
            amImportdata.compileCSVFile(files).then(displayToastMessage).catch(displayToastMessage).finally(cleanUp, updates);

            function displayToastMessage(res) {
                utils.showSimpleToast(res.message);
                vm.currentCSVProgress = 100;
                vm.showCSVProgress = (vm.currentCSVProgress < 100);
            }

            function cleanUp(res) {
                amImportdata.cleanUp();
            }

            function updates(res) {
                vm.currentCSVProgress = (vm.total == 0) ? 0 : ((res.current * 100) / res.total);
                vm.showCSVProgress = (vm.currentCSVProgress < 100);
            }
        }

        //  migrate click events from one element to another [BEGIN]
        function onClickUploadCSV() {
            angular.element(document.querySelector('#csv-file-select')).click();
        }
        function onClickUploadCover() {
            angular.element(document.querySelector('#am-upload-cover-pic')).click();
        }
        //  migrate click events from one element to another [END]

        //  backup the database
        function doBackup() {
            amBackup.doBackup().then(respond).catch(respond);

            function respond(res) {
                amBackup.clearReferences();
                $log.info(res);
            }
        }

        //  check if user is signed in or not
        function checkLogin() {
            amLogin.loginDetails().then(success).catch(failure);

            function success(res) {
                if (res.username) {
                    vm.isLoggedIn = true;
                    vm.label_login = 'You are signed in';
                    vm.user.username = res.username;
                    changeUsernameLabel();
                } else
                    failure();
            }

            function failure() {
                vm.isLoggedIn = false;
                vm.label_login = 'Sign In';
            }
        }

        //  store user's login information in database
        function doLogin() {
            amLogin.login(vm.user.username, vm.user.password).then(success);

            function success(res) {
                if (res.ok) {
                    vm.isLoggedIn = true;
                    vm.label_login = 'You are signed in';
                    utils.showSimpleToast('You have successfully logged in!');
                }
            }
        }

        //  listen to changes in input fields [BEGIN]
        function changeUsernameLabel(force) {
            vm.largeUsernameLabel = (force != undefined || vm.user.username != '');
            vm.label_username = vm.largeUsernameLabel ? 'Username:' : 'Enter Username Here';
        }

        function changePasswordLabel(force) {
            vm.largePasswordLabel = (force != undefined || vm.user.password != '');
            vm.label_password = vm.largePasswordLabel ? 'Password:' : 'Enter Password Here';
        }
        //  listen to changes in input fields [END]
    }
})();