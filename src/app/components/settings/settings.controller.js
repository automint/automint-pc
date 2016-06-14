/**
 * Controller for Settings component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.6.1
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .controller('amCtrlSettings', SettingsController);

    SettingsController.$inject = ['$scope', '$state', '$log', 'utils', 'amBackup', 'amLogin', 'amImportdata', 'amIvSettings', 'amSeTaxSettings'];

    function SettingsController($scope, $state, $log, utils, amBackup, amLogin, amImportdata, amIvSettings, amSeTaxSettings) {
        //  initialize view model
        var vm = this;
        
        //  temporary named assignments
        var olino = 0, ivEmailSubject;

        //  named assignments to keep track of UI [BEGIN]
        //  general settings
        vm.user = {
            username: '',
            password: ''
        };
        vm.label_username = 'Enter Username:';
        vm.label_password = 'Enter Password:';
        //  invoice settings
        vm.workshop = {
            name: '',
            phone: '',
            address1: '',
            address2: '',
            city: ''
        };
        vm.label_workshopName = 'Enter Workshop Name:';
        vm.label_workshopPhone = 'Enter Phone Number:';
        vm.label_workshopAddress1 = 'Enter Address Line 1:';
        vm.label_workshopAddress2 = 'Enter Address Line 2:';
        vm.label_workshopCity = 'Enter City:';
        //  named assignments to keep track of UI [END]
        
        //  function maps [BEGIN]
        vm.changeInvoiceTab = changeInvoiceTab;
        //  general settings
        vm.changeUsernameLabel = changeUsernameLabel;
        vm.changePasswordLabel = changePasswordLabel;
        vm.doBackup = doBackup;
        vm.doLogin = doLogin;
        vm.uploadCSV = uploadCSV;
        vm.uploadCover = uploadCover;
        vm.handleUploadedFile = handleUploadedFile;
        vm.handleUploadedCoverPic = handleUploadedCoverPic;
        //  invoice settings
        vm.changeWorkshopNameLabel = changeWorkshopNameLabel;
        vm.changeWorkshopPhoneLabel = changeWorkshopPhoneLabel;
        vm.changeWorkshopAddress1Label = changeWorkshopAddress1Label;
        vm.changeWorkshopAddress2Label = changeWorkshopAddress2Label;
        vm.changeWorkshopCityLabel = changeWorkshopCityLabel;
        vm.saveWorkshopDetails = saveWorkshopDetails;
        vm.changeInvoiceWLogo = changeInvoiceWLogo;
        vm.uploadInvoiceWLogo = uploadInvoiceWLogo;
        vm.resetLastInvoiceNo = resetLastInvoiceNo;
        vm.saveIvDisplaySettings = saveIvDisplaySettings;
        vm.OnBlurLastInvoiceNumber = OnBlurLastInvoiceNumber;
        vm.saveIvEmailSubject = saveIvEmailSubject;
        // tax settings
        vm.saveServiceTaxSettings = saveServiceTaxSettings;
        vm.saveVatSettings = saveVatSettings;
        //  function maps [END]

        //  default execution steps [BEGIN]
        switch ($state.params.openTab) {
            case 'invoice':
                vm.invoiceTab = true;
                break;
            default:
                break;
        }
        //  general settings
        checkLogin();
        //  invoice settings
        getWorkshopDetails();
        getInvoiceSettings();
        loadInvoiceWLogo();
        //  service tax settings
        getServiceTaxSettings();
        getVatSettings();
        // changeInvoiceTab(true)  //  testing purposes amTODO: remove it
        //  default execution steps [END]

        //  function definitions
        
        //  default tab settings
        function changeInvoiceTab(bool) {
            vm.invoiceTab = bool;
        }
        
        function OnBlurLastInvoiceNumber(ar, arg) {
            if (vm.ivSettings.lastInvoiceNumber == '' || vm.ivSettings.lastInvoiceNumber == null || vm.ivSettings.lastInvoiceNumber == undefined)
                vm.ivSettings.lastInvoiceNumber = 0;
            if (vm.ivSettings.lastInvoiceNumber == olino)
                return;
            resetLastInvoiceNo(vm.ivSettings.lastInvoiceNumber);
        }
       
        //  listen to changes in input fields [BEGIN]
        //  general settings
        function changeUsernameLabel(force) {
            vm.isUsername = (force != undefined || vm.user.username != '');
            vm.label_username = vm.isUsername ? 'Username:' : 'Enter Username:';
        }
        function changePasswordLabel(force) {
            vm.isPassword = (force != undefined || vm.user.password != '');
            vm.label_password = vm.isPassword ? 'Password:' : 'Enter Password:';
        }
        //  invoice settings
        function changeWorkshopNameLabel(force) {
            vm.isWorkshopName = (force != undefined || vm.workshop.name != '');
            vm.label_workshopName = vm.isWorkshopName ? 'Workshop Name:' : 'Enter Workshop Name:';
        }
        function changeWorkshopPhoneLabel(force) {
            vm.isWorkshopPhone = (force != undefined || vm.workshop.phone != '');
            vm.label_workshopPhone = vm.isWorkshopPhone ? 'Phone Number:' : 'Enter Phone Number:';
        }
        function changeWorkshopAddress1Label(force) {
            vm.isWorkshopAddress1 = (force != undefined || vm.workshop.address1 != '');
            vm.label_workshopAddress1 = vm.isWorkshopAddress1 ? 'Address Line 1:' : 'Enter Address Line 1:';
        }
        function changeWorkshopAddress2Label(force) {
            vm.isWorkshopAddress2 = (force != undefined || vm.workshop.address2 != '');
            vm.label_workshopAddress2 = vm.isWorkshopAddress2 ? 'Address Line 2:' : 'Enter Address Line 2:';
        }
        function changeWorkshopCityLabel(force) {
            vm.isWorkshopCity = (force != undefined || vm.workshop.city != '');
            vm.label_workshopCity = vm.isWorkshopCity ? 'City:' : 'Enter City:';
        }
        //  listen to changes in input fields [END]

        //  migrate click events from one element to another [BEGIN]
        //  general settings
        function uploadCSV() {
            angular.element(document.querySelector('#csv-file-select')).click();
        }
        function uploadCover() {
            angular.element(document.querySelector('#am-upload-cover-pic')).click();
        }
        //  invoice settings
        function uploadInvoiceWLogo() {
            angular.element(document.querySelector('#am-upload-invoice-w-logo')).click();
        }
        //  migrate click events from one element to another [END]

        //  functions defined for general settings
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
            vm.currentCsvProgress = 0;
            var files = e.target.files || e.originalEvent.dataTransfer.files;
            console.log(files);
            amImportdata.compileCSVFile(files).then(displayToastMessage).catch(displayToastMessage).finally(cleanUp, updates);

            function displayToastMessage(res) {
                utils.showSimpleToast(res.message);
                vm.currentCsvProgress = 100;
                vm.isCsvProcessed = (vm.currentCsvProgress < 100);
            }

            function cleanUp(res) {
                amImportdata.cleanUp();
            }

            function updates(res) {
                vm.currentCsvProgress = (res.total == 0) ? 0 : ((res.current * 100) / res.total);
                vm.isCsvProcessed = (vm.currentCsvProgress < 100);
            }
        }

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
        
        //  functions defined for invoice settings
        //  get workshop details from database
        function getWorkshopDetails() {
            amIvSettings.getWorkshopDetails().then(getWorkshopObject).catch(failure);
            
            function getWorkshopObject(res) {
                vm.workshop = res;
                changeWorkshopNameLabel();
                changeWorkshopPhoneLabel();
                changeWorkshopAddress1Label();
                changeWorkshopAddress2Label();
                changeWorkshopCityLabel();
            }
            
            function failure(err) {
                $log.info('No workshop details found!');
            }
        }
        
        //  save workshop details to database
        function saveWorkshopDetails() {
            amIvSettings.saveWorkshopDetails(vm.workshop).then(success).catch(failure);
            
            function success(res) {
                utils.showSimpleToast('Workshop details updated successfully!');
            }
            
            function failure(err) {
                utils.showSimpleToast('Failied to update workshop details! Please Try Again!');
            }
        }
        
        //  get invoice settings
        function getInvoiceSettings() {
            amIvSettings.getInvoiceSettings().then(success).catch(failure);
            
            function success(res) {
                vm.ivSettings = res;
                olino = res.lastInvoiceNumber;
                ivEmailSubject = res.emailsubject;
            }
            
            function failure(err) {
                $log.info('Cannot find invoice settings!');
            }
        }
        
        //  change workshop logo in invoice settings
        function changeInvoiceWLogo(e) {
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
                $('#am-invoice-w-logo').attr('src', e.target.result).width(250).height(125);
                var coverPicElem = document.getElementById('am-invoice-w-logo');
                var ic = document.createElement('canvas'),
                    icontext = ic.getContext('2d');
                ic.width = coverPicElem.width;
                ic.height = coverPicElem.height;
                icontext.drawImage(coverPicElem, 0, 0, coverPicElem.width, coverPicElem.height);
                localStorage.setItem('invoice-w-pic', ic.toDataURL(files[0].type));
                loadInvoiceWLogo();
            }
        }
        
        //  load workshop logo in invoice settings
        function loadInvoiceWLogo() {
            var source = localStorage.getItem('invoice-w-pic');
            vm.invoiceWLogo = source;
        }
        
        //  reset invoice number sequence
        function resetLastInvoiceNo(invoiceno, reset) {
            amIvSettings.changeLastInvoiceNo((invoiceno == undefined) ? 0 : invoiceno).then(respond).catch(respond);
            
            function respond(res) {
                getInvoiceSettings();
                if (reset != true)
                    utils.showActionToast('Invoice number has been ' + ((invoiceno == undefined) ? 'reset' : 'changed'), 'Undo', resetLastInvoiceNo, olino, true);
            }
        }
        
        //  change display settings
        function saveIvDisplaySettings() {
            amIvSettings.saveIvDisplaySettings(vm.ivSettings.display).then(success).catch(failure);
            
            function success(res) {
                utils.showSimpleToast('Settings saved successfully!');
            }
            function failure(err) {
                utils.showSimpleToast('Could not save settings at moment. Please try again!');
            }
        }
        
        function getServiceTaxSettings() {
            amSeTaxSettings.getServiceTaxSettings().then(success).catch(failure);
            
            function success(res) {
                vm.sTaxSettings = res;
            }
            
            function failure(err) {
                vm.sTaxSettings = {};
            }
        }
        
        function saveServiceTaxSettings() {
            amSeTaxSettings.saveServiceTaxSettings(vm.sTaxSettings).then(success).catch(failure);
            
            function success(res) {
                if (res.ok)
                    utils.showSimpleToast('Service Tax Settings Saved Successfully!');
                else
                    failure();
            }
            
            function failure(err) {
                utils.showSimpleToast('Failed to save Service Tax Settings. Please Try Again!');
            }
        }

        function getVatSettings() {
            amSeTaxSettings.getVatSettings().then(success).catch(failure);

            function success(res) {
                vm.vatSettings = res;
            }

            function failure(err) {
                vm.vatSettings = {};
            }
        }

        function saveVatSettings() {
            amSeTaxSettings.saveVatSettings(vm.vatSettings).then(success).catch(failure);

            function success(res) {
                if (res.ok)
                    utils.showSimpleToast('VAT Settings Saved Successfully!');
                else
                    failure();
            }
            
            function failure(err) {
                utils.showSimpleToast('Failed to save VAT Settings. Please Try Again!');
            }
        }
        
        function saveIvEmailSubject(es, reset) {
            if (vm.ivSettings.emailsubject == undefined)
                return;
            
            amIvSettings.saveIvEmailSubject((es == undefined) ? vm.ivSettings.emailsubject : es).then(respond).catch(respond);
            
            function respond(res) {
                getInvoiceSettings();
                if (ivEmailSubject != undefined) {
                    if (reset != true)
                        utils.showActionToast('Email Subject has been changed!', 'Undo', saveIvEmailSubject, ivEmailSubject, true);
                } else
                    utils.showSimpleToast('Email Subject has been changed!')
            }
        }
    }
})();