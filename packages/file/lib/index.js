// Generated by CoffeeScript 2.5.1
// # `nikita.file`

// Write a file or a portion of an existing file.

// ## Output

// * `err`   
//   Error object if any.
// * `status`   
//   Indicate file modifications.

// ## Implementation details

// Internally, this function uses the "chmod" and "chown" function and, thus,
// honor all their options including "mode", "uid" and "gid".

// ## Diff Lines

// Diff can be obtained when the options "diff" is set to true or a function. The
// information is provided in two ways:

// * when `true`, a formated string written to the "stdout" option.
// * when a function, a readable diff and the array returned by the function 
//   `diff.diffLines`, see the [diffLines] package for additionnal information.

// ## More about the `append` option

// The `append` option allows more advanced usages. If `append` is "null", it will
// add the value of the "replace" option at the end of the file when no match
// is found and when the value is a string.

// Using the `append` option conjointly with the `match` and `replace` options gets
// even more interesting. If append is a string or a regular expression, it will
// place the value of the "replace" option just after the match. Internally, a
// string value will be converted to a regular expression. For example the string
// "test" will end up converted to the regular expression `/test/mg`.

// ## Replacing part of a file using from and to markers

// ```js
// const {data} = await nikita
// .file({
//   content: 'Start\n# from\nlets try to replace that one\n# to\nEnd',
//   from: '# from\n',
//   to: '# to',
//   replace: 'New string\n',
//   target: `${scratch}/a_file`
// })
// .fs.base.readFile({
//   target: `${scratch}/a_file`,
//   encoding: 'ascii'
// })
// console.info(data)
// // Start\n# from\nNew string\n# to\nEnd
// ```

// ## Replacing a matched line by a string

// ```js
// const {data} = await nikita
// .file({
//   content: 'email=david(at)adaltas(dot)com\nusername=root',
//   match: /(username)=(.*)/,
//   replace: '$1=david (was $2)',
//   target: `${scratch}/a_file`
// })
// .fs.base.readFile({
//   target: `${scratch}/a_file`,
//   encoding: 'ascii'
// })
// console.info(data)
// // email=david(at)adaltas(dot)com\nusername=david (was root)
// ```

// ## Replacing part of a file using a regular expression

// ```js
// const {data} = await nikita
// .file({
//   content: 'Start\nlets try to replace that one\nEnd',
//   match: /(.*try) (.*)/,
//   replace: ['New string, $1'],
//   target: `${scratch}/a_file`
// })
// .fs.base.readFile({
//   target: `${scratch}/a_file`,
//   encoding: 'ascii'
// })
// console.info(data)
// // Start\nNew string, lets try\nEnd
// ```

// ## Replacing with the global and multiple lines options

// ```js
// const {data} = await nikita
// .file({
//   content: '# Start\n#property=30\nproperty=10\n# End',
//   match: /^property=.*$/mg,
//   replace: 'property=50',
//   target: `${scratch}/a_file`
// })
// .fs.base.readFile({
//   target: `${scratch}/a_file`,
//   encoding: 'ascii'
// })
// console.info(data)
// // # Start\n#property=30\nproperty=50\n# End
// ```

// ## Appending a line after each line containing "property"

// ```js
// const {data} = await nikita
// .file({
//   content: '# Start\n#property=30\nproperty=10\n# End',
//   match: /^.*comment.*$/mg,
//   replace: '# comment',
//   target: `${scratch}/a_file`,
//   append: 'property'
// })
// .fs.base.readFile({
//   target: `${scratch}/a_file`,
//   encoding: 'ascii'
// })
// console.info(data)
// // # Start\n#property=30\n# comment\nproperty=50\n# comment\n# End
// ```

// ## Multiple transformations

