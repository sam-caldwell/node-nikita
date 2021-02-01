// Generated by CoffeeScript 2.5.1
var Stream, array, docker, each, exec, fs, ini, merge, misc, path, ssh, string, util;

fs = require('fs');

path = require('path');

each = require('each');

({merge} = require('mixme'));

util = require('util');

Stream = require('stream');

exec = require('ssh2-exec');

ini = require('./ini');

string = require('./string');

array = require('./array');

docker = require('./docker');

ssh = require('./ssh');

misc = module.exports = {
  docker: require('./docker'),
  stats: require('./stats'),
  ssh: require('./ssh'),
  object: {
    equals: function(obj1, obj2, keys) {
      var j, k, keys1, keys2, len;
      keys1 = Object.keys(obj1);
      keys2 = Object.keys(obj2);
      if (keys) {
        keys1 = keys1.filter(function(k) {
          return keys.indexOf(k) !== -1;
        });
        keys2 = keys2.filter(function(k) {
          return keys.indexOf(k) !== -1;
        });
      } else {
        keys = keys1;
      }
      if (keys1.length !== keys2.length) {
        return false;
      }
      for (j = 0, len = keys.length; j < len; j++) {
        k = keys[j];
        if (obj1[k] !== obj2[k]) {
          return false;
        }
      }
      return true;
    },
    diff: function(obj1, obj2, keys) {
      var diff, k, keys1, keys2, v;
      if (!keys) {
        keys1 = Object.keys(obj1);
        keys2 = Object.keys(obj2);
        keys = array.merge(keys1, keys2, array.unique(keys1));
      }
      diff = {};
      for (k in obj1) {
        v = obj1[k];
        if (!(keys.indexOf(k) >= 0)) {
          continue;
        }
        if (obj2[k] === v) {
          continue;
        }
        diff[k] = [];
        diff[k][0] = v;
      }
      for (k in obj2) {
        v = obj2[k];
        if (!(keys.indexOf(k) >= 0)) {
          continue;
        }
        if (obj1[k] === v) {
          continue;
        }
        if (diff[k] == null) {
          diff[k] = [];
        }
        diff[k][1] = v;
      }
      return diff;
    },
    clone: function(obj) {
      return merge({}, obj);
    }
  },
  /*
  `isPortOpen(port, host, callback)`: Check if a port is already open

  */
  isPortOpen: function(port, host, callback) {
    if (arguments.length === 2) {
      callback = host;
      host = '127.0.0.1';
    }
    return exec(`nc ${host} ${port} < /dev/null`, function(err, stdout, stderr) {
      if (!err) {
        return callback(null, true);
      }
      if (err.code === 1) {
        return callback(null, false);
      }
      return callback(err);
    });
  },
  /*
  `merge([inverse], obj1, obj2, ...]`: Recursively merge objects
  --------------------------------------------------------------
  On matching keys, the last object take precedence over previous ones
  unless the inverse arguments is provided as true. Only objects are
  merge, arrays are overwritten.

  Enrich an existing object with a second one:
    obj1 = { a_key: 'a value', b_key: 'b value'}
    obj2 = { b_key: 'new b value'}
    result = misc.merge obj1, obj2
    assert.eql result, obj1
    assert.eql obj1.b_key, 'new b value'

  Create a new object from two objects:
    obj1 = { a_key: 'a value', b_key: 'b value'}
    obj2 = { b_key: 'new b value'}
    result = misc.merge {}, obj1, obj2
    assert.eql result.b_key, 'new b value'

  Using inverse:
    obj1 = { b_key: 'b value'}
    obj2 = { a_key: 'a value', b_key: 'new b value'}
    misc.merge true, obj1, obj2
    assert.eql obj1.a_key, 'a value'
    assert.eql obj1.b_key, 'b value'

  */
  merge: function() {
    var clone, copy, from, i, inverse, j, name, options, ref, ref1, src, target, to;
    console.warn('Function merge is deprecated, use mixme instead');
    target = arguments[0];
    from = 1;
    to = arguments.length;
    if (typeof target === 'boolean') {
      inverse = !!target;
      target = arguments[1];
      from = 2;
    }
    if (target == null) {
      target = {};
    }
    // Handle case when target is a string or something (possible in deep copy)
    if (typeof target !== "object" && typeof target !== 'function') {
      target = {};
    }
    for (i = j = ref = from, ref1 = to; (ref <= ref1 ? j < ref1 : j > ref1); i = ref <= ref1 ? ++j : --j) {
      // Only deal with non-null/undefined values
      if ((options = arguments[i]) !== null) {
// Extend the base object
        for (name in options) {
          src = target[name];
          copy = options[name];
          if (target === copy) {
            // Prevent never-ending loop
            continue;
          }
          // Recurse if we're merging plain objects
          if ((copy != null) && typeof copy === 'object' && !Array.isArray(copy) && !(copy instanceof RegExp) && !Buffer.isBuffer(copy)) {
            clone = src && (src && typeof src === 'object' ? src : {});
            // Never move original objects, clone them
            target[name] = misc.merge(false, clone, copy);
          // Don't bring in undefined values
          } else if (copy !== void 0) {
            if (Array.isArray(copy)) {
              copy = copy.slice(0);
            }
            if (!(inverse && typeof target[name] !== 'undefined')) {
              target[name] = copy;
            }
          }
        }
      }
    }
    // Return the modified object
    return target;
  },
  kadmin: function(options, cmd) {
    var realm;
    realm = options.realm ? `-r ${options.realm}` : '';
    if (options.kadmin_principal) {
      return `kadmin ${realm} -p ${options.kadmin_principal} -s ${options.kadmin_server} -w ${options.kadmin_password} -q '${cmd}'`;
    } else {
      return `kadmin.local ${realm} -q '${cmd}'`;
    }
  },
  ini: ini
};
