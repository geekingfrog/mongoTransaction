var vows = require('vows');
var assert = require('assert');

vows.describe('DAO').addBatch({
  '_checkConnection': {
    topic: function() {
      return 42;
    },
    'equal to 42': function(topic) {
      assert.equal(topic, 42);
    }
  }
}).export(module);
