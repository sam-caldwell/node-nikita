// Generated by CoffeeScript 2.6.0
// # `nikita.lxc.exec`

// Execute command in containers.

// ## Example

// ```js
// const {$status, stdout, stderr} = await nikita.lxc.exec({
//   container: "my-container",
//   command: "whoami"
// })
// console.info(`Command was executed: ${$status}`)
// console.info(stdout)
// ```

// ## Todo

// * Support `env` option

// ## Schema definitions
var definitions, handler, utils;

definitions = {
  config: {
    type: 'object',
    properties: {
      'container': {
        $ref: 'module://@nikitajs/lxd/lib/init#/definitions/config/properties/container'
      },
      'command': {
        type: 'string',
        description: `The command to execute.`
      },
      'cwd': {
        type: 'string',
        description: `Directory to run the command in (default /root).`
      },
      'env': {
        type: 'object',
        default: {},
        description: `Environment variable to set (e.g. HOME=/home/foo).`
      },
      'shell': {
        type: 'string',
        default: 'sh',
        description: `The shell in which to execute commands, for example \`sh\`, \`bash\` or
\`zsh\`.`
      },
      'trim': {
        $ref: 'module://@nikitajs/core/lib/actions/execute#/definitions/config/properties/trim'
      },
      'trap': {
        $ref: 'module://@nikitajs/core/lib/actions/execute#/definitions/config/properties/trap'
      },
      'user': {
        type: 'integer',
        description: `User ID to run the command as (default 0).`
      }
    },
    required: ['container', 'command']
  }
};

// ## Handler
handler = async function({config}) {
  var k, opt, v;
  opt = [
    config.user ? `--user ${config.user}` : void 0,
    config.cwd ? `--cwd ${utils.string.escapeshellarg(config.cwd)}` : void 0,
    ...((function() {
      var ref,
    results;
      ref = config.env;
      results = [];
      for (k in ref) {
        v = ref[k];
        results.push('--env ' + utils.string.escapeshellarg(`${k}=${v}`));
      }
      return results;
    })())
  ].join(' ');
  return (await this.execute(config, {
    trap: false
  }, {
    command: [`cat <<'NIKITALXDEXEC' | lxc exec ${opt} ${config.container} -- ${config.shell}`, config.trap ? 'set -e' : void 0, config.command, 'NIKITALXDEXEC'].join('\n')
  }));
};

// ## Exports
module.exports = {
  handler: handler,
  metadata: {
    definitions: definitions
  }
};

// ## Dependencies
utils = require('./utils');
