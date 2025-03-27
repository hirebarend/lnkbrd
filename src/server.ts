import fastify, { FastifyRequest } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import fastifyView from '@fastify/view';
import ip3country from 'ip3country';
import { isbot } from 'isbot';
import * as qs from 'qs';
import { Logger } from './hooks';
import {
  AUTH_POST,
  CODE_GET,
  LINKS_CODE_GET,
  LINKS_CREATE_GET,
  LINKS_GET,
  LINKS_POST,
  LINKS_PUT,
  OPEN_GRAPH_GET,
} from './routes';

ip3country.init();

export async function startServer() {
  const server = fastify({
    bodyLimit: 10 * 1048576, // 10MB
    caseSensitive: false,
    ignoreDuplicateSlashes: true,
    ignoreTrailingSlash: true,
    logger: true,
    querystringParser: (str) => qs.parse(str),
  });

  await server.register(fastifyCors, {
    allowedHeaders: '*',
    origin: '*',
  });

  await server.addContentTypeParser(
    '*',
    { parseAs: 'buffer' },
    (
      request: any,
      payload: any,
      done: (error: Error | null, body: Buffer) => void,
    ) => {
      done(null, payload);
    },
  );

  if (process.env.MONGODB_CONNECTION_STRING) {
    server.addHook(
      'onResponse',
      await Logger(
        process.env.MONGODB_CONNECTION_STRING,
        process.env.MONGODB_DATABASE_NAME || 'lnkbrd',
        'logs',
      ),
    );
  }

  await server.register(fastifyView, {
    engine: {
      handlebars: require('handlebars'),
    },
  });

  await server.register(fastifySwagger, {
    swagger: {
      consumes: ['application/json'],
      host: process.env.HOST || 'localhost:8080',
      info: {
        description: '',
        title: 'API Specification',
        version: '1.0.0',
      },
      produces: ['application/json'],
      schemes: process.env.HOST ? ['https', 'http'] : ['http'],
      securityDefinitions: {
        apiKey: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
      externalDocs: {
        url: 'https://github.com/hirebarend/lnkbrd',
        description: 'View Offical Documentation',
      },
    },
  });

  await server.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  });

  server.route(AUTH_POST);

  server.route(CODE_GET);

  server.route(LINKS_GET);

  server.route(LINKS_POST);

  server.route(LINKS_PUT);

  server.route(LINKS_CODE_GET);

  server.route(LINKS_CREATE_GET);

  server.route(OPEN_GRAPH_GET);

  server.route({
    handler: async (request, reply) => {
      const mappings: Record<string, string | undefined> = {
        'getverified.co.za': 'https://calendly.com/getverified/30min',
        'proprvetting.com': 'https://calendly.com/getverified/30min',
      };

      const mapping = mappings[request.host];

      if (mapping) {
        reply.redirect(mapping, 302);

        return;
      }

      reply.redirect('/docs', 302);
    },
    method: 'GET',
    url: '/',
    schema: {
      tags: ['X-HIDDEN'],
    },
  });

  server.route({
    handler: async (
      request: FastifyRequest<{
        Headers: {
          'x-real-ip': string | null;
        };
        Params: { code: string };
      }>,
      reply,
    ) => {
      try {
        const ipAddress: string | null = request.headers['x-real-ip'] || null;

        const country: string | null = ipAddress
          ? ip3country.lookupStr(ipAddress)
          : null;

        const userAgent: string | null = request.headers['user-agent'] || null;

        reply.status(200).send({
          country,
          ipAddress,
          isBot: isbot(userAgent),
          userAgent,
        });
      } catch {
        reply.status(503).send();
      }
    },
    method: 'GET',
    url: '/api/v1/health',
  });

  server.route({
    handler: async (request, reply) => {
      reply.status(200).send();
    },
    method: 'GET',
    url: '/api/v1/ping',
  });

  await server.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
  });

  await server.ready();
}
