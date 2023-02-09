'use strict'

/**
 * Keep your Lambda functions warm
 * @author Jeremy Daly <jeremy@jeremydaly.com>
 * @license MIT
 */

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda')

module.exports = {
  invoke: (params) => LambdaClient.send(new InvokeCommand(params))
}
