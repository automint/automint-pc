/*
 * Closure to create factories for handling databases
 * @author ndkcha
 * @since 0.1.0
 * @version 0.1.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp')
        .factory('pdbCustomers', PouchDbCustomers)
        .factory('pdbConfig', PouchDbConfig)
        .factory('pdbCommon', PouchDbCommon);

    PouchDbCustomers.$inject = ['$q'];
    PouchDbConfig.$inject = ['$q'];
    PouchDbCommon.$inject = ['$q'];

    //  factory function for customers' database
    function PouchDbCustomers($q) {
        //  named assignments
        //  refs { dga: defaultGetAll }
        var database, dbOptions, syncOptions, noIdError, dgaOptions;

        //  initialized factory and function mappings
        var factory = {
            setDatabase: setDatabase,
            sync : sync,
            save: save,
            get: get,
            query: query,
            getAll: getAll,
            saveAll: saveAll
        };

        return factory;

        //  function definitions

        //  setup database
        function setDatabase(name) {
            dbOptions = {
                auto_compaction: true //,
                    // revs_limit: 0
            }
            database = new PouchDB(name, dbOptions);
        }

        //  setup sync
        function sync(remoteDb) {
            if (!syncOptions) {
                syncOptions = {
                    live: true,
                    retry: true
                };
            }
            return database.sync(remoteDb, syncOptions);
        }

        //  save a document in pouchDb database
        function save(document) {
            var tracker = $q.defer();
            if (document._id)
                database.put(document).then(saveSuccessfull).catch(saveFailed);
            else {
                noIdError = {
                    ok: false,
                    message: 'No id provided'
                };
                tracker.reject(noIdError);
            }

            return tracker.promise;

            //  respond to success response on saving database
            function saveSuccessfull(response) {
                tracker.resolve(response);
            }

            //  respond to failure response on saving database
            function saveFailed(error) {
                tracker.reject(error);
            }
        }

        //  get a document from pouchdb database
        function get(documentId, options) {
            if (options)
                return database.get(documentId, options);
            else
                return database.get(documentId);
        }

        //  query a document
        //  refs { mrf: map reduce function }
        function query(mrf, options) {
            if (options)
                return database.query(mrf, options);
            else
                return database.query(mrf);
        }

        //  fetch bulk documents from database
        function getAll(options) {
            if (options)
                return database.allDocs(options);
            else {
                dgaOptions = {
                    include_docs: true
                };
                return database.allDocs(dgaOptions);
            }
        }

        //  put bulk documents into database
        function saveAll(documents) {
            return database.bulkDocs(documents);
        }
    }

    //  factory function for workshop's config database
    function PouchDbConfig($q) {
        //  named assignments
        //  refs { dga: defaultGetAll }
        var database, dbOptions, syncOptions, noIdError, dgaOptions;

        //  initialized factory and function mappings
        var factory = {
            setDatabase: setDatabase,
            sync : sync,
            save: save,
            get: get,
            query: query,
            getAll: getAll
        };

        return factory;

        //  function definitions

        //  setup database
        function setDatabase(name) {
            dbOptions = {
                auto_compaction: true //,
                    // revs_limit: 0
            }
            database = new PouchDB(name, dbOptions);
        }

        //  setup sync
        function sync(remoteDb) {
            if (!syncOptions) {
                syncOptions = {
                    live: true,
                    retry: true
                };
            }
            return database.sync(remoteDb, syncOptions);
        }

        //  save a document in pouchDb database
        function save(document) {
            var tracker = $q.defer();
            if (document._id)
                database.put(document).then(saveSuccessfull).catch(saveFailed);
            else {
                noIdError = {
                    ok: false,
                    message: 'No id provided'
                };
                tracker.reject(noIdError);
            }

            return tracker.promise;

            //  respond to success response on saving database
            function saveSuccessfull(response) {
                tracker.resolve(response);
            }

            //  respond to failure response on saving database
            function saveFailed(error) {
                tracker.reject(error);
            }
        }

        //  get a document from pouchdb database
        function get(documentId, options) {
            if (options)
                return database.get(documentId, options);
            else
                return database.get(documentId);
        }

        //  query a document
        //  refs { mrf: map reduce function }
        function query(mrf, options) {
            if (options)
                return database.query(mrf, options);
            else
                return database.query(mrf);
        }

        //  fetch bulk documents from database
        function getAll(options) {
            if (options)
                return database.allDocs(options);
            else {
                dgaOptions = {
                    include_docs: true
                };
                return database.allDocs(dgaOptions);
            }
        }
    }

    //  factory function for common dataset
    function PouchDbCommon($q) {
        //  named assignments
        //  refs { dga: defaultGetAll }
        var database, dbOptions, replicaOptions, noIdError, dgaOptions;

        //  initialized factory and function mappings
        var factory = {
            setDatabase: setDatabase,
            replicate : replicate,
            save: save,
            get: get,
            query: query,
            getAll: getAll
        };

        return factory;

        //  function definitions

        //  setup database
        function setDatabase(name) {
            dbOptions = {
                auto_compaction: true //,
                    // revs_limit: 0
            }
            database = new PouchDB(name, dbOptions);
        }

        //  setup replication from server
        function replicate(remoteDb) {
            if (!replicaOptions) {
                replicaOptions = {
                    live: true,
                    retry: true
                };
            }
            return database.replicate.from(remoteDb, replicaOptions);
        }

        //  save a document in pouchDb database
        function save(document) {
            var tracker = $q.defer();
            if (document._id)
                database.put(document).then(saveSuccessfull).catch(saveFailed);
            else {
                noIdError = {
                    ok: false,
                    message: 'No id provided'
                };
                tracker.reject(noIdError);
            }

            return tracker.promise;

            //  respond to success response on saving database
            function saveSuccessfull(response) {
                tracker.resolve(response);
            }

            //  respond to failure response on saving database
            function saveFailed(error) {
                tracker.reject(error);
            }
        }

        //  get a document from pouchdb database
        function get(documentId, options) {
            if (options)
                return database.get(documentId, options);
            else
                return database.get(documentId);
        }

        //  query a document
        //  refs { mrf: map reduce function }
        function query(mrf, options) {
            if (options)
                return database.query(mrf, options);
            else
                return database.query(mrf);
        }

        //  fetch bulk documents from database
        function getAll(options) {
            if (options)
                return database.allDocs(options);
            else {
                dgaOptions = {
                    include_docs: true
                };
                return database.allDocs(dgaOptions);
            }
        }
    }
})();