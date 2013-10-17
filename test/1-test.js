// division-by-zero-test.js

var vows = require('vows'),
    assert = require('assert');

var boom = function(cb) {
  cb("boom");
};

var expectError = function(cb) {
  return function(err) {
    if(err) cb();
    else cb.apply(cb, arguments);
  };
};

// Create a Test Suite
vows.describe('Division by Zero').addBatch({
    'when dividing a number by zero': {
        topic: function () { return 42 / 0; },

        'we get Infinity': function (topic) {
            assert.equal (topic, Infinity);
        }
    },
    'but when dividing zero by zero': {
        topic: function () { return 0 / 0; },

        'we get a value which': {
            'is not a number': function (topic) {
                assert.isNaN (topic);
            },
            'is not equal to itself': function (topic) {
                assert.notEqual (topic, topic);
            }
        }
    },
    // 'with failing test': {
    //   topic: function() {
    //     boom(expectError(this.callback));
    //   },
    //   // 'boom should explodes': function(topic) {
    //   //   assert.throws(function() {});
    //   // }
    // }
}).export(module); // Run it

