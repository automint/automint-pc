angular.module('altairApp').service("loginService", [
    'apiCall', 'variables', '$pouchDBUser', '$pouchDBDefault',
    function (apiCall, variables, $pouchDBUser, $pouchDBDefault) {

        this.doLoing = function (loginData) {
            var deffLogin = $.Deferred();
            apiCall.custom({
                url: '/authenticate',
                method: 'POST',
                requestType: 'json',
                data: loginData,
            }).then(function (res) {
                if (!res.data.success) {
                    deffLogin.reject({
                        msg: "Login failed, User name/mobile or password is wrong."
                    });
                    return;
                }

                var bucket = res.data.workshops_info[0].bucket;
                if (bucket && bucket === "") {
                    deffLogin.reject({
                        msg: "Internal issue, Please contact us."
                    });
                    return;
                }
                $pouchDBUser.setDatabase(bucket, variables.db_url + "/" + bucket);
                $pouchDBUser.sync().on('change', function (info) {
                    debugger;
                    console.log("DB(Sync) change");
                }).on('paused', function (err) {
                    debugger;
                    console.log("DB(Sync) paused");
                }).on('active', function () {
                    debugger;
                    console.log("DB(Sync) active");
                }).on('denied', function (err) {
                    debugger;
                    console.log("DB(Sync) Denied");
                }).on('complete', function (info) {
                    debugger;
                    console.log("DB(Sync) Complete");
                    deffLogin.resolve({
                        msg: "Sync Done."
                    });
                }).on('error', function (err) {
                    debugger;
                    deffLogin.reject({
                        msg: "error while sync"
                    });
                });

                $pouchDBDefault.setDatabase(variables.db_commons, variables.db_url + "/" + variables.db_commons);
                $pouchDBDefault.sync().on('change', function (info) {
                    debugger;
                    console.log("DB(Sync-Default) change");
                }).on('paused', function (err) {
                    debugger;
                    console.log("DB(Sync-Default) paused");
                }).on('active', function () {
                    debugger;
                    console.log("DB(Sync-Default) active");
                }).on('denied', function (err) {
                    debugger;
                    console.log("DB(Sync-Default) Denied");
                }).on('complete', function (info) {
                    debugger;
                    console.log("DB(Sync-Default) Complete");
                    deffLogin.resolve({
                        msg: "Sync Done."
                    });
                }).on('error', function (err) {
                    debugger;
                    deffLogin.reject({
                        msg: "error while sync"
                    });
                });

                deffLogin.resolve({
                    msg: "Sync Done."
                });
            }, function (err) {
                debugger;
            });

            return deffLogin;
        }

}]).factory('apiCall', function ($http, variables) {
    return {
        custom: function (config) {
            config.url = variables.api_url + '/api/' + variables.api_version + config.url + "/";
            return $http(config);
        }
    };
});