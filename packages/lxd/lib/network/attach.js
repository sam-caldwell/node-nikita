// Generated by CoffeeScript 2.7.0
// # `nikita.lxc.network.attach`

// Attach an existing network to a container.

// ## Output

// * `$status`   
//   True if the network was attached.

// ## Example

// ```js
// const {$status} = await nikita.lxc.network.attach({
//   network: 'network0',
//   container: 'container1'
// })
// console.info(`Network was attached: ${$status}`)
// ```

// ## Schema definitions
var definitions, handler;

definitions = {
  config: {
    type: 'object',
    properties: {
      'network': {
        type: 'string',
        description: `The network name to attach.`
      },
      'container': {
        $ref: 'module://@nikitajs/lxd/lib/init#/definitions/config/properties/container'
      }
    },
    required: ['network', 'container']
  }
};

// ## Handler
handler = async function({config}) {
  var command_attach;
  //Build command
  command_attach = ['lxc', 'network', 'attach', config.network, config.container].join(' ');
  //Execute
  return (await this.execute({
    command: `lxc config device list ${config.container} | grep ${config.network} && exit 42
${command_attach}`,
    code: [0, 42]
  }));
};

// ## Exports
module.exports = {
  handler: handler,
  metadata: {
    definitions: definitions
  }
};
