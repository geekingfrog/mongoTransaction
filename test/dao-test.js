var vows = require('vows');
var assert = require('assert');
var dao = require('../lib/dao.js');
var async = require('async');

vows.describe('DAO').addBatch({
  'connect': {
    'read configuration': {
      'with invalid filepath': {
        topic: function() {
          var cb = this.callback;
          dao.connect('/foo/bar/baz', function(err) {
            cb(null, err);
          });
        },
        'should revert to default config': function(err) {
          assert.isNull(err);
        }
      },
      'with invalid config': {
        topic: function() {
          var cb = this.callback;
          dao.connect('../test/wrongConfig.json', function(err) {
            cb(null, err);
          });
        },
        'should raise an error': function(err) {
          err = err.toString();
          // the expected error is:
          // [Error: failed to connect to [thisHostDoesNotExist:-1]]
          assert.match(err, /error/i);
          assert.match(err, /thisHostDoesNotExist:-1/i);
        }
      }
    },
    '_checkConnection': {
      topic: function() {
        var cb = this.callback;
        dao.transfer('source', 'dest', 10, function(err) {
          cb(null, err);
        });
      },
      'should raise exception if not connected': function(err) {
        assert.isNotNull(err);
        // expects: Not connected to the database !
        assert.match(err, /not connected/i);
      }
    }
  }
}).addBatch({
  'execute transfer': {
    topic: function() {
      var cb = this.callback;
      dao.connect(function(err) {
        dao._initDB(cb);
      });
    },
    'after setup': {
      topic: function() {
        var cb = this.callback;
        var getAccounts = function(callback) {
          async.parallel([ function(asyncCb) {
            dao.findQueryAccount({owner: 'A'}, asyncCb);
          }, function(asyncCb) {
            dao.findQueryAccount({owner: 'B'}, asyncCb);
          }], callback);
        };


        getAccounts(function(err, accs) {
          var sourceId = accs[0]._id;
          var destId = accs[1]._id;
          // dao.transfer(sourceId, destId, 10, getAccounts(cb));
          dao.transfer(sourceId, destId, 10, function() {
            getAccounts(cb);
          });
        });

      },
      'transfer done': function(accs) {
        assert.lengthOf(accs, 2);
        var a = accs[0];
        var b = accs[1];
        assert.equal(a.balance, 90);
        assert.equal(b.balance, 110);
      }
    }
  }
}).export(module);

