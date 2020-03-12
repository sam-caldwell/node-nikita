
parameters = require 'parameters'

parameters
  name: 'lxdvmhost'
  description: "LXD VM host based on Virtual Box"
  commands:
    'start':
      options:
        debug:
          type: 'boolean'
          description: 'Print debug output'
        log:
          type: 'string'
          description: 'Path to the directory storing logs.'
      route: require './start'
    'stop':
      options:
        debug:
          type: 'boolean'
          description: 'Print debug output'
        log:
          type: 'string'
          description: 'Path to the directory storing logs.'
      route: require './stop'
.route()
