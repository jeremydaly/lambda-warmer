'use strict'

/**
 * Keep your Lambda functions warm
 * @author Jeremy Daly <jeremy@jeremydaly.com>
 * @version 1.1.2
 * @license MIT
 */

const id = Date.now().toString() + '-' + ('0000' + Math.floor(Math.random()*1000).toString()).substr(-4)

let warm = false
let lastAccess = null

const funcName = process.env.AWS_LAMBDA_FUNCTION_NAME
const funcVersion = process.env.AWS_LAMBDA_FUNCTION_VERSION

const delay = ms => new Promise(res => setTimeout(res, ms))

module.exports = (event,cfg = {}) => {

  let config = Object.assign({}, {
    flag: 'warmer', // default test flag
    concurrency: 'concurrency', // default concurrency field
    test: 'test', // default test flag
    log: true, // default logging to true
    correlationId: id, // default the correlationId
    delay: 75 // default the delay to 75ms
  },cfg)

  // If the event is a warmer ping
  if (event && event[config.flag]) {

    let concurrency = event[config.concurrency]
      && !isNaN(event[config.concurrency])
      && event[config.concurrency] > 1
      ? event[config.concurrency] : 1

    let invokeCount = event['__WARMER_INVOCATION__']
      && !isNaN(event['__WARMER_INVOCATION__'])
      ? event['__WARMER_INVOCATION__'] : 1

    let invokeTotal = event['__WARMER_CONCURRENCY__']
      && !isNaN(event['__WARMER_CONCURRENCY__'])
      ? event['__WARMER_CONCURRENCY__'] : concurrency

    let correlationId = event['__WARMER_CORRELATIONID__']
      ? event['__WARMER_CORRELATIONID__'] : config.correlationId

    const shouldWait = event['__WARMER_DELAY__']

    const targetFuncName = event.targetFuncName

    const functionToWarm = targetFuncName || `${funcName}:${funcVersion}`
    // Create log record
    let log = {
      action: 'warmer',
      function: functionToWarm,
      id,
      correlationId,
      count: invokeCount,
      concurrency: invokeTotal,
      warm,
      lastAccessed: lastAccess,
      lastAccessedSeconds: lastAccess === null ? null : ((Date.now()-lastAccess)/1000).toFixed(1)
    }

    // Log it
    config.log && console.log(log) // eslint-disable-line no-console

    // flag as warm
    warm = true
    lastAccess = Date.now()

    const shouldInvoke = concurrency > 1 || targetFuncName

    // Fan out if concurrency is set higher than 1
    if (shouldInvoke && !event[config.test]) {

      // init Lambda service
      let lambda = require('./lib/lambda-service')

      // init promise array
      let invocations = []

      // if warming self, we skip 1 due to current function invocation
      // if targetFuncName, we need to start from 1 to invoke target function `concurrency` times
      const startCount = targetFuncName ? 1 : 2;
      // loop through concurrency count
      for (let i = startCount; i <= concurrency; i++) {

        // Set the params and wait for the final function to finish
        let params = {
          FunctionName: functionToWarm,
          InvocationType: i === concurrency ? 'RequestResponse' : 'Event',
          LogType: 'None',
          Payload: Buffer.from(JSON.stringify({
            [config.flag]: true, // send warmer flag
            '__WARMER_INVOCATION__': i, // send invocation number
            '__WARMER_CONCURRENCY__': concurrency, // send total concurrency
            '__WARMER_CORRELATIONID__': correlationId, // send correlation id
            '__WARMER_DELAY__': !!targetFuncName, // send explicit wait if target is another function
          }))
        }

        // Add promise to invocations array
        invocations.push(lambda.invoke(params).promise())

      } // end for

      // Invoke concurrent functions
      return Promise.all(invocations)
        .then(() => true)

    } else if (shouldWait || invokeCount > 1) {
      return delay(config.delay).then(() => true)
    }

    return Promise.resolve(true)
  } else {
    warm = true
    lastAccess = Date.now()
    return Promise.resolve(false)
  }

} // end module
