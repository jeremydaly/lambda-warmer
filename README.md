# Lambda Warmer

[![npm](https://img.shields.io/npm/v/lambda-warmer.svg)](https://www.npmjs.com/package/lambda-warmer)
[![npm](https://img.shields.io/npm/l/lambda-warmer.svg)](https://www.npmjs.com/package/lambda-warmer)
[![Build Status](https://travis-ci.org/jeremydaly/lambda-warmer.svg?branch=master)](https://travis-ci.org/jeremydaly/lambda-warmer)
[![Coverage Status](https://coveralls.io/repos/github/jeremydaly/lambda-warmer/badge.svg?branch=master)](https://coveralls.io/github/jeremydaly/lambda-warmer?branch=master)
![dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)

## A module to optimize AWS Lambda function cold starts

At a recent AWS Startup Day event in Boston, MA, Chris Munns, the Senior Developer Advocate for Serverless at AWS, discussed **Cold Starts** and how to mitigate them. According to Chris (although he acknowledged that it is a "hack") using the **CloudWatch Events "ping"** method is really the only way to do it right now. He gave a number of good tips on how to do this "correctly":

- Don’t ping more often than every 5 minutes
- Invoke the function directly (i.e. don’t use API Gateway to invoke it)
- Pass in a test payload that can be identified as such
- Create handler logic that replies accordingly without running the whole function

He also mentioned that if you want to keep several **concurrent** functions warm, that you need to invoke the same function multiple times with delayed executions. This prevents the system from reusing the same container.

You can read the key takeaways from his talk [here](https://www.jeremydaly.com/15-key-takeaways-from-the-serverless-talk-at-aws-startup-day/).

Following these "best practices", I created **Lambda Warmer**. It is a lightweight module (with no dependencies) that can be added to your Lambda functions to manage "warming" events as well as handling automatic fan-out for initializing *concurrent functions*. Just instrument your code and schedule a "ping".

**NOTE:** Lambda Warmer will invoke the function multiple times using the AWS-SDK in order to scale concurrency (if you want to). Your functions MUST have `lambda:InvokeFunction` permissions so that they can invoke themselves. Following the Principle of Least Privilege, you should limit the `Resource` to the function itself, e.g.:

```yaml
- Effect: "Allow"
  Action:
    - "lambda:InvokeFunction"
  Resource: "arn:aws:lambda:us-east-1:{AWS-ACCOUNT-ID}:function:my-test-function"
```

If you'd like to know more about how **Lambda Warmer** works, and why you might (or might not) want to use it, read this *[Lambda Warmer: Optimize AWS Lambda Function Cold Starts](https://www.jeremydaly.com/lambda-warmer-optimize-aws-lambda-function-cold-starts/)* post.

## Installation

Install Lambda Warmer from NPM as a project dependency.

```
npm i lambda-warmer
```

## Instrumenting your Lambda functions

Adding Lambda Warmer to your functions is simple. Require `lambda-warmer` outside of your main handler and then pass the `event` as the first argument into your declared variable. Lambda Warmer will return a resolved promise with either `true`, meaning this *is* a warming invocation, or `false`, this isn't a warming invocation.

If you're using `async/await`, you can `await` the result of Lambda Warmer and `return` if true. This will short circuit your function and prevent it from executing the rest of the main handler.

```javascript
const warmer = require('lambda-warmer')

exports.handler = async (event) => {
  // if a warming event
  if (await warmer(event)) return 'warmed'
  // else proceed with handler logic
  return 'Hello from Lambda'
}
```

If you are using `callback`s, use Lambda Warmer to start a promise chain and then make your handler logic conditional depending on its result.

```javascript
const warmer = require('lambda-warmer')

exports.handler = (event, context, callback) => {
  // Start a promise chain
  warmer(event).then(isWarmer => {
    // if a warming event
    if (isWarmer) {
      callback(null,'warmed')
    // else proceed with handler logic
    } else {
      callback(null, 'Hello from Lambda')
    }
  })
}
```

## Configuration Options

You can send in a configuration object as the second parameter to change Lambda Warmer's default behavior. All of the settings are optional. Here is a sample configuration object.

```javascript
{
  flag: 'warmer',
  concurrency: 'concurrency',
  test: 'test',
  log: true,
  correlationId: 'XXXXXXXXXXXXX',
  delay: 75
}
```

### flag *(string)*
Name of the `event` field used to notify Lambda Warmer that this is a "warming" invocation. Defaults to `warmer`.

### concurrency *(string)*
Name of the `event` field used to specify the number of concurrent functions you'd like to warm. Defaults to `concurrency`.

### test *(string)*
Name of the `event` field used to flag a warming invocation as a test. Defaults to `test`.

### log *(boolean)*
Flag to control whether or not CloudWatch logs are automatically generated. Defaults to `true`.

### correlationId *(string)*
Identifier that gets passed to all concurrent Lambda invocations. This can be used to group invocations within your logs. If no `correlationId` is passed, it will default to the id generated for the invoked function. Passing the `context.awsRequestId` is good practice.

### delay *(number)*
Minimum amount of time (in milliseconds) for concurrent functions to run. Concurrent functions are invoked asynchronously. Setting a delay enforces Lambda to create multiple invocations. Defaults to `75` to attempt sub 100ms invocation times.

Example passing a configuration:

```javascript
exports.handler = async (event, context) => {
  // if a warming event
  if (await warmer(event, { correlationId: context.awsRequestId, delay: 50 })) return 'warmed'
  // else proceed with handler logic
  return 'Hello from Lambda'
}
```

## Warming your Lambda functions

Lambda Warmer facilitates the warming of your functions by analyzing invocation events and appropriately managing handler processing. It **DOES NOT** manage the periodic invocation of your functions. In order to keep your functions warm, you must create a CloudWatch Rule that invokes your functions on a predetermined schedule.

A rule that invokes your function should contain a `Constant (JSON text)` under the "Configure input" setting. The following is a sample event (using the default configuration and a concurrency of `3`):

```javascript
{ "warmer":true,"concurrency":3 }
```

The names of `warmer` and `concurrency` can be changed using the configuration option when instrumenting your code.

**NOTE:** Non-VPC functions are kept warm for approximately 5 minutes whereas VPC-based functions are kept warm for 15 minutes. Set your schedule for invocations accordingly. There is no need to ping your functions more often than the minimum warm time.

### TIP: Preparing for traffic spikes
If your application experiences periodic traffic spikes throughout the day, you can set up multiple CloudWatch Rules that change the concurrency based on the time of day or day itself.

### Using a SAM Template

To add a schedule event to your Lambda functions, you can add a `Type: Schedule` to the `Events` section of your function in a SAM template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: 'AWS::Serverless-2016-10-31'
Resources:
  MyFunction:
    Type: 'AWS::Serverless::Function'
    Properties:
      Handler: index.handler
      Runtime: nodejs8.10
      CodeUri: 's3://my-bucket/function.zip'
    Events:
      WarmingSchedule:
        Type: Schedule
        Properties:
          Schedule: rate(5 minutes)
          Input: '{ "warmer":true,"concurrency":3 }'
```

### Using the Serverless Framework

If you are using the [Serverless Framework](https://serverless.com), you can include a `schedule` event for your functions using the following format:

```yaml
myFunction:
  name: myFunction
  handler: myFunction.handler
  events:
    - schedule:
        name: warmer-schedule-name
        rate: rate(5 minutes)
        enabled: true
        input:
          warmer: true
          concurrency: 1
```

## Logs

Logs are automatically generated unless the `log` configuration option is set to `false`. Logs contain useful information beyond just invocation data. The `warm` field indicates whether or not the Lambda function was already warm when invoked. The `lastAccessed` field is the timestamp (in milliseconds) of the last time the function was accessed by a non-warming event. Similarly, the `lastAccessedSeconds` gives you a counter (in seconds) of how long it's been since it has been accessed. These can be used to determine if your concurrency can be lowered.

Sample log:

```javascript
{
  action: 'warmer', // identifier
  function: 'my-test-function', // function name
  id: '1531413096993-0568', // unique function instance id
  correlationId: '1531413096993-0568', // correlation id
  count: 1, // function number of total concurrent e.g. 3 of 10
  concurrency: 2, // number of concurrent functions being invoked
  warm: true, // was this function already warm
  lastAccessed: 1531413096995, // timestamp (in ms) of last non-warming access
  lastAccessedSeconds: '25.6' // time since last non-warming access
}
```

## Sponsors

[![IOpipe](http://jeremydaly.com/wp-content/uploads/2019/02/iopipe-logo.png)](https://www.iopipe.com/?utm_source=github&utm_medium=lambda-warmer-lambda-api&utm_campaign=open%20source%20sponsorship)

IOpipe is all about making it more fun to be a developer through the support of the open source serverless community. Sign up with [IOpipe](https://www.iopipe.com/?utm_source=github&utm_medium=lambda-warmer-lambda-api&utm_campaign=open%20source%20sponsorship) for free to get real-time visibility into the most detailed behaviors of your Lambda applications.

## Contributing
I've created a number of custom scripts to do similar cold start mitigation, but I figured I'd share this more complete version to save everyone some time (including my future self). If you would like to contribute, please submit a PR or add [issues](https://github.com/jeremydaly/lambda-warmer/issues) for bug reports and feature ideas.
