var events = require('events');
var util = require('util');

var helpers = require('./lib/helpers');
var _ = helpers._;

var factory = function () {
    var config = helpers.Configuration;
    var verCurrent = helpers.Utility.getModuleInfo(module).version;
    
    function upgrade(from, to, action) {
        var verFrom = (_.isArray(from)) ? from : [from];
        var verTo = to;
        var verLast = config.get('app:version') || '0.0.0';
        var compare = helpers.Utility.versionCompare;
        if (compare(_.first(verFrom), verLast) <= 0 && compare(verLast, _.last(verFrom)) <= 0 && action) {
            var res = action() || false;
            if (res) {
                config.set('app:version', verTo);
            }
            return res;
        } else {
            return false;
        }
    }
    
    this.check = function () {
        // upgrade path
        upgrade(['0.0.0'], '0.0.1', function () {
            // initial new version.. clean config
            config.reset();    
            if (!config.get('app:uuid')) { config.set('app:uuid', helpers.Utility.createUUID()) };
            return true;
        });
        // last check
        var verLast = config.get('app:version') || '0.0.0';
        return (helpers.Utility.versionCompare(verLast, verCurrent) == 0);
    }
}
util.inherits(factory, events.EventEmitter);
module.exports = new factory();
