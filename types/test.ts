import warmer from 'lambda-warmer';

warmer({});
warmer({}, {});
warmer({}, {
  flag: 'some-flag',
  concurrency: 10,
  test: 'test-flag',
  log: true,
  correlationId: 'some-id',
  delay: 1000,
  target: 'some-target',
});

// @ts-expect-error - params should be required
warmer()

// @ts-expect-error - config should be an object
warmer({}, 'some-invalid-config')

warmer({}, {
  // @ts-expect-error - flag should be a string
  flag: 123,
  // @ts-expect-error - concurrency should be a number
  concurrency: 'some-concurrency',
  // @ts-expect-error - test should be a string
  test: 123,
  // @ts-expect-error - log should be a boolean
  log: 'true',
  // @ts-expect-error - correlationId should be a string
  correlationId: 123,
  // @ts-expect-error - delay should be a number
  delay: '1000',
  // @ts-expect-error - target should be a string
  target: 123,
});

warmer.WarmerConfig;
