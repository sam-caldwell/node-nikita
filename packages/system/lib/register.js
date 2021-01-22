// Generated by CoffeeScript 2.5.1
// Registration of `nikita.system` actions
var registry;

require('@nikitajs/file/lib/register');

registry = require('@nikitajs/engine/lib/registry');

module.exports = {
  system: {
    authconfig: '@nikitajs/system/lib/authconfig',
    cgroups: '@nikitajs/system/lib/cgroups',
    limits: '@nikitajs/system/lib/limits',
    mod: '@nikitajs/system/lib/mod'
    running: '@nikitajs/system/lib/running',
    tmpfs: '@nikitajs/system/lib/tmpfs',
  }
};

(async function() {
  var err;
  try {
    return (await registry.register(module.exports));
  } catch (error) {
    err = error;
    console.error(err.stack);
    return process.exit(1);
  }
})();
