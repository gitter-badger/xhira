var events = require('events');
var util = require('util');

var ssdp = require('node-ssdp-lite');

var factory = function () {
    var self = this;
    var _client = new ssdp();

    _client.on('notify', function () {
        console.log('Got a notification.');
    });
    _client.on('response', function (msg, rinfo) {
        if (rinfo.address == '192.168.1.62' || rinfo.address == '10.0.0.7') { 
            console.log('Got a response to an m-search: ' + msg);
        }
    });
    //_client.search('urn:schemas-upnp-org:service:ContentDirectory:1');
    //_client.search('ssdp:all');
    //_client.search('urn:schemas-upnp-org:device:Basic:1');
    
    //var server = new ssdp();
    //server.addUSN('upnp:rootdevice');
    //server.addUSN('urn:schemas-upnp-org:device:MediaServer:1');
    //server.addUSN('urn:schemas-upnp-org:service:ContentDirectory:1');
    //server.addUSN('urn:schemas-upnp-org:service:ConnectionManager:1');
    //server.on('advertise-alive', function (heads) {
    //  // Expire old devices from your cache.
    //  // Register advertising device somewhere (as designated in http headers heads)
    //});
    //server.on('advertise-bye', function (heads) {
    //  // Remove specified device from cache.
    //});
    //// This should get your local ip to pass off to the server.
    //require('dns').lookup(require('os').hostname(), function (err, add) {
    //    server.server(add);
    //});
    
    

    self.destroy = function () {
        _client.destroy();
    }

}
util.inherits(factory, events.EventEmitter);
module.exports = new factory();
