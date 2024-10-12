interface WarmerConfig {
  flag?: string;
  concurrency?: number;
  test?: string;
  log?: boolean;
  correlationId?: string;
  delay?: number;
  target?: string;
}

interface Warmer {
  /**
   * Returns a Promise that resolves to true if the current invocation is a warming
   * invocation and false otherwise.  If this is a warming invocation, the Promise will
   * wait until the delay specified by `config.delay` has passed.
   *
   * @param event the event passed to the lambda
   * @param [config] the config options to change lambda warmer's default behavior.  All of
   * the settings are optional
   * @param [context] the context passed to the lambda
   *
   * @returns a Promise that resolves to true if this is a warming invocation
   */
  (event: any, config?: WarmerConfig, context?: any): Promise<boolean>;
  WarmerConfig: WarmerConfig;
}

declare const warmer: Warmer;
export = warmer;
