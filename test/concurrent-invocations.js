'use strict';

const expect = require('chai').expect // assertion library
const rewire = require('rewire') // Rewire library

// Seed expected environment variable
process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function'

describe('Concurrent Invocation Tests', function() {

  describe('Delays', function() {
    it('should return true after 75ms (default)', function(done) {
      this.slow(500)
      let warmer = rewire('../index')
      let event = {
        warmer: true,
        __WARMER_INVOCATION__: 2, // send invocation number
        __WARMER_CONCURRENCY__: 2, // send total concurrency
        __WARMER_CORRELATIONID__: 'test-correlation-id' // send correlation id
      }
      let start = Date.now()
      warmer(event, { log:false }).then(out => {
        let timer = Date.now()-start
        expect(timer).to.be.within(74,125)
        expect(out).to.equal(true)
        done()
      })
    })

    it('should return true after 100ms', function(done) {
      this.slow(500)
      let warmer = rewire('../index')
      let event = {
        warmer: true,
        __WARMER_INVOCATION__: 2, // send invocation number
        __WARMER_CONCURRENCY__: 2, // send total concurrency
        __WARMER_CORRELATIONID__: 'test-correlation-id' // send correlation id
      }
      let start = Date.now()
      warmer(event, { log:false, delay:100 }).then(out => {
        let timer = Date.now()-start
        expect(timer).to.be.within(99,150)
        expect(out).to.equal(true)
        done()
      })
    })

    it('should return true after 200ms', function(done) {
      this.slow(500)
      let warmer = rewire('../index')
      let event = {
        warmer: true,
        __WARMER_INVOCATION__: 2, // send invocation number
        __WARMER_CONCURRENCY__: 2, // send total concurrency
        __WARMER_CORRELATIONID__: 'test-correlation-id' // send correlation id
      }
      let start = Date.now()
      warmer(event, { log:false, delay:200 }).then(out => {
        let timer = Date.now()-start
        expect(timer).to.be.within(199,250)
        expect(out).to.equal(true)
        done()
      })
    })

    it('should return true after 25ms', function(done) {
      this.slow(500)
      let warmer = rewire('../index')
      let event = {
        warmer: true,
        __WARMER_INVOCATION__: 2, // send invocation number
        __WARMER_CONCURRENCY__: 2, // send total concurrency
        __WARMER_CORRELATIONID__: 'test-correlation-id' // send correlation id
      }
      let start = Date.now()
      warmer(event, { log:false, delay:25 }).then(out => {
        let timer = Date.now()-start
        expect(timer).to.be.within(24,75)
        expect(out).to.equal(true)
        done()
      })
    })
  })



  describe('Passed Data Tests', function() {

    it('should capture default data correctly', function(done) {
      this.slow(500)
      let warmer = rewire('../index')
      let event = {
        warmer: true,
        __WARMER_INVOCATION__: 2, // send invocation number
        __WARMER_CONCURRENCY__: 2, // send total concurrency
        __WARMER_CORRELATIONID__: 'test-correlation-id' // send correlation id
      }
      let start = Date.now()

      let logger = console.log
      let logData = {}
      console.log = (log) => { logData = log }

      warmer(event, { log:true }).then(out => {
        let timer = Date.now()-start
        expect(timer).to.be.within(74,100)
        console.log = logger // restore console.log
        expect(logData.function).to.equal('test-function')
        expect(logData.count).to.equal(2)
        expect(logData.concurrency).to.equal(2)
        expect(logData.warm).to.equal(false)
        expect(logData.correlationId).to.equal('test-correlation-id')
        expect(logData.lastAccessed).to.be.null
        expect(logData.lastAccessedSeconds).to.be.null
        expect(out).to.equal(true)
        done()
      })
    })

    it('should capture configured data correctly', function(done) {
      this.slow(500)
      let warmer = rewire('../index')
      let event = {
        warmerX: true,
        __WARMER_INVOCATION__: 2, // send invocation number
        __WARMER_CONCURRENCY__: 3, // send total concurrency
        __WARMER_CORRELATIONID__: 'test-correlation-id' // send correlation id
      }
      let start = Date.now()

      let logger = console.log
      let logData = {}
      console.log = (log) => { logData = log }

      warmer(event, { flag:'warmerX',log:true }).then(out => {
        let timer = Date.now()-start
        expect(timer).to.be.within(74,100)
        console.log = logger // restore console.log
        expect(logData.function).to.equal('test-function')
        expect(logData.count).to.equal(2)
        expect(logData.concurrency).to.equal(3)
        expect(logData.warm).to.equal(false)
        expect(logData.correlationId).to.equal('test-correlation-id')
        expect(logData.lastAccessed).to.be.null
        expect(logData.lastAccessedSeconds).to.be.null
        expect(out).to.equal(true)
        done()
      })
    })


    it('should capture data correctly and be pre-warmed', function(done) {
      this.slow(500)
      let warmer = rewire('../index')
      let event = {
        warmer: true,
        __WARMER_INVOCATION__: 2, // send invocation number
        __WARMER_CONCURRENCY__: 3, // send total concurrency
        __WARMER_CORRELATIONID__: 'test-correlation-id' // send correlation id
      }
      let start = Date.now()

      let logger = console.log
      let logData = {}
      console.log = (log) => { logData = log }

      // Invoke with non-warming event
      warmer({}).then(()=> {
        // Invoke with warming event
        warmer(event, { flag:'warmer',log:true }).then(out => {
          let timer = Date.now()-start
          expect(timer).to.be.within(74,100)
          console.log = logger // restore console.log
          expect(logData.function).to.equal('test-function')
          expect(logData.count).to.equal(2)
          expect(logData.concurrency).to.equal(3)
          expect(logData.warm).to.equal(true)
          expect(logData.correlationId).to.equal('test-correlation-id')
          expect(logData.lastAccessed).to.not.be.null
          expect(logData.lastAccessedSeconds).to.not.be.null
          expect(out).to.equal(true)
          done()
        })
      })
    })

  })

})
