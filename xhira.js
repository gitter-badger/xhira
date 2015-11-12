//var forever = require('forever-monitor');

//if (process.platform == 'win32') {
//    // start directly
//    var server = require('./server/main');
//} else {
//    // run forever
//    var server = new (forever.Monitor)('./server/main.js', { max: 3, silent: true, options: [] });
//    server.on('exit', function () {
//        console.log('Xhira has exited after 3 restarts');
//    });
//    server.start();
//}




//var pm2 = require('pm2');

//pm2.connect(function () {
//    pm2.start({
//        script    : './server/app.js',         // Script to be run
//        exec_mode : 'cluster',        // Allow your app to be clustered
//        instances : 4,                // Optional: Scale your app by 4
//        max_memory_restart : '100M'   // Optional: Restart your app if it reaches 100Mo
//    }, function (err, apps) {
//        // Get all processes running
//        pm2.list(function (err, process_list) {
//            console.log(process_list);
//            // Disconnect to PM2
//            pm2.disconnect(function () { process.exit(0) });
//        });
//        //pm2.disconnect();
//    });
//});


//// Connect or launch PM2
//pm2.connect(function (err) {
    
//    // Start a script on the current folder
//    pm2.start('./server/app.js', { name: 'Xhira' }, function (err, proc) {
//        if (err) throw new Error('err');
        
//        // Get all processes running
//        pm2.list(function (err, process_list) {
//            console.log(process_list);
            
//            // Disconnect to PM2
//            pm2.disconnect(function () { process.exit(0) });
//        });
//    });
//})


var upgrade = require('./src/upgrade');
var server;

// upgrade & configuration
if (upgrade.check()) {
    server = require('./src/app');
    server.start();
}

