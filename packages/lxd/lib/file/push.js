// Generated by CoffeeScript 2.6.1
// # `nikita.lxc.file.push`

// Push files into containers.

// ## Example

// ```js
// const {$status} = await nikita.lxc.file.push({
//   container: 'my_container',
//   source: `#{scratch}/a_file`,
//   target: '/root/a_file'
// })
// console.info(`File was pushed: ${$status}`)
// ```

// ## Todo

// * Push recursive directories
// * Handle unmatched target permissions
// * Handle unmatched target ownerships
// * Detect name from lxd_target

// ## Schema definitions
var definitions, handler, path, utils;

definitions = {
  config: {
    type: 'object',
    properties: {
      'algo': {
        default: 'md5',
        $ref: 'module://@nikitajs/core/lib/actions/fs/hash#/definitions/config/properties/algo'
      },
      'container': {
        $ref: 'module://@nikitajs/lxd/lib/init#/definitions/config/properties/container'
      },
      'content': {
        type: 'string',
        description: `Content of the target file.`
      },
      'create_dirs': {
        type: 'boolean',
        default: false,
        description: `Create any directories necessary.`
      },
      'gid': {
        type: ['integer', 'string'],
        description: `Set the file's gid on push, overwrite the \`source\` option.`
      },
      'lxd_target': {
        type: 'string',
        description: `File destination in the form of "[<remote>:]<container>/<path>",
overwrite the \`target\` option.`
      },
      'mode': {
        type: ['integer', 'string'],
        pattern: "^\\d+$",
        filemode: true,
        description: `Set the file's perms on push. LXD only support the absolute
representation. When passing a string, an integer is casted to its
octal value and passing a symbolic value will throw an error.`
      },
      'source': {
        type: 'string',
        description: `File to push in the form of "<path>".`
      },
      'target': {
        type: 'string',
        description: `File destination in the form of "<path>".`
      },
      'uid': {
        type: ['integer', 'string'],
        description: `Set the file's uid on push.`
      }
    },
    required: ['container', 'target'],
    oneOf: [
      {
        required: ['content']
      },
      {
        required: ['source']
      }
    ]
  }
};

// ## Handler
handler = async function({
    config,
    metadata: {tmpdir}
  }) {
  var $status, err, status_running, tmpfile;
  // Make source file with content
  if (config.content != null) {
    tmpfile = path.join(tmpdir, `nikita.${Date.now()}${Math.round(Math.random() * 1000)}`);
    await this.fs.base.writeFile({
      target: tmpfile,
      content: config.content
    });
    config.source = tmpfile;
  }
  // note, name could be obtained from lxd_target
  // throw Error "Invalid Option: target is required" if not config.target and not config.lxd_target
  if (config.lxd_target == null) {
    config.lxd_target = `${path.join(config.container, config.target)}`;
  }
  ({$status} = (await this.lxc.running({
    container: config.container
  })));
  status_running = $status;
  if ($status) {
    try {
      ({$status} = (await this.execute({
        command: `# Ensure source is a file
[ -f "${config.source}" ] || exit 2
command -v openssl >/dev/null || exit 3
sourceDgst=\`openssl dgst -${config.algo} ${config.source} | sed 's/^.* \\([a-z0-9]*\\)$/\\1/g'\`
# Get target hash
targetDgst=\`cat <<EOF | lxc exec ${config.container} -- sh
# Ensure openssl is available
command -v openssl >/dev/null || exit 4
# Target does not exist
[ ! -f "${config.target}" ] && exit 0
openssl dgst -${config.algo} ${config.target} | sed 's/^.* \\([a-z0-9]*\\)$/\\1/g'
EOF\`
[ "$sourceDgst" != "$targetDgst" ] || exit 42`,
        code: [0, 42],
        trap: true
      })));
    } catch (error) {
      err = error;
      if (err.exit_code === 2) {
        throw Error(`Invalid Option: source is not a file, got ${JSON.stringify(config.source)}`);
      }
      if (err.exit_code === 3) {
        throw Error("Invalid Requirement: openssl not installed on host");
      }
      if (err.exit_code === 4) {
        throw utils.error('NIKITA_LXD_FILE_PUSH_MISSING_OPENSSL', ['the openssl package must be installed in the container', 'and accessible from the `$PATH`.']);
      }
    }
  }
  if (!status_running || $status) {
    await this.execute({
      command: `${['lxc', 'file', 'push', config.source, config.lxd_target, config.create_dirs ? '--create-dirs' : void 0, (config.gid != null) && typeof config.gid === 'number' ? '--gid' : void 0, (config.uid != null) && typeof config.uid === 'number' ? '--uid' : void 0, config.mode ? `--mode ${config.mode}` : void 0].join(' ')}`,
      trap: true,
      trim: true
    });
  }
  if (typeof config.gid === 'string') {
    await this.lxc.exec({
      container: config.container,
      command: `chgrp ${config.gid} ${config.target}`
    });
  }
  if (typeof config.uid === 'string') {
    return (await this.lxc.exec({
      container: config.container,
      command: `chown ${config.uid} ${config.target}`
    }));
  }
};

// ## Exports
module.exports = {
  handler: handler,
  metadata: {
    tmpdir: true,
    definitions: definitions
  }
};

// ## Dependencies
path = require('path');

utils = require('../utils');
