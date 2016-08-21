// Generated by CoffeeScript 1.10.0
var db;

module.exports = function(options) {
  var cmd_database_create, cmd_database_exists, i, k, len, ref, ref1, ref2, results, user, v;
  if (options.db == null) {
    options.db = {};
  }
  ref = options.db;
  for (k in ref) {
    v = ref[k];
    if (options[k] == null) {
      options[k] = v;
    }
  }
  if (!options.host) {
    throw Error('Missing option: "host"');
  }
  if (!options.admin_username) {
    throw Error('Missing option: "admin_username"');
  }
  if (!options.admin_password) {
    throw Error('Missing option: "admin_password"');
  }
  if (!options.database) {
    throw Error('Missing option: "database"');
  }
  if (!options.engine) {
    throw Error('Missing option: "engine"');
  }
  if (options.user == null) {
    options.user = [];
  }
  if (!Array.isArray(options.user)) {
    options.user = [options.user];
  }
  options.engine = options.engine.toLowerCase();
  if ((ref1 = options.engine) !== 'postgres') {
    throw Error("Unsupport engine: " + (JSON.stringify(options.engine)));
  }
  options.log({
    message: "Database engine set to " + options.engine,
    level: 'INFO',
    module: 'mecano/db/database/add'
  });
  if (options.port == null) {
    options.port = 5432;
  }
  options.log({
    message: "Check if database " + options.database + " exists",
    level: 'DEBUG',
    module: 'mecano/db/database/add'
  });
  cmd_database_create = db.cmd(options, {
    database: null
  }, "CREATE DATABASE " + options.database + ";");
  cmd_database_exists = db.cmd(options, {
    database: options.database
  }, "\\dt");
  this.execute({
    cmd: cmd_database_create,
    unless_exec: cmd_database_exists
  }, function(err, status) {
    if (status) {
      return options.log({
        message: "Database created: " + (JSON.stringify(options.database)),
        level: 'WARN',
        module: 'mecano/db/database/add'
      });
    }
  });
  ref2 = options.user;
  results = [];
  for (i = 0, len = ref2.length; i < len; i++) {
    user = ref2[i];
    options.log({
      message: "Check if user " + user + " has PRIVILEGES on " + options.database + " ",
      level: 'DEBUG',
      module: 'mecano/db/database/user'
    });
    this.db.user.exists({
      name: user,
      admin_username: options.admin_username,
      admin_password: options.admin_password,
      port: options.port,
      host: options.host
    }, function(err, exists) {
      if (!exists) {
        return options.log({
          message: "User does exists " + user + ": skipping",
          level: 'WARNING',
          module: 'mecano/db/database/add'
        });
      }
    });
    results.push(this.execute({
      "if": function() {
        return this.status(-1);
      },
      cmd: db.cmd(options, {
        database: options.database
      }, "GRANT ALL PRIVILEGES ON DATABASE " + options.database + " TO " + user),
      unless_exec: db.cmd(options, {
        database: options.database
      }, "SELECT datacl FROM  pg_database WHERE  datname = '" + options.database + "'") + (" | grep '" + user + "='")
    }, function(err, status) {
      if (status) {
        return options.log({
          message: "Privileges granted: to " + (JSON.stringify(user)) + " on " + (JSON.stringify(options.database)),
          level: 'WARN',
          module: 'mecano/db/database/add'
        });
      }
    }));
  }
  return results;
};

db = require('../../misc/db');