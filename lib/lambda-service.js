'use strict'

/**
 * Keep your Lambda functions warm
 * @author Jeremy Daly <jeremy@jeremydaly.com>
 * @license MIT
 */

// Require the Lambda client
const Lambda = require('aws-sdk/clients/lambda') // Lambda

// Export
module.exports = new Lambda()
