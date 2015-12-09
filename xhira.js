/*
 * node-windows
 * node-mac
 * node-linux
 */

var fs = require('fs');
var childproc = require('child_process');

var server;

function getConfig() {
    var res = {};
    try {
        var cfg = require('./data/config.json');
        return cfg;
    } catch (err) {
        return {};
    }
}
function watchConfig() { 
    fs.watchFile('./data/config.json', { interval : 500 }, function (curr, prev) {
        if (curr.mtime.valueOf() != prev.mtime.valueOf() || curr.ctime.valueOf() != prev.ctime.valueOf()) {
            var config = getConfig();
            if (config.update && config.update.state) {
                if (config.update.state.action == 'restart') { 
                    if ()
                }
            }
        }
    });
}
function isDebug() { 
    var debug = typeof v8debug === 'object';
    return debug;
}

function start() {
    if (isDebug()) { 
        server = require('./server');
    } else { 
        server = childproc.spawn(process.argv[0], ['server.js']);
        server.stdout.addListener('data', function (data) {
            process.stdout.write(data);
        });
        server.stderr.addListener('data', function (data) {
            process.stderr.write(data);
        });
        server.addListener('exit', function (code) {
            server = null;
            start();
        });

    }
}

function stop() { 
    if (server) { server.kill(); }
}

start();




//setTimeout(function () {
//    stop();
//}, 10000);




