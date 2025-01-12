
# `nikita.execute`

Run a command locally or with ssh if `host` or `ssh` is provided.

## Exit codes

The "code" property is important to determine whether an
action failed or succeed with or without modifications. An action is expected to
execute successfully if the exit code match one of the value
in "code", by default "0". Otherwise, it is considered to have failed and an
error is passed to the user callback. Sucessfull codes may or may not impact the
status, indicating or not a change of state.

The normalized form of code is an object with 2 properties:

- `true`: indicating a change of state, returned `$status` is `true`.
- `false`: indicating no change of state, returned `$status` is `false`.

The default value is: `{ true: [0], false: [] }`.

When code is an integer, it overwrite the `true` property, for example:

```js
nikita.execute({
  code: 1,
  command: 'exit 1'
}, ({config}) => {
  assert.deepEqual(
    config.code,
    { true: [1], false: [] }
  );
});
```

When code is an array, the first element overwrite the `true` property while
additionnal elements overwrite the `false` property:

```js
nikita.execute({
  code: [1, 2, [3, 4]],
  command: 'exit 1'
}, ({config}) => {
  assert.deepEqual(
    config.code,
    { true: [1], false: [2, 3, 4] }
  );
});
```

## Output

* `$status`   
  Value is `true` if exit code equals on of the values of `code.true`, `[0]` by default, `false` if
  exit code equals on of the values of `code.false`, `[]` by default.
* `stdout`   
  Stdout value(s) unless `stdout` property is provided.
* `stderr`   
  Stderr value(s) unless `stderr` property is provided.

## Temporary directory

A temporary directory is required under certain conditions. The action leverages
the `tmpdir` plugins which is only activated when necessary. The conditions
involves the usage of `sudo`, `chroot`, `arch_chroot` or `env_export`.

For performance reason, consider declare the `metadata.tmpdir` property in your
parent action to avoid the creation and removal of a tempory directory everytime
the `execute` action is called.

## Events

* `stdout`
* `stdout_stream`
* `stderr`
* `stderr_stream`

## Create a user over SSH

This example create a user on a remote server with the `useradd` command. It
print the error message if the command failed or an information message if it
succeed.

An exit code equal to "9" defined by the "code.false" property indicates that
the command is considered successfull but without any impact.

```js
const {$status} = await nikita.execute({
  ssh: ssh,
  command: 'useradd myfriend',
  code: [0, 9]
})
console.info(`User was created: ${$status}`)
```

## Run a command with bash

```js
const {stdout} = await nikita.execute({
  bash: true,
  command: 'env'
})
console.info(stdout)
```

## Hooks

    on_action =
      after: [
        '@nikitajs/core/src/plugins/execute'
        '@nikitajs/core/src/plugins/ssh'
        '@nikitajs/core/src/plugins/tools/path'
      ]
      before: [
        '@nikitajs/core/src/plugins/metadata/schema'
        '@nikitajs/core/src/plugins/metadata/tmpdir'
      ]
      handler: ({config, metadata, ssh, tools: {find, path, walk}}) ->
        config.env ?= if not ssh and not config.env then process.env else {}
        env_export = if config.env_export? then config.env_export else !!ssh
        # Create the tmpdir if arch_chroot is activated
        if config.arch_chroot and config.arch_chroot_rootdir
          metadata.tmpdir ?= ({os_tmpdir, tmpdir}) ->
            # Note, Arch mount `/tmp` with tmpfs in memory
            # placing a file in the host fs will not expose it inside of chroot
            config.arch_chroot_tmpdir = path.join '/opt', tmpdir
            tmpdir = path.join config.arch_chroot_rootdir, config.arch_chroot_tmpdir
            sudo = (command) ->
              if utils.os.whoami(ssh) is 'root'
              then command
              else "sudo #{command}"
            command = [
              'set -e'
              sudo "[ -w #{config.arch_chroot_rootdir} ] || exit 2;"
              sudo "mkdir -p #{tmpdir};"
              sudo "chmod 700 #{tmpdir};"
            ].join '\n'
            try
              await execProm ssh, command
            catch err
              throw errors.NIKITA_EXECUTE_ARCH_CHROOT_ROOTDIR_NOT_EXIST err: err, config: config if err.code is 2
              throw err
            target: tmpdir
        else if config.sudo or config.bash or (env_export and Object.keys(config.env).length)
          metadata.tmpdir ?= true
      
    on_result =
      before: '@nikitajs/core/src/plugins/ssh'
      handler: ({action: {config, metadata, ssh}}) ->
        # Only arch chroot manage tmpdir, otherwise it is handled by the plugin
        return unless config.arch_chroot and config.arch_chroot_rootdir
        # Disregard cleaning if tmpdir is a user defined function and if
        # the function failed to execute, see the on_action hook above.
        return if typeof metadata.tmpdir is 'function'
        sudo = (command) ->
          if utils.os.whoami(ssh) is 'root'
          then command
          else "sudo #{command}"
        command = [
          sudo "rm -rf #{metadata.tmpdir}"
        ].join '\n'
        await execProm ssh, command

