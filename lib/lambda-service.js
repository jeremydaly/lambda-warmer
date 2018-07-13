'use strict'

/**
 * Keep your Lambda functions warm
 * @author Jeremy Daly <jeremy@jeremydaly.com>
 * @license MIT
 */

// Require AWS SDK
const AWS = require('aws-sdk') // AWS SDK

// Export
module.exports = new AWS.Lambda()
