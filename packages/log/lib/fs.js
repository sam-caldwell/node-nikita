// Generated by CoffeeScript 2.5.1
// # `nikita.log.fs`

// Write log to the host filesystem in a user provided format.

// ## Layout

// By default, a file name "{{basename}}.log" will be created inside the base
// directory defined by the option "basedir". 
// The path looks like "{config.basedir}/{hostname}.log".

// If the option "archive" is activated, a folder named after the current time is
// created inside the base directory. A symbolic link named as "latest" will point
// this is direction. The paths look like "{config.basedir}/{time}/{hostname}.log"
// and "{config.basedir}/latest".

// ## Schema
var fs, handler, path, schema;

schema = {
  type: 'object',
  properties: {
    'archive': {
      type: 'boolean',
      default: false,
      description: `Save a copy of the previous logs inside a dedicated directory.`
    },
    'basedir': {
      type: 'string',
      default: './log',
      description: `Directory where to store logs relative to the process working
directory. Default to the "log" directory. Note, when the \`archive\`
option is activated, the log files will be stored accessible from
"./log/latest".`
    },
    'filename': {
      type: 'string',
      default: '{{config.basename}}.log',
      description: `Name of the log file. The default behavior rely on the templated
plugin to contextually render the filename.`
    },
    'basename': {
      type: 'string',
      default: 'localhost',
      description: `Default variable used by the filename rendering.`
    },
    'serializer': {
      type: 'object',
      description: `An object of key value pairs where keys are the event types and the
value is a function which must be implemented to serialize the
information.`
    }
  },
  required: ['serializer']
};

// ## Handler
handler = async function({config}) {
  var err, latestdir, logdir, now;
  // Normalization
  config.basedir = path.resolve(config.basedir);
  // Archive config
  if (!config.archive) {
    logdir = path.resolve(config.basedir);
  } else {
    latestdir = path.resolve(config.basedir, 'latest');
    now = new Date();
    if (config.archive === true) {
      config.archive = `${now.getFullYear()}`.slice(-2) + `0${now.getFullYear()}`.slice(-2) + `0${now.getDate()}`.slice(-2);
    }
    logdir = path.resolve(config.basedir, config.archive);
  }
  try {
    await this.fs.base.mkdir(logdir);
  } catch (error) {
    err = error;
    if (err.code !== 'NIKITA_FS_MKDIR_TARGET_EEXIST') {
      throw err;
    }
  }
  // Events
  if (config.stream == null) {
    config.stream = fs.createWriteStream(path.resolve(logdir, config.filename));
  }
  await this.log.stream(config);
  // Handle link to latest directory
  return (await this.fs.base.symlink({
    $if: latestdir,
    source: logdir,
    target: latestdir
  }));
};

// ## Exports
module.exports = {
  handler: handler,
  ssh: false,
  metadata: {
    schema: schema
  }
};

// ## Dependencies
fs = require('fs');

path = require('path');
