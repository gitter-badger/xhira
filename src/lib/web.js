var events = require('events');
var fs = require('fs');
var util = require('util');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var Express = require('express');
var ExpressSession = require('express-session');
var http = require('http');
var passport = require('passport');
var passportLocal = require('passport-local');
var passportLocalApiKey = require('passport-localapikey');
var passportSocketIo = require('passport.socketio');
var sessionNedbStore = require('connect-nedb-session');
var socketio = require('socket.io');

var helpers = require('./helpers.js');
var _ = helpers._;
var config = helpers.Configuration;

var express = Express();

var _SessionConfig;
var SessionConfig = function () { 
    if (_SessionConfig) { return _SessionConfig; }
    var secret = config.get('services:web:sessionSecret', helpers.util.createUUID());
    var sessionStore = sessionNedbStore(ExpressSession);
    if (!fs.existsSync('data')) { fs.mkdirSync('data'); }
    _SessionConfig = {
        cookieParser: cookieParser,
        key: 'xhira',
        secret: secret,
        resave: true,
        saveUninitialized: true,
        cookie: {
            path: '/',
            //httpOnly: true,
            maxAge: 1000 * 3600 * 24 * 30 // 30 days
        },
        store: new sessionStore({ filename: 'data/sessions.db' }),
        success: function(data, accept) {
            //console.log('successful connection to socket.io');
            accept(null, true);
        },
        fail: function (data, message, error, accept) {
            //console.log('failed connection to socket.io:', message);
            return accept(null, false);
        }
    };
    return _SessionConfig;
}

var Session = function () {
    return ExpressSession(SessionConfig());
}

// Routes
var Routes = function () {
    var self = this;

    function checkAuthentication(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        } else {
            sendResponse(res, { status: 401 });
        }
    }

    function sendResponse(res, opt) {
        var options = _.defaults(opt || {}, { status: 200, end: true });
        
        var payload = { status: {} };
        var statusType = 'success', statusMessage = 'Ok';
        if (options.status >= 400) {
            statusType = 'error';
            statusMessage = 'Error';
        }
        payload.status[statusType] = { message: options.message || statusMessage };
        if (options.data) { payload.data = options.data };        

        res.status(options.status);
        res.send(payload);
        if (options.end) { res.end(); }        
    }

    function routerAPI() {
        var router = Express.Router();

        router.all('/test', checkAuthentication);
        router.get('/test', function (req, res) {
            sendResponse(res, { message: 'SECURE Message' });
        });
        
        //router.all('/update', checkAuthentication);
        router.get('/update', function (req, res) {
            //var nextCheck = helpers.moment.utc().toJSON();
            //config.set('update:nextCheck', nextCheck);
            config.set('update:state', { action: 'test' });
            sendResponse(res, { message: 'checking...' });
        });
        
        // api
        router.get('/', function (req, res) {
            var data = {
                node: {
                    name: 'Xhira',
                    uuid: config.get('node:uuid'),
                    version: config.get('node:version'),
                    address: req.app.locals.httpAddress.address,
                    port: req.app.locals.httpAddress.port
                }
            };
            if (config.get('network')) {
                data.network = {
                    uuid: config.get('network:uuid')
                };
            }
            if (req.isAuthenticated()) {
                data.user = {
                        id: req.user.id
                };
                
            }
            sendResponse(res, { data: data });
        });
        //router.get('/location.json', function (req, res) {
        //    var data = {
        //        local: false
        //    };
        //    sendResponse(res, { data: data });
        //});
        // api/auth
        router.get('/auth', function (req, res) {
            sendResponse(res, { data: { authenticated: req.isAuthenticated() } });
        });        
        router.post('/auth/login', function (req, res) {
            var authType = 'local';            
            if (req.body.apikey) { authType = 'localapikey'; }
            passport.authenticate(authType, function (err, user, info) {
                if (user) {
                    req.logIn(user, function (err) {
                        if (!err) {
                            sendResponse(res);
                        } else {
                            sendResponse(res, { status: 401 });
                        }
                    });
                } else {
                    sendResponse(res, { status: 401 });
                }
            })(req,res);
        });
        router.get('/auth/logout', function (req, res) {
            req.logOut();
            sendResponse(res);
        });

        return router;
    }    

    self.init = function () {
        
        // API
        express.use('/api', routerAPI());
        
        // ROOT
        //express.use('cordova.js', express.static(__dirname + '/cordova.js'));
        express.use(Express.static('www'));
    }

    //this.API = function () {
    //    var router = express.Router();

    //    // auth
    //    //router.all('*', requireAuthentication, loadUser);
    //    router.route('/auth/check').get(function (req, res) {
    //        if (req.isAuthenticated()) {
    //            res.json({ result: true });
    //        } else {
    //            res.status(401).end();
    //        }
    //    });


    //    // system
    //    router.all('*', isAuthenticated);
    //    router.route('/system').get(function (req, res) {
    //        if (req.isAuthenticated()) {
    //            var bus = { connected: framework.bus.connected() };
    //            res.json({ bus: bus });
    //        } else {
    //            res.status(401).end();
    //        }
    //    });

    //    // test
    //    router.all('*', isAuthenticated);
    //    router.route('/test').get(function (req, res) {
    //        res.json({ test: true });
    //    });

    //    return router;
    //}

}