// ```js
// const {data} = await nikita
// .file({
//   content: 'username: me\nemail: my@email\nfriends: you',
//   write: [
//     {match: /^(username).*$/mg, replace: '$1: you'},
//     {match: /^email.*$/mg, replace: ''},
//     {match: /^(friends).*$/mg, replace: '$1: me'}
//   ],
//   target: `${scratch}/a_file`
// })
// .fs.base.readFile({
//   target: `${scratch}/a_file`,
//   encoding: 'ascii'
// })
// console.info(data)
// // username: you\n\nfriends: me
// ```

// ## Hook
var handler, on_action, path, schema, utils;

on_action = function({config}) {
  if (!((config.source || (config.content != null)) || (config.replace != null) || (config.write != null))) {
    // Validate parameters
    throw Error('Missing source or content or replace or write');
  }
  if (config.source && (config.content != null)) {
    throw Error('Define either source or content');
  }
  if (!config.target) {
    throw Error('Missing target');
  }
  if (config.content) {
    if (typeof config.content === 'number') {
      config.content = `${config.content}`;
    } else if (Buffer.isBuffer(config.content)) {
      config.content = config.content.toString();
    }
  }
  if (typeof config.backup_mode === 'string') {
    config.backup_mode = parseInt(config.backup_mode, 8);
  }
  if (typeof config.mode === 'string') {
    return config.mode = parseInt(config.mode, 8);
  }
};

// ## Schema
schema = {
  type: 'object',
  properties: {
    'append': {
      oneOf: [
        {
          type: 'string'
        },
        {
          type: 'boolean'
        },
        {
          instanceof: 'RegExp'
        }
      ],
      default: false,
      description: `Append the content to the target file. If target does not exist, the
file will be created.`
    },
    'backup': {
      oneOf: [
        {
          type: 'string'
        },
        {
          typeof: 'boolean'
        }
      ],
      description: `Create a backup, append a provided string to the filename extension or
a timestamp if value is not a string, only apply if the target file
exists and is modified.`
    },
    'backup_mode': {
      type: 'integer',
      default: 0o0400,
      description: `Backup file mode (permission and sticky bits), defaults to \`0o0400\`,
in the  form of \`{mode: 0o0400}\` or \`{mode: "0400"}\`.`
    },
    'content': {
      oneOf: [
        {
          type: 'string'
        },
        {
          typeof: 'function'
        }
      ],
      description: `Text to be written, an alternative to source which reference a file.`
    },
    'context': {
      type: 'object',
      description: `Context provided to the template engine.`
    },
    'diff': {
      typeof: 'function',
      description: `Print diff information, pass a readable diff and the result of
[jsdiff.diffLines][diffLines] as arguments if a function, default to
true.`
    },
    'eof': {
      oneOf: [
        {
          type: 'string'
        },
        {
          type: 'boolean'
        }
      ],
      description: `Ensure the file ends with this charactere sequence, special values are
'windows', 'mac', 'unix' and 'unicode' (respectively "\r\n", "\r",
"\n", "\u2028"), will be auto-detected if "true", default to false or
"\n" if "true" and not detected.`
    },
    'encoding': {
      type: 'string',
      default: 'utf8',
      description: `Encoding of the source and target files.`
    },
    'engine': {
      type: 'string',
      default: 'handlebars',
      description: `Template engine being used.`
    },
    'from': {
      oneOf: [
        {
          type: 'string'
        },
        {
          instanceof: 'RegExp'
        }
      ],
      description: `Name of the marker from where the content will be replaced.`
    },
    'gid': {
      $ref: 'module://@nikitajs/engine/lib/actions/fs/chown#/properties/gid'
    },
    'local': {
      type: 'boolean',
      default: false,
      description: `Treat the source as local instead of remote, only apply with "ssh"
option.`
    },
    'match': {
      oneOf: [
        {
          type: 'string'
        },
        {
          instanceof: 'RegExp'
        }
      ],
      description: `Replace this marker, default to the replaced string if missing.`
    },
    'mode': {
      $ref: 'module://@nikitajs/engine/lib/actions/fs/chmod#/properties/mode'
    },
    'place_before': {
      oneOf: [
        {
          type: 'string'
        },
        {
          type: 'boolean'
        },
        {
          instanceof: 'RegExp'
        }
      ],
      description: `Place the content before the match.`
    },
    'remove_empty_lines': {
      type: 'boolean',
      description: `Remove empty lines from content`
    },
    'replace': {
      oneOf: [
        {
          type: 'string'
        },
        {
          type: 'array',
          items: {
            type: 'string'
          }
        }
      ],
      description: `The content to be inserted, used conjointly with the from, to or match
options.`
    },
    'source': {
      type: 'string',
      description: `File path from where to extract the content, do not use conjointly
with content.`
    },
    'target': {
      oneOf: [
        {
          type: 'string'
        },
        {
          typeof: 'function'
        }
      ],
      description: `File path where to write content to. Pass the content.`
    },
    'to': {
      oneOf: [
        {
          type: 'string'
        },
        {
          instanceof: 'RegExp'
        }
      ],
      description: `Name of the marker until where the content will be replaced.`
    },
    'uid': {
      $ref: 'module://@nikitajs/engine/lib/actions/fs/chown#/properties/uid'
    },
    'unlink': {
      type: 'boolean',
      default: false,
      description: `Replace the existing link, leaving the refered file untouched.`
    },
    'write': {
      description: `An array containing multiple transformation where a transformation is
an object accepting the options \`from\`, \`to\`, \`match\` and \`replace\`.`,
      type: 'array',
      items: {
        type: 'object',
        properties: {
          'from': {
            oneOf: [
              {
                type: 'string'
              },
              {
                instanceof: 'RegExp'
              }
            ],
            description: `File path from where to extract the content, do not use
conjointly with content.`
          },
          'to': {
            oneOf: [
              {
                type: 'string'
              },
              {
                instanceof: 'RegExp'
              }
            ],
            description: `Name of the marker until where the content will be replaced.`
          },
          'match': {
            oneOf: [
              {
                type: 'string'
              },
              {
                instanceof: 'RegExp'
              }
            ],
            description: `Replace this marker, default to the replaced string if missing.`
          },
          'replace': {
            type: 'string',
            description: `The content to be inserted, used conjointly with the from, to or
match options.`
          }
        }
      }
    }
  }
};

