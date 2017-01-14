/**
 * Controller for Automint Settings Module
 * @author ndkcha
 * @since 0.4.1
 * @version 0.8.0
 */

/// <reference path="../../../typings/main.d.ts" />

(function() {
    //  import server side modules
    const fs = require('fs-extra');
    const ipcRenderer = require('electron').ipcRenderer;
    const electron = require('electron').remote;
    const BrowserWindow = require('electron').remote.BrowserWindow;
    const fse = require('fs-extra');
    const amApp = electron.app;
    const dialog = electron.dialog;
    const ammPreferences = require('./automint_modules/am-preferences.js');

    var TOKEN_DIR = process.resourcesPath + "/app.asar.unpacked/";
    // var TOKEN_DIR = __dirname + "/../../../app.asar.unpacked/";
    var TOKEN_PATH = TOKEN_DIR + 'google-cred.json';

    //  now let client breath
    angular.module('automintApp').controller('amCtrlSettings', SettingsController);

    // define dependencies of controller
    SettingsController.$inject = ['$rootScope', '$scope', '$state', '$mdDialog', '$amRoot', 'utils', 'amBackup', 'amImportdata', 'amSettings'];

    //  have fun coding the controller
    function SettingsController($rootScope, $scope, $state, $mdDialog, $amRoot, utils, amBackup, amImportdata, amSettings) {
        //  initialize view model
        var vm = this;

        //  temporary named assignments for this instance
        var olino = 0,
            oljbno = 0,
            oleno = 0;
        var oPasscode = '1234',
            oPasscodeEnabled;
        var oIvAlignTop = '',
            oIvAlignBottom = '';
        var ivEmailSubject, oIvFacebookLink, oIvInstagramLink, oIvTwitterLink, oIvWorkshopName, oIvWorkshopPhone, oIvWorkshopAddress1, oIvWorkshopAddress2, oIvWorkshopCity, oDefaultServiceType;
        var currentTaxFocusIndex = -1;
        var csMessage,
            isAutomintLoggedIn;
        
        //  named assignments to view model
        vm.user = {
            username: '',
            password: ''
        };
        vm.label_username = 'Enter Username:';
        vm.label_password = 'Enter Password:';
        vm.serviceStateList = ['Job Card', 'Estimate', 'Bill'];
        vm.serviceState = vm.serviceStateList[2];
        vm.amAppPath = amApp.getPath('userData');
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
        vm.taxSettings = [];
        vm.currencySymbol = "Rs.";
        vm.invoicePageSizeList = ['Single Page', 'A4'];
        vm.invoicePageSize = vm.invoicePageSizeList[1];
        vm.invoiceNotes = {
            note: '',
            enabled: false
        }

        //  function maps to view model
        vm.changeInvoiceTab = changeInvoiceTab;
        vm.changeUsernameLabel = changeUsernameLabel;
        vm.changePasswordLabel = changePasswordLabel;
        vm.doBackup = doBackup;
        vm.uploadCSV = uploadCSV;
        vm.uploadCover = uploadCover;
        vm.handleUploadedFile = handleUploadedFile;
        vm.handleUploadedCoverPic = handleUploadedCoverPic;
        vm.handlePasscodeVisibility = handlePasscodeVisibility;
        vm.saveDefaultServiceType = saveDefaultServiceType;
        vm.setAmAppDataPath = setAmAppDataPath;
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
        vm.addNewTax = addNewTax;
        vm.deleteTax = deleteTax;
        vm.saveTax = saveTax;
        vm.autoCapitalizeName = autoCapitalizeName;
        vm.IsTaxFocused = IsTaxFocused;
        vm.saveCurrencySymbol = saveCurrencySymbol;
        vm.saveInvoicePageSize = saveInvoicePageSize;
        vm.changeInvoiceFLogo = changeInvoiceFLogo;
        vm.uploadInvoiceFLogo = uploadInvoiceFLogo;
        vm.clearEmailSignInDetails = clearEmailSignInDetails;
        vm.saveInvoiceNotes = saveInvoiceNotes;
        $rootScope.loadSettingsBlock = loadBlock;

        //  default execution steps
        switch ($state.params.openTab) {
            case 'invoice':
                vm.invoiceTab = true;
                break;
            default:
                break;
        }
        $rootScope.isCUSection = false;
        loadBlock();

        //  function definitions

        function loadBlock() {
            amSettings.fetchSettings().then(processSettingsObject).catch(failure);
            amSettings.fetchWorkshopDetails().then(processWorkshopObject).catch(failure);
            loadInvoiceFLogo();
            loadInvoiceWLogo();
        }

        function saveInvoiceNotes() {
            amSettings.saveInvoiceNotes(vm.invoiceNotes).then(success).catch(failure);

            function success(res) {
                if (res.ok)
                    utils.showSimpleToast('Notes settings saved successfully');
                else
                    failure();
            }

            function failure(err) {
                utils.showSimpleToast('Could not save notes settings! Please Try Again Later!');
            }
        }

        function clearEmailSignInDetails() {
            fs.remove(TOKEN_PATH, deletedCredFile);

            function deletedCredFile(err) {
                if (err) {
                    console.error(err);
                    utils.showSimpleToast('Could not clear Sign In details');
                    return;
                }
                BrowserWindow.getFocusedWindow().webContents.session.clearStorageData({
                    storages: ['cookies']
                }, done);
            }

            function done() {
                utils.showSimpleToast('Sign In data has been cleared');
            }
        }

        function uploadInvoiceFLogo() {
            angular.element(document.querySelector('#am-upload-invoice-f-logo')).click();
        }

        function changeInvoiceFLogo(e) {
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
                $('#am-invoice-f-logo').attr('src', e.target.result);
                var footerPic = document.getElementById('am-invoice-f-logo');
                var ic = document.createElement('canvas'),
                    icontext = ic.getContext('2d');
                ic.width = footerPic.width;
                ic.height = footerPic.height;
                icontext.drawImage(footerPic, 0, 0, footerPic.width, footerPic.height);
                localStorage.setItem('invoice-f-pic', ic.toDataURL(files[0].type));
                loadInvoiceFLogo();
            }
        }

        //  load workshop logo in invoice settings
        function loadInvoiceFLogo() {
            var source = localStorage.getItem('invoice-f-pic');
            vm.invoiceFLogo = source;
        }

        function saveInvoicePageSize() {
            amSettings.saveInvoicePageSize(vm.invoicePageSize).then(success).catch(failure);

            function success(res) {
                if (res.ok)
                    utils.showSimpleToast('Invoice settings saved successfully');
                else
                    failure();
            }

            function failure(err) {
                utils.showSimpleToast('Could not save invoice settings! Please try again!');
            }
        }

        function saveCurrencySymbol() {
            if ((vm.currencySymbol == '') || (vm.currencySymbol == undefined))
                vm.currencySymbol = "Rs.";
            amSettings.saveCurrencySymbol(vm.currencySymbol).then(success).catch(failure);

            function success(res) {
                if (res.ok)
                    utils.showSimpleToast('Currency saved successfully!');
                else
                    failure();
            }

            function failure(err) {
                utils.showSimpleToast('Could not save Currency at moment! Try Again Later!');
            }
        }

        function IsTaxFocused(index) {
            return (currentTaxFocusIndex == index);
        }

        function autoCapitalizeName(tax) {
            tax.name = utils.autoCapitalizeWord(tax.name);
        }

        function saveTax(tax) {
            if ((tax.name == '') || (tax.name == undefined)) {
                utils.showSimpleToast('Please enter name of tax in order to save it!');
                return;
            }
            amSettings.saveTaxSettings(tax).then(success).catch(failure);

            function success(res) {
                if (res.ok)
                    utils.showSimpleToast(tax.name + ' settings saved successfully!');
                else
                    failure();
            }

            function failure(err) {
                utils.showSimpleToast('Could not save ' + tax.name + ' settings. Try Again Later!');
            }
        }

        function deleteTax(tax) {
            if (tax.name == '') {
                var index = vm.taxSettings.indexOf(tax);
                vm.taxSettings.splice(index, 1);
                return;
            }
            amSettings.deleteTaxSettings(tax).then(success).catch(failure);

            function success(res) {
                if (res.ok) {
                    utils.showSimpleToast(tax.name + ' deleted successfully!');
                    amSettings.getAllTaxSettings().then(processTaxSettingsObject).catch(failure);
                } else
                    failure();
            }

            function failure(err) {
                utils.showSimpleToast('Could not delete ' + tax.name + ' settings. Try Again Later!');
            }
        }

        function addNewTax() {
            vm.taxSettings.push({
                name: '',
                isTaxApplied: false,
                inclusive: false,
                percent: 0,
                isForTreatments: false,
                isForInventory: false
            });
            currentTaxFocusIndex = vm.taxSettings.length - 1;
        }

        function changeTaxTab(bool) {
            vm.taxTab = bool;
        }

        function setAmAppDataPath(move) {
            var newPath = dialog.showOpenDialog({
                properties: ['openDirectory']
            });
            if (newPath) {
                $rootScope.busyApp.show = true;
                $rootScope.busyApp.message = 'Restarting App. Please Wait..';
                ammPreferences.storePreference('automint.userDataPath', newPath[0]);
                if (move) {
                    fse.copy(amApp.getPath('userData'), newPath[0], {
                        clobber: true
                    }, success);
                } else
                    removeSuccess();
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
            amSettings.changeLastJobCardNo((jobcardno == undefined) ? 0 : jobcardno).then(respond).catch(respond);

            function respond(res) {
                amSettings.getInvoiceSettings().then(processInvoiceSettingsObject).catch(failure);
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
            amSettings.changeLastEstimateNo((estimateno == undefined) ? 0 : estimateno).then(respond).catch(respond);

            function respond(res) {
                amSettings.getInvoiceSettings().then(processInvoiceSettingsObject).catch(failure);
                if (reset != true)
                    utils.showActionToast('Estimate number has been ' + ((estimateno == undefined) ? 'reset' : 'changed'), 'Undo', resetLastEstimateNo, oleno, true);
            }
        }

        function handlePasscodeVisibility(visible) {
            document.getElementById('am-passcode').type = (visible) ? 'text' : 'password';
        }

        function saveIvAlignMargins(force) {
            if (vm.ivAlign.top == oIvAlignTop && vm.ivAlign.bottom == oIvAlignBottom && !force)
                return;
            amSettings.saveIvAlignMargins(vm.ivAlign).then(success).catch(failure);

            function success(res) {
                oIvAlignTop = vm.ivAlign.top;
                oIvAlignBottom = vm.ivAlign.bottom;
                utils.showSimpleToast('Settings saved successfully!');
            }

            function failure(err) {
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

        function savePasscode() {
            if (vm.passcode == '' || vm.passcode == undefined) {
                utils.showSimpleToast('Passcode cannot be blank');
                vm.passcode = oPasscode;
                return;
            }
            if (vm.passcode == oPasscode && vm.isPasscodeEnabled == oPasscodeEnabled)
                return;
            amSettings.savePasscode(vm.passcode, vm.isPasscodeEnabled).then(success).catch(failure);

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
            vm.isCsvProcessed = true;
            var files = e.target.files || e.originalEvent.dataTransfer.files;
            amImportdata.checkTypeofFile(files).then(displayToastMessage).catch(displayToastMessage).finally(cleanUp);

            function displayToastMessage(res) {
                utils.showSimpleToast(res.message);
                vm.isCsvProcessed = false;
            }

            function cleanUp(res) {
                amImportdata.cleanUp();
                loadBlock();
            }
        }

        //  backup the database
        function doBackup() {
            amBackup.doBackup().then(respond).catch(respond);

            function respond(res) {
                amBackup.clearReferences();
                console.info(res);
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
            amSettings.saveWorkshopDetails(vm.workshop).then(success).catch(failure);

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
            amSettings.changeLastInvoiceNo((invoiceno == undefined) ? 0 : invoiceno).then(respond).catch(respond);

            function respond(res) {
                amSettings.getInvoiceSettings().then(processInvoiceSettingsObject).catch(failure);
                if (reset != true)
                    utils.showActionToast('Invoice number has been ' + ((invoiceno == undefined) ? 'reset' : 'changed'), 'Undo', resetLastInvoiceNo, olino, true);
            }
        }

        function saveIvDisplaySettings() {
            amSettings.saveIvDisplaySettings(vm.ivSettings.display).then(success).catch(failure);

            function success(res) {
                utils.showSimpleToast('Settings saved successfully!');
            }

            function failure(err) {
                utils.showSimpleToast('Could not save settings at moment. Please try again!');
            }
        }

        function saveIvEmailSubject(es, reset) {
            if (vm.ivSettings.emailsubject == undefined || ((ivEmailSubject == vm.ivSettings.emailsubject) && !es))
                return;
            amSettings.saveIvEmailSubject((es == undefined) ? vm.ivSettings.emailsubject : es).then(respond).catch(respond);

            function respond(res) {
                amSettings.getInvoiceSettings().then(processInvoiceSettingsObject).catch(failure);
                if (ivEmailSubject != undefined) {
                    if (reset != true)
                        utils.showActionToast('Email Subject has been changed!', 'Undo', saveIvEmailSubject, ivEmailSubject, true);
                } else
                    utils.showSimpleToast('Email Subject has been changed!')
            }
        }

        function processTaxSettingsObject(res) {
            if (angular.isArray(res))
                vm.taxSettings = res;
            else
                failure('No Taxes Found!');
        }

        function processInvoiceSettingsObject(res) {
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

        function processSettingsObject(res) {
            //  currency settings
            vm.currencySymbol = (res.currency != undefined) ? res.currency : $rootScope.currencySymbol;
            //  invoice settings
            if (res.settings && res.settings.invoices) {
                //  general invoice settings
                vm.ivSettings = res.settings.invoices;
                if (!vm.ivSettings.lastJobCardNo)
                    vm.ivSettings.lastJobCardNo = 0;
                if (!vm.ivSettings.lastEstimateNo)
                    vm.ivSettings.lastEstimateNo = 0;
                if (!vm.ivSettings.lastInvoiceNumber)
                    vm.ivSettings.lastInvoiceNumber = 0;

                olino = res.settings.invoices.lastInvoiceNumber;
                oljbno = res.settings.invoices.lastJobCardNo;
                oleno = res.settings.invoices.lastEstimateNo;
                ivEmailSubject = res.settings.invoices.emailsubject;
                //  page size settings
                vm.invoicePageSize = (res.settings.invoices.pageSize != undefined) ? res.settings.invoices.pageSize : vm.invoicePageSizeList[0];
                //  invoice margins
                if (res.settings.invoices.margin) {
                    vm.ivAlign = res.settings.invoices.margin;
                    changeTopAlignLabel();
                    changeBottomAlignLabel();
                    oIvAlignTop = res.settings.invoices.margin.top;
                    oIvAlignBottom = res.settings.invoices.margin.bottom;
                }
                //  notes settings
                if (res.settings.invoices.notes != undefined)
                    vm.invoiceNotes = res.settings.invoices.notes; 
            }
            //  tax settings
            if (res.settings && res.settings.tax) {
                vm.taxSettings = [];
                Object.keys(res.settings.tax).forEach(iterateTax);

                function iterateTax(tax) {
                    var t = res.settings.tax[tax];
                    vm.taxSettings.push({
                        inclusive: (t.type == "inclusive"),
                        isTaxApplied: t.isTaxApplied,
                        isForTreatments: t.isForTreatments,
                        isForInventory: t.isForInventory,
                        percent: t.percent,
                        name: tax
                    });
                }
            }
            //  service types
            if (res.settings && res.settings.servicestate) {
                vm.serviceState = (res.settings.servicestate != undefined) ? res.settings.servicestate : vm.serviceStateList[2];
                oDefaultServiceType = (res.settings.servicestate != undefined) ? res.settings.servicestate : vm.serviceStateList[2];
            }
            //  passcode settings
            if (res.passcode) {
                vm.passcode = (res.passcode.code != undefined) ? res.passcode.code : '1234';
                vm.isPasscodeEnabled = (res.passcode.enabled != undefined) ? res.passcode.enabled : false;
                oPasscode = (res.passcode.code != undefined) ? res.passcode.code : '1234';
                oPasscodeEnabled = (res.passcode.enabled != undefined) ? res.passcode.enabled : false;
            }
        }

        function processWorkshopObject(res) {
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
            console.error(err);
        }
    }
})();