var Authentication = function () {
    var self = this;
    
    self.init = function () {
        passport.deserializeUser(function (id, done) {
            if (id == 1) {
                var uname = config.get('auth:user') || '';
                var pass = config.get('auth:pass') || '';
                done(null, { id: id, local: { username: uname, password: pass } });
            } else { 
                done("error", null);
            }
            //User.findById(id, function (err, user) {
            //    done(err, { _id: 1, username: 'admin', password: 'admin' }); // done(err, user);
            //});
        });
        passport.serializeUser(function (user, done) {
            done(null, user.id);
        });
        passport.use('local', new passportLocal.Strategy({ passReqToCallback: true }, function (req, username, password, done) {
            var uname = config.get('auth:user') || '';
            var pass = config.get('auth:pass') || '';
            var user = { id: 1, local: { username: uname, password: pass } };
        
            if (!uname) { return done(null, false); }
            var isNamePass = (uname == username && pass == password);
            if (!isNamePass) { return done(null, false); }
        
            return done(null, user);
        }));
        passport.use('localapikey', new passportLocalApiKey.Strategy(
            function (apikey, done) {
                var uname = config.get('auth:user') || '';
                var pass = config.get('auth:pass') || '';
                var user = { id: 1, local: { username: uname, password: pass } };
                return done(null, user);
                //User.findOne({ apikey: apikey }, function (err, user) {
                //    if (err) { return done(err); }
                //    if (!user) { return done(null, false); }
                //    return done(null, user);
                //});
            }
        ));        

        express.use(Session());
        express.use(passport.initialize());
        express.use(passport.session());
        
        // CORS
        express.use(function (req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });
    }

}

var factory = function () {
    var self = this;
    var _port = 26500;
    
    // parsers
    express.use(cookieParser());
    express.use(bodyParser.json());
    express.use(bodyParser.urlencoded({ extended: true }));
    
    // authentication
    var auth = new Authentication();
    auth.init();
    
    // routes
    var routes = new Routes();
    routes.init();
    
    // server
    var _server = http.createServer(express);
    _server.on('close', function () {
        self.emit('stopping', express.locals.httpAddress);
        express.locals.httpAddress = null;
    });
    _server.on('error', function (err) {
        express.locals.httpAddress = _server.address();
        self.emit('error', express.locals.httpAddress);
    });
    
    // socket io
    var _io = socketio(_server);
    _io.use(passportSocketIo.authorize(SessionConfig()));
    _io.on('connection', function (socket) {
        var user = JSON.stringify(socket.request.user);

        //console.log('Your User ID is', user);
    });

    // exposed stuff
    self.start = function () { 
        _server.listen(_port, function () {
            express.locals.httpAddress = { address: helpers.ip.getIP('ipv4'), port: _port }; //_server.address();
            self.emit('started', express.locals.httpAddress);
        });
    }
    self.stop = function () { 
        _server.close(function () {
            self.emit('stopped', express.locals.httpAddress);
        });
    }

}
util.inherits(factory, events.EventEmitter);
module.exports = new factory();

