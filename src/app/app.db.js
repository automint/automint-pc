/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('altairApp')
        .service('$pouchDb', PouchDbService)
        .factory('pdbCustomer', PouchCustomer)
        .factory('pdbConfig', PouchConfig)
        .factory('pdbCommon', PouchCommon);
        
    PouchDbService.$inject = ['$rootScope', '$q'];
    PouchCustomer.$inject = ['$pouchDb', '$q'];
    PouchConfig.$inject = ['$pouchDb', '$q'];
    PouchCommon.$inject = ['$pouchDb', '$q'];
    
    function PouchDbService($rootScope, $q) {
        //  temporary assignments
        var database;
        var changeListener;

        // function mapping and declarations
        this.setDatabase = setDatabase;
        this.startListening = startListening;
        this.stopListening = stopListening;
        this.sync = sync;
        this.save = save;
        this.delete = deleteDocument;
        this.get = get;
        this.getAll = getAll;
        this.destroy = destroy;
        
        //  set local database
        function setDatabase(databaseName) {
            database = new PouchDB(databaseName);
        }

        //  start listening to changes in local database
        function startListening() {
            changeListener = database.changes({
                live: true,
                include_docs: true
            }).on("change", function(change) {
                //  do something
            });
        }

        //  stop listening to changes in local database
        function stopListening() {
            changeListener.cancel();
        }

        //  sync database with remote server
        function sync(remoteDatabase) {
            database.sync(remoteDatabase, {
                live: true,
                retry: true
            });
        }

        //  save document in database (auto-detect for new or updated document)
        function save(jsonDocument) {
            var deferred = $q.defer();
            if (!jsonDocument._id) {
                database.post(jsonDocument).then(function(response) {
                    deferred.resolve(response);
                }).catch(function(error) {
                    deferred.reject(error);
                });
            } else {
                database.put(jsonDocument).then(function(response) {
                    deferred.resolve(response);
                }).catch(function(error) {
                    deferred.reject(error);
                });
            }
            return deferred.promise;
        }

        //  delete document based on document id and revision
        function deleteDocument(documentId, documentRevision) {
            return database.remove(documentId, documentRevision);
        }

        //  get document based on its id
        function get(documentId) {
            return database.get(documentId);
        }

        //  get all documents from database
        function getAll() {
            debugger;
            return database.allDocs({
                include_docs: true
            });
        }

        //  drop database from local storage
        function destroy() {
            database.destroy();
        }
    }
    
    function PouchConfig($pouchDb, $q) {
        //  temporary assignments
        var database;
        var changeListener;

        //  initialized blank factory
        var factory = {};
        
        //  function declarations and mapping
        factory.setDatabase = setDatabase;
        factory.startListening = startListening;
        factory.stopListening = stopListening;
        factory.sync = sync;
        factory.save = save;
        factory.delete = deleteDocument;
        factory.get = get;
        factory.getAll = getAll;
        factory.destroy = destroy;

        //  set local database
        function setDatabase(databaseName) {
            database = new PouchDB(databaseName);
        }

        //  start listening to changes in local database
        function startListening() {
            changeListener = database.changes({
                live: true,
                include_docs: true
            }).on("change", function(change) {
                //  do something
            });
        }

        //  stop listening to changes in local database
        function stopListening() {
            changeListener.cancel();
        }

        //  sync database with remote server
        function sync(remoteDatabase) {
            return database.sync(remoteDatabase, {
                live: true,
                retry: true
            });
        }

        //  save document to database
        function save(jsonDocument) {
            var deferred = $q.defer();
            if (!jsonDocument._id) {
                database.post(jsonDocument).then(function(response) {
                    deferred.resolve(response);
                }).catch(function(error) {
                    deferred.reject(error);
                });
            } else {
                database.put(jsonDocument).then(function(response) {
                    deferred.resolve(response);
                }).catch(function(error) {
                    deferred.reject(error);
                });
            }
            return deferred.promise;
        }

        //  delete document from database based on document id and revision
        function deleteDocument(documentId, documentRevision) {
            return database.remove(documentId, documentRevision);
        }

        //  get document based on document id
        function get(documentId) {
            return database.get(documentId);
        }

        //  get all documents from database
        function getAll() {
            return database.allDocs({
                include_docs: true
            });
        }

        //  drop database
        function destroy() {
            database.destroy();
        }

        return factory;
    }
    
    function PouchCustomer($pouchDb, $q) {
        //  temporary assignments
        var database;
        var changeListener;

        //  initialized blank factory
        var factory = {};

        //  function declarations and mapping
        factory.setDatabase = setDatabase;
        factory.db = db;
        factory.startListening = startListening;
        factory.stopListening = stopListening;
        factory.sync = sync;
        factory.save = save;
        factory.delete = deleteDocument;
        factory.get = get;
        factory.getAll = getAll;
        factory.destroy = destroy;
        
        //  set local database
        function setDatabase(databaseName) {
            database = new PouchDB(databaseName);
        }
        
        //  get local database instance
        function db() {
            return database;
        }

        //  start listening to changes in local database
        function startListening() {
            changeListener = database.changes({
                live: true,
                include_docs: true
            }).on("change", function(change) {
                //  do something
            });
        }

        //  stop listening to changes in local dataabse
        function stopListening() {
            changeListener.cancel();
        }

        //  sync database with remote server
        function sync(remoteDatabase) {
            return database.sync(remoteDatabase, {
                live: true,
                retry: true
            });
        }

        //  save document to database
        function save(jsonDocument) {
            var deferred = $q.defer();
            if (!jsonDocument._id) {
                database.post(jsonDocument).then(function(response) {
                    deferred.resolve(response);
                }).catch(function(error) {
                    deferred.reject(error);
                });
            } else {
                database.put(jsonDocument).then(function(response) {
                    deferred.resolve(response);
                }).catch(function(error) {
                    deferred.reject(error);
                });
            }
            return deferred.promise;
        }
        
        //  delete document from database based on document id and revision
        function deleteDocument(documentId, documentRevision) {
            if (documentRevision) {
                return database.remove(documentId, documentRevision);
            } else {
                return database.remove(documentId);
            }
        }

        //  get document based on document id
        function get(documentId) {
            return database.get(documentId);
        }

        //  get all documents from database
        function getAll() {
            return database.allDocs({
                include_docs: true
            });
        }
        
        //  drop database
        function destroy() {
            database.destroy();
        }
        return factory;
    }
    
    function PouchCommon($pouchDb, $q) {
        //  temporary assignments
        var database;
        var dbName;
        var changeListener;

        //  initialized blank factory
        var factory = {};

        //  function declarations and mapping
        factory.setDatabase = setDatabase;
        factory.db = db;
        factory.startListening = startListening;
        factory.stopListening = stopListening;
        factory.replicate = replicate;
        factory.save = save;
        factory.delete = deleteDocument;
        factory.get = get;
        factory.getAll = getAll;
        factory.destroy = destroy;
        
        //  set local database
        function setDatabase(databaseName) {
            database = new PouchDB(databaseName);
            dbName = databaseName;
        }
        
        //  get local database instance
        function db() {
            return database;
        }

        //  start listening to changes in local database
        function startListening() {
            changeListener = database.changes({
                live: true,
                include_docs: true
            }).on("change", function(change) {
                //  do something
            });
        }

        //  stop listening to changes in local dataabse
        function stopListening() {
            changeListener.cancel();
        }

        //  replicate remote database to local
        function replicate(remoteDatabase) {
            return database.replicate.from(remoteDatabase, {
                live: true,
                retry: true
            });
        }

        //  save document to database
        function save(jsonDocument) {
            var deferred = $q.defer();
            if (!jsonDocument._id) {
                database.post(jsonDocument).then(function(response) {
                    deferred.resolve(response);
                }).catch(function(error) {
                    deferred.reject(error);
                });
            } else {
                database.put(jsonDocument).then(function(response) {
                    deferred.resolve(response);
                }).catch(function(error) {
                    deferred.reject(error);
                });
            }
            return deferred.promise;
        }
        
        //  delete document from database based on document id and revision
        function deleteDocument(documentId, documentRevision) {
            if (documentRevision) {
                return database.remove(documentId, documentRevision);
            } else {
                return database.remove(documentId);
            }
        }

        //  get document based on document id
        function get(documentId) {
            return database.get(documentId);
        }

        //  get all documents from database
        function getAll() {
            return database.allDocs({
                include_docs: true
            });
        }
        
        //  drop database
        function destroy() {
            database.destroy();
        }
        return factory;
    }
})();