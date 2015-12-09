angular.module('app.framework', []);

angular.module('app.framework')
    
    .factory('framework', ['helpers', function (helpers) {
        var _ = helpers._;
        var q = helpers.q;
        
        var API = function () {
            var self = this;
            
            self.getUrl = function (path) {
                var addr = connection.getAddress();                
                var base = 'http://' + addr.address + ':' + addr.port + '/api'
                var url = (path) ? base + path : base;
                return url;
            }
            self.isAuthenticated = function () {
                var def = q.defer();
                if (connection.connected()) {
                    var url = self.getUrl();
                    helpers.api.get(url).then(function (payload) {
                        if (payload && payload.status && payload.status.success) {
                            var auth = (payload.data.user && payload.data.user.id);
                            if (auth) { def.resolve(); } else { def.reject(); }
                        } else {
                            def.reject();
                        }
                    }).catch(function (err) {
                        def.reject();
                    });
                } else {
                    def.reject();
                }              
                return def.promise;
            }

      
        }
        var Connection = function () {
            var self = this;
            Eventify.enable(self);
            var _socket;
            
            self.connect = function (options) {
                options = _.defaults(options || {}, {});
                
                if (options.address && options.port) { 
                    // disconnect first
                    if (self.connected()) { 
                        self.disconnect();
                    }
                    // connect socket
                    var url = 'http://' + options.address + ':' + options.port;
                    _socket = io.connect(url);
                    _socket.on('connect', function () {
                        self.trigger('connect');
                    });
                    _socket.on('reconnect', function () {
                        self.trigger('reconnect');
                    });
                    _socket.on('disconnect', function () {
                        self.trigger('disconnect');
                    });
                    _socket.on('news', function (data) {
                        console.log(data);
                        _socket.emit('my other event', { my: 'data' });
                    });
                }
            }
            self.connected = function () {
                return (_socket) ? _socket.connected : false;
            }
            self.disconnect = function () {
                _socket = null;
            }
            self.getAddress = function () { 
                return { address: _socket.io.opts.host, port: _socket.io.opts.port };
            }            
        }
        var Nodes = function () { 
            var self = this;
            Eventify.enable(self);
            
            var _nodes = [];
            
            function getNodeFromApiData(data) {
                return {
                    uuid: data.node.uuid,
                    name: data.node.name,
                    version: data.node.version,
                    address: data.node.address,
                    port: data.node.port
                };
            }            
            function getNodeFromObject(obj) { 
                var props = ['uuid', 'name', 'version', 'address', 'port', 'lastConnected'];
                return _.pick(obj, props);
            }
            function queryAddress(options) {
                options = _.defaults(options || {}, {});
                var def = q.defer();
                
                var url = '/api';
                if (options.address && options.port) {
                    url = 'http://' + options.address + ':' + options.port + '/api';
                }
                
                helpers.api.get(url).then(function (payload) {
                    if (payload && payload.status && payload.status.success) {
                        def.resolve(payload.data);
                    } else {
                        def.reject();
                    }
                }).catch(function (err) { 
                    def.reject();
                });
                return def.promise;
            }

            self.add = function (options) {
                options = _.defaults(options || {}, { lastConnected: moment.unix(0).utc().format() });
                if (options.address && options.port) {
                    if (!_.findWhere(_nodes, { address: options.address, port: options.port })) {
                        var newNode = getNodeFromObject(options);
                        _nodes.push(newNode);
                        self.trigger('add', newNode);
                    } else { 
                        // update
                    }             
                }
            }
            self.discover = function () {
                if (helpers.platform.isDevice() && helpers.platform.zeroConf.available()) {
                    helpers.platform.zeroConf.watch('_xhira._tcp.local', function (result) {
                        if (result && result.action == 'added') {
                            var address = result.data.service.addresses[0];
                            var port = result.data.service.port;
                            self.add({ address: address, port: port });


                        }
                    });
                } else if (!helpers.platform.isDevice() && window.location) {
                    queryAddress().then(function (data) {
                        var node = getNodeFromApiData(data);
                        self.add(node);
                    });
                } else {
                    // where is it???
                }
            }
            self.get = function () { 
                return _nodes;
            }
            self.query = function (options) {
                return queryAddress(options);
            }
            self.remove = function (options) {
                options = _.defaults(options || {}, {});
                if (options.uuid) {
                    var oldNode = _.findWhere(_nodes, { uuid: options.uuid });
                    if (oldNode) {
                        _nodes = _.reject(_nodes, { uuid: options.uuid });
                        self.trigger('remove', oldNode);
                    }
                    
                }  else if (options.address && options.port) {
                    var oldNode = _.findWhere(_nodes, { address: options.address, port: options.port });
                    if (oldNode) { 
                        _nodes = _.reject(_nodes, { address: options.address, port: options.port });
                        self.trigger('remove', oldNode);
                    }
                }
            }
            self.update = function(options) {
                options = _.defaults(options || {}, {});
                
                var updNode;
                if (options.uuid) {
                    updNode = _.findWhere(_nodes, { uuid: options.uuid });
                } else if (options.address && options.port) {
                    updNode = _.findWhere(_nodes, { address: options.address, port: options.port });
                }
                
                if (updNode) {
                    updNode = getNodeFromObject(options);
                    self.trigger('update', updNode);
                }
            }
            self.validate = function (options) {
                options = _.defaults(options || {}, {});
                
                var valNodes;
                if (options.uuid) {
                    valNodes = _.where(_nodes, { uuid: options.uuid });
                } else if (options.address && options.port) {
                    valNodes = _.where(_nodes, { address: options.address, port: options.port });
                } else { 
                    valNodes = _nodes;
                }
                _.forEach(valNodes, function (item) {
                    self.query(item).then(function (data) { 
                        self.update(data);
                    });
                });

            }
            
            helpers.localStorage.nodes = helpers.localStorage.nodes || [];
            _nodes = helpers.localStorage.nodes;
            self.validate();
        }
        
        var connection = new Connection();
        var nodes = new Nodes();
        
        // public stuff
        var factory = {};
        Eventify.enable(factory);
        factory.api = new API();
        factory.Nodes = nodes;
        
        connection.on('connect', function () { 
            factory.trigger('connect');
        });
        connection.on('reconnect', function () {
            factory.trigger('reconnect');
        });
        connection.on('disconnect', function () {
            factory.trigger('disconnect');
        });
        factory.connect = function (options) {
            connection.connect(options);
        }
        factory.connected = function () {
            return connection.connected();
        }        
        factory.disconnect = function () {
            connection.disconnect();
        }
        
        return factory;
    }])

;