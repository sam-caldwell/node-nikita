// Generated by CoffeeScript 2.7.0
module.exports = async function({config, ...args}) {
  ({config} = (await this.lxc.state({
    $header: 'Container state',
    container: `${config.container}`
  })));
  return process.stdout.write(JSON.stringify(config, null, 2));
};