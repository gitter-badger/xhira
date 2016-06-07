import * as fs from 'fs';
import * as nconf from 'nconf';

export function getValue () : string {
    return __dirname;
}

export function get (key: string, def: any) {
    let value = nconf.get(key);    
    if (value != null) {
        
        
    }

//         if (!value) {
//             this.set(key, def);
//             value = def;
//         }
//         return value;
    
}

console.log('Configuration initialized..');

// var events = require('events');
// var util = require('util');

// var _ = require('lodash');
// var nconf = require('nconf');
// var PouchDB = require('pouchdb');
// var PouchFind = require('pouchdb-find'); 
// var Q = require('q');

// var helpers = require('./helpers');
// var logger = require('./logger');

// // Configuration
// var Configuration = function () {
    
//     if (!fs.existsSync('data')) { fs.mkdirSync('data'); }
//     nconf.env('-');
//     nconf.argv();
//     nconf.file({ file: './data/config.json' });
    
//     this.get = function (key, def) {
//         var value = nconf.get(key);
//         if (!value) {
//             this.set(key, def);
//             value = def;
//         }
//         return value;
//     }
//     this.reset = function () {
//         nconf.reset();
//         nconf.save();
//     }
//     this.set = function (key, value) {
//         nconf.set(key, value);
//         nconf.save();
//     }
// }