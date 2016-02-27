//'use strict'
altairApp
    .factory('windowDimensions', [
        '$window',
        function ($window) {
            return {
                height: function () {
                    return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
                },
                width: function () {
                    return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
                }
            }
        }
    ])
    .factory('utils', function () {
        return {
            // Util for finding an object by its 'id' property among an array
            findByItemId: function findById(a, id) {
                for (var i = 0; i < a.length; i++) {
                    if (a[i].item_id == id) return a[i];
                }
                return null;
            },
            // serialize form
            serializeObject: function (form) {
                var o = {};
                var a = form.serializeArray();
                $.each(a, function () {
                    if (o[this.name] !== undefined) {
                        if (!o[this.name].push) {
                            o[this.name] = [o[this.name]];
                        }
                        o[this.name].push(this.value || '');
                    } else {
                        o[this.name] = this.value || '';
                    }
                });
                return o;
            },
            // high density test
            isHighDensity: function () {
                return ((window.matchMedia && (window.matchMedia('only screen and (min-resolution: 124dpi), only screen and (min-resolution: 1.3dppx), only screen and (min-resolution: 48.8dpcm)').matches || window.matchMedia('only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (min--moz-device-pixel-ratio: 1.3), only screen and (min-device-pixel-ratio: 1.3)').matches)) || (window.devicePixelRatio && window.devicePixelRatio > 1.3));
            },
            // touch device test
            isTouchDevice: function () {
                return !!('ontouchstart' in window);
            },
            // local storage test
            lsTest: function () {
                var test = 'test';
                try {
                    localStorage.setItem(test, test);
                    localStorage.removeItem(test);
                    return true;
                } catch (e) {
                    return false;
                }
            },
            // show/hide card
            card_show_hide: function (card, begin_callback, complete_callback, callback_element) {
                $(card).velocity({
                        scale: 0,
                        opacity: 0.2
                    }, {
                        duration: 400,
                        easing: [0.4, 0, 0.2, 1],
                        // on begin callback
                        begin: function () {
                            if (typeof begin_callback !== 'undefined') {
                                begin_callback(callback_element);
                            }
                        },
                        // on complete callback
                        complete: function () {
                            if (typeof complete_callback !== 'undefined') {
                                complete_callback(callback_element);
                            }
                        }
                    })
                    .velocity('reverse');
            },
            mapJSONKeyName: function (mapJson, dataJson, mappedKeyOnly) {
                var newDataJson = {};
                if (!mappedKeyOnly) {
                    mappedKeyOnly = false;
                }
                for (var key in dataJson) {
                    var mappedKey = mapJson[key];
                    if (mappedKey) {
                        newDataJson[mappedKey] = dataJson[key];
                    } else if (!mappedKeyOnly) {
                        newDataJson[key] = dataJson[key];
                    }
                }
                return newDataJson;
            }
        };
    })
    .factory('workshopIdHandler', function () {
        var currentID = -1;

        return {
            get: function () {
                return currentID;
            },
            set: function (id) {
                currentID = id;
            }
        }
    })
    .factory('accessTokenHandler', function () {
        var tokenLocalKeyName = "x-access-token";
        var currentToken = undefined;
        return {
            get: function () {
                if (chrome.storage.local) {
                    //$defferdObj = $.Deferred();
                    chrome.storage.local.get(tokenLocalKeyName, function (data) {
                        if (currentToken && currentToken === data[tokenLocalKeyName]) {
                            console.log("accessTokenHandler > token has changed");
                        }
                        currentToken = data[tokenLocalKeyName]; // Call back hell solution
                        //$defferdObj.resolve(data);
                    });
                    if (currentToken) {
                        console.log("accessTokenHandler > tocken from current token");
                        return currentToken; // Return current token
                    }
                    return undefined;
                    //return $defferdObj.promise();
                } else if (localStorage) {
                    return localStorage.getItem(tokenLocalKeyName);
                }
            },
            set: function (accessToken) {
                if (chrome.storage.local) {
                    var obj = {};
                    obj[tokenLocalKeyName] = accessToken;
                    currentToken = accessToken; // Call back hell solution
                    chrome.storage.local.set(obj, function () {});
                    return true;
                } else if (localStorage) {
                    localStorage.setItem(tokenLocalKeyName, accessToken);
                    return true
                }
                console.log("Token Set Request" + accessToken);
                return false;
            },
            remove: function () {
                if (chrome.storage.local) {
                    chrome.storage.local.remove(tokenLocalKeyName, function () {});
                } else if (localStorage) {
                    localStorage.removeItem(tokenLocalKeyName);
                    return true
                }
                return true;
            },
            isSet: function () {
                return undefined;
            }
        };
    })
    .factory('httpInterceptor', function (accessTokenHandler, workshopIdHandler) { /* HTTP Interceptor to handle and Check for login */

        return {
            request: function (config) {
                //console.log("HTTP Request to " + config.url);
                //console.log("Access Token = " + accessToken);
                var accessToken = accessTokenHandler.get();
                if (accessToken) {
                    config.headers['x-access-token'] = accessToken;
                    config.headers['x-workshop-id'] = workshopIdHandler.get();
                }
                return config;
            },
            response: function (config) {
                //console.log(config);
                if (config.data.authFailed && config.data.errorCode === 3) {
                    debugger;
                }
                return config;
            }
        };
    })
    .factory('indexDBHandler', function (variables) {
        // indexDB for get/set/update data in db
        //console.error(new Error("In indexDBHandler"));
        var indexDB = {};
        indexDB.db = undefined;
        indexDB.dbVersion = 1; //Only change whene scheme changed
        indexDB.dbName = variables.db_name;

        var objectIndexDB = {
            stores: {
                settings: 'setting',
                user: 'user',
                services: 'service',
                workshops: "workshop",
                manufacturer: "manufcturer",
                model: "model"
            },
            settingStore: {

            },
            open: function () {
                try {
                    var dbRequest = window.indexedDB.open(indexDB.dbName, indexDB.dbVersion);
                    dbRequest.onsuccess = function (e) {
                        indexDB.db = e.target.result;
                        console.log("indexedDB open");
                    }
                    dbRequest.onupgradeneeded = function (e) {
                        console.log("DB Update call....");
                        indexDB.db = e.target.result;

                        //User Sore
                        var userObjectStore = indexDB.db.createObjectStore('user', {
                            keyPath: "id",
                            autoIncrement: true
                        });
                        userObjectStore.createIndex('mobile', 'mobile', {
                            unique: true
                        });
                        userObjectStore.createIndex('sid', 'sid', {
                            unique: true
                        });
                        userObjectStore.createIndex('validLoginMobileIdx', ['mobile', 'password'], {
                            unique: false
                        });
                        userObjectStore.createIndex('validLoginEmailIdx', ['email', 'password'], {
                            unique: false
                        });
                        userObjectStore.createIndex('logged', 'logged', {
                            unique: true
                        });

                        //Workshop Details Store
                        var workshopObjectStore = indexDB.db.createObjectStore('workshop', {
                            keyPath: "id",
                            autoIncrement: true
                        });
                        workshopObjectStore.createIndex('sid', 'sid', {
                            unique: true
                        });

                        //Manufacturers Details Store
                        var manufacurerObjectStore = indexDB.db.createObjectStore('manufcturer', {
                            keyPath: "id"
                        });

                        //Model Details Store
                        var modelObjectStore = indexDB.db.createObjectStore('model', {
                            keyPath: "id"
                        });
                        modelObjectStore.createIndex('mname', 'manufacturer', {
                            unique: false
                        });

                        //Service Details Store
                        var serviceObjectStore = indexDB.db.createObjectStore('service', {
                            keyPath: "id",
                            autoIncrement: true
                        });
                        serviceObjectStore.createIndex('sid', 'sid', {
                            unique: true
                        });

                        // This setting store has key/value pair for app settings
                        indexDB.db.createObjectStore('setting', {
                            keyPath: "key"
                        }).add({
                            "key": "first-login",
                            "val": true // It should be true // false for tesing 
                        });

                        console.log("DB Update Done");
                    }
                    dbRequest.onerror = function (e) {
                        console.error(e);
                    }
                } catch (e) {
                    console.warn("DB Failed to open");
                    console.error(e);
                }
            },
            set: function (objectStoreName, object) {

            },
            close: function () {
                indexDB.db.close();
            },
            isOpen: function (flag) {

            },
            getDB: function () {
                return indexDB.db;
            }
        }
        console.log(">>> IndexedDB Call");
        // debugger;
        objectIndexDB.open();
        return objectIndexDB;
    })
    .factory('requestsHandler', function ($q, indexDBHandler, syncRequestHandler, workshopIdHandler) {
        return {
            login: {
                doLoing: function (data) {
                    //Data = {id:'email/mobile',pass:'password'}
                    // Return Promise object
                    var defer = $.Deferred();
                    //Login Logic
                    var db = indexDBHandler.getDB();
                    var settingStore = db.transaction(indexDBHandler.stores.settings, 'readwrite').objectStore(indexDBHandler.stores.settings);
                    settingStore.get('first-login').onsuccess = function (e) {
                        var fl = e.target.result.value;
                        debugger;
                        // Is this first time login ?
                        if (fl) {
                            var syncNotification = UIkit.notify("Syncing in progress....", {
                                status: 'warning',
                                timeout: 0
                            });
                            //API Call and Sync
                            syncRequestHandler.featch({
                                "mobile": data.id,
                                "password": data.pass
                            }).then(function (data) { //Success Sync
                                syncNotification.close();
                                UIkit.notify(data, {
                                    status: 'success',
                                    timeout: 5000
                                });
                                defer.resolve({
                                    code: 2
                                });
                                console.log("Sync done.");
                            }, function (msg) { //Failed Sync
                                syncNotification.close();
                                UIkit.notify(msg, {
                                    status: 'danger',
                                    timeout: 5000
                                });
                                defer.reject(data); //Sync failed
                                console.log("Sync Faile due to " + msg);
                            });

                        } else {
                            // Check from db
                            var userStore = db.transaction(indexDBHandler.stores.user, 'readwrite').objectStore(indexDBHandler.stores.user);
                            userStore.index('validLoginMobileIdx').get(IDBKeyRange.only([data.id, data.pass])).onsuccess = function (e) {
                                debugger
                                if (!e.target.result) {
                                    var data = {
                                        msg: "Email/Mobile and Password not match."
                                    }
                                    defer.reject(data); //Login failed
                                }
                                var workshopStore = db.transaction(indexDBHandler.stores.workshops, 'readwrite').objectStore(indexDBHandler.stores.workshops);
                                workshopStore.getAll().onsuccess = function (e1) {
                                    debugger;

                                    workshopIdHandler.set(e1.target.result[0].sid);
                                    if (e.target.result) {
                                        defer.resolve({
                                            code: 2
                                        }); // Login success
                                    }

                                }
                            };
                            userStore.onerror = function () {
                                defer.reject({
                                    msg: "Unkonw error"
                                }); //Login failed
                            };
                        }
                    };
                    // Over Login Logic
                    debugger;
                    return defer;
                }
            },
            user: {
                get: function (id) {
                    var defer = $q.defer();
                    //Logic
                    var db = indexDBHandler.getDB();
                    var store = db.transaction(indexDBHandler.stores.services, 'readwrite').objectStore(indexDBHandler.stores.services);
                    var request = store.get(id);
                    request.onsuccess = function (e) {
                        defer.resolve(e.target.result);
                    };
                    request.onerror = function (e) {
                        defer.reject(e);
                    };

                    // Over Logic
                    return defer.promise;
                }
            },
            service: {
                getAll: function () {
                    // Return Promise object
                    var defer = $q.defer();
                    //Logic
                    var db = indexDBHandler.getDB();
                    var store = db.transaction(indexDBHandler.stores.services, 'readwrite').objectStore(indexDBHandler.stores.services);
                    var request = store.getAll();
                    request.onsuccess = function (e) {
                        var services = e.target.result;
                        var i = 0;
                        var getUsers = function (e) {
                            if (i >= services.length) { // done all user load in services
                                defer.resolve(services);
                                return;
                            }
                            var store = db.transaction(indexDBHandler.stores.user, 'readwrite').objectStore(indexDBHandler.stores.user);
                            var request = store.get(services[i].luid);
                            request.onsuccess = function (e) {
                                services[i].user = e.target.result;
                                i++;
                                getUsers();
                            }

                        }
                        getUsers();
                    };
                    request.onerror = function (e) {
                        defer.reject(e);
                    };

                    // Over Logic
                    return defer.promise;
                },
                get: function (id) {
                    // Return Promise object

                    var defer = $q.defer();
                    id = parseInt(id);
                    if (id === NaN) { //If ID NaN
                        defer.reject("Id is NaN");
                        return defer;
                    }
                    //Logic
                    var db = indexDBHandler.getDB();
                    var store = db.transaction(indexDBHandler.stores.services, 'readwrite').objectStore(indexDBHandler.stores.services);
                    var rquest = store.get(id);
                    rquest.onsuccess = function (e) {
                        var service = e.target.result;
                        var store = db.transaction(indexDBHandler.stores.user, 'readwrite').objectStore(indexDBHandler.stores.user);
                        var request = store.get(IDBKeyRange.only(service.luid));
                        request.onsuccess = function (e1) {
                            var user = e1.target.result;
                            service.uid = user.sid;
                            service.firstname = user.firstname;
                            service.lastname = user.lastname;
                            service.mobile = user.mobile;
                            service.email = user.email;
                            defer.resolve(service);
                        }
                    };
                    rquest.onerror = function (e) {
                        defer.reject(e);
                    };

                    // Over Logic
                    return defer.promise;
                },
                update: function (serviceData) {
                    // Return Promise object
                    var defer = $q.defer();
                    //Logic
                    debugger;
                    var db = indexDBHandler.getDB();
                    var store = db.transaction(indexDBHandler.stores.services, 'readwrite').objectStore(indexDBHandler.stores.services);
                    var rquest = store.put(serviceData);

                    rquest.onsuccess = function (e) {
                        debugger;
                        syncRequestHandler.service.addUpdate(serviceData).then(function (data) {
                            debugger;
                        }, function () {
                            debugger;
                        });
                        defer.resolve(e.target.result);
                    };
                    rquest.onerror = function (e) {
                        defer.reject(e);
                    };

                    // Over Logic
                    return defer.promise;
                },
                add: function (serviceData) {
                    // Return Promise object
                    var defer = $q.defer();
                    var db = indexDBHandler.getDB();

                    //Logic
                    var serviceDataDummy = $.extend(true, {}, serviceData);
                    var syncCall = function () {
                        /* Sync Adapter */
                        syncRequestHandler.service.addUpdate(serviceDataDummy).then(function (data) {
                            debugger
                            serviceData.sid = data.service_id;
                            serviceData.uid = data.user_id;
                            serviceData.vid = data.vehicle_id;
                            for (var i = 0; i < data.problems.length; i++) {
                                serviceData.problems[i].id = data.problems[i];
                            }
                            var store = db.transaction(indexDBHandler.stores.services, 'readwrite').objectStore(indexDBHandler.stores.services);
                            var rquest = store.put(serviceDataDummy);
                            rquest.onsuccess = function (e) {
                                console.log("Update information with server id");
                            }
                            console.log("New Service added on server");

                        }, function (e) {
                            debugger;
                            console.log("New Service failed add on server");
                        })
                    };
                    var userData = {};
                    userData.email = serviceData.email;
                    userData.firstname = serviceData.firstname;
                    userData.lastname = serviceData.lastname;
                    userData.mobile = serviceData.mobile;

                    var userStore = db.transaction(indexDBHandler.stores.user, 'readwrite').objectStore(indexDBHandler.stores.user);
                    var userRquest = userStore.add(userData);

                    userRquest.onsuccess = function (e) {
                        delete serviceData.email;
                        delete serviceData.firstname;
                        delete serviceData.lastname;
                        delete serviceData.mobile;

                        serviceData.luid = e.target.result;
                        serviceDataDummy.luid = e.target.result;
                        var store = db.transaction(indexDBHandler.stores.services, 'readwrite').objectStore(indexDBHandler.stores.services);
                        var rquest = store.add(serviceData);
                        rquest.onsuccess = function (e) {
                            defer.resolve();
                            debugger;
                            serviceDataDummy.id = e.target.result;
                            syncCall();
                        }
                        rquest.onerror = function (e) {
                            debugger;
                            defer.reject(e);
                        };
                    };
                    // Over Logic
                    return defer.promise;
                }
            }
        };
    })
    .factory('syncRequestHandler', function (variables, indexDBHandler, apiCall, accessTokenHandler, utils, workshopIdHandler) {
        var server = {};
        var token = undefined;
        var _this = {};
        _this.login = function (data) {
            var deff = $.Deferred();

            apiCall.custom2({
                url: '/authenticate',
                method: 'POST',
                requestType: 'json',
                data: data,
            }).then(function (data) {
                if (data.data.success && data.data.token && data.data.token.trim() !== "") { //Setting up token
                    accessTokenHandler.set(data.data.token); //Store token
                    deff.resolve({ //Response to resolver
                        data: data,
                        error: false
                    });
                } else { // Token failed
                    deff.reject({
                        error: true,
                        msg: data.message
                    });
                }
            }, function (e) {
                deff.reject({
                    error: true,
                    msg: "Connecting to fail with server"
                });
                debugger;
            });

            return deff;
        };
        _this.loginWithCurrentUser = function (callback) {
            var i = 0;
            var maxTry = 2;
            var db = indexDBHandler.getDB();
            var store = db.transaction(indexDBHandler.stores.user, 'readwrite').objectStore(indexDBHandler.stores.user);
            var rquest = store.index('logged').get(IDBKeyRange.only(true)).onsuccess = function (e) {
                var loginData = {
                    id: e.target.result.mobile,
                    pass: e.target.result.password
                };
                var callLogin = function () {
                    if (e.target && e.target.result) {
                        i++;
                        _this.login(loginData).then(function (data) {

                            if (data.error && i <= maxTry) {
                                callLogin();
                            } else {
                                callback(true);
                            }

                        }, function () {
                            callback(false);
                        });
                    }
                };
            };
            callLogin();
        }

        //featch data 
        _this.featcher = function (requests) {
            //Function for call Network
            var requestCall = function (request, index, key) {

                //Loop Request when parent is run loop for child
                var deffLoopRequestCall = $.Deferred();
                var loopIndex = 0;
                var loopRequestCall = function (data) {
                    debugger;
                    var childURL = request.child.url.replace("{id}", data.data[loopIndex].id);
                    apiCall.custom2({
                        url: childURL,
                        method: request.child.method,
                        requestType: 'json',
                    }).then(function (data1) {
                        data.data[loopIndex][request.child.key] = data1.data;
                        if (loopIndex < data.data.length - 1) {
                            loopIndex++;
                            loopRequestCall(data);
                        } else {
                            deffLoopRequestCall.resolve(data);
                        }
                    }, function (e) {
                        deffLoopRequestCall.reject(data);
                    });
                }; //loopRequestCall

                var deff = $.Deferred();
                apiCall.custom2({
                    url: request.url,
                    method: request.method,
                    requestType: 'json',
                }).then(function (data) {
                    if (request.child) { // Child call 
                        if (Array.isArray(data.data)) {
                            loopRequestCall(data);
                            deffLoopRequestCall.then(function (data) {
                                deff.resolve(data, index, key);
                            }, function (data) {
                                console.log("Error to get child - " + request.child)
                                deff.resolve(data, index, key);
                            });
                        } else {
                            var childURL = request.child.url.replace("{id}", data.data.id);
                            apiCall.custom2({
                                url: childURL,
                                method: request.child.method,
                                requestType: 'json',
                            }).then(function (data1) {
                                data[request.child.key] = data1.data;
                                deff.resolve(data, index, key);
                            }, function (e) {
                                deff.resolve(data, index, key);
                            });
                        }
                    } else {
                        deff.resolve(data, index, key);
                    }
                }, function (e) {
                    deff.reject({
                        error: e,
                        index: index
                    });
                });
                return deff;
            };

            var deffOuter = $.Deferred();
            var fatchFlag = true;
            var i = 0;
            var requestSize = Object.keys(requests).length;
            for (var key in requests) {
                requestCall(requests[key], i, key).then(function (data, index, keyz) {
                    requests[keyz].data = data.data;
                    requests[keyz].requestResolved = true; //Current request resolved

                    //Check every ruest is resolved ? if yes send resolve outer deffered
                    var resolveFlag = true;
                    for (var keyx in requests) {
                        if (!requests[keyx].requestResolved) {
                            resolveFlag = false;
                            break;
                        }
                    }
                    if (resolveFlag) {
                        deffOuter.resolve(requests); // Send all request done
                    }

                }, function (errorData) {
                    fatchFlag = false;
                    console.log("Failed to load - " + requests[errorData.index].url);
                });
                i++;
            }
            return deffOuter;
        }; //Feature 



        _this.syncSchemaManager = function (requests, schema) {
            var deffOuter = $.Deferred();
            var maps = schema.maps;
            var mapIndex = 0;
            var cacheIdMaps = {};
            var returnMapsResult = {};

            var deffNextMap = $.Deferred();
            var nextMap = function () {
                debugger;


                var map = maps[mapIndex];
                var request = requests[map.requestName];
                var cacheIds = undefined;



                var requestData;
                if (map.data && map.data.data) {
                    debugger;
                    requestData = map.data.data;
                } else {
                    if (map.data && map.data.subKey) {
                        requestData = request.data[map.data.subKey];
                    } else {
                        requestData = request.data;
                    }
                }
                //Function for inser or update data
                var updateDB = function (map, data) {
                    var deffLocal = $.Deferred();
                    var db = indexDBHandler.getDB();
                    var isArrayData = Array.isArray(data);

                    var doneUpdate = function () {

                    }; //doneUpdate()

                    //Create Transaction
                    var transaction = db.transaction(map.store, 'readwrite');
                    transaction.onerror = function (e) {
                        console.log(e.target.error.message);
                        console.log("error transaction");
                    };
                    var deffUpdateRow = $.Deferred();
                    var nextDataRow = function (dataIndex) {
                        var dataInsert;
                        if (isArrayData) {
                            dataInsert = data[dataIndex];
                        } else {
                            dataInsert = data;
                        }

                        //Append Data
                        if (map.appendData) {
                            dataInsert = $.extend(true, dataInsert, map.appendData);
                        }

                        //Translate Keys 
                        if (map.translateKeys) {
                            dataInsert = utils.mapJSONKeyName(map.translateKeys, dataInsert);
                        }

                        //Remove Keys
                        if (map.removeKeys) {
                            debugger;
                            for (var i = 0; i < map.removeKeys.length; i++) {
                                delete dataInsert[map.removeKeys[i]];
                            }
                        }
                        //Transtale Local DB key from cached
                        if (map.translateToLocalKeys) {
                            if (map.translateToLocalKeys.cacheIdMap) {
                                debugger
                                var cachedMap = cacheIdMaps[map.translateToLocalKeys.cacheIdMap.map];
                                dataInsert[map.translateToLocalKeys.cacheIdMap.newKey] = cachedMap[dataInsert[map.translateToLocalKeys.cacheIdMap.requestKey]];
                            }
                        }
                        var changeRequest;
                        var store = transaction.objectStore(map.store);
                        if (map.existOnUpdate) {
                            changeRequest = store.put(dataInsert);
                        } else {
                            changeRequest = store.add(dataInsert);
                        }

                        changeRequest.onsuccess = function (e) {
                            //Cache new id for other where use
                            if (map.cacheIdMap && map.cacheIdMap.name && !map.existOnUpdate) { // Create blank if not exsist 
                                if (!cacheIdMaps[map.cacheIdMap.name])
                                    cacheIdMaps[map.cacheIdMap.name] = {};

                                cacheIdMaps[map.cacheIdMap.name][dataInsert.sid] = e.target.result;
                            }

                            if (isArrayData && dataIndex < data.length - 1) {
                                nextDataRow(++dataIndex);
                            } else {
                                deffUpdateRow.resolve(dataIndex);
                            }
                        };
                        changeRequest.onerror = function (e) {
                            // console.log(e.target.error.message);
                            deffUpdateRow.reject(e.target.error.message, dataIndex);
                        };


                    }; // nextDataRow()

                    //Call 
                    nextDataRow(0);
                    deffUpdateRow.then(function (index) { // All row updated in db ?
                        console.log("All row update in '" + map.store + "' store of map : " + map.name);
                        deffLocal.resolve();
                    }, function (msg, indexOnFailed) { // No failed
                        deffLocal.reject(msg);
                        console.error(msg);
                    });

                    return deffLocal;
                }; // updateDB()

                updateDB(map, requestData).then(function () {

                    if (mapIndex < maps.length - 1) {
                        mapIndex++;
                        nextMap();
                    } else {
                        deffNextMap.resolve();
                    }
                }, function (msg) {
                    debugger;
                });
            }; // nextMap()
            nextMap();
            deffNextMap.then(function () {
                debugger;
                deffOuter.resolve();
            }, function () {
                debugger;
                deffOuter.reject();
            });
            return deffOuter;
        }; // Sync Manger


        //Return object of sync
        return {
            featch: function (data) {
                var deffOuter = $.Deferred();
                _this.login(data).then(function (data) { //Success Login
                        console.log("Server Login success with server");

                        debugger;
                        workshopIdHandler.set(data.data.data.workshops_info[0].id);
                        var requests = {
                            "me": {
                                url: "/me",
                                method: "GET",
                                data: undefined
                            },
                            "customer": {
                                url: "/customers",
                                method: "GET",
                                data: undefined
                            },
                            "service": {
                                url: "/services",
                                method: "GET",
                                data: undefined,
                                child: {
                                    url: "/services/{id}/problems",
                                    method: "GET",
                                    key: "problems"
                                }
                            },
                            "customer": {
                                url: "/customers",
                                method: "GET",
                                data: undefined
                            },
                            "manuf": {
                                url: "/manufacturers",
                                method: "GET",
                                data: undefined
                            },
                            "model": {
                                url: "/models",
                                method: "GET",
                                data: undefined
                            }
                        };


                        //Featch data
                        _this.featcher(requests).then(function (requests) { //Success when all data loaded
                            console.log("All Data feached");
                            var db = indexDBHandler.getDB();

                            var syncSchema = {
                                maps: [{ //-------------------------------------------- User (logged user)
                                    name: "me",
                                    requestName: "me",
                                    store: indexDBHandler.stores.user,
                                    existOnUpdate: false,
                                    data: {
                                        subKey: "user_info",
                                        isArray: false
                                    },
                                    appendData: {
                                        "logged": true
                                    },
                                    translateKeys: {
                                        "id": "sid"
                                    },
                                    cacheIdMap: {
                                        name: "usersid"
                                    }
                                }, { //-------------------------------------------- Workshops
                                    name: "appworkshop",
                                    requestName: "me",
                                    store: "workshop",
                                    data: {
                                        subKey: "workshop_info",
                                        isArray: true
                                    },
                                    translateKeys: {
                                        "id": "sid"
                                    },
                                    cacheIdMap: {
                                        name: "workshopid"
                                    },
                                    succes: function (map, cache) {
                                        debugger;
                                        workshopIdHandler.set(cache);
                                    }
                                }, { //-------------------------------------------- Users / Customers
                                    name: "customers",
                                    requestName: "customer",
                                    store: indexDBHandler.stores.user,
                                    translateKeys: {
                                        "id": "sid"
                                    },
                                    cacheIdMap: {
                                        name: "usersid"
                                    }
                                }, { //-------------------------------------------- Services 
                                    name: "services",
                                    requestName: "service",
                                    store: indexDBHandler.stores.services,
                                    translateKeys: {
                                        "id": "sid"
                                    },
                                    removeKeys: ["firstname", "lastname", "mobile"],
                                    translateToLocalKeys: {
                                        cacheIdMap: {
                                            map: "usersid", // cached ID Map Name
                                            requestKey: "uid", // Means uid value mapped and converted in to 
                                            newKey: "luid" //local uid
                                        }
                                    }
                                }, { //-------------------------------------------- manufecturer 
                                    name: "manufecturer",
                                    requestName: "manuf",
                                    store: indexDBHandler.stores.manufacturer,
                                }, { //-------------------------------------------- model 
                                    name: "models",
                                    requestName: "model",
                                    store: indexDBHandler.stores.model,
                                }, {
                                    name: "setoff-firstloging",
                                    existOnUpdate: true,
                                    store: indexDBHandler.stores.settings,
                                    data: {
                                        data: {
                                            "key": "first-login",
                                            "value": false
                                        }
                                    }
                                }],
                                series: true,
                            };

                            _this.syncSchemaManager(requests, syncSchema).then(function () {
                                debugger;
                                console.log("Sync done");
                                var workshopStore = indexDBHandler.getDB().transaction(indexDBHandler.stores.workshops, 'readwrite').objectStore(indexDBHandler.stores.workshops);
                                workshopStore.getAll().onsuccess = function (e) {
                                    debugger;
                                    workshopIdHandler.set(e.target.result[0].sid);
                                    deffOuter.resolve("Syncing Done.");
                                }
                            }, function () {
                                debugger;
                                console.log("Failed Sync");
                                deffOuter.reject("Syncing Failed.");
                            });
                        }, function (e) { // Failed on login
                            console.error(e);
                            deffOuter.reject("Fatch Failed");
                        });
                    },
                    function (e) { // Failed on login
                        console.error(e);
                        deffOuter.reject("Login Failed");
                    });

                return deffOuter;

            },
            service: {
                addUpdate: function (serviceData, update) {
                    var deff = $.Deferred();
                    // Just testing
                    var callService = function (loginResonse) {
                        if (loginResonse != undefined && !loginResonse) {
                            deff.reject("Login failed");
                            return;
                        }
                        var httpMethod = "POST";
                        if (update) {
                            httpMethod = "PUT";
                        }
                        apiCall.custom2({
                            url: "/services",
                            method: httpMethod,
                            data: serviceData
                        }).success(function (data) {
                            debugger;
                            //Login Failed
                            if (data.success && data.success == false && data.message.toLowerCase().contains("token")) {
                                console.log("Login Failed. Try to login.");
                                _this.loginWithCurrentUser(callService); //Give current function as callback if loging fail or success 
                            }
                            deff.resolve(data);
                        }).error(function (e) {
                            deff.reject(e);
                        });
                    }
                    callService();
                    return deff;
                }
            }
        };
    })
    .factory('apiCall', function ($http, variables) {
        return {
            // get a single api
            get: function (id, param, value) {
                return $http.get(variables.api_url + '/api/' + id + '/' + param + '/' + value);
            },

            // get all apis
            all: function (id) {
                return $http.get(variables.api_url + '/api/' + id + '/');
            },

            // create a api
            create: function (id, apiData) {
                return $http.post(variables.api_url + '/api/' + id + '/', apiData);
            },

            // create specific api
            specificcreate: function (id, param, apiData) {
                return $http.post(variables.api_url + '/api/' + id + '/' + param + '/', apiData);
            },

            // update a api
            update: function (id, param, value, apiData) {
                return $http.put(variables.api_url + '/api/' + id + '/' + param + '/' + value, apiData);
            },

            // delete a api
            delete: function (id, param, value) {
                return $http.delete(variables.api_url + '/api/' + id + '/' + param + '/' + value);
            },

            //Custom CALL
            custom: function (url, method, data) {
                return $http({
                    "url": variables.api_url + '/api/' + url + "/",
                    "method": method,
                    "data": data
                });
            },
            //Custom CALL
            custom2: function (config) {
                config.url = variables.api_url + '/api/' + variables.api_version + config.url + "/";
                return $http(config);
            }
        };
    })
    .factory('authFactory', function ($http, $q, accessTokenHandler, apiCall, variables, $state) {

        // create auth factory object
        var authFactoryObj = {};

        // log a user in
        authFactoryObj.login = function (data) {

            // return the promise object and its data
            apiCall.custom2({
                url: '/authenticate',
                method: 'POST',
                requestType: 'json',
                data: requestData,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST",
                    "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization",
                    "Access-Control-Allow-Credentials": false
                },
            }).success(function (data) {
                if (data.success && data.token && data.token.trim() !== "") { //Setting up token
                    accessTokenHandler.set(data.token);
                }
                $defferedRequest.resolve({
                    redirect: "",
                    response: {
                        success: data.success,
                        message: data.message
                    },
                    error: false,
                    msg: "Success."
                });
                return data;
            }).error(function () {
                $defferedRequest.resolve({
                    data: {},
                    error: true,
                    msg: "Error to connect Server."
                });
            });
            return $defferedRequest.promise();;
        };

        // log a user out by clearing the token
        authFactoryObj.logout = function () {
            // clear the token
            accessTokenHandler.remove();
            $state.go('login');
        };

        // check if a user is logged in
        // checks if there is a local token
        authFactoryObj.isLoggedIn = function () {
            var token = accessTokenHandler.get();
            if (token && token.trim() !== "")
                return true;
            else
                return false;
        };

        // return auth factory object
        return authFactoryObj;

    });

