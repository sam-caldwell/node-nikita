
# `nikita.file.json`

## Example

Merge the destination file with user provided content.

```javascript
require('nikita')
.file.json({
  target: "/path/to/target.json",
  content: { preferences: { colors: 'blue' } },
  transform: function(data){
    if(data.indexOf('red') < 0){ data.push('red'); }
    return data;
  },
  merge: true,
  pretty: true
})
```

## On config

    on_action = ({config, metadata}) ->
      # Options
      config.content ?= {}
      config.pretty ?= false
      config.pretty = 2 if config.pretty is true
      config.transform ?= null
      throw Error "Required Option: the 'target' option is required" unless config.target
      throw Error "Invalid config: \"transform\"" if config.transform and typeof config.transform isnt 'function'

## Schema

    schema =
      type: 'object'
      properties:
        'backup':
          oneOf: [{type: 'string'}, {type: 'boolean'}]
          default: false
          description: """
          Create a backup, append a provided string to the filename extension or a
          timestamp if value is not a string, only apply if the target file exists and
          is modified.
          """
        'content':
          type: 'object'
          description: """
          The javascript code to stringify.
          """
        'merge':
          type: 'boolean'
          description: """
          Merge the user content with the content of the destination file if it
          exists.
          """
        'pretty':
          oneOf: [{type: 'integer'}, {type: 'boolean'}]
          default: false
          description: """
          Prettify the JSON output, accept the number of spaces as an integer, default
          to none if false or to 2 spaces indentation if true.
          """
        'source':
          type: 'string'
          description: """
          Path to a JSON file providing default values.
          """
        'target':
          type: 'string'
          description: """
          Path to the destination file.
          """
        'transform':
          # typeof: 'function'
          description: """
          User provided function to modify the javascript before it is stringified
          into JSON.
          """

## Handler

    handler = ({config, log, metadata, operations: {status, events}, ssh}) ->
      @log message: "Entering file.json", level: 'DEBUG', module: 'nikita/lib/file/json'
      @call if: config.merge, ->
        try
          data = await @fs.base.readFile
            target: config.target
            encoding: 'utf8'
          config.content = merge JSON.parse(data), config.content
          return
        catch err
          if not err.code is 'NIKITA_FS_CRS_TARGET_ENOENT'
            throw err
      @call if: config.source, ->
        data = await @fs.base.readFile
          ssh: if config.local then false else config.ssh
          sudo: if config.local then false else config.sudo
          target: config.source
          encoding: 'utf8'
        config.content = merge JSON.parse(data), config.content
        return
      @call if: config.transform, ->
        config.content = config.transform config.content
        return
      @file
        target: config.target
        content: -> JSON.stringify config.content, null, config.pretty
        backup: config.backup
        diff: config.diff
        eof: config.eof
        gid: config.gid
        uid: config.uid
        mode: config.mode

## Exports

    module.exports =
      handler: handler
      hooks:
        on_action: on_action
      schema: schema

## Dependencies

    {merge} = require 'mixme'