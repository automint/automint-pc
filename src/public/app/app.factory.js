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
    .factory('httpInterceptor', function (accessTokenHandler) { /* HTTP Interceptor to handle and Check for login */

        return {
            request: function (config) {
                //console.log("HTTP Request to " + config.url);
                var accessToken = accessTokenHandler.get();
                //console.log("Access Token = " + accessToken);
                if (accessToken) {
                    config.headers['x-access-token'] = accessToken;
                    config.headers['x-workshop-id'] = 1;

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
                workshops: "workshop"
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

                        //Workshop Details Store
                        var workshopObjectStore = indexDB.db.createObjectStore('workshop', {
                            keyPath: "id",
                            autoIncrement: true
                        });

                        //Service Details Store
                        var serviceObjectStore = indexDB.db.createObjectStore('service', {
                            keyPath: "id",
                            autoIncrement: true
                        });


                        userObjectStore.add({ // remove this dubmmy user 
                            id: 1,
                            fname: "Ankur",
                            lname: "Loriya",
                            mobile: "9998528138",
                            email: "ankur.loriya@gmail.com",
                            pass: "1",
                            cityid: 1
                        }).onsuccess = function (e) {
                            console.log("Dummy user added for testing.");
                        };
                        userObjectStore.createIndex('validLoginMobileIdx', ['mobile', 'password'], {
                            unique: false
                        });
                        userObjectStore.createIndex('validLoginEmailIdx', ['email', 'password'], {
                            unique: false
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
    .factory('requestsHandler', function ($q, indexDBHandler, syncRequestHandler) {
        return {
            login: {
                doLoing: function (data) {
                    //Data = {id:'email/mobile',pass:'password'}
                    // Return Promise object
                    var defer = $q.defer();
                    //Login Logic
                    var db = indexDBHandler.getDB();
                    var settingStore = db.transaction(indexDBHandler.stores.settings, 'readwrite').objectStore(indexDBHandler.stores.settings);
                    settingStore.get('first-login').onsuccess = function (e) {
                        var fl = e.target.result.val;

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
                                debugger;
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
                                //console.log(e.target.result);
                                if (e.target.result) {
                                    defer.resolve({
                                        code: 2
                                    }); // Login success
                                } else {
                                    var data = {
                                        msg: "Email/Mobile and Password not match."
                                    }
                                    defer.reject(data); //Login failed
                                }
                            };
                        }
                    };
                    // Over Login Logic
                    return defer.promise;
                }
            },
            service: {
                getAll: function () {
                    // Return Promise object
                    var defer = $q.defer();
                    //Logic
                    var db = indexDBHandler.getDB();
                    var userStore = db.transaction(indexDBHandler.stores.services, 'readwrite').objectStore(indexDBHandler.stores.services);
                    var rquest = userStore.getAll();
                    rquest.onsuccess = function (e) {
                        defer.resolve(e.target.result);
                    };
                    rquest.onsuccess = function (e) {
                        defer.reject(e);
                    };

                    // Over Logic
                    return defer.promise;
                },
                get: function (id) {
                    // Return Promise object
                    var defer = $q.defer();
                    //Logic
                    var db = indexDBHandler.getDB();
                    var userStore = db.transaction(indexDBHandler.stores.services, 'readwrite').objectStore(indexDBHandler.stores.services);
                    var rquest = userStore.get(id);
                    rquest.onsuccess = function (e) {
                        defer.resolve(e.target.result);
                    };
                    rquest.onsuccess = function (e) {
                        defer.reject(e);
                    };

                    // Over Logic
                    return defer.promise;
                },
                update: function (serviceData) {
                    // Return Promise object
                    var defer = $q.defer();
                    //Logic
                    var db = indexDBHandler.getDB();
                    var userStore = db.transaction(indexDBHandler.stores.services, 'readwrite').objectStore(indexDBHandler.stores.services);
                    var rquest = userStore.put(serviceData);
                    /* Sync Adapter */

                    rquest.onsuccess = function (e) {
                        defer.resolve(e.target.result);
                    };
                    rquest.onsuccess = function (e) {
                        defer.reject(e);
                    };

                    // Over Logic
                    return defer.promise;
                },
                add: function (serviceData) {
                    // Return Promise object
                    var defer = $q.defer();
                    //Logic
                    var db = indexDBHandler.getDB();
                    var userStore = db.transaction(indexDBHandler.stores.services, 'readwrite').objectStore(indexDBHandler.stores.services);
                    var rquest = userStore.add(serviceData);


                    rquest.onsuccess = function (e) {
                        /* Sync Adapter */
                        syncRequestHandler.service.add(serviceData).then(function () {
                            defer.resolve(e.target.result);
                        }, function () {

                        })

                    };
                    rquest.onsuccess = function (e) {
                        defer.reject(e);
                    };

                    // Over Logic
                    return defer.promise;
                }
            }
        };
    })
    .factory('syncRequestHandler', function (variables, indexDBHandler, apiCall, accessTokenHandler, utils) {
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


        //featch data 
        _this.featcher = function (requests) {
            //Function for call Network
            var requestCall = function (request, index, key) {
                var deff = $.Deferred();
                apiCall.custom2({
                    url: request.url,
                    method: request.method,
                    requestType: 'json',
                }).then(function (data) {
                    deff.resolve(data, index, key);
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
        }
        return {
            featch: function (data) {
                var deffOuter = $.Deferred();
                _this.login(data).then(function (data) { //Success Login
                        console.log("Server Login success with server");
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
                                var db = indexDBHandler.getDB();

                                //Put in inedexedDB
                                var schemaMaps = {
                                    "customer": {
                                        "firstname": "fname",
                                        "lastname": "lname",
                                        "city_id": "cityid",
                                        "password": "pass",
                                        //"id": "sid"
                                    },
                                    "workshop": {
                                        "offerings": "offer",
                                        "latitude": "lati",
                                        "longitude": "long"
                                    }

                                };

                                //Me
                                var transaction = db.transaction(indexDBHandler.stores.user, 'readwrite');

                                transaction.onerror = function (e) {
                                    debugger;
                                    console.log(e.target.error.message);
                                    console.log("error transaction");
                                }

                                var meData = requests.me.data.user_info; //utils.mapJSONKeyName(schemaMaps.customer, requests.me.data.user_info);
                                var userStore = transaction.objectStore(indexDBHandler.stores.user);
                                var tranRequest = userStore.put(meData);
                                tranRequest.onsuccess = function (e) {
                                    console.log("User info saved in indexedb");
                                };
                                tranRequest.onerror = function (e) {
                                    console.log(e.target.error.message);
                                };

                                // Me Workshop
                                transaction = db.transaction(indexDBHandler.stores.workshops, 'readwrite');
                                transaction.onerror = function (e) {
                                    debugger;
                                    console.log(e.target.error.message);
                                    console.log("error transaction");
                                };
                                ``
                                var workshopData = requests.me.data.workshop_info;
                                var workshopStore = transaction.objectStore(indexDBHandler.stores.workshops);
                                for (var i = 0; i < workshopData.length; i++) {
                                    var tranRequest = workshopStore.put(workshopData[i]);
                                    tranRequest.onsuccess = function (e) {
                                        console.log("Workshop info saved in indexedb");
                                    };
                                    tranRequest.onerror = function (e) {
                                        console.log(e.target.error.message);
                                    };
                                }

                                //Services
                                var servicesData = requests.service.data;
                                if (servicesData && !servicesData.success) {

                                    var loadProblems = function (service, index) {
                                        debugger;
                                        service.problems = [];
                                        var deff = $.Deferred();
                                        apiCall.custom2({
                                            url: "/services/" + service.id + "/problems",
                                            method: "GET",
                                            requestType: 'json',
                                        }).then(function (data) {
                                            debugger;
                                            deff.resolve(data.data, index);
                                        }, function (e) {
                                            deff.reject(e, index);
                                        });
                                        return deff;

                                    }; //Function over

                                    var addService = function (service) {
                                        var service = utils.mapJSONKeyName({ //Change key name 'id' to 'sid'
                                            "id": "sid"
                                        }, service);
                                        var transaction = db.transaction(indexDBHandler.stores.services, 'readwrite');
                                        transaction.onerror = function (e) {
                                            debugger;
                                            console.log(e.target.error.message);
                                            console.log("error transaction");
                                        };
                                        var serviceStore = transaction.objectStore(indexDBHandler.stores.services);
                                        var tranRequest = serviceStore.add(service);
                                        tranRequest.onsuccess = function (e) {
                                            debugger;
                                            console.log("Service Data saved in indexedb");
                                        };
                                        tranRequest.onerror = function (e) {
                                            console.log(e.target.error.message);
                                        };
                                    }

                                    for (var i = 0; i < servicesData.length; i++) {
                                        loadProblems(servicesData[i], i).then(function (data, index) {
                                            debugger;
                                            servicesData[index].problems = data;
                                            addService(servicesData[index]);

                                        }, function (e) {
                                            addService(servicesData[index]);
                                        }, function () {
                                            debugger;
                                            console.log("finally called");
                                        });
                                    }
                                }


                                //Firest Sync Off
                                /*transaction = db.transaction(indexDBHandler.stores.settings, 'readwrite');
                                transaction.onerror = function (e) {
                                    debugger;
                                    console.log(e.target.error.message);
                                    console.log("error transaction");
                                };
                                var settingStore = transaction.objectStore(indexDBHandler.stores.settings);
                                settingStore.put({
                                    "key": "first-login",
                                    "value": false
                                });*/


                            },
                            function (error) { // Failed Featch any request
                                deffOuter.reject("Error :(");
                            });
                        // over rquest for loop



                    },
                    function (e) { // Failed on login
                        console.error(e);
                        deffOuter.reject("Login Failed");
                    });

                return deffOuter;

            },
            service: {
                add: function (serviceData) {
                    var deff = $.Deferred();
                    deff.resolve(""); // Just testing
                    var callService = function () {
                        apiCall.custom2({

                        }).success(function () {

                        });
                    }
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