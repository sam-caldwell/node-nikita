// Generated by CoffeeScript 2.4.1
// # `nikita.service.restart`

// Start a service.

// ## Options

// * `name` (string)   
//   Service name.   
// * `ssh` (object|ssh2)   
//   Run the action on a remote server using SSH, an ssh2 instance or an
//   configuration object used to initialize the SSH connection.   
// * `stdout` (stream.Writable)   
//   Writable EventEmitter in which the standard output of executed commands will
//   be piped.   
// * `stderr` (stream.Writable)   
//   Writable EventEmitter in which the standard error output of executed command
//   will be piped.   

// ## Callback parameters

// * `err`   
//   Error object if any.   
// * `modified`   
//   Indicates if the startup behavior has changed.   

// ## Example

// ```js
// require('nikita').service.start([{
//   ssh: ssh,
//   name: 'gmetad'
// }, function(err, {status}){ /* do sth */ });
// ```

// ## Source Code
module.exports = function({options}) {
  this.log({
    message: "Entering service.restart",
    level: 'DEBUG',
    module: 'nikita/lib/service/restart'
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
    message: `Restart service ${options.name}`,
    level: 'INFO',
    module: 'nikita/lib/service/restart'
  });
  this.service.discover(function(err, system) {
    return options.loader != null ? options.loader : options.loader = system.loader;
  });
  return this.call(function() {
    return this.system.execute({
      cmd: (function() {
        switch (options.loader) {
          case 'systemctl':
            return `systemctl restart ${options.name}`;
          case 'service':
            return `service ${options.name} restart`;
          default:
            throw Error('Init System not supported');
        }
      })()
    }, function(err, {status}) {
      if (err) {
        throw err;
      }
      if (status) {
        return this.store[`nikita.service.${options.name}.status`] = 'started';
      }
    });
  });
};