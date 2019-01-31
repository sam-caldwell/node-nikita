// Generated by CoffeeScript 2.3.2
// # `nikita.db.schema`

// Create a database for the destination database.

// ## Options

// * `admin_username`   
//   The login of the database administrator.   
// * `admin_password`   
//   The password of the database administrator.   
// * `database` (String)   
//   The database name where the schema is created.
// * `engine`   
//   The engine type, can be MySQL or PostgreSQL. Default to MySQL   
// * `host`   
//   The hostname of the database   
// * `port`   
//   Port to the associated database   
// * `schema`   
//   New schema name.   
// * `owner` Array or String   
//   The Schema owner. Alter Schema if schema already exists.   

// ## Create Schema example

// ```js
// require('nikita')
// .database.schema({
//   admin_username: 'test',
//   admin_password: 'test',
//   database: 'my_db'
// }, function(err, {status}){
//   console.log(err ? err.message : 'Principal created or modified: ' + status);
// });
// ```

// ## Source Code
var db;

module.exports = function({options}) {
  var k, ref, ref1, v;
  // Import options from `options.db`
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
    // Check main options
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
  // Deprecation
  if (options.engine === 'postgres') {
    console.log('Deprecated Value: options "postgres" is deprecated in favor of "postgresql"');
    options.engine = 'postgresql';
  }
  // Defines and check the engine type 
  options.engine = options.engine.toLowerCase();
  if ((ref1 = options.engine) !== 'postgresql') {
    throw Error(`Unsupport engine: ${JSON.stringify(options.engine)}`);
  }
  // Options
  if (options.port == null) {
    options.port = 5432;
  }
  this.system.execute({
    code_skipped: 2,
    cmd: db.cmd(options, '\\dt')
  }, function(err, {status}) {
    if (err) {
      throw err;
    }
    if (!err && !status) {
      throw Error(`Database does not exist ${options.database}`);
    }
  });
  this.system.execute({
    cmd: db.cmd(options, `CREATE SCHEMA ${options.schema};`),
    unless_exec: db.cmd(options, `SELECT 1 FROM pg_namespace WHERE nspname = '${options.schema}';`) + " | grep 1"
  });
  // Check if owner is the good one
  return this.system.execute({
    if: function() {
      return options.owner != null;
    },
    unless_exec: db.cmd(options, '\\dn') + ` | grep '${options.schema}|${options.owner}'`,
    cmd: db.cmd(options, `ALTER SCHEMA ${options.schema} OWNER TO ${options.owner};`),
    code_skipped: 1
  }, function(err, {stderr}) {
    if (/^ERROR:\s\srole.*does\snot\sexist/.test(stderr)) {
      throw Error(`Owner ${options.owner} does not exists`);
    }
  });
};

// ## Dependencies
db = require('@nikitajs/core/lib/misc/db');