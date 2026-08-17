import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import { AppModule } from './app.module';
import { toAppConfig, type AppConfig } from './shared/config/app.config';
import { InvalidEnvError, parseEnv } from './shared/config/env.schema';
import { REDACT_CENSOR, REDACT_PATHS } from './shared/logging/redact';

const REQUEST_ID_HEADER = 'x-request-id';

function requestId(request: IncomingMessage): string {
  const fromProxy = request.headers[REQUEST_ID_HEADER];

  return typeof fromProxy === 'string' && fromProxy.length > 0 ? fromProxy : randomUUID();
}

function readConfigOrExit(): AppConfig {
  try {
    return toAppConfig(parseEnv(process.env));
  } catch (error) {
    if (error instanceof InvalidEnvError) {
      process.stderr.write(`${error.message}\n`);
      process.exit(1);
    }

    throw error;
  }
}

async function bootstrap(): Promise<void> {
  const config = readConfigOrExit();

  const adapter = new FastifyAdapter({
    trustProxy: true,
    genReqId: requestId,
    logger: {
      redact: { paths: REDACT_PATHS, censor: REDACT_CENSOR },
    },
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule.forRoot(config), adapter, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  await app.listen({ port: config.port, host: '0.0.0.0' });
}

void bootstrap();