angular
    .module("ConsoleLogger", [])
    // router.ui debug
    // app.js (run section "PrintToConsole")
    .factory("PrintToConsole", [
        "$rootScope",
        function ($rootScope) {
            var handler = {
                active: false
            };
            handler.toggle = function () {
                handler.active = !handler.active;
            };

            if (handler.active) {
                console.log($state + ' = ' + $state.current.name);
                console.log($stateParams + '=' + $stateParams);
                console.log($state_full_url + '=' + $state.$current.url.source);
                console.log(Card_fullscreen + '=' + card_fullscreen);

                $rootScope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams) {
                    console.log("$stateChangeStart --- event, toState, toParams, fromState, fromParams");
                    console.log(arguments);
                });
                $rootScope.$on('$stateChangeError', function (event, toState, toParams, fromState, fromParams, error) {
                    console.log("$stateChangeError --- event, toState, toParams, fromState, fromParams, error");
                    console.log(arguments);
                });
                $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
                    console.log("$stateChangeSuccess --- event, toState, toParams, fromState, fromParams");
                    console.log(arguments);
                });
                $rootScope.$on('$viewContentLoading', function (event, viewConfig) {
                    console.log("$viewContentLoading --- event, viewConfig");
                    console.log(arguments);
                });
                $rootScope.$on('$viewContentLoaded', function (event) {
                    console.log("$viewContentLoaded --- event");
                    console.log(arguments);
                });
                $rootScope.$on('$stateNotFound', function (event, unfoundState, fromState, fromParams) {
                    console.log("$stateNotFound --- event, unfoundState, fromState, fromParams");
                    console.log(arguments);
                });
            }

            return handler;
        }
    ]);