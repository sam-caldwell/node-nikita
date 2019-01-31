// Generated by CoffeeScript 2.3.2
// # `nikita.service.stop`

// Start a service. Note, does not throw an error if service is not installed.

// ## Options

// * `arch_chroot` (boolean|string)   
//   Run this command inside a root directory with the arc-chroot command or any 
//   provided string, require the "rootdir" option if activated.   
// * `rootdir` (string)   
//   Path to the mount point corresponding to the root directory, required if 
//   the "arch_chroot" option is activated.   
// * `name` (string)   
//   Service name.   

// ## Callback parameters

// * `err`   
//   Error object if any.   
// * `status`   
//   Indicates if the service was stopped ("true") or if it was already stopped 
//   ("false").   

// ## Example

// ```js
// require('nikita')
// .service.stop([{
//   ssh: ssh,
//   name: 'gmetad'
// }, function(err, status){ /* do sth */ });
// ```

// ## Source Code
module.exports = function({options}) {
  this.log({
    message: "Entering service.stop",
    level: 'DEBUG',
    module: 'nikita/lib/service/stop'
  });
  if (typeof options.argument === 'string') {
    // Options
    if (options.name == null) {
      options.name = options.argument;
    }
  }
  if (!options.name) {
    // Validation
    throw Error(`Invalid Name: ${JSON.stringify(options.name)}`);
  }
  // Action
  this.log({
    message: `Stop service ${options.name}`,
    level: 'INFO',
    module: 'nikita/lib/service/stop'
  });
  return this.system.execute({
    cmd: `ls /lib/systemd/system/*.service /etc/systemd/system/*.service /etc/rc.d/* /etc/init.d/* 2>/dev/null | grep -w "${options.name}" || exit 3\nif command -v systemctl >/dev/null 2>&1; then\n  systemctl status ${options.name} || exit 3\n  systemctl stop ${options.name}\nelif command -v service >/dev/null 2>&1; then\n  service ${options.name} status || exit 3\n  service ${options.name} stop\nelse\n  echo "Unsupported Loader" >&2\n  exit 2\nfi`,
    code_skipped: 3,
    arch_chroot: options.arch_chroot,
    rootdir: options.rootdir
  }, function(err, {status}) {
    if (!err && !status) {
      this.log({
        message: "Service already stopped",
        level: 'WARN',
        module: 'nikita/lib/service/stop'
      });
    }
    if (!err && status) {
      return this.log({
        message: "Service is stopped",
        level: 'INFO',
        module: 'nikita/lib/service/stop'
      });
    }
  });
};