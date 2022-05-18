// Generated by CoffeeScript 2.7.0
// # `nikita.ipa.user.disable`

// Disable a user from FreeIPA. Status is false if the user is already disabled.

// ## Example

// ```js
// const {$status} = await nikita.ipa.user.disable({
//   uid: "someone",
//   connection: {
//     url: "https://ipa.domain.com/ipa/session/json",
//     principal: "admin@DOMAIN.COM",
//     password: "mysecret"
//   }
// })
// console.info(`User was disable: ${$status}`)
// ```

// ## Hooks
var definitions, handler, on_action;

on_action = function({config}) {
  if (config.uid == null) {
    config.uid = config.username;
  }
  return delete config.username;
};

// ## Schema definitions
definitions = {
  config: {
    type: 'object',
    properties: {
      'uid': {
        type: 'string',
        description: `Name of the user to delete, same as the \`username\`.`
      },
      'username': {
        type: 'string',
        description: `Name of the user to delete, alias of \`uid\`.`
      },
      'connection': {
        type: 'object',
        $ref: 'module://@nikitajs/network/lib/http#/definitions/config',
        required: ['principal', 'password']
      }
    },
    required: ['connection', 'uid']
  }
};

// ## Handler
handler = async function({config}) {
  var base, nsaccountlock;
  if ((base = config.connection.http_headers)['Referer'] == null) {
    base['Referer'] = config.connection.referer || config.connection.url;
  }
  ({
    result: {nsaccountlock}
  } = (await this.ipa.user.show({
    $shy: false,
    connection: config.connection,
    uid: config.uid
  })));
  if (nsaccountlock === true) {
    return false;
  }
  return (await this.network.http(config.connection, {
    negotiate: true,
    method: 'POST',
    data: {
      method: "user_disable/1",
      params: [[config.uid], {}],
      id: 0
    }
  }));
};

// ## Exports
module.exports = {
  handler: handler,
  hooks: {
    on_action: on_action
  },
  metadata: {
    definitions: definitions
  }
};