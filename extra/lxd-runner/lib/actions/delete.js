// Generated by CoffeeScript 2.7.0
module.exports = function({config}) {
  return this.lxc.delete({
    $header: 'Container delete',
    container: `${config.container}`,
    force: config.force
  });
};