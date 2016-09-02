
path = require 'path'
mecano = require '../../src'
test = require '../test'
they = require 'ssh2-they'
fs = require 'ssh2-fs'

describe 'download file', ->

  scratch = test.scratch @
  
  describe 'source', ->

    they 'with file protocol', (ssh, next) ->
      source = "file://#{__filename}"
      target = "#{scratch}/download_test"
      mecano
        ssh: ssh
      .download
        source: source
        target: target # Download a non existing file
      , (err, status) ->
        return next err if err
        status.should.be.true()
      .call ({}, callback) ->
        fs.readFile @options.ssh, target, 'ascii', (err, content) ->
          content.should.containEql 'yeah' unless err
          callback err
      .download
        source: source
        target: target # Download on an existing file
      , (err, status) ->
        status.should.be.false() unless err
        next err

    they 'without protocol', (ssh, next) ->
      source = "#{__filename}"
      target = "#{scratch}/download_test"
      # Download a non existing file
      mecano
        ssh: ssh
      .download
        source: source
        target: target
      , (err, status) ->
        status.should.be.true() unless err
      .call ({}, callback) ->
        fs.readFile @options.ssh, target, 'ascii', (err, content) ->
          content.should.containEql 'yeah' unless err
          callback err
      .download # Download on an existing file
        source: source
        target: target
      , (err, status) ->
        status.should.be.false() unless err
      .then next

    they 'doesnt exists', (ssh, next) ->
      source = "#{__dirname}/doesnotexists"
      target = "#{scratch}/download_test"
      mecano
        ssh: ssh
      .download
        source: source
        target: target
        # shy: true
      , (err, status) ->
        err.message.should.eql 'No such source file'
        err.code.should.eql 'ENOENT'
      .then (err) ->
        next()

    they 'into an existing directory', (ssh, next) ->
      source = "#{__filename}"
      target = "#{scratch}/download_test"
      mecano
        ssh: ssh
      .mkdir
        target: target
      .download
        source: source
        target: target
      .call (_, callback) ->
        fs.stat ssh, "#{target}/#{path.basename source}", (err, stat) ->
          stat.isFile().should.be.true() unless err
          callback err
      .then next

  describe 'cache', ->

    they 'validate md5', (ssh, next) ->
      source = "#{__dirname}/download.zip"
      target = "#{scratch}/download"
      mecano.download
        ssh: ssh
        source: source
        target: "#{scratch}/download_test"
        cache: true
        cache_dir: "#{scratch}/cache_dir"
        md5: '3f104676a5f72de08b811dbb725244ff'
      , (err, status) ->
        return next err if err
        status.should.be.true()
        fs.exists null, "#{scratch}/cache_dir/#{path.basename source}", (err, exists) ->
          exists.should.be.true() unless err
          next err

    they 'cache dir', (ssh, next) ->
      # Download a non existing file
      target = "#{scratch}/download"
      mecano.download
        ssh: ssh
        source: "#{__filename}"
        target: "#{scratch}/download_test"
        cache: true
        cache_dir: "#{scratch}/cache_dir"
      , (err, status) ->
        return next err if err
        status.should.be.true()
        fs.exists ssh, "#{scratch}/cache_dir/#{path.basename __filename}", (err, exists) ->
          exists.should.be.true() unless err
          next err

    they 'detect file already present', (ssh, next) ->
      ssh = null
      mecano
        ssh: ssh
      .download
        source: "#{__filename}"
        target: "#{scratch}/download_test"
        cache: true
        cache_dir: "#{scratch}/cache_dir"
      .download
        source: "#{__filename}"
        target: "#{scratch}/download_test"
        cache: true
        cache_dir: "#{scratch}/cache_dir"
      , (err, status) ->
        status.should.be.false() unless err
      .file
        content: 'abc'
        target: "#{scratch}/download_test"
      .download
        source: "#{__filename}"
        target: "#{scratch}/download_test"
        cache: true
        cache_dir: "#{scratch}/cache_dir"
      , (err, status) ->
        status.should.be.true() unless err
      .then next
  
  describe 'md5', ->

    they 'cache dir with md5 string', (ssh, next) ->
      # Download a non existing file
      target = "#{scratch}/download"
      mecano
        ssh: ssh
      .file
        target: "#{scratch}/a_file"
        content: 'okay'
      .download
        source: "#{scratch}/a_file"
        target: "#{scratch}/download_test"
        cache: true
        cache_dir: "#{scratch}/cache_dir"
        md5: 'df8fede7ff71608e24a5576326e41c75'
      , (err, status) ->
        return next err if err
        status.should.be.true()
        fs.readFile ssh, "#{scratch}/cache_dir/a_file", 'ascii', (err, data) ->
          return next err if err
          data.should.eql 'okay'
          fs.readFile ssh, "#{scratch}/download_test", 'ascii', (err, data) ->
            return next err if err
            data.should.eql 'okay'
            next()

    they 'is computed if true', (ssh, next) ->
      return next() unless ssh
      logs = []
      # Download with invalid checksum
      target = "#{scratch}/check_md5"
      mecano
        ssh: ssh
      .on 'text', (log) -> logs.push "[#{log.level}] #{log.message}"
      .file
        target: "#{scratch}/source"
        content: "okay"
      .download
        source: "#{scratch}/source"
        target: target
        md5: true
      , (err, status) ->
        status.should.be.true() unless err
      .download
        source: "#{scratch}/source"
        target: target
        md5: true
      , (err, status) ->
        status.should.be.false() unless err
      .call ->
        ("[WARN] Hash dont match, source is 'df8fede7ff71608e24a5576326e41c75' and target is 'undefined'" in logs).should.be.true()
        ("[INFO] Hash matches as 'df8fede7ff71608e24a5576326e41c75'" in logs).should.be.true()
      .then next
