'use strict';

const expect = require('chai').expect // assertion library
const rewire = require('rewire') // Rewire library

describe('Non-warming Event Tests', function() {

  describe('Using default configuration', function() {
    it('should return false', function(done) {
      this.slow(500)
      let warmer = rewire('../index')
      let event = { foo:'bar' }

      let logger = console.log
      let logData = {}
      console.log = (log) => { logData = log }

      warmer(event, { log:false }).then(out => {
        console.log = logger // restore console.log
        expect(logData).to.deep.equal({})
        expect(out).to.equal(false)
        done()
      })
    })
  })

})
