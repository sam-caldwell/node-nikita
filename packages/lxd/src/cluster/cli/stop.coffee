
nikita = require 'nikita'

module.exports = ({params}) ->
  nikita
    debug: params.debug
  .log.cli pad: host: 20, header: 60
  .log.md basename: 'start', basedir: params.log, archive: false, if: params.log
  .system.execute
    cwd: "#{__dirname}/../../../assets"
    cmd: '''
    vagrant halt
    '''
