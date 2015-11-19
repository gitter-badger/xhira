var events = require('events');
var util = require('util');

var ip = require('./ip');
var multicastdns = require('multicast-dns');
var os = require('os');

var factory = function () {
    var self = this;
    var mdns = multicastdns({ ip: '224.0.0.251', port: 5353, ttl: 255, multicast: true, loopback: true, reuseAddr: true });
    var mdnsResponse = [];
    var services = [];
    
    function doQuery() { 
        mdns.query('_services._dns-sd._udp.local', 'PTR');
    }
    function doRespond() {
        mdns.response(getResponse());
    }
    function getResponse() { 
        return mdnsResponse;
    }
    function needResponse(name, type) {
       
        if (name == '_services._dns-sd._udp.local' && (type == 'PTR' || type == 'ANY')) { return true; }
        
        var recs = getResponse().filter(function (item) { return (item.name == name && (item.type == type || type == 'ANY')); });
        if (recs.length > 0) { return true; }

        return false;
    }
    function updateResponse() {
        var response = [];
        
        if (services.length > 0) { 
            // A / AAAA record
            var respA = { name: os.hostname() + '.local', type: 'A', ttl: 60, class: 32769, data: ip.getIP('ipv4') };
            response.push(respA);
            var respAAAA = { name: os.hostname() + '.local', type: 'AAAA', ttl: 60, class: 32769, data: ip.getIP('ipv6') };
            response.push(respAAAA);
            // SVC records
            services.forEach(function (svc) {
                var svcName = svc.name + '._' + svc.type + '._tcp.local';
                var svcData = { target: respA.name, port: svc.port };
                response.push({ name: svcName, type: 'SRV', ttl: 60, class: 32769, data: svcData });
            });
            // TXT records
            services.forEach(function (svc) {
                var txtName = svc.name + '._' + svc.type + '._tcp.local';
                var txtData = 'txtvers=1';
                response.push({ name: txtName, type: 'TXT', ttl: 60, class: 32769, data: txtData });
            });
            // PTR records
            services.forEach(function (svc) {
                var ptrName = '_' + svc.type + '._tcp.local';
                var ptrData = svc.name + '.' + ptrName;
                response.push({ name: ptrName, type: 'PTR', ttl: 7200, class: 1, data: ptrData });
            });
        }
        
        mdnsResponse = response;
        return response;
    }
    
    mdns.on('query', function (query) {
        var respond = false;
        query.questions.forEach(function (q) {
            //console.log('Q => ' + JSON.stringify(q));
            if (respond == false && needResponse(q.name, q.type) == true) { respond = true; }
        });
        if (respond) { doRespond(); }
    });
    mdns.on('response', function (response) {
        //console.log('RESPONSE: ' + JSON.stringify(response));
        for (var i = 0; i < response.answers.length; i++) {
            var a = response.answers[i]
            //console.log('R => ' + JSON.stringify(a));
        }
    });
    
    self.browse = function () {
        
        // optional callback to wait for result
        // use setTimeout to trigger callback when no result came back
        // store timer/query/callback in factory variable for lookup by the response-event
        // when response received,... detroy timer and call callback function

        doQuery();
    }
    self.addService = function (name, type, port) {
        if (!self.hasService(name, type, port)) {
            services.push({ name: name, type: type, port: port });
            updateResponse();
            doRespond();
        }
    }
    self.hasService = function (name, type, port) {
        var svcs = services.filter(function (value) { return (value.name == name && value.type == type && (value.port == port || port === undefined)); });
        return (svcs.length > 0);
    }    
    self.removeService = function (name, type, port) {
        services = services.filter(function (value) { return (value.name != name || value.type != type || value.port != port); });
        updateResponse();
    }
    self.destroy = function () { 
        mdns.destroy();
    }
}
util.inherits(factory, events.EventEmitter);
module.exports = new factory();
