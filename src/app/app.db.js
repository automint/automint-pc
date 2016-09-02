/**
 * Closure to create factories for handling databases
 * @author ndkcha
 * @since 0.4.1
 * @version 0.7.0
 */

/// <reference path="../typings/main.d.ts" />

(function() {
    angular.module('automintApp').factory('pdbMain', PouchDBMain).factory('pdbCache', PouchDbCache).factory('pdbLocal', PouchDbLocal);

    /*
        === NOTE ===
        Use PouchDB() as constructor of PouchDb databases as mentioned in pouchdb api
    */

    PouchDbLocal.$inject = ['$q'];
    PouchDBMain.$inject = ['$q'];
    PouchDbCache.$inject = ['$q'];

    function PouchDbLocal($q) {
        //  named assignments
        //  refs { dga: defaultGetAll }
        var database, syncOptions, noIdError, dgaOptions;

        //  initialized factory and function mappings
        var factory = {
            setDatabase: setDatabase,
            OnDbChanged: OnDbChanged,
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
            database = new PouchDB(name, {
                auto_compaction: true
            });
        }
        
        //  return change listeners of database
        function OnDbChanged(options) {
            if (!options) {
                options = {
                    since: 'now',
                    live: true,
                }
            }
            return database.changes(options);
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

    function PouchDBMain($q) {
        //  named assignments
        //  refs { dga: defaultGetAll }
        var database, syncOptions, noIdError, dgaOptions;

        //  initialized factory and function mappings
        var factory = {
            setDatabase: setDatabase,
            OnDbChanged: OnDbChanged,
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
            database = new PouchDB(name, {
                revs_limit: 10
            });
        }
        
        //  return change listeners of database
        function OnDbChanged(options) {
            if (!options) {
                options = {
                    since: 'now',
                    live: true,
                }
            }
            return database.changes(options);
        }

        //  setup sync
        function sync(remoteDb) {
            if (!syncOptions) {
                syncOptions = {
                    live: true,
                    retry: false
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
    
    function PouchDbCache($q) {
        //  named assignments
        var database;
        
        //  initialized factory and function mappings
        var factory = {
            setDatabase: setDatabase,
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
            database = new PouchDB(name, {
                auto_compaction: true
            });
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
})();