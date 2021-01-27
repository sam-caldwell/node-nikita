// Generated by CoffeeScript 2.5.1
var handlers, session;

session = require('../session');

module.exports = {
  name: '@nikitajs/engine/lib/plugins/conditions',
  require: ['@nikitajs/engine/lib/metadata/raw', '@nikitajs/engine/lib/metadata/disabled'],
  hooks: {
    'nikita:session:normalize': {
      handler: function(action, handler) {
        var conditions, property, value;
        // Ventilate conditions properties defined at root
        conditions = {};
        for (property in action) {
          value = action[property];
          if (/^(if|unless)($|_[\w_]+$)/.test(property)) {
            if (conditions[property]) {
              throw Error('CONDITIONS_DUPLICATED_DECLARATION', [`Property ${property} is defined multiple times,`, 'at the root of the action and inside conditions']);
            }
            if (!Array.isArray(value)) {
              value = [value];
            }
            conditions[property] = value;
            delete action[property];
          }
        }
        return async function() {
          action = (await handler.call(null, ...arguments));
          action.conditions = conditions;
          return action;
        };
      }
    },
    'nikita:session:action': {
      before: '@nikitajs/engine/lib/metadata/disabled',
      handler: async function(action) {
        var final_run, k, local_run, ref, v;
        final_run = true;
        ref = action.conditions;
        for (k in ref) {
          v = ref[k];
          if (handlers[k] == null) {
            continue;
          }
          local_run = (await handlers[k].call(null, action));
          if (local_run === false) {
            final_run = false;
          }
        }
        if (!final_run) {
          return action.metadata.disabled = true;
        }
      }
    }
  }
};

handlers = {
  if: async function(action) {
    var condition, final_run, i, len, ref, run;
    final_run = true;
    ref = action.conditions.if;
    for (i = 0, len = ref.length; i < len; i++) {
      condition = ref[i];
      if (typeof condition === 'function') {
        condition = (await session({
          hooks: {
            on_result: function({action}) {
              return delete action.parent;
            }
          },
          metadata: {
            condition: true,
            depth: action.metadata.depth,
            raw_output: true
          },
          parent: action,
          handler: condition,
          config: action.config
        }));
      }
      run = (function() {
        switch (typeof condition) {
          case 'undefined':
            return false;
          case 'boolean':
            return condition;
          case 'number':
            return !!condition;
          case 'string':
            return !!condition.length;
          case 'object':
            if (Buffer.isBuffer(condition)) {
              return !!condition.length;
            } else if (condition === null) {
              return false;
            } else {
              return !!Object.keys(condition).length;
            }
            break;
          default:
            throw Error('Value type is not handled');
        }
      })();
      if (run === false) {
        final_run = false;
      }
    }
    return final_run;
  },
  unless: async function(action) {
    var condition, final_run, i, len, ref, run;
    final_run = true;
    ref = action.conditions.unless;
    for (i = 0, len = ref.length; i < len; i++) {
      condition = ref[i];
      if (typeof condition === 'function') {
        condition = (await session({
          hooks: {
            on_result: function({action}) {
              return delete action.parent;
            }
          },
          metadata: {
            condition: true,
            depth: action.metadata.depth,
            raw_output: true
          },
          parent: action,
          handler: condition,
          config: action.config
        }));
      }
      run = (function() {
        switch (typeof condition) {
          case 'undefined':
            return true;
          case 'boolean':
            return !condition;
          case 'number':
            return !condition;
          case 'string':
            return !condition.length;
          case 'object':
            if (Buffer.isBuffer(condition)) {
              return !condition.length;
            } else if (condition === null) {
              return true;
            } else {
              return !Object.keys(condition).length;
            }
            break;
          default:
            throw Error('Value type is not handled');
        }
      })();
      if (run === false) {
        final_run = false;
      }
    }
    return final_run;
  }
};
