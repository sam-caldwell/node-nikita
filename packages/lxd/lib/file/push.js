// Generated by CoffeeScript 2.4.1
// # `nikita.lxd.file.push`

// Push files into containers.

// ## Options

// * `container` (string, required)
//   The name of the container.
// * `content` (string, optional*)
//   Content of the target file; required if `source` is not set
// * `create_dirs` (boolean, optional, false)
//   Create any directories necessary.
// * `gid` (integer, optional)
//   Set the file's gid on push.
//   overwrite the `source` option.
// * `lxd_target` (string, required)
//   File destination in the form of "[<remote>:]<container>/<path>",
//   overwrite the `target` option.
// * `mode` (integer|string, optional)
//   Set the file's perms on push.
// * `source` (string, optional*)
//   File to push in the form of "<path>"; required if `content` is not set.
// * `target` (string, required)
//   File destination in the form of "<path>".
// * `uid` (integer, optional)
//   Set the file's uid on push.

// ## Example

// ```js
// require('nikita')
// .lxd.file.push({
//   container: "my_container"
// }, function(err, {status}) {
//   console.info( err ? err.message : 'The container was deleted')
// });
// ```

// ## Todo

// * Push recursive directories
// * Handle unmatched target permissions
// * Handle unmatched target ownerships
// * Detect name from lxd_target

// ## Source Code
var path;

module.exports = function({options}) {
  this.log({
    message: "Entering lxd.file.push",
    level: 'DEBUG',
    module: '@nikitajs/lxd/lib/file/push'
  });
  if (!options.container) { // note, name could be obtained from lxd_target
    throw Error("Invalid Option: name is required");
  }
  if (!(options.source || (options.content != null))) {
    throw Error("Invalid Option: source or content are required");
  }
  if (!options.target && !options.lxd_target) {
    throw Error("Invalid Option: target is required");
  }
  if (options.algo == null) {
    options.algo = 'md5';
  }
  if (options.lxd_target == null) {
    options.lxd_target = `${path.join(options.container, options.target)}`;
  }
  if (options.tmp_file == null) {
    options.tmp_file = `/tmp/nikita.${Date.now()}${Math.round(Math.random() * 1000)}`;
  }
  // Execution
  this.fs.writeFile({
    if: options.content != null,
    target: options.tmp_file,
    content: options.content
  });
  this.lxd.running({
    container: options.container
  });
  this.system.execute({
    if: function() {
      return this.status(-1);
    },
    cmd: `# Ensure source is a file\n[ -f "${options.source || options.tmp_file}" ] || exit 2\ncommand -v openssl >/dev/null || exit 3\nsourceDgst=\`openssl dgst -${options.algo} ${options.source || options.tmp_file} | sed 's/^.* \\([a-z0-9]*\\)$/\\1/g'\`\n# Get target hash\ntargetDgst=\`cat <<EOF | lxc exec ${options.container} -- bash\n# Ensure openssl is available\ncommand -v openssl >/dev/null || exit 4\n# Target does not exist\n[ ! -f "${options.target}" ] && exit 0\nopenssl dgst -${options.algo} ${options.target} | sed 's/^.* \\([a-z0-9]*\\)$/\\1/g'\nEOF\`\n[ "$sourceDgst" != "$targetDgst" ] || exit 42`,
    code_skipped: 42,
    trap: true
  }, function(err) {
    if ((err != null ? err.code : void 0) === 2) {
      throw Error(`Invalid Option: source is not a file, got ${JSON.stringify(options.source || options.tmp_file)}`);
    }
    if ((err != null ? err.code : void 0) === 3) {
      throw Error("Invalid Requirement: openssl not installed on host");
    }
    if ((err != null ? err.code : void 0) === 4) {
      throw Error("Invalid Requirement: openssl not installed on container");
    }
  });
  this.system.execute({
    if: function() {
      return !this.status(-2) || this.status(-1);
    },
    cmd: `${['lxc', 'file', 'push', options.source || options.tmp_file, options.lxd_target, options.create_dirs ? '--create-dirs' : void 0, (options.gid != null) && typeof options.gid === 'number' ? '--gid' : void 0, (options.uid != null) && typeof options.uid === 'number' ? '--uid' : void 0, options.mode ? `--mode ${options.mode}` : void 0].join(' ')}`,
    trap: true,
    trim: true
  });
  this.lxd.exec({
    if: typeof options.gid === 'string',
    container: options.container,
    cmd: `chgrp ${options.gid} ${options.target}`
  });
  this.lxd.exec({
    if: typeof options.uid === 'string',
    container: options.container,
    cmd: `chown ${options.uid} ${options.target}`
  });
  return this.fs.unlink({
    if: options.content != null,
    target: options.tmp_file,
    tolerant: true // TODO, not yet implemented
  });
};


// ## Dependencies
path = require('path');
