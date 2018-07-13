'use strict';

const expect = require('chai').expect // assertion library
const rewire = require('rewire') // Rewire library

// Seed expected environment variable
process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function'

describe('Logging Tests', function() {

  describe('Using standard warming invocation', function() {
    it('should capture logging data', function(done) {
      let warmer = rewire('../index')
      let event = { warmer: true, concurrency: 1 }

      let logger = console.log
      let logData = {}
      console.log = (log) => { logData = log }

      warmer(event, { log:true }).then(out => {
        console.log = logger // restore console.log
        // console.log(logData);
        expect(logData.function).to.equal('test-function')
        expect(logData.count).to.equal(1)
        expect(logData.concurrency).to.equal(1)
        expect(logData.warm).to.equal(false)
        expect(logData.correlationId).to.equal(logData.id)
        expect(logData.lastAccessed).to.be.null
        expect(logData.lastAccessedSeconds).to.be.null
        expect(out).to.equal(true)
        done()
      })
    })

    it('should capture logging data with correlationId', function(done) {
      let warmer = rewire('../index')
      let event = { warmer: true, concurrency: 1 }

      let logger = console.log
      let logData = {}
      console.log = (log) => { logData = log }

      warmer(event, { log:true, correlationId: 'test-correlation-id' }).then(out => {
        console.log = logger // restore console.log
        // console.log(logData);
        expect(logData.function).to.equal('test-function')
        expect(logData.count).to.equal(1)
        expect(logData.concurrency).to.equal(1)
        expect(logData.warm).to.equal(false)
        expect(logData.correlationId).to.equal('test-correlation-id')
        expect(logData.lastAccessed).to.be.null
        expect(logData.lastAccessedSeconds).to.be.null
        expect(out).to.equal(true)
        done()
      })
    })

    it('should disable logging', function(done) {
      let warmer = rewire('../index')
      let event = { warmer: true, concurrency: 1 }

      let logger = console.log
      let logData = {}
      console.log = (log) => { logData = log }

      warmer(event, { log:false }).then(out => {
        console.log = logger // restore console.log
        // console.log(logData);
        expect(logData).to.deep.equal({})
        expect(out).to.equal(true)
        done()
      })
    })

    it('should capture logging data (pre-warmed)', function(done) {
      let warmer = rewire('../index')
      let event = { warmer: true, concurrency: 1 }

      let logger = console.log
      let logData = {}
      console.log = (log) => { logData = log }

      warmer({}).then(() => {
        warmer(event, { log:true }).then(out => {
          console.log = logger // restore console.log
          // console.log(logData);
          expect(logData.function).to.equal('test-function')
          expect(logData.count).to.equal(1)
          expect(logData.concurrency).to.equal(1)
          expect(logData.warm).to.equal(true)
          expect(logData.correlationId).to.equal(logData.id)
          expect(logData.lastAccessed).to.not.be.null
          expect(logData.lastAccessedSeconds).to.not.be.null
          expect(out).to.equal(true)
          done()
        })
      })
    })

  })

})
