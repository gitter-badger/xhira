/*
 * TCP/UDP port range to use: 26500-26999
 * 
 * TODO
 * - 
 * 
 * 
 */

var helpers = require('./lib/helpers');

var factory = function () {
    var self = this;
    
    // Data stores
    var store = require('./lib/datastore.js').store;        
    
    // mDNS service
    var mdns = require('./lib/mdns.js');
    
    // Web service
    var web = require('./lib/web.js');
    web.on('started', function (data) {
        helpers.Logger.info('Web Service listening (' + data.address + ':' + data.port + ')');
        mdns.addService('Xhira', 'xhira', 25600);
        mdns.addService('Xhira', 'http', data.port);
    });
    web.on('error', function (data) {
        helpers.Logger.error('Web Service start FAILED!');
    });
    web.on('stopping', function (data) {
        helpers.Logger.error('Web Service stopping');
        mdns.removeService('Xhira', 'http', data.port);
        mdns.removeService('Xhira', 'xhira', 25600);
    });    
    
    // MQTT Service
    var mqtt = require('./lib/mqtt.js');
    var mqttServer = mqtt.Server;
    mqttServer.on('started', function (data) {
        helpers.Logger.info('MQTT Service listening (' + data.address + ':' + data.port + ')');
        mdns.addService('Xhira', 'mqtt', data.port);
    });
    mqttServer.on('stopping', function (data) {
        helpers.Logger.error('MQTT Service stopping');
        mdns.removeService('Xhira', 'mqtt', data.port);
    });    

    // public
    self.start = function () {
        web.start();
        
        
        

        mqttServer.start();

        
        // --
        //setTimeout(function () { 
        //    var c = require('./lib/mqtt.js').Client();
        //}, 2000);
        // --
        //setTimeout(function () {
        //    self.stop();
        //}, 10000);
        // --
    }
    self.stop = function () {
        mqttServer.stop();
        web.stop();
    }

}
module.exports = new factory();

