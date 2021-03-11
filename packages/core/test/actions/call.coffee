
nikita = require '../../src'
registry = require '../../src/registry'
{tags, config} = require '../test'
they = require('mocha-they')(config)

describe 'actions.call', ->
  return unless tags.api

  it 'call action from global registry', ->
    nikita
    .call ->
      registry.register 'my_function', ({config}) ->
        pass_a_key: config.a_key
    .call ->
      {pass_a_key} = await nikita.my_function a_key: 'a value'
      pass_a_key.should.eql 'a value'
    .call ->
      registry.unregister 'my_function'
  
  they 'call a module exporting a function', ({ssh}) ->
    nikita
      ssh: ssh
      $tmpdir: true
    , ({metadata: {tmpdir}}) ->
      @fs.base.writeFile
        content: '''
        module.exports = ({config}) => {
          return config
        }
        '''
        target: "#{tmpdir}/my_module.js"
      result = await @call "#{tmpdir}/my_module.js", my_key: 'my value'
      result.should.containEql my_key: 'my value'
  
  they 'call a module exporting an object', ({ssh}) ->
    nikita
      ssh: ssh
      $tmpdir: true
    , ({metadata: {tmpdir}}) ->
      @fs.base.writeFile
        content: '''
        module.exports = {
          metadata: {
            header: 'hello'
          },
          handler: ({config, metadata}) => {
            return {config, metadata}
          }
        }
        '''
        target: "#{tmpdir}/my_module.js"
      {config, metadata} = await @call "#{tmpdir}/my_module.js", my_key: 'my value'
      config.should.containEql
        my_key: 'my value'
      metadata.should.containEql
        header: 'hello'
        module: "#{tmpdir}/my_module.js"
