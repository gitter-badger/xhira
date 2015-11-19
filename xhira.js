/*
 * node-windows
 * node-mac
 * node-linux
 * 
 */


var upgrade = require('./src/upgrade');
var server;

// upgrade & configuration
if (upgrade.check()) {
    server = require('./src/app');
    server.start();
}

process.on('exit', function () {
    server.stop();
})