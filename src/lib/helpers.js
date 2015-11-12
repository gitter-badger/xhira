var events = require('events');
var fs = require('fs');
var util = require('util');

var lodash = require('lodash');
var nconf = require('nconf');
var pkginfo = require('pkginfo');
var q = require('q');
var uuid = require('uuid');
var winston = require('winston');

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
    self.log = function (level, msg, meta) {
        _log(level, msg, meta);
    }
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
    self.getModuleInfo = function (mod) {
        var m = mod || module;
        var info = pkginfo(m);
        return m.exports;
    }
    self.versionCompare = function (v1, v2, options) {
        var lexicographical = options && options.lexicographical,
            zeroExtend = options && options.zeroExtend,
            v1parts = v1.split('.'),
            v2parts = v2.split('.');
        
        function isValidPart(x) {
            return (lexicographical ? /^\d+[A-Za-z]*$/ : /^\d+$/).test(x);
        }
        
        if (!v1parts.every(isValidPart) || !v2parts.every(isValidPart)) {
            return NaN;
        }
        
        if (zeroExtend) {
            while (v1parts.length < v2parts.length) v1parts.push("0");
            while (v2parts.length < v1parts.length) v2parts.push("0");
        }
        
        if (!lexicographical) {
            v1parts = v1parts.map(Number);
            v2parts = v2parts.map(Number);
        }
        
        for (var i = 0; i < v1parts.length; ++i) {
            if (v2parts.length == i) {
                return 1;
            }
            
            if (v1parts[i] == v2parts[i]) {
                continue;
            }
            else if (v1parts[i] > v2parts[i]) {
                return 1;
            }
            else {
                return -1;
            }
        }
        
        if (v1parts.length != v2parts.length) {
            return -1;
        }
        
        return 0;
    }

}
util.inherits(Utility, events.EventEmitter);

// Module
var factory = function () {
    this._ = lodash;
    this.Configuration = new Configuration();
    this.Logger = new Logger();
    this.Q = q;
    this.Utility = new Utility();
}
module.exports = new factory();
