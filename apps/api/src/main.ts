import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';

import { AppModule } from './app.module';
import { REDACT_CENSOR, REDACT_PATHS } from './shared/logging/redact';

const REQUEST_ID_HEADER = 'x-request-id';

const DEFAULT_PORT = 3000;

function requestId(request: IncomingMessage): string {
  const fromProxy = request.headers[REQUEST_ID_HEADER];

  return typeof fromProxy === 'string' && fromProxy.length > 0 ? fromProxy : randomUUID();
}

async function bootstrap(): Promise<void> {
  const adapter = new FastifyAdapter({
    trustProxy: true,
    genReqId: requestId,
    logger: {
      redact: { paths: REDACT_PATHS, censor: REDACT_CENSOR },
    },
  });

  const app = await NestFactory.create<NestFastifyApplication>(AppModule, adapter, {
    bufferLogs: true,
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  await app.listen({ port: Number(process.env.PORT ?? DEFAULT_PORT), host: '0.0.0.0' });
}

void bootstrap();
