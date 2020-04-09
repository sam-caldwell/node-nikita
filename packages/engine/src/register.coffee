
registry = require './registry'
error = require './utils/error'

module.exports =
  '': handler: (->)
  'call':
    '': {}
  'log':
    '': handler: (->)
  'registry':
    'get': raw: true, handler: ({parent, options: [namespace]}) ->
      parent.registry.get namespace
    'register': raw: true, handler: ({parent, options: [namespace, action]}) ->
      parent.registry.register namespace, action
    'registered': raw: true, handler: ({parent, options: [namespace]}) ->
      parent.registry.registered namespace
    'unregister': raw: true, handler: ({parent, options: [namespace]}) ->
      parent.registry.unregister namespace
  'ssh':
    '': '@nikitajs/engine/src/actions/ssh'
    'open': '@nikitajs/engine/src/actions/ssh/open'
    'close': '@nikitajs/engine/src/actions/ssh/close'
    'root': '@nikitajs/engine/src/actions/ssh/root'
  'status': raw: true, handler: ({parent, options: [position]}) ->
    # console.log position, parent.children.slice(-1)[0].output.status
    if typeof position is 'number'
      parent.children.slice(position)[0].output.status
    else unless position?
      parent.children.some (child) -> child.output.status
    else
      throw error 'NIKITA_STATUS_POSITION_INVALID', [
        'argument position must be an integer if defined,'
        "get #{JSON.stringify position}"
      ]
(->
  await registry.register module.exports
)()