## Schema definitions

    definitions =
      config:
        type: 'object'
        properties:
          'arch_chroot':
            type: ['boolean', 'string']
            description: '''
            Run this command inside a root directory with the arc-chroot command
            or any provided string, require the "arch_chroot_rootdir" option if activated.
            '''
          'bash':
            type: ['boolean', 'string']
            description: '''
            Serialize the command into a file and execute it with bash.
            '''
          'code':
            cast_code: true
            type: ['integer', 'string', 'array', 'object']
            properties:
              'true':
                type: 'array'
                items: type: 'integer'
                default: [0]
              'false':
                type: 'array'
                items: type: 'integer'
                default: []
            default: {}
            description: '''
            Valid exit code(s) returned by the command.
            '''
          'command':
            oneOf: [
              type: 'string'
            ,
              typeof: 'function'
            ]
            description: '''
            String, Object or array; Command to execute. A value provided as a
            function is interpreted as an action and will be called by forwarding
            the config object. The result is the expected to be the command
            to execute.
            '''
          'cwd':
            type: 'string'
            description: '''
            Current working directory from where to execute the command.
            '''
          'dirty':
            type: 'boolean'
            default: false
            description: '''
            Leave temporary files on the filesystem.
            '''
          'dry':
            type: 'boolean'
            description: '''
            Run the action without executing any real command.
            '''
          'env':
            type: 'object'
            description: '''
            Environment variables as key-value pairs. With local execution, it
            default to `process.env`. With remote execution over SSH, the accepted
            environment variables is determined by the AcceptEnv server setting
            and default to "LANG,LC_*". See the `env_export` property to get
            around this limitation.
            '''
            patternProperties: '': type: "string"
          'env_export':
            type: 'boolean'
            description: '''
            Write a temporary file which exports the the environment variables
            defined in the `env` property. The value is always `true` when
            environment variables must be used with SSH.
            '''
          'format':
            type: 'string'
            enum: ['json', 'yaml']
            description: '''
            Convert the stdout to a Javascript value or object.
            '''
          'gid':
            type: 'integer'
            description: '''
            Unix group id.
            '''
          'stdio':
            # Schema coercion from string, without is
            # oneOf: [
            #   $ref: '#/definitions/stdio'
            # ,
            #   type: 'array'
            #   items: $ref: '#/definitions/stdio'
            # ]
            type: 'array'
            items:
              $ref: '#/definitions/stdio'
            description: '''
            Configure the pipes that are established between the parent and
            child process.
            '''
          'stdin':
            instanceof: 'Object' # must be `stream.Writable`
            description: '''
            Readable EventEmitter in which the standard input is piped from.
            '''
          'stdin_log':
            type: 'boolean'
            default: true
            description: '''
            Log the executed command of type stdin, default is `true`.
            '''
          'stdout':
            instanceof: 'Object' # must be `stream.Writable`
            description: '''
            Writable EventEmitter in which the standard output of executed
            commands will be piped.
            '''
          'stdout_return':
            type: 'boolean'
            default: true
            description: '''
            Return the stderr content in the output, default is `true`.  It is
            preferable to set this property to `false` and to use the `stdout`
            property when expecting a large stdout output.
            '''
          'stdout_log':
            type: 'boolean'
            default: true
            description: '''
            Pass stdout output to the logs of type "stdout_stream", default is
            `true`.
            '''
          'stdout_trim':
            type: 'boolean'
            default: false
            description: '''
            Trim the stdout output.
            '''
          'stderr':
            instanceof: 'Object' # must be `stream.Writable`
            description: '''
            Writable EventEmitter in which the standard error output of executed
            command will be piped.
            '''
          'stderr_return':
            type: 'boolean'
            default: true
            description: '''
            Return the stderr content in the output, default is `true`. It is
            preferable to set this property to `false` and to use the `stderr`
            property when expecting a large stderr output.
            '''
          'stderr_log':
            type: 'boolean'
            default: true
            description: '''
            Pass stdout output to the logs of type "stdout_stream", default is
            `true`.
            '''
          'stderr_trim':
            type: 'boolean'
            default: false
            description: '''
            Trim the stderr output.
            '''
          'sudo':
            type: 'boolean'
            # default: false
            description: '''
            Run a command as sudo, desactivated if user is "root".
            '''
          'target':
            type: 'string'
            description: '''
            Temporary path storing the script, only apply with the `bash` and
            `arch_chroot` properties, always disposed once executed. Unless
            provided, the default location is `{metadata.tmpdir}/{string.hash
            config.command}`. See the `tmpdir` plugin for additionnal information.
            '''
          'trap':
            type: 'boolean'
            default: false
            description: '''
            Exit immediately if a commands inside a script exits with a non-zero
            exit status, add the `set -e` option to your script.
            '''
          'trim':
            type: 'boolean'
            default: false
            description: '''
            Trim both the stdout and stderr outputs.
            '''
          'uid':
            type: 'integer'
            description: '''
            Unix user id.
            '''
        dependencies:
          arch_chroot:
            properties:
              'arch_chroot_rootdir':
                type: 'string'
                description: '''
                Path to the mount point corresponding to the root directory, required
                if the "arch_chroot" option is activated.
                '''
            required: ['arch_chroot_rootdir']
        required: ['command']
      # see https://nodejs.org/api/child_process.html#optionsstdio
      stdio:
        oneOf: [
          enum: [
            'pipe', 'overlapped', 'ignore', 'inherit'
          ]
          type: 'string'
        ,
          enum: [
            0, 1, 2
          ]
          type: 'integer'
        ]
          
