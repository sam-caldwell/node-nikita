// Generated by CoffeeScript 2.4.1
var path;

path = require('path');

module.exports = function(action_global, action_parent, options_action) {
  var action, base, base1, base2, base3, base4, headers, k, match, push_headers, ref, ref1, ref2, ref3, ref4, v;
  action = {
    internal: {},
    options: {},
    original: (function() { // Create original and filter with cascade
      var k, options, ref, v;
      options = options_action;
      ref = action_parent != null ? action_parent.internal : void 0;
      for (k in ref) {
        v = ref[k];
        if (options[k] === void 0 && action_global.cascade[k] === true) {
          options[k] = v;
        }
      }
      return options;
    })(),
    parent: action_parent
  };
  // Merge cascade action options with default session options
  action.internal.cascade = {...action_global.cascade, ...options_action.cascade};
// Copy initial options
  for (k in options_action) {
    v = options_action[k];
    if (k === 'cascade') {
      continue;
    }
    action.internal[k] = options_action[k];
  }
  ref = action_parent != null ? action_parent.internal : void 0;
  // Merge parent cascaded options
  for (k in ref) {
    v = ref[k];
    if (action.internal.cascade[k] !== true) {
      continue;
    }
    if (action.internal[k] === void 0) {
      action.internal[k] = v;
    }
  }
  ref1 = action_global.options;
  // Merge action options with default session options
  for (k in ref1) {
    v = ref1[k];
    if (k === 'cascade') {
      continue;
    }
    if (action.internal[k] === void 0) {
      action.internal[k] = v;
    }
  }
  // Build headers option
  headers = [];
  push_headers = function(action) {
    if (action.internal.header) {
      headers.push(action.internal.header);
    }
    if (action.parent) {
      return push_headers(action.parent);
    }
  };
  push_headers(action);
  action.internal.headers = headers.reverse();
  // Default values
  if ((base = action.internal).sleep == null) {
    base.sleep = 3000; // Wait 3s between retry
  }
  if ((base1 = action.internal).retry == null) {
    base1.retry = 0;
  }
  if ((base2 = action.internal).disabled == null) {
    base2.disabled = false;
  }
  if ((base3 = action.internal).status == null) {
    base3.status = true;
  }
  action.internal.depth = action.internal.depth != null ? action.internal.depth : (((ref2 = action.parent) != null ? (ref3 = ref2.internal) != null ? ref3.depth : void 0 : void 0) || 0) + 1;
  action.internal.attempt = -1; // Clone and filter cascaded options
  // throw Error 'Incompatible Options: status "false" implies shy "true"' if options.status is false and options.shy is false # Room for argument, leave it strict for now until we come accross a usecase justifying it.
  // options.shy ?= true if options.status is false
  if ((base4 = action.internal).shy == null) {
    base4.shy = false;
  }
  // Goodies
  if (action.internal.source && (match = /~($|\/.*)/.exec(action.internal.source))) {
    if (!action_global.store['nikita:ssh:connection']) {
      action.internal.source = path.join(process.env.HOME, match[1]);
    } else {
      action.internal.source = path.posix.join('.', match[1]);
    }
  }
  if (action.internal.target && (match = /~($|\/.*)/.exec(action.internal.target))) {
    if (!action_global.store['nikita:ssh:connection']) {
      action.internal.target = path.join(process.env.HOME, match[1]);
    } else {
      action.internal.target = path.posix.join('.', match[1]);
    }
  }
  ref4 = action.internal;
  // Filter cascaded options
  for (k in ref4) {
    v = ref4[k];
    if (action.internal.cascade[k] === false) {
      continue;
    }
    action.options[k] = v;
  }
  // Move handler and callback at root level
  action.handler = action.internal.handler;
  delete action.internal.handler;
  action.callback = action.internal.callback;
  delete action.internal.callback;
  return action;
};