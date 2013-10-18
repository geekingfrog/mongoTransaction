var dao = require('./dao');
var util = require('util');

dao.connect("./dbconf.json", function(err){
  if(err) {
    console.dir(err);
    return;
  }

  init(createTr);

  dao.transfer('5260ae59fd000b6dc3525c70', '5260ae59fd000b6dc3525c6f', 12, function(err) {
    console.log("error? "+err);
  });

});

var init = dao.initDB;

var createTr = function(err) {
  if(err){
    console.dir(err);
    return;
  }
  else console.log("no error while init db");
  if(1) return;
  dao.findAllAccount(function(err, accounts) {
    var a = accounts[0];
    var b = accounts[1];
    dao._createTransaction(a._id, b._id, 10, beginTr);
  });
};

var beginTr = function(err, tr) {
  console.dir("transaction created: ");
  console.dir(tr);
  dao._beginTransaction(tr[0], applyTr);
};

var applyTr = function(err, tr) {
  console.log("Applying transaction");
  dao._applyTransaction(tr, commitTr);
};

var commitTr = function(err, tr) {
  console.log("Commit transaction");
  dao._commitTransaction(tr, removePending);
};

var removePending = function(err, tr) {
  console.log("Remove pending transactions in accounts");
  dao._removePendingTransaction(tr, terminateTr);
};

var terminateTr = function(err, tr) {
  console.log("Marking transaction as done");
  dao._terminateTransaction(tr, function(err, tr) {
    if(err) console.log("ERROR: "+err);
    else console.log("transaction terminated");
  });
};

