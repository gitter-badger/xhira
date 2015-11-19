var events = require('events');
var util = require('util');

var bodyParser = require('body-parser');
var Express = require('express');
var http = require('http');
var passport = require('passport');
var passportLocal = require('passport-local');
var passportLocalApiKey = require('passport-localapikey');
var session = require('express-session');

var helpers = require('./helpers.js');
var _ = helpers._;

var express = Express();

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

        //router.all('/test', checkAuthentication);
        //router.get('/test', function (req, res) {
        //    sendResponse(res, { message: 'SECURE Message' });
        //});
        router.get('/', function (req, res) {
            var data = {
                version: '1.0.0',
                name: 'Xhira'
            };
            sendResponse(res, { data: data });
        });
        router.get('/location.json', function (req, res) {
            var data = {
                local: false
            };
            sendResponse(res, { data: data });
        });
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
    
        var myLogger = function (req, res, next) {
            console.log('USER: ' + JSON.stringify(req.user) + ' (' + Date.now() + ')');
            next();
        };
        express.use(myLogger);
        
        // API
        express.use('/api', routerAPI());
        
        // ROOT
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
                var config = helpers.Configuration;
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
            var config = helpers.Configuration;
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
                var config = helpers.Configuration;
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

        var secret = helpers.Configuration.get('services:web:sessionSecret', helpers.Utility.createUUID());
        express.use(session({ secret: secret, saveUninitialized: true, resave: true }));
        express.use(passport.initialize());
        express.use(passport.session());    
    }

}

var factory = function () {
    var self = this;
    var _address = null;
    var _port = 26501;

    // parsers
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
        self.emit('stopping', _address);
        _address = null;
    });
    _server.on('error', function (err) {
        _address = _server.address();
        self.emit('error', _address);
    });
    
    // exposed stuff
    self.start = function () { 
        _server.listen(_port, function () {
            _address = _server.address();
            self.emit('started', _address);
        });
    }
    self.stop = function () { 
        _server.close(function () {
            self.emit('stopped', _address);
        });
    }

}
util.inherits(factory, events.EventEmitter);
module.exports = new factory();

