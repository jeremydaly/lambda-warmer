'use strict'

/**
 * Keep your Lambda functions warm
 * @author Jeremy Daly <jeremy@jeremydaly.com>
 * @license MIT
 */

const Lambda = require('@aws-sdk/client-lambda')

module.exports = new Lambda()
