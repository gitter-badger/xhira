var events = require('events');
var util = require('util');

var bodyParser = require('body-parser');
var express = require('express')();
var http = require('http');
var passport = require('passport');
var passportLocal = require('passport-local');
var session = require('express-session');

var helpers = require('./helpers.js');

// Routes
var Routes = function () {
    var self = this;

    function isAuthenticated(req, res, next) {
        if (req.user) {
            return next();
        } else {
            res.status(401).end();
        }
    }

    self.init = function () { 
    
        var myLogger = function (req, res, next) {
            console.log('LOGGED');
            next();
        };
        
        express.use(myLogger);
        
        var requestTime = function (req, res, next) {
            req.requestTime = Date.now();
            next();
        };
        
        express.use(requestTime);

        express.get('/', function (req, res) {

            var responseText = 'Hello World!<br>';
            responseText += '<small>Requested at: ' + req.requestTime + '</small>';
            res.send(responseText);
        });
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
    //    router.route('/auth/login').post(function (req, res) {
    //        var passport = req._passport.instance;
    //        passport.authenticate('local-login', function (err, user, info) {
    //            //if (err) { return next(err); }
    //            if (user) {
    //                req.logIn(user, function (err) {
    //                    if (!err) {
    //                        res.json({ result: true });
    //                    } else {
    //                        res.status(401).end();
    //                    }
    //                });
    //            } else {
    //                res.status(401).end();
    //            }
    //        })(req, res);

    //    });
    //    router.route('/auth/logout').get(function (req, res) {
    //        req.logOut();
    //        res.send('OK');
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

    //this.SSDP = function () {
    //    var router = express.Router();

    //    // desc
    //    router.route('/description').get(function (req, res) {
    //        res.json({ result: true });
    //    });

    //    return router;
    //}

    //this.Components = function () {
    //    return express.static('bower_components')
    //}
    //this.Root = function () {
    //    return express.static('public')
    //}
}

var Authentication = function () { 
    var self = this;
    
    self.init = function () { 
        passport.deserializeUser(function (id, done) {
            //User.findById(id, function (err, user) {
                done(err, { _id: 1, username: 'admin', password: 'admin' }); // done(err, user);
            //});
        });
        passport.serializeUser(function (user, done) {
            done(null, 1); // done(null, user._id);
        });
        passport.use('login', new passportLocal.Strategy({ passReqToCallback: true }, function (req, username, password, done) {
            var config = helpers.Configuration;
            var uname = config.get('authorization:username') || '';
            var pass = config.get('authorization:password') || '';
            var user = { id: 1, username: uname, password: pass };
        
            if (!uname) { return done(null, false); }
            var isNamePass = (uname == username && pass == password);
            if (!isNamePass) { return done(null, false); }
        
            return done(null, user);
        }));
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








