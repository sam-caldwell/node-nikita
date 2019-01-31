// Generated by CoffeeScript 2.3.2
// # Registry

// Management facility to register and unregister actions.

// ## Register all functions
var is_object, load, merge, registry;

load = function(middleware) {
  var ref, result;
  if (!(typeof middleware === 'object' && (middleware != null) && !Array.isArray(middleware))) {
    middleware = {
      handler: middleware
    };
  }
  if ((ref = typeof middleware.handler) !== 'function' && ref !== 'string') {
    throw Error(`Invalid middleware handler: got ${JSON.stringify(middleware.handler)}`);
  }
  if (typeof middleware.handler !== 'string') {
    return middleware;
  }
  middleware.module = middleware.handler;
  result = /^nikita\//.test(middleware.handler) ? require(`.${middleware.handler.substr(6)}`) : require.main.require(middleware.handler);
  if (typeof result === 'function') {
    result = {
      handler: result
    };
    result.module = middleware.module;
  }
  return result;
};

registry = function(obj) {
  // ## Get

  // Retrieve an action by name.

  // Options include: flatten, deprecate
  Object.defineProperty(obj, 'get', {
    configurable: true,
    enumerable: false,
    get: function() {
      return function(name, options) {
        var cnames, flatobj, i, j, len, n, walk;
        if (arguments.length === 1 && is_object(arguments[0])) {
          options = name;
          name = null;
        }
        if (options == null) {
          options = {};
        }
        if (!name) {
          // Flatten result
          if (options.flatten) {
            flatobj = {};
            walk = function(obj, keys) {
              var k, results, v;
              results = [];
              for (k in obj) {
                v = obj[k];
                if (k === '') {
                  if (v.deprecate && !options.deprecate) {
                    continue;
                  }
                  results.push(flatobj[keys.join('.')] = merge({}, v));
                } else {
                  results.push(walk(v, [...keys, k]));
                }
              }
              return results;
            };
            walk(obj, []);
            return flatobj;
          } else {
            // Tree result
            walk = function(obj, keys) {
              var k, res, v;
              res = {};
              for (k in obj) {
                v = obj[k];
                if (k === '') {
                  if (v.deprecate && !options.deprecate) {
                    continue;
                  }
                  res[k] = merge({}, v);
                } else {
                  v = walk(v, [...keys, k]);
                  if (Object.values(v).length !== 0) {
                    res[k] = v;
                  }
                }
              }
              return res;
            };
            return walk(obj, []);
          }
        }
        if (typeof name === 'string') {
          // return merge {}, obj if arguments.length is 0
          name = [name];
        }
        cnames = obj;
        for (i = j = 0, len = name.length; j < len; i = ++j) {
          n = name[i];
          if (!cnames[n]) {
            return null;
          }
          if (cnames[n] && cnames[n][''] && i === name.length - 1) {
            return cnames[n][''];
          }
          cnames = cnames[n];
        }
        return null;
      };
    }
  });
  // ## Register

  // Register new actions.

  // With an action path:

  // ```javascript
  // nikita.register('first_action', 'path/to/action')
  // nikita.first_action(options);
  // ```

  // With a namespace and an action path:

  // ```javascript
  // nikita.register(['second', 'action'], 'path/to/action')
  // nikita.second.action(options);
  // ```

  // With an action object:

  // ```javascript
  // nikita.register('third_action', {
  //   relax: true,
  //   handler: function(options){ console.log(options.relax) }
  // })
  // nikita.third_action(options);
  // ```

  // With a namespace and an action object:

  // ```javascript
  // nikita.register(['fourth', 'action'], {
  //   relax: true,
  //   handler: function(options){ console.log(options.relax) }
  // })
  // nikita.fourth.action(options);
  // ```

  // Multiple actions:

  // ```javascript
  // nikita.register({
  //   'fifth_action': 'path/to/action'
  //   'sixth': {
  //     '': 'path/to/sixth',
  //     'action': : 'path/to/sixth/actkon'
  //   }
  // })
  // nikita
  // .fifth_action(options);
  // .sixth(options);
  // .sixth.action(options);
  // ```
  Object.defineProperty(obj, 'register', {
    configurable: true,
    enumerable: false,
    get: function() {
      return function(name, handler) {
        var cnames, j, n, name1, names, ref, walk;
        if (typeof name === 'string') {
          name = [name];
        }
        if (Array.isArray(name)) {
          handler = load(handler);
          cnames = names = obj;
          for (n = j = 0, ref = name.length - 1; (0 <= ref ? j < ref : j > ref); n = 0 <= ref ? ++j : --j) {
            n = name[n];
            if (cnames[n] == null) {
              cnames[n] = {};
            }
            cnames = cnames[n];
          }
          if (cnames[name1 = name[name.length - 1]] == null) {
            cnames[name1] = {};
          }
          cnames[name[name.length - 1]][''] = handler;
          return merge(obj, names);
        } else {
          walk = function(obj) {
            var k, results, v;
            results = [];
            for (k in obj) {
              v = obj[k];
              if (k !== '' && v && typeof v === 'object' && !Array.isArray(v) && !v.handler) {
                results.push(walk(v));
              } else {
                v = load(v);
                results.push(obj[k] = k === '' ? v : {
                  '': v
                });
              }
            }
            return results;
          };
          walk(name);
          return merge(obj, name);
        }
      };
    }
  });
  // ## Deprecate

  // `nikita.deprecate(old_function, [new_function], action)`

  // Deprecate an old or renamed action. Internally, it leverages 
  // [Node.js `util.deprecate`][deprecate].

  // For example:

  // ```javascript
  // nikita.deprecate('old_function', 'new_function', -> 'my_function')
  // nikita.new_function()
  // # Print
  // # (node:75923) DeprecationWarning: old_function is deprecated, use new_function
  // ```
  Object.defineProperty(obj, 'deprecate', {
    configurable: true,
    enumerable: false,
    get: function() {
      return function(old_name, new_name, handler) {
        if (arguments.length === 2) {
          handler = new_name;
          new_name = null;
        }
        handler = load(handler);
        handler.deprecate = new_name;
        if (typeof handler.module === 'string') {
          if (handler.deprecate == null) {
            handler.deprecate = handler.module;
          }
        }
        if (handler.deprecate == null) {
          handler.deprecate = true;
        }
        return obj.register(old_name, handler);
      };
    }
  });
  // # Registered

  // Test if a function is registered or not.

  // Options:

  // * `parent` (boolean)   
  //   Return true if the name match an parent action name.
  Object.defineProperty(obj, 'registered', {
    configurable: true,
    enumerable: false,
    get: function() {
      return function(name, options = {}) {
        var cnames, i, j, len, n;
        if (module.exports !== obj && module.exports.registered(name)) {
          return true;
        }
        if (typeof name === 'string') {
          name = [name];
        }
        cnames = obj;
        for (i = j = 0, len = name.length; j < len; i = ++j) {
          n = name[i];
          if ((cnames[n] == null) || !cnames.propertyIsEnumerable(n)) {
            return false;
          }
          if (options.parent && cnames[n] && i === name.length - 1) {
            return true;
          }
          if (cnames[n][''] && i === name.length - 1) {
            return true;
          }
          cnames = cnames[n];
        }
        return false;
      };
    }
  });
  // ## Unregister

  // Remove an action from registry.
  return Object.defineProperty(obj, 'unregister', {
    configurable: true,
    enumerable: false,
    get: function() {
      return function(name) {
        var cnames, i, j, len, n;
        if (typeof name === 'string') {
          name = [name];
        }
        cnames = obj;
        for (i = j = 0, len = name.length; j < len; i = ++j) {
          n = name[i];
          if (i === name.length - 1) {
            delete cnames[n];
          }
          cnames = cnames[n];
          if (!cnames) {
            return;
          }
        }
      };
    }
  });
};

registry(module.exports);

Object.defineProperty(module.exports, 'registry', {
  configurable: true,
  enumerable: false,
  get: function() {
    return registry;
  }
});

// ## Dependencies
({merge} = require('./misc'));

({is_object} = require('./misc/object'));

// [deprecate]: https://nodejs.org/api/util.html#util_util_deprecate_function_string