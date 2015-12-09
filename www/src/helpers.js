angular.module('app.helpers', ['ngLodash']);

angular.module('app.helpers')

    .provider('$appConfig', function () {
        var defaultConfig = {
            version: '0.0.0'
        };
        var appConfig = {};
    
        this.set = function (options) {
            appConfig = (options) ? options : {};
        }
    
        this.$get = ['helpers.localstorage', 'lodash', function (localStore, _) {
            
                function readConfig() {
                    var lsConfig = (!_.isUndefined(localStore.config) && !_.isNull(localStore.config)) ? localStore.config : {};
                    return _.defaults(appConfig, lsConfig, defaultConfig);
                }
            
                localStore.config = readConfig();
            
                var factory = {};
                factory.get = function (key) {
                    var config = readConfig();
                    return (!_.isUndefined(config[key]) && !_.isNull(config[key])) ? config[key] : null;
                };
                factory.remove = function (key) {
                    delete localStore.config[key];
                };
                factory.set = function (key, value) {
                    localStore.config[key] = value;
                };
                return factory;

            }];

    })

    .factory('helpers.base', ['$q', 'lodash', function ($q, _) {
        var uuidCHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
        var base64key = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
        var factory = {};
        
        factory.base64Decode = function (input, key) {
            var key = key || base64key;
            
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;
            
            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
            
            while (i < input.length) {
                enc1 = key.indexOf(input.charAt(i++));
                enc2 = key.indexOf(input.charAt(i++));
                enc3 = key.indexOf(input.charAt(i++));
                enc4 = key.indexOf(input.charAt(i++));
                
                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;
                
                output = output + String.fromCharCode(chr1);
                
                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }
            }
            
            output = factory.utf8Decode(output);
            
            return output;
        }
        factory.base64Encode = function (input, key) {
            var key = key || base64key;
            
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            
            input = factory.utf8Encode(input);
            
            while (i < input.length) {
                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);
                
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                
                output = output +
                key.charAt(enc1) + key.charAt(enc2) +
                key.charAt(enc3) + key.charAt(enc4);
            }
            
            return output;
        }
        factory.filterCollectionByAttribute = function (collection, attrib, value, partial, limit) {
            var col = collection || [];
            // parameters
            var attribs = [];
            if (attrib) {
                if (_.isArray(attrib)) { attribs = attrib } else { attribs.push(attrib); };
            }
            var values = [];
            if (value) {
                if (_.isArray(value)) { values = value } else { values.push(value); };
            }
            partial = partial || false;
            // filter
            var filtered = _.filter(col, function (item) {
                var isItem = false;
                _.each(attribs, function (a) {
                    _.each(values, function (v) {
                        var al = item[a].toString().toLowerCase();
                        var vl = v.toString().toLowerCase();
                        if (partial && al.indexOf(vl) >= 0) {
                            isItem = true;
                        } else if (!partial && al == vl) {
                            isItem = true;
                        }
                    });
                });
                return (isItem);
            });
            // limit result
            if (limit && filtered.length > limit) { filtered = _.first(filtered, limit); }
            return filtered;
        }
        factory.promiseAll = function (items, options) {
            options = _.defaults(options || {}, { funcReturn: false, chunks: items.length, map: false });
            var def = $q.defer();
            
            function resolvePromise(result) {
                if (options.map == true) {
                    var res = _.object(_.map(result, function (item) { return [item.key, item.value] }));
                    def.resolve(res);
                } else {
                    def.resolve(result);
                }
            }
            function getResults(state, input, output) {
                var res = [];
                for (var i = 0; i < input.length; i++) {
                    var val = (_.isArray(output)) ? output[i] : null;
                    var itm = { key: input[i].key, value: val, state: state };
                    if (options.funcReturn) { itm.func = input[i].func; }
                    res.push(itm);
                }
                return res;
            }
            function promiseChunk(_items) {
                var _def = $q.defer();
                var funcs = _.map(_items, function (item) {
                    var params = item.params || [];
                    return item.func.apply(this, params);
                });
                $q.all(funcs).then(function (results) {
                    _def.resolve(getResults(true, _items, results));
                }, function (errors) {
                    _def.resolve(getResults(false, _items, errors));
                }, function (updates) {
                    _def.resolve(getResults(null, _items, updates));
                });
                return _def.promise;
            }
            
            var itemsFirst = _.take(items, options.chunks);
            var itemsRest = _.drop(items, options.chunks);
            promiseChunk(itemsFirst).then(function (resultFirst) {
                if (itemsRest.length > 0) {
                    factory.promiseAll(itemsRest, options).then(function (resultRest) {
                        resolvePromise(_.union(resultFirst, resultRest));
                    });
                } else {
                    resolvePromise(resultFirst);
                }
            });
            return def.promise;
        }
        factory.utf8Decode = function (utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;
            
            while (i < utftext.length) {
                c = utftext.charCodeAt(i);
                
                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }
            }
            
            return string;
        }
        factory.utf8Encode = function (string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";
            
            for (var n = 0; n < string.length; n++) {
                var c = string.charCodeAt(n);
                
                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
            }
            
            return utftext;
        }
        factory.uuid = function (len, radix) {
            var chars = uuidCHARS, uuid = [], i;
            radix = radix || chars.length;
            
            if (len) {
                // Compact form
                for (i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
            } else {
                // rfc4122, version 4 form
                var r;
                
                // rfc4122 requires these characters
                uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
                uuid[14] = '4';
                
                // Fill in random data.  At i==19 set the high bits of clock sequence as
                // per rfc4122, sec. 4.1.5
                for (i = 0; i < 36; i++) {
                    if (!uuid[i]) {
                        r = 0 | Math.random() * 16;
                        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                    }
                }
            }
            
            return uuid.join('');
        };
        factory.uuidCompact = function () {
            // A more compact, but less performant, RFC4122v4 solution:
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };
        factory.uuidFast = function () {
            // A more performant, but slightly bulkier, RFC4122v4 solution.  We boost performance by minimizing calls to random()
            var chars = uuidCHARS, uuid = new Array(36), rnd = 0, r;
            for (var i = 0; i < 36; i++) {
                if (i == 8 || i == 13 || i == 18 || i == 23) {
                    uuid[i] = '-';
                } else if (i == 14) {
                    uuid[i] = '4';
                } else {
                    if (rnd <= 0x02) rnd = 0x2000000 + (Math.random() * 0x1000000) | 0;
                    r = rnd & 0xf;
                    rnd = rnd >> 4;
                    uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
                }
            }
            return uuid.join('');
        };
        
        return factory;
    }])

    .factory('helpers.config', ['$appConfig', function ($appConfig) {
        return $appConfig;
    }])

    .factory('helpers.localstorage', ['$rootScope', '$window', '$log', function ($rootScope, $window, $log) {
        var storageType = 'localStorage';
        var prefix = 'xhira_';
        var webStorage = $window[storageType] || ($log.warn('This browser does not support Web Storage!'), {});
        var $storage = {
            $default: function (items) { for (var k in items) { angular.isDefined($storage[k]) || ($storage[k] = items[k]); } return $storage; },
            $reset: function (items) { for (var k in $storage) { '$' === k[0] || delete $storage[k]; } return $storage.$default(items); }
        };
        for (var i = 0, k; i < webStorage.length; i++) {
            (k = webStorage.key(i)) && prefix === k.slice(0, prefix.length) && ($storage[k.slice(prefix.length)] = angular.fromJson(webStorage.getItem(k)));
        }
        
        var _last$storage = angular.copy($storage);
        var _debounce;
        $rootScope.$watch(function () {
            _debounce || (_debounce = setTimeout(function () {
                _debounce = null;
                
                if (!angular.equals($storage, _last$storage)) {
                    angular.forEach($storage, function (v, k) {
                        angular.isDefined(v) && '$' !== k[0] && webStorage.setItem(prefix + k, angular.toJson(v));
                        delete _last$storage[k];
                    });
                    for (var k in _last$storage) {
                        webStorage.removeItem(prefix + k);
                    }
                    _last$storage = angular.copy($storage);
                }
            }, 100));
        });
        
        'localStorage' === storageType && $window.addEventListener && $window.addEventListener('storage', function (event) {
            if (prefix === event.key.slice(0, prefix.length)) {
                event.newValue ? $storage[event.key.slice(prefix.length)] = angular.fromJson(event.newValue) : delete $storage[event.key.slice(prefix.length)];
                _last$storage = angular.copy($storage);
                $rootScope.$apply();
            }
        });
        
        return $storage;
    }])

    .factory('helpers.api', ['$http', '$q', 'lodash', function ($http, $q, _) {
        
        function getHeaders(options) {
            options = _.defaults(options || {}, { });
            var headers = _.extend({}, options.add);
            return headers;
        }
        
        var factory = {};
        factory.get = function (url, options) {
            options = _.defaults(options || {}, { params: {}, headers: {} });
            var def = $q.defer();
            var config = { headers: getHeaders({ add: options.headers }), cache: false };
            var params = _.map(_.pairs(options.params), function (param) { return param.join('='); }).join('&');
            var fullUrl = url + ((params) ? ('?' + params) : '');
            $http.get(fullUrl, config).then(function (payload) {
                def.resolve(payload.data);
            }).catch(function () {
                def.reject(false);
            });
            return def.promise;
        }
        factory.set = function (entity, options) {
            options = _.defaults(options || {}, { data: {}, params: {} });
            var def = $q.defer();
            
            var countryFilter = _.findWhere(_entities, { code: entity }).countryFilter;
            var apiAlias = _.findWhere(_entities, { code: entity }).apiAlias;
            var config = { headers: getHeaders({ applyCountryFilter: countryFilter }) };
            var params = _.map(_.pairs(options.params), function (param) { return param.join('='); }).join('&');
            var url = baseUrl + (apiAlias || entity) + ((params) ? ('?' + params) : '');
            var json = JSON.stringify(options.data);
            if (countryFilter && !getCountryId()) {
                def.reject();
            } else {
                $http.post(url, json, config).then(function (result, status) {
                    console.log(status);
                    def.resolve();
                }).catch(function (error) {
                    console.log(error);
                    def.reject();
                });
            }
            return def.promise;
        }
        factory.authenticate = function (options) {
            options = _.defaults(options || {}, { user: '', pass: '' });
            var result = { status: false, message: '', user: null };
            var def = $q.defer();
            
            
            
            
            return def.promise;
        }
        return factory;
    }])

    .factory('helpers.platform', ['$q', 'lodash', function ($q, _) {
        var _supported = ['android', 'browser', 'ios'];
        var factory = {};
        
        factory.id = cordova.platformId;
        
        factory.isDevice = function () { 
            return (factory.id != 'browser');
        }        
        factory.isSupported = function () {
            var idx = _.indexOf(_supported, factory.id);
            return (idx >= 0);
        }
        
        factory.zeroConf = new function () {
            var zf = {};
            //zf.listServices = function (type, options, callback) {
            //    //var def = $q.defer();
            //    options = _.defaults(options || {}, { timeout: 5000 });
            //    if (window.cambiocreative && window.cambiocreative.CDVZeroConfig) {
            //        var zcfg = window.cambiocreative.CDVZeroConfig;
            //        zcfg.list(type, options.timeout, function (result) {
            //            if (callback && result) { callback(result); }
            //            //def.resolve(result);
            //        }, function (err) { 
            //            //def.resolve(err);
            //        });
            //    } else {
            //        if (callback) { callback([1,2,3]); }
            //        //def.resolve([1,2,3]);                    
            //    }
            //    //return def.promise;
            //}
            zf.available = function () {
                return (window.cambiocreative && window.cambiocreative.CDVZeroConfig);
            }
            zf.watch = function (type, callback) {
                if (zf.available()) {
                    var zcfg = window.cambiocreative.CDVZeroConfig;
                    zcfg.watch(type, function (result) {
                        if (callback && result) { callback(result); }
                    });
                }
            }
            return zf;
        }


        return factory;
    }])

    .factory('helpers', ['$q', 'lodash', 'helpers.config', 'helpers.localstorage', 'helpers.api', 'helpers.platform', function ($q, _, config, localStorage, api, platform) {
        var factory = {};
        factory.q = $q;
        factory._ = _;
        factory.config = config;
        factory.api = api;
        factory.localStorage = localStorage;
        factory.moment = moment;
        factory.platform = platform;
        return factory;
    }])

;