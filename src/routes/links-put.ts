import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Collection } from 'mongodb';
import { Link, getConsumerFromHeader, getContainer } from '../core';

export const LINKS_PUT: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: {
        expires: number | null;
        externalId: string | null;
        geoTargeting: Array<{ country: string; url: string }>;
        metadata: Record<string, string>;
        name: string | null;
        openGraph: {
          description: string;
          image: string;
          title: string;
        } | null;
        tags: Array<string>;
        url: string;
        webhook: string | null;
      };
      Params: {
        code: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const container = await getContainer();

    const collection: Collection<Link> = container.db.collection<Link>('links');

    const consumer: string | null = getConsumerFromHeader(
      request.headers.authorization,
    );

    if (!consumer) {
      reply.status(401).send();

      return;
    }

    await collection.updateOne(
      {
        code: request.params.code,
        consumer,
        status: 'active',
      },
      {
        $set: {
          expires: request.body.expires,
          externalId: request.body.externalId,
          geoTargeting: request.body.geoTargeting,
          metadata: request.body.metadata,
          name: request.body.name,
          openGraph: request.body.openGraph,
          tags: request.body.tags,
          url: request.body.url,
          updated: new Date().getTime(),
          webhook: request.body.webhook,
        },
      },
    );

    reply.status(200).send(request.body);
  },
  method: 'PUT',
  url: '/api/v1/links/:code',
  schema: {
    tags: ['links'],
    security: [
      {
        apiKey: [],
      },
    ],
    body: {
      type: 'object',
      properties: {
        expires: { type: 'number', nullable: true },
        externalId: { type: 'string', nullable: true },
        geoTargeting: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              country: { type: 'string' },
              url: { type: 'string' },
            },
          },
        },
        metadata: {
          type: 'object',
          nullable: true,
        },
        name: { type: 'string', nullable: true },
        openGraph: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            image: { type: 'string' },
            title: { type: 'string' },
          },
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        url: { type: 'string' },
        webhook: { type: 'string', nullable: true },
      },
    },
  },
};
