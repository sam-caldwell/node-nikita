
nikita = require '../../../src'
{tags} = require '../../test'

return unless tags.api

describe 'plugins.metadata.attempt (plugin.retry)', ->
  
  describe 'validation', ->

    it 'ensure attempt equals or is greater than 0', ->
      nikita
      .call metadata: attempt: 0, (->)
      .call metadata: attempt: 1, (->)
      .call metadata: attempt: -1, (->)
      .should.be.rejectedWith [
        'METADATA_ATTEMPT_INVALID_RANGE:'
        'configuration `attempt` expect a number above or equal to 0,'
        'got -1.'
      ].join ' '

  describe 'handler', ->

    it 'start with value 0', ->
      nikita.call ({metadata}) ->
        metadata.attempt.should.eql 0

    it 'follow the number of retry', ->
      count = 0
      nikita.call metadata: retry: 5, sleep: 0, ({metadata}) ->
        metadata.attempt.should.eql count++
        throw Error 'Catchme' if metadata.attempt < 4

    it.skip 'reschedule attempt with relax', ->
      count = 0
      nikita
      .call retry: 3, relax: true, sleep: 0, ({metadata}) ->
        metadata.attempt.should.eql count++
        throw Error 'Catchme'
      .call ->
        count.should.eql 3
