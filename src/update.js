var events = require('events');
var fs = require('fs');
var http = require('http');
var path = require('path');
var targz = require('tar.gz');
var util = require('util');

var npmi = require('npmi');
var request = require('request');

var helpers = require('./lib/helpers');

var _ = helpers._;
var config = helpers.Configuration;
var q = helpers.Q;

var factory = function () {
    var self = this;

    function checkConfigUpdate() {
        var state = config.get('update:state') || {};
        
        
        if (state.action == 'test') { 

            var options = {
                name: 'xhira',          // your module name
                version: 'latest',      // expected version [default: 'latest']
                path: '.',              // installation path [default: '.']
                forceInstall: false,    // force install if set to true (even if already installed, it will do a reinstall) [default: false]
                npmLoad: {
                    // npm.load(options, callback): this is the "options" given to npm.load()
                    loglevel: 'silent'  // [default: {loglevel: 'silent'}]
                }
            };
            npmi(options, function (err, result) {
                if (err) {
                    if (err.code === npmi.LOAD_ERR) console.log('npm load error');
                    else if (err.code === npmi.INSTALL_ERR) console.log('npm install error');
                    return console.log(err.message);
                }
                
                // installed
                console.log(options.name + '@' + options.version + ' installed successfully in ' + path.resolve(options.path));
            });

        } else if (state.action == 'install') { 
            // install the downloaded update

            console.log('INSTALL');

        } else if (state.action == 'validate') { 
            // check downloaded version files
            if (state.version && state.folder) {
                validateUpdate(state.version, state.folder).then(function () {
                    config.set('update:state', { action: 'install', version: state.version, folder: state.folder });
                }).catch(function () {
                    config.set('update:state', {});
                });
            } else {
                config.set('update:state', {});
            }
        } else if (state.action == 'extract') {
            // extract the downloaded update
            if (state.version && state.file) {
                extractUpdate(state.file).then(function (folder) {
                    fs.unlink(state.file, function () { 
                        config.set('update:state', { action: 'validate', version: state.version, folder: folder });
                    });
                }).catch(function () {
                    config.set('update:state', {});
                });
            } else {
                config.set('update:state', {});
            }
        } else if (state.action == 'download') { 
            // download the available update
            if (state.version && state.location) {
                downloadUpdate(state.version, state.location).then(function (result) { 
                    config.set('update:state', { action: 'extract', version: state.version, file: result.file });
                }, function () { 
                    config.set('update:state', {});
                });
            } else { 
                config.set('update:state', {});
            }
        } else if (state.action == 'check') { 
            // check if there is a new version
            checkForUpdate().then(function (data) {
                if (data.update.available) {
                    config.set('update:state', { action: 'download', version: data.version.update, location: data.update.file });
                } else { 
                    config.set('update:state', { });
                }
            });            
        } else {
            // nothing specific to do
            // scheduled check????
            // => if (update.nextCheck && helpers.moment.utc(update.nextCheck) <= helpers.moment.utc()) {
        }
  
    }
    function checkForUpdate() {
        var def = q.defer();

        var appDir = path.dirname(require.main.filename);
        var pkg = JSON.parse(fs.readFileSync(appDir + path.sep + 'package.json', 'utf8'));
        var url = 'http://registry.npmjs.org/' + pkg.name;
        var options = { url: url, headers: { 'Content-Type': 'application/json' } };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                config.set('update:nextCheck', '');
                var tag = config.get('update:tag') || 'latest';
                var npm = JSON.parse(body);
                var version = npm['dist-tags'][tag] || npm['dist-tags'].latest;
                var result = {
                    version: { current: pkg.version, update: version },
                    update: {
                        available: true, //helpers.version.lt(pkg.version, version),
                        file: npm.versions[version].dist.tarball
                    }
                };
                def.resolve(result);            
            } else { 
                def.reject();
            }
        });
                
        return def.promise;
    }
    function downloadUpdate(version, url) {
        var def = q.defer();
    
        if (!fs.existsSync('updates')) { fs.mkdirSync('updates'); }
    
        var downloadPath = path.dirname(require.main.filename) + path.sep + 'updates';
        var downloadFile = version + path.extname(url);
        var downloadPathFile = downloadPath + path.sep + downloadFile;
        request.get(url)
        .on('response', function (response) {
            def.resolve({ file: downloadPathFile });
        })
        .on('error', function (err) { 
            def.reject(err);
        })
        .pipe(fs.createWriteStream(downloadPathFile));

        return def.promise;
    }
    function extractUpdate(file) {
        var def = q.defer();
    
        var objFile = path.parse(file);
        var folder = objFile.dir + path.sep + objFile.name;
        targz().extract(file, folder).then(function () {
            def.resolve(folder);
        }).catch(function (err) {
            def.reject(err);
        });
    
        return def.promise;
    }
    function postInstall() {
        var def = q.defer();

        var currVersion = helpers.util.getPackageInfo().version;
        var lastVersion = config.get('node:version') || '0.0.0';
        if (helpers.version.eq(lastVersion, currVersion)) {
            // already updated
            def.resolve();
        } else if (helpers.version.lte(lastVersion, '0.0.1')) {
            // initial new version.. clean config
            config.reset();
            if (!config.get('node:uuid')) { config.set('node:uuid', helpers.util.createUUID()) };
            if (!config.get('auth:user')) { config.set('auth:user', 'admin') };
            if (!config.get('auth:pass')) { config.set('auth:pass', 'admin') };
            if (!config.get('update:type')) { config.set('update:type', 'auto') };
            if (!config.get('update:tag')) { config.set('update:tag', 'latest') };
            config.set('node:version', '0.0.1'); 
            return postInstall();
        } else { 
            // upgrade failed somehow... incorrect version number
            def.reject();
        }
        return def.promise;
    }
    function validateUpdate(version, folder) {
        var def = q.defer();
        
        try {
            pkgFile = folder + path.sep + 'package' + path.sep + 'package.json';
            var pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
            if (version == pkg.version) { 
                def.resolve();
            } else {
                def.reject();
            }
        } catch (err) {
            def.reject();
        }
        
        return def.promise;
    }
    
    function watchConfig() { 
        // watch for changes in de update section of the config file
        fs.watchFile('data/config.json', { interval : 500 }, function (curr, prev) {
            if (curr.mtime.valueOf() != prev.mtime.valueOf() || curr.ctime.valueOf() != prev.ctime.valueOf()) {
                checkConfigUpdate();
            }
        });
        checkConfigUpdate();
    }

    self.bootstrap = function (done) {
        postInstall().then(function () { 
            if (done) { done(); }
        });
    }

    watchConfig();
}
util.inherits(factory, events.EventEmitter);
module.exports = new factory();

