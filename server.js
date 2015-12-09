var factory = function () {
    var self = this;
    
    self.update = require('./src/update');
    self.update.bootstrap(function () { 
        self.app = require('./src/app');
        self.app.start();
    });
}
module.exports = new factory();
