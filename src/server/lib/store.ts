/// <reference path="../../../typings/index.d.ts" />

import * as fs from 'fs';




// var events = require('events');
// var fs = require('fs');
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

// // Data Store
// function Store() {
//     var self = this;
//     var options = {
//         name: 'store',
//         prefix: './data/'
//     };
//     PouchDB.plugin(PouchFind);
//     var db = new PouchDB(options);
//     var changes = null;

//     function getMultiple(obj) {
//         var def = Q.defer();

//         var params = { attachments: true, include_docs: true };
//         if (obj.start) {
//             params.startkey = obj.start;
//             if (obj.end && obj.end == obj.start) {
//                 params.endkey = obj.end + '\uffff';
//             } else if (obj.end) {
//                 params.endkey = obj.end;
//             } else { 
//                 params.endkey = obj.start + '\uffff';
//             }
//         }
//         if (obj.skip) { params.skip = obj.skip; }
//         if (obj.limit) { params.limit = obj.limit; }

//         db.allDocs(params).then(function (docs) {
//             def.resolve(docs);
//         }).catch(function (err) {
//             if (err.status == 404) {
//                 def.resolve(null);
//             } else {
//                 def.reject();
//             }
//         });

//         return def.promise;
//     }
//     function getSingle (id) {
//         var def = Q.defer();
//         db.get(id).then(function (doc) {
//             def.resolve(doc);
//         }).catch(function (err) {
//             if (err.status == 404) {
//                 def.resolve(null);
//             } else {
//                 def.reject();
//             }
//         });
//         return def.promise;
//     }
//     function updateSingle(doc, options) {
//         var opt = _.defaults(options || {}, { merge: true });
//         return db.get(doc._id).then(function (origDoc) {
//             var updated = (opt.merge) ? _.defaultsDeep(doc, origDoc) : doc;
//             var newDoc = _.omit(updated, ['_id', '_rev']);
//             return db.put(newDoc, origDoc._id, origDoc._rev);
//         }).catch(function (err) {
//             if (err.status === 409) {
//                 return updateSingle(doc, options);
//             } else {
//                 return db.put(doc);
//             }
//         });
//     }

//     this.config = new Configuration();
//     this.create = function (data, options) {
//         var opt = _.assignIn(options || {}, { create: true, merge: false });
//         return this.update(data, opt);
//     }
//     this.find = function (options) {
//         var def = Q.defer();
//         db.find(options).then(function (result) {
//             def.resolve(result);
//         }).catch(function (err) {
//             def.reject(err);
//         });
//         return def.promise;
//     }
//     this.get = function (id) {
//         if (_.isObject(id)) { 
//             return getMultiple(id);
//         } else { 
//             return getSingle(id);
//         }
//     }
//     this.getSystemTopic = function () {
//         return 'xhira/' + this.config.get('system:uuid');
//     }    
//     this.init = function (callback) {
        
//         logger.log('verbose', 'Initializing storage.');

//         db.createIndex({
//             index: { name: 'idx-device-full-code', fields: ['plugin', 'type', 'code'] }
//         });

//         changes = db.changes({
//             since: 'now',live: true, include_docs: true
//         }).on('change', function (change) {
//             logger.log('debug', 'STORE CHANGE >> ' + change.id);
//             self.emit('change', change);
//         }).on('complete', function (info) {
//             //
//         }).on('error', function (err) {
//             //
//         });

//         PouchDB.sync('store', 'http://localhost:5984/xhira', { live: true, retry: true } // TODO
//         ).on('change', function (info) {
//             logger.log('debug', 'sync change, info: ' + JSON.stringify(info));
//         }).on('paused', function () {
//             logger.log('debug', 'sync paused');
//         }).on('active', function () {
//             logger.log('debug', 'sync active');
//         }).on('denied', function (info) {
//             logger.log('debug', 'sync denied, info: ' + JSON.stringify(info));
//         }).on('complete', function (info) {
//             logger.log('debug', 'sync complete, info: ' + JSON.stringify(info));
//         }).on('error', function (err) {
//             logger.log('debug', 'sync error');
//         });

//         if (callback) { callback(); }
//     }
//     this.isEqual = function (doc1, doc2, options) { 
//         var opt = _.defaults(options || {}, { dataOnly: true });
//         var propsOmit = ['_id', '_rev'];
//         var doc1chk = (opt.dataOnly) ? _.omit(doc1, propsOmit) : doc1;
//         var doc2chk = (opt.dataOnly) ? _.omit(doc2, propsOmit) : doc2;
//         return _.isEqual(doc1chk, doc2chk);
//     }
//     this.update = function (data, options) {
//         var def = Q.defer();
//         var opt = _.defaults(options || {}, { onlyWhenDifferent: false });
//         if (opt.onlyWhenDifferent) {
//             getSingle(data._id).then(function (currDoc) {
//                 if (!self.isEqual(data, currDoc)) {
//                     updateSingle(data, options).then(function (doc) {
//                         def.resolve(doc);
//                     }).catch(function (err) {
//                         def.reject(err);
//                     });
//                 } else { 
//                     def.resolve(currDoc);
//                 }
//             });
//         } else { 
//             updateSingle(data, options).then(function (doc) {
//                 def.resolve(doc);
//             }).catch(function (err) {
//                 def.reject(err);
//             });        
//         }

//         return def.promise;
//     }
// }
// util.inherits(Store, events.EventEmitter);


// module.exports = new Store();
