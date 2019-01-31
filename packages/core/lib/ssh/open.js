// Generated by CoffeeScript 2.3.2
// # `nikita.ssh.open`

// Initialize an SSH connection.

// ## Options

// Takes the same options as the ssh2 module in an underscore form.

// * `cmd` (string)   
//   Command used to become the root user on the remote server, default to "su -".   
// * `private_key` (string)   
//   Private key for Ryba, optional, default to the value defined by
//   "bootstrap.private_key_location".   
// * `private_key_path` (string)   
//   Path where to read the private key for Ryba, default to "~/.ssh/id_rsa".   
// * `public_key` (string)   
//   Public key associated with the private key.   
// * `password` (string)   
//   Password of the user with super user permissions, required if current user 
//   running masson doesnt yet have remote access as root.   
// * `username` (string)   
//   Username of the user with super user permissions, required if current user 
//   running masson doesnt yet have remote access as root.  
// * `host` (string)   
//   Hostname or IP address of the remove server.   
// * `ip` (string)   
//   IP address of the remove server, used if "host" option isn't defined.   
// * `host` (string)   
//   Port of the remove server, default to 22.   
// * `root` (object)    
//   Options passed to `nikita.ssh.root` to enable password-less root login.   

// It is also possible to pass all the options through the `ssh` property.

// ## Exemples

// Once an SSH connection is establish, it is possible to retrieve the connection
// by calling the `ssh` action. If no ssh connection is available, it will
// simply return null.

// ```
// require('nikita')
// .ssh.open({
//   host: 'localhost',
//   user: 'my_account',
//   password: 'my_secret'
// })
// .call(function(){
//   assert(!!@ssh(), true)
// })
// .system.execute({
//   header: 'Print remote hostname',
//   cmd: 'hostname'
// })
// .ssh.close()
// ```

// Set the `ssh` option to `null` or `false` to disabled SSH and force an action to be executed 
// locally:

// ```js
// require('nikita')
// .ssh.open({
//   host: 'localhost',
//   user: 'my_account',
//   password: 'my_secret'
// })
// .call({ssh: false}, function(){
//   assert(@ssh(options.ssh), null)
// })
// .system.execute({
//   ssh: false
//   header: 'Print local hostname',
//   cmd: 'hostname'
// })
// .ssh.close()
// ```

// It is possible to group all the options inside the `ssh` property. This is
// provided for conveniency and is often used to pass `ssh` information when
// initializing the session.

// ```js
// require('nikita')({
//   ssh: {
//     host: 'localhost',
//     user: 'my_account',
//     password: 'my_secret'
//   }
// })
// .ssh.open()
// .call(function(options){
//   assert(!!@ssh(), true)
// })
// .ssh.close()
// ```

// ## Source code
var connect, fs, misc, ssh;

module.exports = {
  handler: function({options}) {
    var base, base1, k, ref, v;
    this.log({
      message: "Entering ssh.open",
      level: 'DEBUG',
      module: 'nikita/lib/ssh/open'
    });
    // No need to connect if ssh is a connection
    if (ssh.is(options.ssh)) {
      if (!this.store['nikita:ssh:connection']) {
        return this.call(function(_, callback) {
          this.store['nikita:ssh:connection'] = options.ssh;
          return callback(null, true);
        });
      } else if (ssh.compare(this.store['nikita:ssh:connection'], options.ssh)) { // Nothing to do
        return;
      } else {
        throw Error('SSH Connection Already Set: call `ssh.close` before attempting to associate a new connection with `ssh.open`.');
      }
    }
    // Merge SSH config namespace
    if (options.ssh && !options.ssh.config) {
      ref = options.ssh || {};
      for (k in ref) {
        v = ref[k];
        if (options[k] == null) {
          options[k] = v;
        }
      }
    }
    // Normalize configuration
    if (options.username == null) {
      options.username = 'root';
    }
    if (options.host == null) {
      options.host = options.ip;
    }
    if (options.port == null) {
      options.port = 22;
    }
    if (options.private_key == null) {
      options.private_key = null;
    }
    if (options.private_key_path == null) {
      options.private_key_path = '~/.ssh/id_rsa';
    }
    // options.public_key ?= []
    // options.public_key = [options.public_key] if typeof options.public_key is 'string'
    if (options.root == null) {
      options.root = {};
    }
    if ((base = options.root).host == null) {
      base.host = options.ip || options.host;
    }
    if ((base1 = options.root).port == null) {
      base1.port = options.port;
    }
    // Check status
    if (this.store['nikita:ssh:connection']) {
      // The new connection refer to the same target and the current one
      if (ssh.compare(this.store['nikita:ssh:connection'], options)) {
        return;
      }
      throw Error("SSH Connection Already Set: call `ssh.close` before attempting to create a new connection with `ssh.open`.");
    }
    // Read private key if option is a path
    this.call({
      unless: options.private_key
    }, function({}, callback) {
      this.log({
        message: `Read Private Key from: ${options.private_key_path}`,
        level: 'DEBUG',
        module: 'nikita/lib/ssh/open'
      });
      return misc.path.normalize(options.private_key_path, function(location) {
        return fs.readFile(location, 'ascii', function(err, data) {
          if (err && err.code === 'ENOENT') {
            return callback(Error(`Private key doesnt exists: ${JSON.stringify(location)}`));
          }
          if (err) {
            return callback(err);
          }
          options.private_key = data;
          return callback();
        });
      });
    });
    // Establish connection
    this.call({
      relax: true
    }, function({}, callback) {
      this.log({
        message: `Read Private Key: ${JSON.stringify(options.private_key_path)}`,
        level: 'DEBUG',
        module: 'nikita/lib/ssh/open'
      });
      return connect(options, (err, conn) => {
        this.log(!err ? {
          message: "Connection is established",
          level: 'INFO',
          module: 'nikita/lib/ssh/open'
        } : {
          message: "Connection failed",
          level: 'WARN',
          module: 'nikita/lib/ssh/open'
        });
        if (!err) {
          this.store['nikita:ssh:connection'] = conn;
        }
        return callback(err, !!conn);
      });
    }, function(err, status) {
      if (!err) {
        return this.end();
      }
    });
    // Enable root access
    this.call({
      if: options.root.username
    }, function() {
      this.log({
        message: "Bootstrap Root Access",
        level: 'INFO',
        module: 'nikita/lib/ssh/open'
      });
      if (options.public_key) {
        console.log('Deprecated Options: public_key');
      }
      return this.ssh.root(options.root);
    });
    return this.call({
      retry: 3
    }, function({}, callback) {
      this.log({
        message: "Establish Connection: attempt after enabling root access",
        level: 'DEBUG',
        module: 'nikita/lib/ssh/open'
      });
      return connect(options, (err, conn) => {
        if (!err) {
          this.store['nikita:ssh:connection'] = conn;
        }
        return callback(err);
      });
    });
  }
};

// ## Dependencies
fs = require('fs');

misc = require('../misc');

ssh = require('../misc/ssh');

connect = require('ssh2-connect');