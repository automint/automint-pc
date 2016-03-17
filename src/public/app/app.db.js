angular.module('altairApp')
    .service("$pouchDB", ["$rootScope", "$q", function ($rootScope, $q) {

        var database;
        var changeListener;

        this.remoteDatabase;

        this.setDatabase = function (databaseName, remote) {
            database = new PouchDB(databaseName);
            remoteDatabase = remote;
            console.log("DB running. name = " + databaseName);
        }

        this.startListening = function () {
            changeListener = database.changes({
                live: true,
                include_docs: true
            }).on("change", function (change) {
                debugger;
            });
        }

        this.stopListening = function () {
            changeListener.cancel();
        }

        this.sync = function () {
            database.sync(remoteDatabase, {
                live: true,
                retry: true
            });
        }

        this.save = function (jsonDocument) {
            var deferred = $q.defer();
            if (!jsonDocument._id) {
                database.post(jsonDocument).then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            } else {
                database.put(jsonDocument).then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            }
            return deferred.promise;
        }

        this.delete = function (documentId, documentRevision) {
            return database.remove(documentId, documentRevision);
        }

        this.get = function (documentId) {
            return database.get(documentId);
        }

        this.getAll = function () {
            debugger;
            return database.allDocs({
                include_docs: true
            });
        }

        this.destroy = function () {
            database.destroy();
        }
}]).factory("$pouchDBDefault", ["$pouchDB", '$q', function ($pouchDB, $q) {
        var database;
        var changeListener;

        var _this = {};
        _this.remoteDatabase;

        _this.setDatabase = function (databaseName, remote) {
            database = new PouchDB(databaseName);
            remoteDatabase = remote;
            console.log("Default DB running. name = " + databaseName);
        }

        _this.startListening = function () {
            changeListener = database.changes({
                live: true,
                include_docs: true
            }).on("change", function (change) {
                debugger;
            });
        }

        _this.stopListening = function () {
            changeListener.cancel();
        }

        _this.sync = function () {
            return database.sync(remoteDatabase, {
                live: true,
                retry: true
            });
        }

        _this.save = function (jsonDocument) {
            var deferred = $q.defer();
            if (!jsonDocument._id) {
                database.post(jsonDocument).then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            } else {
                database.put(jsonDocument).then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            }
            return deferred.promise;
        }

        _this.delete = function (documentId, documentRevision) {
            return database.remove(documentId, documentRevision);
        }

        _this.get = function (documentId) {
            return database.get(documentId);
        }

        _this.getAll = function () {
            debugger;
            return database.allDocs({
                include_docs: true
            });
        }

        _this.destroy = function () {
            database.destroy();
        }

        return _this;

}]).factory("$pouchDBUser", ["$pouchDB", '$q', function ($pouchDB, $q) {
        var database;
        var changeListener;

        var _this = {};
        _this.remoteDatabase;

        _this.setDatabase = function (databaseName, remote) {
            database = new PouchDB(databaseName);
            remoteDatabase = remote;
            console.log("DB running. name = " + databaseName);
        }

        _this.startListening = function () {
            changeListener = database.changes({
                live: true,
                include_docs: true
            }).on("change", function (change) {
                debugger;
            });
        }

        _this.stopListening = function () {
            changeListener.cancel();
        }

        _this.sync = function () {
            return database.sync(remoteDatabase, {
                live: true,
                retry: true
            });
        }

        _this.save = function (jsonDocument) {
            var deferred = $q.defer();
            if (!jsonDocument._id) {
                database.post(jsonDocument).then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            } else {
                database.put(jsonDocument).then(function (response) {
                    deferred.resolve(response);
                }).catch(function (error) {
                    deferred.reject(error);
                });
            }
            return deferred.promise;
        }

        _this.delete = function (documentId, documentRevision) {
            return database.remove(documentId, documentRevision);
        }

        _this.get = function (documentId) {
            return database.get(documentId);
        }

        _this.getAll = function () {
            debugger;
            return database.allDocs({
                include_docs: true
            });
        }

        _this.destroy = function () {
            database.destroy();
        }

        return _this;

}]);