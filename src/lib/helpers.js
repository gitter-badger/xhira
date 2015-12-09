var events = require('events');
var fs = require('fs');
var path = require('path');
var util = require('util');

var lodash = require('lodash');
var moment = require('moment');
var nconf = require('nconf');
var q = require('q');
var semver = require('semver');
var uuid = require('uuid');
var winston = require('winston');

var ip = require('./ip.js');

// Configuration
var Configuration = function () {
    var self = this;
    
    // initialize
    if (!fs.existsSync('data')) { fs.mkdirSync('data'); }
    nconf.env('-');
    nconf.argv();
    nconf.file({ file: 'data/config.json' });
    
    self.get = function (key, def) {
        var value = nconf.get(key);
        if (!value) {
            self.set(key, def);
            value = def;
        }
        return value;
    }
    self.reset = function () {
        nconf.reset();
        nconf.save();
    }
    self.set = function (key, value) {
        nconf.set(key, value);
        nconf.save();
    }
}
util.inherits(Configuration, events.EventEmitter);

// Logger
var Logger = function () {
    var self = this;
    var defaultLevel = 'info';
    
    if (!fs.existsSync('logs')) { fs.mkdirSync('logs'); }
    var logger = new winston.Logger({ transports: [
            new (winston.transports.Console)({ colorize: true, level: defaultLevel }),
            new (winston.transports.File)({ colorize: true, filename: './logs/main.log', level: defaultLevel })
        ] });
    
    function _log(level, msg, meta) {
        var _level = level || defaultLevel;
        if (meta) { 
            logger.log(_level, msg, meta);
        } else { 
            logger.log(_level, msg);
        }
    }

    self.debug = function (msg, meta) {
        _log('debug', msg, meta);
    }
    self.error = function (msg, meta) { 
        _log('error', msg, meta);
    }
    self.info = function (msg, meta) {
        _log('info', msg, meta);
    }
    //self.log = function (level, msg, meta) {
    //    _log(level, msg, meta);
    //}
    self.silly = function (msg, meta) {
        _log('silly', msg, meta);
    }
    self.verbose = function (msg, meta) {
        _log('verbose', msg, meta);
    }  
    self.warn = function (msg, meta) {
        _log('warn', msg, meta);
    }    

}
util.inherits(Logger, events.EventEmitter);

// Utility
var Utility = function () {
    var self = this;
    
    self.createUUID = function () {
        return uuid.v1();
    }
    self.getPackageInfo = function () {
        var appDir = path.dirname(require.main.filename);
        var pkg = JSON.parse(fs.readFileSync(appDir + '/package.json', 'utf8'));
        return pkg;
    }
    

}
util.inherits(Utility, events.EventEmitter);

// Module
var factory = function () {
    this._ = lodash;
    this.Configuration = new Configuration();
    this.ip = ip;
    this.log = new Logger();
    this.moment = moment;
    this.Q = q;
    this.util = new Utility();
    this.version = semver;
}
module.exports = new factory();
