import type { Env } from './env.schema';

export abstract class AppConfig {
  abstract readonly nodeEnv: Env['NODE_ENV'];
  abstract readonly port: number;
  abstract readonly isProduction: boolean;
}

export function toAppConfig(env: Env): AppConfig {
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    isProduction: env.NODE_ENV === 'production',
  };
}
