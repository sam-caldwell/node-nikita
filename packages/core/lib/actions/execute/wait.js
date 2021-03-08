// Generated by CoffeeScript 2.5.1
// # `nikita.execute.wait`

// Run a command periodically and continue once the command succeed. Status will be
// set to "false" if the user command succeed right away, considering that no
// change had occured. Otherwise it will be set to "true".   

// ## Example

// ```js
// const {$status} = await nikita.execute.wait({
//   command: "test -f /tmp/sth"
// })
// console.info(`Command succeed, the file "/tmp/sth" now exists: ${$status}`)
// ```

// ## Hooks
var handler, on_action, schema, utils;

on_action = function({config}) {
  if (!config.command) {
    return;
  }
  // Always normalise quorum as an integer
  if (config.quorum && config.quorum === true) {
    return config.quorum = Math.ceil((config.command.length + 1) / 2);
  } else if (config.quorum == null) {
    if (typeof config.command === 'string') {
      config.command = [config.command];
    }
    return config.quorum = config.command.length;
  }
};

// ## Schema
schema = {
  type: 'object',
  properties: {
    'quorum': {
      type: ['integer', 'boolean'],
      description: `Number of minimal successful connection, 50%+1 if "true".`
    },
    'command': {
      type: 'array',
      items: {
        type: 'string'
      },
      description: `The commands to be executed.`
    },
    'interval': {
      type: 'integer',
      default: 2000,
      description: `Time interval between which we should wait before re-executing the
command, default to 2s.`
    },
    'code': {
      type: 'array',
      items: {
        type: 'integer'
      },
      description: `Expected exit code to recieve to exit and call the user callback,
default to "0".`
    },
    'code_skipped': {
      type: 'array',
      items: {
        type: 'integer'
      },
      // default: [1]
      description: `Expected code to be returned when the command failed and should be
scheduled for later execution, default to "1".`
    },
    'stdin_log': {
      $ref: 'module://@nikitajs/core/lib/actions/execute#/properties/stdin_log'
    },
    'stdout_log': {
      $ref: 'module://@nikitajs/core/lib/actions/execute#/properties/stdout_log'
    },
    'stderr_log': {
      $ref: 'module://@nikitajs/core/lib/actions/execute#/properties/stderr_log'
    }
  },
  required: ['command']
};

// ## Handler
handler = async function({
    config,
    tools: {log}
  }) {
  var $status, attempts, commands, wait;
  if (config.retry == null) {
    config.retry = -1;
  }
  attempts = 0;
  $status = false;
  wait = function(timeout) {
    if (!timeout) {
      return;
    }
    return new Promise(function(resolve) {
      return setTimeout(resolve, timeout);
    });
  };
  commands = config.command;
  while (attempts !== config.retry) {
    attempts++;
    log({
      message: `Start attempt #${attempts}`,
      level: 'DEBUG'
    });
    commands = (await utils.promise.array_filter(commands, async(command) => {
      var success;
      ({
        $status: success
      } = (await this.execute({
        command: command,
        code: config.code || 0,
        code_skipped: config.code_skipped,
        stdin_log: config.stdin_log,
        stdout_log: config.stdout_log,
        stderr_log: config.stderr_log,
        $relax: config.code_skipped === void 0
      })));
      return !success;
    }));
    log({
      message: `Attempt #${attempts} expect ${config.quorum} success, got ${config.command.length - commands.length}`,
      level: 'INFO'
    });
    if (commands.length <= config.command.length - config.quorum) {
      return {
        attempts: attempts,
        $status: attempts > 1
      };
    }
    await wait(config.interval);
  }
  throw utils.error('NIKITA_EXECUTE_WAIT_MAX_RETRY', ['the number of attempts reached the maximum number of retries,', `got ${config.retry}.`]);
};

// ## Exports
module.exports = {
  handler: handler,
  hooks: {
    on_action: on_action
  },
  metadata: {
    argument_to_config: 'command',
    schema: schema
  }
};

// ## Dependencies
utils = require('../../utils');
