angular.module('altairApp').service("cruzerService", [
    'apiCall', 'variables', '$pouchDBUser', '$pouchDBDefault',
    function(apiCall, variables, $pouchDBUser, $pouchDBDefault) {
        
        this.nd = "helo";
        
        this.syncDB = function(bucket) {
            var dbURL = variables.db_url.replace("{bucket}", bucket);
            $pouchDBUser.setDatabase('cruzer-workshop', dbURL + bucket);
            $pouchDBUser.sync().on('change', function(info) {
                console.log("DB(Sync) change");
            }).on('paused', function(err) {
                console.log("DB(Sync) paused");
            }).on('active', function() {
                console.log("DB(Sync) active");
            }).on('denied', function(err) {
                console.log("DB(Sync) Denied");
            }).on('complete', function(info) {
                console.log("DB(Sync) Complete");
                deffLogin.resolve({
                    msg: "Sync Done."
                });
            }).on('error', function(err) {
                deffLogin.reject({
                    msg: "error while sync"
                });
            });

            dbURL = variables.db_url.replace("{bucket}", variables.db_commons);
            $pouchDBDefault.setDatabase(variables.db_commons, dbURL + variables.db_commons);
            $pouchDBDefault.sync().on('change', function(info) {
                console.log("DB(Sync-Default) change");
            }).on('paused', function(err) {
                console.log("DB(Sync-Default) paused");
            }).on('active', function() {
                console.log("DB(Sync-Default) active");
            }).on('denied', function(err) {
                console.log("DB(Sync-Default) Denied");
            }).on('complete', function(info) {
                console.log("DB(Sync-Default) Complete");
                deffLogin.resolve({
                    msg: "Sync Done."
                });
            }).on('error', function(err) {
                deffLogin.reject({
                    msg: "error while sync"
                });
            });
        }
        this.runDB = function() {
            var deffDB = $.Deferred();

            chrome.storage.local.get(variables.localKeys.bucket, function(data) {
                console.log("locl bucket name = " + data[variables.localKeys.bucket]);
                if (!data[variables.localKeys.bucket]) {
                    deffDB.reject();
                    console.log("Local bucket undefined");
                } else {
                    deffDB.resolve();
                    syncDB(data[variables.localKeys.bucket]);
                }

            });

            return deffDB;
        }

        this.isLogin = function() {
            console.log("is login");
            var deffIsLogin = $.Deferred();

            chrome.storage.local.get(variables.localKeys.login, function(data) {
                console.log("Local login data get = " + data);
                console.log(data);
                zxcvb = data;
                deffIsLogin.resolve(data[variables.localKeys.login]);
            });

            return deffIsLogin;
        }
        this.doLoing = function(loginData) {
            var deffLogin = $.Deferred();
            apiCall.custom({
                url: '/authenticate',
                method: 'POST',
                requestType: 'json',
                data: loginData,
            }).then(function(res) {
                if (!res.data.success) {
                    deffLogin.reject({
                        msg: "Login failed, User name/mobile or password is wrong."
                    });
                    return;
                }

                var bucket = res.data.workshops_info[0].bucket;
                if (bucket && bucket === "" || bucket === null) {
                    console.log("app did not get bucket name in auth request...!!!");
                    deffLogin.reject({
                        msg: "Internal issue, Please contact us."
                    });
                    return;
                }

                //Sync db on success login
                syncDB(bucket);
                debugger;
                //Store Flag and bucket name
                var json1 = {};
                json1[variables.localKeys.login] = true;
                chrome.storage.local.set(json1, function() {
                    console.log("Login flag changes to true");
                });
                var json2 = {};
                json2[variables.localKeys.bucket] = bucket;
                chrome.storage.local.set(json2, function() {
                    console.log("Bucket name saved in db");
                });

                // Request resolve for login page
                deffLogin.resolve({
                    msg: "Sync Done."
                });
            }, function(err) {
                debugger;
            });

            return deffLogin;
        }

    }
]).factory('apiCall', function($http, variables) {
    return {
        custom: function(config) {
            config.url = variables.api_url + '/api/' + variables.api_version + config.url + "/";
            return $http(config);
        }
    };
}).factory('localStoreService', function() {
    return {
        set: function(key, value) {

        },
        get: function(key) {

        },
        remove: function(key) {

        }
    };
});