## Handler

    handler = ({config, metadata, parent, tools: {dig, find, log, path, walk}, ssh}) ->
      # Validate parameters
      config.mode ?= 0o500
      config.command = await @call config, config.command if typeof config.command is 'function'
      config.bash = 'bash' if config.bash is true
      config.arch_chroot = 'arch-chroot' if config.arch_chroot is true
      config.command = "set -e\n#{config.command}" if config.command and config.trap
      config.command_original = "#{config.command}"
      # sudo = await find ({config: {sudo}}) -> sudo
      dry = await find ({config: {dry}}) -> dry
      # TODO move next 2 lines this to schema or on_action ?
      throw Error "Incompatible properties: bash, arch_chroot" if ['bash', 'arch_chroot'].filter((k) -> config[k]).length > 1
      # Environment variables are merged with parent
      # env = merge {}, ...await walk ({config: {env}}) -> env
      # Serialize env in a sourced file
      env_export = if config.env_export? then config.env_export else !!ssh
      if env_export and Object.keys(config.env).length
        env_export_content = (
          "export #{k}=#{utils.string.escapeshellarg v}\n" for k, v of config.env
        ).join '\n'
        env_export_hash = utils.string.hash env_export_content
      # Guess current username
      current_username = utils.os.whoami(ssh)
      # Sudo
      if config.sudo
        if current_username is 'root'
          config.sudo = false
        else
          config.bash = 'bash' unless ['bash', 'arch_chroot'].some (k) -> config[k]
      # User substitution
      # Determines if writing is required and eventually convert uid to username
      if config.uid and current_username isnt 'root' and not /\d/.test "#{config.uid}"
        {stdout} = await @execute "awk -v val=#{config.uid} -F ":" '$3==val{print $1}' /etc/passwd`", (err, {stdout}) ->
        config.uid = stdout.trim()
        config.bash = 'bash' unless config.bash or config.arch_chroot
      if env_export and Object.keys(config.env).length
        env_export_hash = utils.string.hash env_export_content
        env_export_target = path.join metadata.tmpdir, env_export_hash
        config.command = "source #{env_export_target}\n#{config.command}"
        log message: "Writing env export to #{JSON.stringify env_export_target}", level: 'INFO'
        await @fs.base.writeFile
          $sudo: config.sudo
          content: env_export_content
          mode: 0o500
          target: env_export_target
          uid: config.uid
      if config.arch_chroot
        # Note, with arch_chroot enabled, 
        # arch_chroot_rootdir `/mnt` gave birth to
        # tmpdir `/mnt/tmpdir/nikita-random-path`
        # and target is inside it
        command = config.command
        if typeof target isnt 'string'
          target_in = path.join config.arch_chroot_tmpdir, "execute-arch_chroot-#{utils.string.hash config.command}"
          target = path.join config.arch_chroot_rootdir, target_in
        # target = "#{metadata.tmpdir}/#{utils.string.hash config.command}" if typeof config.target isnt 'string'
        log message: "Writing arch-chroot script to #{JSON.stringify target}", level: 'INFO'
        config.command = "#{config.arch_chroot} #{config.arch_chroot_rootdir} bash #{target_in}"
        config.command = "sudo #{config.command}" if config.sudo
        await @fs.base.writeFile
          $sudo: config.sudo
          target: "#{target}"
          content: "#{command}"
          mode: config.mode
      # Write script
      else if config.bash
        command = config.command
        if typeof target isnt 'string'
          target = path.join metadata.tmpdir, "execute-bash-#{utils.string.hash config.command}"
        log message: "Writing bash script to #{JSON.stringify target}", level: 'INFO'
        cmd = "#{config.bash} #{target}"
        if config.uid
          cmd = "su - #{config.uid} -c '#{cmd}'"
        if config.sudo
          cmd = "sudo #{cmd}"
        unless config.dirty
          cmd += "; code=`echo $?` "
          unless config.sudo
            cmd += "&& rm '#{target}'"
          else
            cmd += "&& sudo rm '#{target}'"
          cmd += "&& exit $code"
        config.command = cmd
        # config.command = "#{config.bash} #{target}"
        # config.command = "su - #{config.uid} -c '#{config.command}'" if config.uid
        # # Note, rm cannot be remove with arch_chroot enabled
        # config.command += " && code=`echo $?`; rm '#{target}'; exit $code" unless config.dirty
        await @fs.base.writeFile
          $sudo: config.sudo
          content: command
          mode: config.mode
          target: target
          uid: config.uid
      else if config.sudo
        config.command = "sudo #{config.command}"
      # Execute
      new Promise (resolve, reject) ->
        log message: config.command_original, type: 'stdin', level: 'INFO' if config.stdin_log
        result =
          $status: false
          stdout: []
          stderr: []
          code: null
          command: config.command_original
        return resolve result if config.dry
        child = exec config,
          ssh: ssh
          env: config.env
        # Note, child[stdin|stdout|stderr] are undefined
        # when option stdio is set to 'inherit'
        config.stdin.pipe child.stdin if config.stdin and child.stdin
        child.stdout.pipe config.stdout, end: false if config.stdout and child.stdout
        child.stderr.pipe config.stderr, end: false if config.stderr and child.stderr
        stdout_stream_open = stderr_stream_open = false
        if child.stdout and (config.stdout_return or config.stdout_log)
          child.stdout.on 'data', (data) ->
            stdout_stream_open = true if config.stdout_log
            log message: data, type: 'stdout_stream' if config.stdout_log
            if config.stdout_return
              if Array.isArray result.stdout # A string once `exit` is called
                result.stdout.push data
              else console.warn [
                'NIKITA_EXECUTE_STDOUT_INVALID:'
                'stdout coming after child exit,'
                "got #{JSON.stringify data.toString()},"
                'this is embarassing and we never found how to catch this bug,'
                'we would really enjoy some help to replicate or fix this one.'
              ].join ' '
        if child.stderr and (config.stderr_return or config.stderr_log)
          child.stderr.on 'data', (data) ->
            stderr_stream_open = true if config.stderr_log
            log message: data, type: 'stderr_stream' if config.stderr_log
            if config.stderr_return
              if Array.isArray result.stderr # A string once `exit` is called
                result.stderr.push data
              else console.warn [
                'NIKITA_EXECUTE_STDERR_INVALID:'
                'stderr coming after child exit,'
                "got #{JSON.stringify data.toString()},"
                'this is embarassing and we never found how to catch this bug,'
                'we would really enjoy some help to replicate or fix this one.'
              ].join ' '
        child.on "exit", (code) ->
          log message: "Command exit with status: #{code}", level: 'DEBUG'
          result.code = code
          # Give it some time because the "exit" event is sometimes called
          # before the "stdout" "data" event when running `npm test`
          setImmediate ->
            log message: null, type: 'stdout_stream' if stdout_stream_open and config.stdout_log
            log message: null, type: 'stderr_stream' if  stderr_stream_open and config.stderr_log
            result.stdout = result.stdout.map((d) -> d.toString()).join('')
            result.stdout = result.stdout.trim() if config.trim or config.stdout_trim
            result.stderr = result.stderr.map((d) -> d.toString()).join('')
            result.stderr = result.stderr.trim() if config.trim or config.stderr_trim
            if config.format and config.code.true.indexOf(code) isnt -1
              result.data = switch config.format
                when 'json' then JSON.parse result.stdout
                when 'yaml' then yaml.load result.stdout
            log message: result.stdout, type: 'stdout' if result.stdout and result.stdout isnt '' and config.stdout_log
            log message: result.stderr, type: 'stderr' if result.stderr and result.stderr isnt '' and config.stderr_log
            if child.stdout and config.stdout
              child.stdout.unpipe config.stdout
            if child.stderr and config.stderr
              child.stderr.unpipe config.stderr
            if config.code.true.indexOf(code) is -1 and config.code.false.indexOf(code) is -1
              log 
                message: [
                  'An unexpected exit code was encountered,'
                  'using relax mode,' if metadata.relax
                  "command is #{JSON.stringify utils.string.max config.command_original, 50},"
                  "got #{JSON.stringify result.code}"
                  "instead of #{JSON.stringify config.code}."
                ].filter( (line) -> !!line).join ' '
                level: if metadata.relax then 'INFO' else 'ERROR'
              return reject utils.error 'NIKITA_EXECUTE_EXIT_CODE_INVALID', [
                'an unexpected exit code was encountered,'
                'using relax mode,' if metadata.relax
                "command is #{JSON.stringify utils.string.max config.command_original, 50},"
                "got #{JSON.stringify result.code}"
                "instead of #{JSON.stringify config.code}."
              ], {...result, exit_code: code}
            if config.code.false.indexOf(code) is -1
              result.$status = true
            else
              log message: "Skip exit code `#{code}`", level: 'INFO'
            resolve result

## Exports

    module.exports =
      handler: handler
      hooks:
        on_action: on_action
        on_result: on_result
      metadata:
        argument_to_config: 'command'
        definitions: definitions

## Errors

    errors =
      NIKITA_EXECUTE_ARCH_CHROOT_ROOTDIR_NOT_EXIST: ({err, config}) ->
        utils.error 'NIKITA_EXECUTE_ARCH_CHROOT_ROOTDIR_NOT_EXIST', [
          'directory defined by `config.arch_chroot_rootdir` must exist,'
          "location is #{JSON.stringify config.arch_chroot_rootdir}."
        ],
          exit_code: err.code
          stdout: err.stdout
          stderr: err.stderr

## Dependencies

    exec = require 'ssh2-exec'
    execProm = require 'ssh2-exec/promise'
    fs = require 'ssh2-fs'
    yaml = require 'js-yaml'
    utils = require '../../utils'
