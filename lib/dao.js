var MongoClient = require('mongodb').MongoClient;
var BSON = require('mongodb').BSONPure;
var path = require('path');
var _ = require('lodash');
var async = require('async');
var _db = null;

// 'enum' of transaction states
var TrStates = {
  INITIAL: 'Initial',
  PENDING: 'Pending',
  COMMITTED: 'Committed',
  DONE: 'Done'
};


// checkConnection takes an asynchronous function as argument
// and returns a node.js style callback wich fails if the db is not connected
// otherwise it apply the given function
var _checkConnection = exports._checkConnection = function(fn) {
  return function() {
    var cb = arguments[arguments.length-1];
    if (_db) fn.apply(this, arguments);
    else {
      console.log("log the error here");
      process.nextTick(function() {
        cb("Not connected to the database !");
      });
    }
  };
};

// Connection to the database. Expect a path to the config file and a callback.
// The root of the path is the location of the node process
exports.connect = function(configPath, cb) {
  var config = require(configPath);
  var defaultConfig = {
    port: 27017,
    host: "localhost",
    db: "test"
  };
  config = _.extend(defaultConfig, config);

  var url = "mongodb://"+config.host+":"+config.port+"/"+config.db;
  console.log(url);

  MongoClient.connect(url, function(err, db) {
    _db = db;
    if(_.isFunction(cb)) cb(err);
  });
};

// stuff here for testing and prototyping purpose, create the collections
// and make sure we have some accounts there
exports.initDB = _checkConnection(function(cb) {
  accounts = _db.collection('accounts');

  A = {
    owner: 'A',
    account_number: '314159',
    balance: 100,
    pendingTransactions: []
  };
  
  B = {
    owner: 'B',
    account_number: '271828',
    balance: 100,
    pendingTransactions: []
  };

  async.parallel([
    function(callback) {
      accounts.update({owner: 'B'}, B, { w:1, upsert: true}, callback);
    },
    function(callback) {
      accounts.update({owner: 'A'}, A, { w:1, upsert: true}, callback);
    }
  ], cb);

});

exports.findAllAccount = _checkConnection(function(cb) {
  _db.collection('accounts').find().toArray(cb);
});

var _createTransaction = exports._createTransaction = _checkConnection(function(sourceId, destId, amount, cb) {
  var tr = {
    source_id: sourceId,
    dest_id: destId,
    amount: amount,
    state: TrStates.INITIAL
  };
  _db.collection('transactions').insert(tr, {w:1}, function(err, trs) {
    if(err) cb(err);
    else cb(null, trs[0]);
  });
});

var _beginTransaction = exports._beginTransaction = _checkConnection(function(tr, cb) {
  console.log("beginning transaction with id: "+tr._id);
  console.dir(tr);
  _db.collection('transactions').update(
    {_id: new BSON.ObjectID(tr._id.toString())},
    {$set: {state: TrStates.PENDING}},
    {w: 1},
    function(err) { cb(err, tr); }
  );
});

var _applyTransaction = exports._applyTransaction = _checkConnection(function(tr, cb) {
  var accounts = _db.collection('accounts');

  console.log("applying transaction from "+tr.source_id+" to "+tr.dest_id+" with ammount: "+tr.amount);
  async.parallel([
    function(callback) {
      accounts.update(
        {_id: new BSON.ObjectID(tr.source_id.toString()), pendingTransactions: {$ne: tr._id}},
        {$inc: {balance: -tr.amount}, $push: {pendingTransactions: tr._id}},
        {w: 1},
        callback
      );
    } , function(callback) {
      accounts.update(
        {_id: new BSON.ObjectID(tr.dest_id.toString()), pendingTransactions: {$ne: tr._id}},
        {$inc: {balance: tr.amount}, $push: {pendingTransactions: tr._id}},
        {w: 1},
        callback
      );
    }], function(err) {
      if(err) cb(err);
      else cb(null, tr);
  });
});

var _commitTransaction = exports._commitTransaction = function(tr, cb) {
  console.log("commit transaction with id: "+tr._id);
  console.dir(tr);
  _db.collection('transactions').update(
    {_id: new BSON.ObjectID(tr._id.toString())},
    {$set: {state: TrStates.COMMITTED}},
    {w: 1},
    function(err) { cb(err, tr); }
  );
};

var _removePendingTransaction = exports._removePendingTransaction = function(tr, cb) {
  var accounts = _db.collection('accounts');

  async.parallel([
    function(callback){
      accounts.update(
        {_id: new BSON.ObjectID(tr.source_id.toString())},
        {$pull: {pendingTransactions: tr._id}},
        {w: 1},
        callback
      );
    },
    function(callback) {
      accounts.update(
        {_id: new BSON.ObjectID(tr.dest_id.toString())},
        {$pull: {pendingTransactions: tr._id}},
        {w: 1},
        callback
      );
    }],
    function(err) {
      if(err) cb(err);
      else cb(null, tr);
  });

};

var _terminateTransaction = exports._terminateTransaction = function(tr, cb) {
  console.log("set transaction with id: "+tr._id+" to done");
  console.dir(tr);
  _db.collection('transactions').update(
    {_id: new BSON.ObjectID(tr._id.toString())},
    {$set: {state: TrStates.DONE}},
    {w: 1},
    function(err) { cb(err, tr); }
  );
};

// @args sourceId: String or BSON.ObjectID
// @args destId: String or BSON.ObjectID
// @args amount: Number
exports.transfer = function(sourceId, destId, amount, cb) {
  if(! (sourceId instanceof BSON.ObjectID))
    sourceId = new BSON.ObjectID(sourceId);

  if(! (destId instanceof BSON.ObjectID))
    destId = new BSON.ObjectID(destId);

  async.waterfall([
      function(callback) {
        _createTransaction(sourceId, destId, amount, callback);
      },
      _beginTransaction,
      _applyTransaction,
      _commitTransaction,
      _removePendingTransaction,
      _terminateTransaction
    ], function(err) {
      if(err) console.log("ERRROOOOR"+err);
      else cb(null);
  });

  _createTransaction(sourceId, destId, amount, function(err, tr) {
    if(err) console.log(err);
  });
};
