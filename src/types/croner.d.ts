declare module 'croner' {
  export interface CronOptions {
    paused?: boolean;
    kill?: boolean;
    maxRuns?: number;
    startAt?: string | Date;
    stopAt?: string | Date;
    timezone?: string;
  }

  export function Cron(
    pattern: string,
    options?: CronOptions | ((...args: unknown[]) => unknown),
    fn?: (...args: unknown[]) => unknown
  ): unknown;

  export class Cron {
    constructor(
      pattern: string,
      options?: CronOptions | ((...args: unknown[]) => unknown),
      fn?: (...args: unknown[]) => unknown
    );
  }
}
