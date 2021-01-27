// Generated by CoffeeScript 2.5.1
module.exports = {
  name: '@nikitajs/engine/lib/plugins/time',
  hooks: {
    'nikita:session:action': {
      handler: function(action) {
        return action.metadata.time_start = Date.now();
      }
    },
    'nikita:session:result': {
      before: '@nikitajs/engine/lib/plugins/history',
      handler: function({action}) {
        return action.metadata.time_end = Date.now();
      }
    }
  }
};
