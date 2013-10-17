var dao = require('./dao');
var util = require('util');

dao.connect("./dbconf.json", function(err){
  if(err) {
    console.dir(err);
    return;
  }
  dao.bla(function(err, results) {
    if(err) console.log("ERROR: "+err);
    else {
      console.dir(results);
    }
  });

  // init(createTr);

  init(function(err) {
    dao.test();
  });

});

var init = dao.initDB;

var createTr = function(err) {
  if(err){
    console.dir(err);
    return;
  }
  dao.findAllAccount(function(err, accounts) {
    var a = accounts[0];
    var b = accounts[1];
    dao._createTransaction(a._id, b._id, 10, beginTr);
  });
};

var beginTr = function(err, tr) {
  console.dir("transaction created: ");
  console.dir(tr);
  dao._beginTransaction(tr, applyTr);
};

var applyTr = function(err, tr) {
  console.log("Applying transaction");
  console.dir(tr);
};

