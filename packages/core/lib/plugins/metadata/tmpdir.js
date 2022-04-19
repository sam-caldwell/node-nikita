// Generated by CoffeeScript 2.6.1
var exec, fs, is_object_literal, mutate, os, process, utils;

({is_object_literal} = require('mixme'));

({mutate} = require('mixme'));

utils = require('../../utils');

os = require('os');

process = require('process');

fs = require('ssh2-fs');

exec = require('ssh2-exec/promise');

module.exports = {
  name: '@nikitajs/core/lib/plugins/metadata/tmpdir',
  require: ['@nikitajs/core/lib/plugins/tools/find', '@nikitajs/core/lib/plugins/tools/path'],
  hooks: {
    // 'nikita:schema': ({schema}) ->
    //   mutate schema.definitions.metadata.properties,
    //     tmpdir:
    //       oneOf: [
    //         type: ['boolean', 'string']
    //       ,
    //         typeof: 'function'
    //       ]
    //       description: '''
    //       Creates a temporary directory for the duration of the action
    //       execution.
    //       '''
    'nikita:action': {
      before: ['@nikitajs/core/lib/plugins/templated'],
      after: ['@nikitajs/core/lib/plugins/execute', '@nikitajs/core/lib/plugins/ssh', '@nikitajs/core/lib/plugins/tools/path', '@nikitajs/core/lib/plugins/metadata/uuid'],
      // Probably related to pb above
      // '@nikitajs/core/lib/plugins/metadata/schema'
      handler: async function(action) {
        var config, err, exists, metadata, os_tmpdir, ref, ssh, ssh_hash, sudo, tmp_hash, tmpdir_info, tools;
        ({config, metadata, tools} = action);
        if (!(((ref = typeof metadata.tmpdir) === 'boolean' || ref === 'function' || ref === 'string' || ref === 'undefined') || (is_object_literal(metadata.tmpdir)))) {
          throw utils.error('METADATA_TMPDIR_INVALID', ['the "tmpdir" metadata value must be a boolean, a function, an object or a string,', `got ${JSON.stringify(metadata.tmpdir)}`]);
        }
        // tmpdir is explicit, it must be defined to be available as a metadata
        // wether we switch with sudo or ssh, if not defined, there is nothing to do
        if (!metadata.tmpdir) {
          return;
        }
        // SSH connection extraction
        ssh = config.ssh === false ? void 0 : (await tools.find(function(action) {
          return action.ssh;
        }));
        // Sudo extraction
        sudo = (await tools.find(function({metadata}) {
          return metadata.sudo;
        }));
        // Generate temporary location
        os_tmpdir = ssh ? '/tmp' : os.tmpdir();
        ssh_hash = ssh ? utils.ssh.hash(ssh) : null;
        tmp_hash = utils.string.hash(JSON.stringify({
          ssh_hash: ssh_hash,
          sudo: sudo,
          uuid: metadata.uuid
        }));
        tmpdir_info = (await (async function() {
          switch (typeof metadata.tmpdir) {
            case 'string':
              return {
                target: metadata.tmpdir
              };
            case 'boolean':
              return {
                target: 'nikita-' + tmp_hash,
                hash: tmp_hash
              };
            case 'function':
              return (await metadata.tmpdir.call(null, {
                action: action,
                os_tmpdir: os_tmpdir,
                tmpdir: 'nikita-' + tmp_hash
              }));
            case 'object':
              // metadata.tmpdir.target ?= 'nikita-'+tmp_hash
              return metadata.tmpdir;
            default:
              return void 0;
          }
        })());
        // Current context
        if (tmpdir_info.uuid == null) {
          tmpdir_info.uuid = metadata.uuid;
        }
        if (tmpdir_info.ssh_hash == null) {
          tmpdir_info.ssh_hash = ssh_hash;
        }
        if (tmpdir_info.sudo == null) {
          tmpdir_info.sudo = sudo;
        }
        if (tmpdir_info.mode == null) {
          tmpdir_info.mode = 0o0744;
        }
        if (tmpdir_info.hash == null) {
          tmpdir_info.hash = utils.string.hash(JSON.stringify(tmpdir_info));
        }
        if (tmpdir_info.target == null) {
          tmpdir_info.target = 'nikita-' + tmpdir_info.hash;
        }
        tmpdir_info.target = tools.path.resolve(os_tmpdir, tmpdir_info.target);
        metadata.tmpdir = tmpdir_info.target;
        exists = action.parent && (await tools.find(action.parent, function({metadata}) {
          var ref1;
          if (!metadata.tmpdir) {
            return;
          }
          if (tmpdir_info.hash === ((ref1 = metadata.tmpdir_info) != null ? ref1.hash : void 0)) {
            return true;
          }
        }));
        if (exists) {
          return;
        }
        try {
          await fs.mkdir(ssh, metadata.tmpdir, tmpdir_info.mode);
          if (tmpdir_info.sudo) {
            await exec(ssh, `sudo chown root:root '${metadata.tmpdir}'`);
          }
          return metadata.tmpdir_info = tmpdir_info;
        } catch (error) {
          err = error;
          if (err.code !== 'EEXIST') {
            throw err;
          }
        }
      }
    },
    'nikita:result': {
      before: '@nikitajs/core/lib/plugins/ssh',
      handler: async function({action}) {
        var config, metadata, ssh, tools;
        ({config, metadata, tools} = action);
        // Value of tmpdir could still be true if there was an error in
        // one of the on_action hook, such as a invalid schema validation
        if (typeof metadata.tmpdir !== 'string') {
          return;
        }
        if (!metadata.tmpdir_info) {
          return;
        }
        if ((await tools.find(function({metadata}) {
          return metadata.dirty;
        }))) {
          return;
        }
        // SSH connection extraction
        ssh = config.ssh === false ? void 0 : (await tools.find(action, function(action) {
          return action.ssh;
        }));
        // Temporary directory decommissioning
        return (await exec(ssh, [metadata.tmpdir_info.sudo ? 'sudo' : void 0, `rm -r '${metadata.tmpdir}'`].join(' ')));
      }
    }
  }
};