// ## Handler
handler = async function({
    config,
    tools: {log}
  }) {
  var backup, char, contentChanged, context, err, exists, i, j, k, len, len1, raw, ref, ref1, source, target, targetContent, targetContentHash, targetStats, text, w;
  // Content: pass all arguments to function calls
  context = arguments[0];
  log({
    message: `Source is \"${config.source}\"`,
    level: 'DEBUG',
    module: 'nikita/lib/file'
  });
  log({
    message: `Destination is \"${config.target}\"`,
    level: 'DEBUG',
    module: 'nikita/lib/file'
  });
  if (typeof config.content === 'function') {
    config.content = config.content.call(this, context);
  }
  if (config.diff == null) {
    config.diff = config.diff || !!config.stdout;
  }
  switch (config.eof) {
    case 'unix':
      config.eof = "\n";
      break;
    case 'mac':
      config.eof = "\r";
      break;
    case 'windows':
      config.eof = "\r\n";
      break;
    case 'unicode':
      config.eof = "\u2028";
  }
  target = null;
  targetContentHash = null;
  if (config.write == null) {
    config.write = [];
  }
  if ((config.from != null) || (config.to != null) || (config.match != null) || (config.replace != null) || (config.place_before != null)) {
    config.write.push({
      from: config.from,
      to: config.to,
      match: config.match,
      replace: config.replace,
      append: config.append,
      place_before: config.place_before
    });
    config.append = false;
  }
  ref = config.write;
  for (j = 0, len = ref.length; j < len; j++) {
    w = ref[j];
    if ((w.from == null) && (w.to == null) && (w.match == null) && (w.replace != null)) {
      w.match = w.replace;
    }
  }
  // Start work
  if (config.source != null) {
    // Option "local" force to bypass the ssh
    // connection, use by the upload function
    source = config.source || config.target;
    log({
      message: `Force local source is \"${config.local ? 'true' : 'false'}\"`,
      level: 'DEBUG',
      module: 'nikita/lib/file'
    });
    ({exists} = (await this.fs.base.exists({
      ssh: !config.local ? config.ssh : void 0,
      sudo: config.local ? false : config.sudo,
      target: source
    })));
    if (!exists) {
      if (config.source) {
        throw Error(`Source does not exist: ${JSON.stringify(config.source)}`);
      }
      config.content = '';
    }
    log({
      message: "Reading source",
      level: 'DEBUG',
      module: 'nikita/lib/file'
    });
    ({
      data: config.content
    } = (await this.fs.base.readFile({
      ssh: config.local ? false : void 0,
      sudo: config.local ? false : void 0,
      target: source,
      encoding: config.encoding
    })));
  } else if (config.content == null) {
    try {
      ({
        data: config.content
      } = (await this.fs.base.readFile({
        ssh: config.local ? false : config.ssh,
        sudo: config.local ? false : config.sudo,
        target: config.target,
        encoding: config.encoding
      })));
    } catch (error) {
      err = error;
      if (err.code !== 'NIKITA_FS_CRS_TARGET_ENOENT') {
        throw err;
      }
      config.content = '';
    }
  }
  // Stat the target
  targetStats = (await this.call({
    metadata: {
      raw_output: true
    }
  }, async function() {
    var stats;
    if (typeof config.target !== 'string') {
      return null;
    }
    log({
      message: "Stat target",
      level: 'DEBUG',
      module: 'nikita/lib/file'
    });
    try {
      ({stats} = (await this.fs.base.lstat({
        target: config.target
      })));
      if (utils.stats.isDirectory(stats.mode)) {
        throw Error('Incoherent situation, target is a directory and there is no source to guess the filename');
        config.target = `${config.target}/${path.basename(config.source)}`;
        log({
          message: "Destination is a directory and is now \"config.target\"",
          level: 'INFO',
          module: 'nikita/lib/file'
        });
        // Destination is the parent directory, let's see if the file exist inside
        ({stats} = (await this.fs.base.stat({
          target: config.target,
          metadata: {
            relax: 'NIKITA_FS_STAT_TARGET_ENOENT'
          }
        })));
        if (!utils.stats.isFile(stats.mode)) {
          throw Error(`Destination is not a file: ${config.target}`);
        }
        log({
          message: "New target exists",
          level: 'INFO',
          module: 'nikita/lib/file'
        });
      } else if (utils.stats.isSymbolicLink(stats.mode)) {
        log({
          message: "Destination is a symlink",
          level: 'INFO',
          module: 'nikita/lib/file'
        });
        if (config.unlink) {
          await this.fs.base.unlink({
            target: config.target
          });
          stats = null;
        }
      } else if (utils.stats.isFile(stats.mode)) {
        log({
          message: "Destination is a file",
          level: 'INFO',
          module: 'nikita/lib/file'
        });
      } else {
        throw Error(`Invalid File Type Destination: ${config.target}`);
      }
      return stats;
    } catch (error) {
      err = error;
      switch (err.code) {
        case 'NIKITA_FS_STAT_TARGET_ENOENT':
          await this.fs.mkdir({
            target: path.dirname(config.target),
            uid: config.uid,
            gid: config.gid,
            // force execution right on mkdir
            mode: config.mode ? config.mode | 0o111 : 0o755
          });
          break;
        default:
          throw err;
      }
      return null;
    }
  }));
  if (config.transform) {
    // if the transform function returns null or undefined, the file is not written
    // else if transform throws an error, the error isnt caught but rather thrown
    config.content = (await config.transform.call(void 0, {
      config: config
    }));
  }
  if (config.remove_empty_lines) {
    log({
      message: "Remove empty lines",
      level: 'DEBUG',
      module: 'nikita/lib/file'
    });
    config.content = config.content.replace(/(\r\n|[\n\r\u0085\u2028\u2029])\s*(\r\n|[\n\r\u0085\u2028\u2029])/g, "$1");
  }
  if (config.write.length) {
    utils.partial(config, log);
  }
  if (config.eof) {
    log({
      message: 'Checking option eof',
      level: 'DEBUG',
      module: 'nikita/lib/file'
    });
    if (config.eof === true) {
      ref1 = config.content;
      for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
        char = ref1[i];
        if (char === '\r') {
          config.eof = config.content[i + 1] === '\n' ? '\r\n' : char;
          break;
        }
        if (char === '\n' || char === '\u2028') {
          config.eof = char;
          break;
        }
      }
      if (config.eof === true) {
        config.eof = '\n';
      }
      log({
        message: `Option eof is true, guessing as ${JSON.stringify(config.eof)}`,
        level: 'INFO',
        module: 'nikita/lib/file'
      });
    }
    if (!utils.string.endsWith(config.content, config.eof)) {
      log({
        message: 'Add eof',
        level: 'INFO',
        module: 'nikita/lib/file'
      });
      config.content += config.eof;
    }
  }
  // Read the target, compute its hash and diff its content
  if (targetStats) {
    ({
      data: targetContent
    } = (await this.fs.base.readFile({
      target: config.target,
      encoding: config.encoding
    })));
    targetContentHash = utils.string.hash(targetContent);
  }
  if (config.content != null) {
    contentChanged = (targetStats == null) || targetContentHash !== utils.string.hash(config.content);
  }
  if (contentChanged) {
    ({raw, text} = utils.diff(targetContent, config.content, config));
    if (typeof config.diff === 'function') {
      config.diff(text, raw);
    }
    log({
      type: 'diff',
      message: text,
      level: 'INFO',
      module: 'nikita/lib/file'
    });
  }
  if (config.backup && contentChanged) {
    log({
      message: "Create backup",
      level: 'INFO',
      module: 'nikita/lib/file'
    });
    if (config.backup_mode == null) {
      config.backup_mode = 0o0400;
    }
    backup = typeof config.backup === 'string' ? config.backup : `.${Date.now()}`;
    await this.fs.copy({
      source: config.target,
      target: `${config.target}${backup}`,
      mode: config.backup_mode,
      metadata: {
        relax: 'NIKITA_FS_STAT_TARGET_ENOENT'
      }
    });
  }
  // Call the target with the content when a function
  if (typeof config.target === 'function') {
    log({
      message: 'Write target with user function',
      level: 'INFO',
      module: 'nikita/lib/file'
    });
    await config.target({
      content: config.content
    });
  } else {
    // Ownership and permission are also handled
    // Preserved the file mode if the file exists. Otherwise,
    // delegate to fs.createWriteStream` the creation of the default
    // mode of "744".
    // https://github.com/nodejs/node/issues/1104
    // `mode` specifies the permissions to use in case a new file is created.
    if (contentChanged) {
      await this.call(async function() {
        if (config.append) {
          if (config.flags == null) {
            config.flags = 'a';
          }
        }
        await this.fs.base.writeFile({
          target: config.target,
          flags: config.flags,
          content: config.content,
          mode: targetStats != null ? targetStats.mode : void 0
        });
        return {
          status: true
        };
      });
    }
    if (config.mode) {
      await this.fs.chmod({
        target: config.target,
        stats: targetStats,
        mode: config.mode
      });
    } else if (targetStats) {
      await this.fs.chmod({
        target: config.target,
        stats: targetStats,
        mode: targetStats.mode
      });
    }
    // Option gid is set at runtime if target is a new file
    await this.fs.chown({
      target: config.target,
      stats: targetStats,
      uid: config.uid,
      gid: config.gid,
      if: (config.uid != null) || (config.gid != null)
    });
  }
  return {};
};

// ## Exports
module.exports = {
  handler: handler,
  hooks: {
    on_action: on_action
  },
  metadata: {
    schema: schema
  }
};

// ## Dependencies
path = require('path');

utils = require('./utils');

// [diffLines]: https://github.com/kpdecker/jsdiff
