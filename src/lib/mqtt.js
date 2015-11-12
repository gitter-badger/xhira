var events = require('events');
var util = require('util');

var mqtt = require('mqtt');


var Client = function () {
    var self = this;
    var client = mqtt.connect({ port: 26510, host: 'localhost', keepalive: 10000 });
    client.subscribe('presence');
    client.publish('presence', 'bin hier');
    client.on('message', function (topic, message) {
        console.log(message);
    });
    client.end();
    return client;
}
util.inherits(Client, events.EventEmitter);

var Server = function () {
    var self = this;
    var _address = null;
    var _port = 26510;
    var _clients = {};

    var _server = mqtt.Server();
    _server.on('client', function (client) { 
        client.on('connect', function (packet) {
            _clients[packet.clientId] = client;
            client.id = packet.clientId;
            console.log("CONNECT: client id: " + client.id);
            client.subscriptions = [];
            client.connack({ returnCode: 0 });
        });
        
        client.on('subscribe', function (packet) {
            var granted = [];
            
            console.log("SUBSCRIBE(%s): %j", client.id, packet);
            
            for (var i = 0; i < packet.subscriptions.length; i++) {
                var qos = packet.subscriptions[i].qos
                        , topic = packet.subscriptions[i].topic
                        , reg = new RegExp(topic.replace('+', '[^\/]+').replace('#', '.+') + '$');
                
                granted.push(qos);
                client.subscriptions.push(reg);
            }
            
            client.suback({ messageId: packet.messageId, granted: granted });
        });
        
        client.on('publish', function (packet) {
            console.log("PUBLISH(%s): %j", client.id, packet);
            for (var k in _clients) {
                var c = _clients[k];
                
                for (var i = 0; i < c.subscriptions.length; i++) {
                    var s = c.subscriptions[i];
                    
                    if (s.test(packet.topic)) {
                        c.publish({ topic: packet.topic, payload: packet.payload });
                        break;
                    }
                }
            }
        });
        
        client.on('pingreq', function (packet) {
            console.log('PINGREQ(%s)', client.id);
            client.pingresp();
        });
        
        client.on('disconnect', function (packet) {
            client.stream.end();
        });
        
        client.on('close', function (packet) {
            delete _clients[client.id];
        });
        
        client.on('error', function (e) {
            client.stream.end();
            console.log(e);
        });
    });
    _server.on('close', function () {
        self.emit('stopping', _address);
        _address = null;
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
util.inherits(Server, events.EventEmitter);

var factory = function () {
    var self = this;
    
    self.Client = Client;
    self.Server = new Server();

}
util.inherits(factory, events.EventEmitter);
module.exports = new factory();



//var Database = require('../persistence/mongo');
//var db = new Database();
//var isJson = require('../utils/common').isJson;
//var model = require('../models');
//var authCheck = require('../auth/basic');

//module.exports = function (app) {
//    'use strict';
//    return function (client) {
//        var userInfo = {};
//        var unsubscribeAll = function () {

//        };
        
//        client.on('connect', function (packet) {
//            client.id = packet.client;
//            if (packet.username === undefined || packet.password === undefined) {
//                return client.connack({
//                    returnCode: -1
//                });
//            }
//            client.id = packet.client;
//            var reqUserInfo = {
//                name: packet.username,
//                password: packet.password.toString()
//            };
            
//            var errorCB = function () {
//                client.connack({
//                    returnCode: -1
//                });
//            };
            
//            var successCB = function (user) {
//                userInfo = user;
//                client.connack({
//                    returnCode: 0
//                });
//            };
            
//            authCheck(reqUserInfo, errorCB, successCB, errorCB);
//        });
        
//        client.on('subscribe', function (packet) {
//            db.subscribe({ name: userInfo.name, token: userInfo.uid }, function (result) {
//                return client.publish({
//                    topic: userInfo.name.toString(),
//                    payload: JSON.stringify(result)
//                });
//            });
//        });
//        client.on('publish', function (packet) {
//            var payload = { name: userInfo.name, token: userInfo.uid, data: packet.payload.toString() };
//            db.insert(payload);
//        });
//        client.on('pingreq', function (packet) {
//            return client.pingresp();
//        });
//        client.on('disconnect', function () {
//            return client.stream.end();
//        });
//        client.on('error', function (error) {
//            return client.stream.end();
//        });
//        client.on('close', function (err) {
//            return unsubscribeAll();
//        });
//        return client.on('unsubscribe', function (packet) {
//            return client.unsuback({
//                messageId: packet.messageId
//            });
//        });
//    };
//};




/*
 * 
 * Publish/Subscribe

The MQTT protocol is based on the principle of publishing messages and subscribing to topics, or "pub/sub". Multiple clients connect to a broker 
 * and subscribe to topics that they are interested in. Clients also connect to the broker and publish messages to topics. Many clients may subscribe 
 * to the same topics and do with the information as they please. The broker and MQTT act as a simple, common interface for everything to connect to. 
 * This means that you if you have clients that dump subscribed messages to a database, to Twitter, Cosm or even a simple text file, then it becomes 
 * very simple to add new sensors or other data input to a database, Twitter or so on.

Topics/Subscriptions

Messages in MQTT are published on topics. There is no need to configure a topic, publishing on it is enough. Topics are treated as a hierarchy, using 
 * a slash (/) as a separator. This allows sensible arrangement of common themes to be created, much in the same way as a filesystem. For example, multiple 
 * computers may all publish their hard drive temperature information on the following topic, with their own computer and hard drive name being replaced 
 * as appropriate:

sensors/COMPUTER_NAME/temperature/HARDDRIVE_NAME

Clients can receive messages by creating subscriptions. A subscription may be to an explicit topic, in which case only messages to that topic will be 
 * received, or it may include wildcards. Two wildcards are available, + or #.

+ can be used as a wildcard for a single level of hierarchy. It could be used with the topic above to get information on all computers and hard drives 
 * as follows:

sensors/+/temperature/+

As another example, for a topic of "a/b/c/d", the following example subscriptions will match:

a/b/c/d
+/b/c/d
a/+/c/d
a/+/+/d
+/+/+/+

The following subscriptions will not match:

a/b/c
b/+/c/d
+/+/+

# can be used as a wildcard for all remaining levels of hierarchy. This means that it must be the final character in a subscription. With a topic 
 * of "a/b/c/d", the following example subscriptions will match:

a/b/c/d
#
a/#
a/b/#
a/b/c/#
+/b/c/#

Zero length topic levels are valid, which can lead to some slightly non-obvious behaviour. For example, a topic of "a//topic" would correctly match against 
 * a subscription of "a/+/topic". Likewise, zero length topic levels can exist at both the beginning and the end of a topic string, so "/a/topic" would 
 * match against a subscription of "+/a/topic", "#" or "/#", and a topic "a/topic/" would match against a subscription of "a/topic/+" or "a/topic/#".

Quality of Service

MQTT defines three levels of Quality of Service (QoS). The QoS defines how hard the broker/client will try to ensure that a message is received. Messages 
 * may be sent at any QoS level, and clients may attempt to subscribe to topics at any QoS level. This means that the client chooses the maximum QoS it 
 * will receive. For example, if a message is published at QoS 2 and a client is subscribed with QoS 0, the message will be delivered to that client with 
 * QoS 0. If a second client is also subscribed to the same topic, but with QoS 2, then it will receive the same message but with QoS 2. For a second 
 * example, if a client is subscribed with QoS 2 and a message is published on QoS 0, the client will receive it on QoS 0.

Higher levels of QoS are more reliable, but involve higher latency and have higher bandwidth requirements.

0: The broker/client will deliver the message once, with no confirmation.

1: The broker/client will deliver the message at least once, with confirmation required.

2: The broker/client will deliver the message exactly once by using a four step handshake.

Retained Messages

All messages may be set to be retained. This means that the broker will keep the message even after sending it to all current subscribers. If a new 
 * subscription is made that matches the topic of the retained message, then the message will be sent to the client. This is useful as a "last known 
 * good" mechanism. If a topic is only updated infrequently, then without a retained message, a newly subscribed client may have to wait a long time 
 * to receive an update. With a retained message, the client will receive an instant update.

Clean session / Durable connections

On connection, a client sets the "clean session" flag, which is sometimes also known as the "clean start" flag. If clean session is set to false, then 
 * the connection is treated as durable. This means that when the client disconnects, any subscriptions it has will remain and any subsequent QoS 1 or 
 * 2 messages will be stored until it connects again in the future. If clean session is true, then all subscriptions will be removed for the client when 
 * it disconnects.

Wills

When a client connects to a broker, it may inform the broker that it has a will. This is a message that it wishes the broker to send when the client 
 * disconnects unexpectedly. The will message has a topic, QoS and retain status just the same as any other message.
 * 
 * 
 * 
 */