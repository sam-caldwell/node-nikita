// Generated by CoffeeScript 2.5.1
// # `nikita.uid_gid`

// Normalize the "uid" and "gid" properties. A username defined by the "uid" option will
// be converted to a Unix user ID and a group defined by the "gid" option will
// be converted to a Unix group ID.    

// At the moment, this only work with Unix username because it only read the
// "/etc/passwd" file. A future implementation might execute a system command to
// retrieve information from external identity providers.   

// ## Exemple

// ```js
// const {uid, gid} = await nikita.system.uid_gid({
//   uid: 'myuser',
//   gid: 'mygroup'
// })
// console.info(`User uid is ${config.uid}`)
// console.info(`Group gid is ${config.gid}`)
// ```

// ## Hooks
var handler, on_action, schema;

on_action = function({config}) {
  if (typeof config.uid === 'string' && /^\d+$/.test(config.uid)) {
    config.uid = parseInt(config.uid, 10);
  }
  if (typeof config.gid === 'string' && /^\d+$/.test(config.gid)) {
    return config.gid = parseInt(config.gid, 10);
  }
};

// ## Schema
schema = {
  type: 'object',
  properties: {
    'gid': {
      $ref: 'module://@nikitajs/core/lib/actions/fs/chown#/properties/gid'
    },
    'group_target': {
      type: 'string',
      description: `Path to the group definition file, default to "/etc/group"`
    },
    'passwd_target': {
      type: 'string',
      description: `Path to the passwd definition file, default to "/etc/passwd".`
    },
    'uid': {
      $ref: 'module://@nikitajs/core/lib/actions/fs/chown#/properties/uid'
    }
  }
};

// ## Handler
handler = async function({config}, callback) {
  var group, user;
  if (config.uid && typeof config.uid === 'string') {
    ({user} = (await this.system.user.read({
      target: config.passwd_target,
      uid: config.uid
    })));
    config.uid = user.uid;
    config.default_gid = user.gid;
  }
  if (config.gid && typeof config.gid === 'string') {
    ({group} = (await this.system.group.read({
      target: config.group_target,
      gid: config.gid
    })));
    config.gid = group.gid;
  }
  return {
    uid: config.uid,
    gid: config.gid,
    default_gid: config.default_gid
  };
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