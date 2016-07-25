/**
 * Controller for Settings component
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    const ipcRenderer = require('electron').ipcRenderer;
    const electron = require('electron').remote;
    const fse = require('fs-extra');
    const amApp = electron.app;
    const dialog = electron.dialog;
    const ammPreferences = require('./automint_modules/am-preferences.js');

    angular.module('automintApp').controller('amCtrlSettings', SettingsController);

    SettingsController.$inject = ['$rootScope', '$scope', '$state', '$log', 'utils', 'amBackup', 'amLogin', 'amImportdata', 'amIvSettings', 'amSeTaxSettings', 'amSettings'];

    function SettingsController($rootScope, $scope, $state, $log, utils, amBackup, amLogin, amImportdata, amIvSettings, amSeTaxSettings, amSettings) {
        //  initialize view model
        var vm = this;
        
        //  temporary named assignments
        var olino = 0, 
            oljbno = 0, 
            oleno = 0, 
            oPasscode = '1234', 
            oPasscodeEnabled, 
            oIvAlignTop = '', 
            oIvAlignBottom = '',
            ivEmailSubject, oIvFacebookLink, oIvInstagramLink, oIvTwitterLink, oIvWorkshopName, oIvWorkshopPhone, oIvWorkshopAddress1, oIvWorkshopAddress2, oIvWorkshopCity, oDefaultServiceType;

        //  named assignments to keep track of UI [BEGIN]
        //  general settings
        vm.user = {
            username: '',
            password: ''
        };
        vm.label_username = 'Enter Username:';
        vm.label_password = 'Enter Password:';
        vm.serviceStateList = ['Job Card', 'Estimate', 'Bill'];
        vm.serviceState = vm.serviceStateList[2];
        vm.amAppPath = 'Default';
        //  invoice settings
        vm.workshop = {
            name: '',
            phone: '',
            address1: '',
            address2: '',
            city: '',
            social: {
                facebook: '',
                instagram: '',
                twitter: ''
            }
        };
        vm.label_workshopName = 'Enter Workshop Name:';
        vm.label_workshopPhone = 'Enter Phone Number:';
        vm.label_workshopAddress1 = 'Enter Address Line 1:';
        vm.label_workshopAddress2 = 'Enter Address Line 2:';
        vm.label_workshopCity = 'Enter City:';
        vm.passcode = '1234';
        vm.ivAlign = {
            top: '',
            bottom: ''
        };
        vm.label_ivAlignTopAlignment = 'Enter Top Margin:';
        vm.label_ivAlignBottomAlignment = 'Enter Bottom Margin:';
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
        vm.handlePasscodeVisibility = handlePasscodeVisibility;
        vm.saveDefaultServiceType = saveDefaultServiceType;
        vm.setAmAppDataPath = setAmAppDataPath;
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
        vm.saveFacebookLink = saveFacebookLink;
        vm.saveInstagramLink = saveInstagramLink;
        vm.saveTwitterLink = saveTwitterLink;
        vm.saveServiceTaxSettings = saveServiceTaxSettings;
        vm.saveVatSettings = saveVatSettings;
        vm.savePasscode = savePasscode;
        vm.changeTopAlignLabel = changeTopAlignLabel;
        vm.changeBottomAlignLabel = changeBottomAlignLabel;
        vm.saveIvAlignMargins = saveIvAlignMargins;
        vm.saveWorkshopName = saveWorkshopName;
        vm.saveWorkshopPhone = saveWorkshopPhone;
        vm.saveWorkshopAddress1 = saveWorkshopAddress1;
        vm.saveWorkshopAddress2 = saveWorkshopAddress2;
        vm.saveWorkshopCity = saveWorkshopCity;
        vm.resetLastEstimateNo = resetLastEstimateNo;
        vm.OnBlurLastEstimateNo = OnBlurLastEstimateNo;
        vm.resetLastJobCardNo = resetLastJobCardNo;
        vm.OnBlurLastJobCardNo = OnBlurLastJobCardNo;
        vm.autoCapitalizeCity = autoCapitalizeCity;
        vm.autoCapitalizeAddressLine1 = autoCapitalizeAddressLine1;
        vm.autoCapitalizeAddressLine2 = autoCapitalizeAddressLine2;
        vm.autoCapitalizeWorkshopName = autoCapitalizeWorkshopName;
        vm.autoCapitalizeEmailSubject = autoCapitalizeEmailSubject;
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
        getPasscode();
        getDefaultServiceType();
        getAmAppDataPath();
        //  invoice settings
        getWorkshopDetails();
        getInvoiceSettings();
        loadInvoiceWLogo();
        getIvAlignMargins();
        //  service tax settings
        getServiceTaxSettings();
        getVatSettings();
        // changeInvoiceTab(true)  //  testing purposes amTODO: remove it
        //  default execution steps [END]

        //  function definitions

        function setAmAppDataPath() {
            var newPath = dialog.showOpenDialog({properties: ['openDirectory']});
            if (newPath) {
                ammPreferences.storePreference('automint.userDataPath', newPath[0]);
                fse.copy(amApp.getPath('userData'), newPath[0], {
                    clobber: true
                }, success);
            }
            
            function success(res) {
                if (res)
                    console.error(res);
                fse.remove(amApp.getPath('userData'), removeSuccess);
            }

            function removeSuccess(err) {
                if (err)
                    console.error(err);
                ipcRenderer.send('am-do-restart', true);
            }
            // /Users/ndkcha/Library/Application Support/Automint
        }

        function getAmAppDataPath() {
            vm.amAppPath = amApp.getPath('userData');
        }

        function getDefaultServiceType() {
            amSettings.getDefaultServiceType().then(success).catch(failure);

            function success(res) {
                vm.serviceState = res;
                oDefaultServiceType = res;
            }

            function failure(err) {
                vm.serviceState = vm.serviceStateList[2];
                oDefaultServiceType = vm.serviceStateList[2];
            }
        }

        function saveDefaultServiceType() {
            if (oDefaultServiceType == vm.serviceState)
                return;
            amSettings.saveDefaultServiceType(vm.serviceState).then(success).catch(failure);

            function success(res) {
                if (res.ok) {
                    oDefaultServiceType = vm.serviceState;
                    utils.showSimpleToast('Default Service Type Changed Successfully!');
                } else
                    failure();
            }

            function failure(err) {
                utils.showSimpleToast('Could not set default service type at moment');
                vm.serviceState = oDefaultServiceType;
            }
        }

        function autoCapitalizeEmailSubject() {
            vm.ivSettings.emailsubject = utils.autoCapitalizeWord(vm.ivSettings.emailsubject);
        }

        function autoCapitalizeCity() {
            vm.workshop.city = utils.autoCapitalizeWord(vm.workshop.city);
        }

        function autoCapitalizeAddressLine2() {
            vm.workshop.address2 = utils.autoCapitalizeWord(vm.workshop.address2);
        }

        function autoCapitalizeAddressLine1() {
            vm.workshop.address1 = utils.autoCapitalizeWord(vm.workshop.address1);
        }

        function autoCapitalizeWorkshopName() {
            vm.workshop.name = utils.autoCapitalizeWord(vm.workshop.name);
        }

        function OnBlurLastJobCardNo() {
            if (vm.ivSettings.lastJobCardNo == '' || vm.ivSettings.lastJobCardNo == null || vm.ivSettings.lastJobCardNo == undefined)
                vm.ivSettings.lastJobCardNo = 0;
            if (vm.ivSettings.lastJobCardNo == oljbno)
                return;
            resetLastJobCardNo(vm.ivSettings.lastJobCardNo);
        }

        function resetLastJobCardNo(jobcardno, reset) {
            amIvSettings.changeLastJobCardNo((jobcardno == undefined) ? 0 : jobcardno).then(respond).catch(respond);

            function respond(res) {
                getInvoiceSettings();
                if (reset != true)
                    utils.showActionToast('Job Card Number has been ' + ((jobcardno == undefined) ? 'reset' : 'changed'), 'Undo', resetLastJobCardNo, oljbno, true);
            }
        }

        function OnBlurLastEstimateNo() {
            if (vm.ivSettings.lastEstimateNo == '' || vm.ivSettings.lastEstimateNo == null || vm.ivSettings.lastEstimateNo == undefined)
                vm.ivSettings.lastEstimateNo = 0;
            if (vm.ivSettings.lastEstimateNo == oleno)
                return;
            resetLastEstimateNo(vm.ivSettings.lastEstimateNo);
        }

        function resetLastEstimateNo(estimateno, reset) {
            amIvSettings.changeLastEstimateNo((estimateno == undefined) ? 0 : estimateno).then(respond).catch(respond);
            
            function respond(res) {
                getInvoiceSettings();
                if (reset != true)
                    utils.showActionToast('Estimate number has been ' + ((estimateno == undefined) ? 'reset' : 'changed'), 'Undo', resetLastEstimateNo, oleno, true);
            }
        }

        function handlePasscodeVisibility(visible) {
            document.getElementById('am-passcode').type = (visible) ? 'text' : 'password';
        }

        function getIvAlignMargins() {
            amIvSettings.getIvAlignMargins().then(success).catch(failure);

            function success(res) {
                vm.ivAlign = res;
                changeTopAlignLabel();
                changeBottomAlignLabel();
                oIvAlignTop = res.top;
                oIvAlignBottom = res.bottom;
            }

            function failure(err) {
                vm.ivAlign = {
                    top: '',
                    bottom: ''
                };
                oIvAlignTop = '';
                oIvAlignBottom = '';
            }
        }

        function saveIvAlignMargins(force) {
            if (vm.ivAlign.top == oIvAlignTop && vm.ivAlign.bottom == oIvAlignBottom && !force)
                return;
            amIvSettings.saveIvAlignMargins(vm.ivAlign).then(success).catch(failure);

            function success(res) {
                oIvAlignTop = vm.ivAlign.top;
                oIvAlignBottom = vm.ivAlign.bottom;
                utils.showSimpleToast('Settings saved successfully!');
            }

            function failure(err) {
                console.warn(err);
                utils.showSimpleToast('Could not save margin! Please Try Again!');
            }
        }

        function changeTopAlignLabel(force) {
            if (vm.ivAlign.top == null)
                vm.ivAlign.top = '';
            vm.isTopAlignment = (force != undefined || vm.ivAlign.top != '');
            vm.label_ivAlignTopAlignment = vm.isTopAlignment ? 'Top:' : 'Enter Top Margin:';
        }

        function changeBottomAlignLabel(force) {
            if (vm.ivAlign.bottom == null)
                vm.ivAlign.bottom = '';
            vm.isBottomAlignment = (force != undefined || vm.ivAlign.bottom != '');
            vm.label_ivAlignBottomAlignment = vm.isBottomAlignment ? 'Bottom:' : 'Enter Bottom Margin:';
        }

        function getPasscode() {
            amLogin.getPasscode().then(success).catch(failure);

            function success(res) {
                if (!res) {
                    failure();
                    return;
                }
                vm.passcode = res.code;
                vm.isPasscodeEnabled = res.enabled;
                oPasscode = res.code;
                oPasscodeEnabled = res.enabled;
            }

            function failure(err) {
                vm.passcode = '1234';
                oPasscode = '1234';
                vm.isPasscodeEnabled = false;
                oPasscodeEnabled = false;
            }
        }

        function savePasscode() {
            if (vm.passcode == '' || vm.passcode == undefined) {
                utils.showSimpleToast('Passcode cannot be blank');
                vm.passcode = oPasscode;
                return;
            }
            if (vm.passcode == oPasscode && vm.isPasscodeEnabled == oPasscodeEnabled)
                return;
            amLogin.savePasscode(vm.passcode, vm.isPasscodeEnabled).then(success).catch(failure);

            function success(res) {
                if (res.ok) {
                    oPasscode = vm.passcode;
                    oPasscodeEnabled = vm.isPasscodeEnabled;
                    $rootScope.isPasscodeEnabled = vm.isPasscodeEnabled;
                    utils.showSimpleToast('Passcode saved successfully');
                } else
                    failure();
            }

            function failure(err) {
                utils.showSimpleToast('Failued to save Passcode');
            }
        }

        function saveFacebookLink() {
            if (oIvFacebookLink == vm.workshop.social.facebook)
                return;
            saveWorkshopDetails();
        }

        function saveTwitterLink() {
            if (oIvTwitterLink == vm.workshop.social.twitter)
                return;
            saveWorkshopDetails();
        }

        function saveInstagramLink() {
            if (oIvInstagramLink == vm.workshop.social.instagram)
                return;
            saveWorkshopDetails();
        }
        
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
                oIvWorkshopName = res.name;
                oIvWorkshopPhone = res.phone;
                oIvWorkshopAddress1 = res.address1;
                oIvWorkshopAddress2 = res.address2;
                oIvWorkshopCity = res.city;
                oIvFacebookLink = res.social.facebook;
                oIvTwitterLink = res.social.twitter;
                oIvInstagramLink = res.social.instagram;
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

        function saveWorkshopName() {
            if (oIvWorkshopName == vm.workshop.name)
                return;
            saveWorkshopDetails();
        }

        function saveWorkshopPhone() {
            if (oIvWorkshopPhone == vm.workshop.phone)
                return;
            saveWorkshopDetails();
        }

        function saveWorkshopAddress1() {
            if (oIvWorkshopAddress1 == vm.workshop.address1)
                return;
            saveWorkshopDetails();
        }

        function saveWorkshopAddress2() {
            if (oIvWorkshopAddress2 == vm.workshop.address2)
                return;
            saveWorkshopDetails();
        }

        function saveWorkshopCity() {
            if (oIvWorkshopCity == vm.workshop.city)
                return;
            saveWorkshopDetails();
        }
        
        //  save workshop details to database
        function saveWorkshopDetails() {
            amIvSettings.saveWorkshopDetails(vm.workshop).then(success).catch(failure);
            
            function success(res) {
                oIvWorkshopName = vm.workshop.name;
                oIvWorkshopPhone = vm.workshop.phone;
                oIvWorkshopAddress1 = vm.workshop.address1;
                oIvWorkshopAddress2 = vm.workshop.address2;
                oIvWorkshopCity = vm.workshop.city;
                oIvFacebookLink = vm.workshop.social.facebook;
                oIvTwitterLink = vm.workshop.social.twitter;
                oIvInstagramLink = vm.workshop.social.instagram;
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
                if (!vm.ivSettings.lastJobCardNo)
                    vm.ivSettings.lastJobCardNo = 0;
                if (!vm.ivSettings.lastEstimateNo)
                    vm.ivSettings.lastEstimateNo = 0;
                if (!vm.ivSettings.lastInvoiceNumber)
                    vm.ivSettings.lastInvoiceNumber = 0;
                
                olino = res.lastInvoiceNumber;
                oljbno = res.lastJobCardNo;
                oleno = res.lastEstimateNo;
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
            if (vm.ivSettings.emailsubject == undefined || ((ivEmailSubject == vm.ivSettings.emailsubject) && !es))
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