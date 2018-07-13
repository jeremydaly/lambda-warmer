'use strict';

const expect = require('chai').expect // assertion library
const rewire = require('rewire') // Rewire library

describe('Warming Event Tests', function() {

  describe('Using default configuration', function() {
    it('should return true', function(done) {
      let warmer = rewire('../index')
      let event = { warmer: true, concurrency: 1 }
      warmer(event, { log:false }).then(out => {
        expect(out).to.equal(true)
        done()
      })
    })
  })

  describe('Using modified configuration', function() {
    it('should return true', function(done) {
      let warmer = rewire('../index')
      let event = { warmerX: true, concurrencyX: 1 }
      warmer(event, { flag: 'warmerX', concurrency: 'concurrencyX', log:false }).then(out => {
        expect(out).to.equal(true)
        done()
      })
    })
  })

})
