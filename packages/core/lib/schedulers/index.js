// Generated by CoffeeScript 2.7.0
var utils;

utils = require('../utils');

/*
Usage:
schedule([handlers], [options])
schedule([options], [handlers])
Options:
- strict
  Task failure prevent any additionnal task to be executed and close the
  scheduler.
- paused
  Prevent the execution of newly registered tasks, call resume to trigger the
  execution.
*/
module.exports = function(handlers, options) {
  var opts, promise, scheduler, stack, state;
  if (Array.isArray(handlers) || (handlers != null) === false) {
    if (options == null) {
      options = {};
    }
  } else if (typeof handlers === 'object' && (Array.isArray(options) || (options != null) === false)) {
    opts = options;
    options = handlers;
    handlers = opts;
  } else {
    throw Error('Invalid arguments');
  }
  // Options normalisation
  if (options.strict == null) {
    options.strict = false;
  }
  if (options.paused == null) {
    options.paused = false;
  }
  // Internal usage
  stack = [];
  scheduler = null;
  state = {
    paused: options.paused,
    output: [],
    resolved: false,
    running: false
  };
  promise = new Promise(function(resolve, reject) {
    scheduler = {
      pause: function() {
        return state.paused = true;
      },
      resume: function() {
        state.paused = false;
        return scheduler.pump();
      },
      end: function(err, output) {
        var task;
        state.resolved = true;
        if (err) {
          while (task = stack.shift()) {
            task.reject(err);
          }
          return reject(err);
        } else {
          return resolve(output);
        }
      },
      pump: function() {
        var item;
        if (state.running) {
          return;
        }
        if (!state.resolved) {
          if (!stack.length) {
            return this.end(null, state.output);
          }
        }
        if (!stack.length) {
          return;
        }
        state.running = true;
        item = stack.shift();
        item = item;
        return setImmediate(async function() {
          var error, result;
          try {
            result = (await item.handler.call());
            state.running = false;
            item.resolve.call(null, result);
            if (item.options.output) {
              // Include tasks output in the scheduler promise
              // Default to only the tasks provide at initialisation
              // Use the push output option to include additionnal tasks
              state.output.push(result);
            }
            return setImmediate(function() {
              return scheduler.pump();
            });
          } catch (error1) {
            error = error1;
            state.running = false;
            item.reject.call(null, error);
            if (options.strict) {
              return scheduler.end(error);
            } else {
              return setImmediate(function() {
                return scheduler.pump();
              });
            }
          }
        });
      },
      unshift: function(handlers, options = {}) {
        var isArray;
        if (options.pump == null) {
          options.pump = true;
        }
        isArray = Array.isArray(handlers);
        if (!(isArray || typeof handlers === 'function')) {
          throw Error('Invalid Argument');
        }
        return new Promise(function(resolve, reject) {
          var handler;
          if (!isArray) {
            stack.unshift({
              handler: handlers,
              resolve: resolve,
              reject: reject,
              options: options
            });
            if (!state.paused) {
              return scheduler.pump();
            }
          } else {
            // Unshift from the last to the first element to preserve order
            return Promise.all(((function() {
              var i, len, ref, results;
              ref = handlers.reverse();
              results = [];
              for (i = 0, len = ref.length; i < len; i++) {
                handler = ref[i];
                results.push(scheduler.unshift(handler, {
                  pump: false
                }));
              }
              return results;
            })()).reverse()).then(resolve, reject);
          }
        });
      },
      push: function(handlers, options = {}) {
        var isArray, prom;
        isArray = Array.isArray(handlers);
        if (!(isArray || typeof handlers === 'function')) {
          throw Error('Invalid Argument');
        }
        prom = new Promise(function(resolve, reject) {
          var handler;
          if (!isArray) {
            stack.push({
              handler: handlers,
              resolve: resolve,
              reject: reject,
              options: options
            });
            if (!state.paused) {
              return scheduler.pump();
            }
          } else {
            return Promise.all((function() {
              var i, len, results;
              results = [];
              for (i = 0, len = handlers.length; i < len; i++) {
                handler = handlers[i];
                results.push(scheduler.push(handler, options));
              }
              return results;
            })()).then(resolve, reject);
          }
        });
        prom.catch((function() {})); // Handle strict unhandled rejections
        return prom;
      },
      call: function(handlers, options = {}) {
        return this.push(handlers, options);
      }
    };
    if (handlers) {
      if (handlers.length) {
        scheduler.push(handlers, {
          output: true
        });
        return scheduler.pump();
      } else {
        return resolve([]);
      }
    }
  });
  promise.catch((function() {})); // Handle strict unhandled rejections
  return new Proxy(promise, {
    get: function(target, name) {
      if (target[name] != null) {
        if (typeof target[name] === 'function') {
          return target[name].bind(target);
        } else {
          return target[name];
        }
      } else {
        return scheduler[name];
      }
    }
  });
};
