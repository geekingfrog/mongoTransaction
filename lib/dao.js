var MongoClient = require('mongodb').MongoClient;
var BSON = require('mongodb').BSONPure;
var path = require('path');
var _ = require('lodash');
var _db = null;

// 'enum' of transaction states
var TrStates = {
  INITIAL: 'Initial',
  PENDING: 'Pending',
  COMMITED: 'Commited',
  DONE: 'Done'
};

// utility to make multiple insert and call the provided callback
// after all is done
var waitForN = function(n, cb) {
  return function(data) {
    return function(err, result) {
      if(err) cb(err);
      else {
        data.push(result);
        if(--n === 0) cb(null, data);
      }
    };
  }([]);
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

  var allDone = waitForN(2, cb);

  A = {
    owner: 'A',
    account_number: '314159',
    balance: '100',
    pendingTransactions: []
  };
  accounts.update({owner: 'A'}, A, { w:1, upsert: true}, allDone);
  
  B = {
    owner: 'B',
    account_number: '271828',
    balance: '100',
    pendingTransactions: [1]
  };
  accounts.update({owner: 'B'}, B, { w:1, upsert: true}, allDone);

});

exports.findAllAccount = _checkConnection(function(cb) {
  _db.collection('accounts').find().toArray(cb);
});

exports._createTransaction = _checkConnection(function(sourceId, destId, amount, cb) {
  var tr = {
    source_id: sourceId,
    dest_id: destId,
    amount: amount,
    state: TrStates.INITIAL
  };
  _db.collection('transactions').insert(tr, {w:1}, cb);
});

exports._beginTransaction = _checkConnection(function(tr, cb) {
  console.log("beginning transaction: ");
  console.dir(tr);
  _db.collection('transactions').update(
    {_id: tr._id},
    {$set: {state: "foobared"}},
    {w: 1},
    cb
  );

  // _db.collection('transactions').findAndModify(
  //   {_id: tr._id},
  //   [],
  //   {$set: {state: TrStates.PENDING}},
  //   {w:1, new: true},
  //   cb
  // );
});

exports._applyTransaction = _checkConnection(function(tr, cb) {
  var allDone = waitForN(2, cb);
  var accounts = _db.collection('accounts');

  console.log("applying transaction from "+tr.source_id+" to "+tr.dest_id);
  process.nextTick(function() { cb(null); });
  // accounts.update({

  // }

// db.accounts.update({name: t.source, pendingTransactions: {$ne: t._id}}, {$inc: {balance: -t.value}, $push: {pendingTransactions: t._id}})
// db.accounts.update({name: t.destination, pendingTransactions: {$ne: t._id}}, {$inc: {balance: t.value}, $push: {pendingTransactions: t._id}})
// db.accounts.find()

});

exports.bla = _checkConnection(function(cb) {
  _db.collection('accounts').find({
    pendingTransactions: {$ne: 1}
  }).toArray(cb);
});


var mongo = require('mongodb');
var BSON = mongo.BSONPure;
// var o_id = new BSON.ObjectID(theidID);

exports.test = function() {
  var id = new BSON.ObjectID('525fa6f8bd1c9f5b20000001');
  _db.collection('transactions').findOne({_id: id}, function(err, tr) {
    console.log("got the transaction ?");
    console.dir(arguments);
  });
  // _db.collection('transactions').update(
  //   {_id: '525fa6f8bd1c9f5b20000001'},
  //   {$set: {state: "foobared"}},
  //   {w: 1},
  //   function(err, arg) {
  //     console.log('updated');
  //     console.dir(arguments);
  //   }
  // );
};

exports.boom = _checkConnection(function(cb) {
  console.log("ok because connected to db");
});
