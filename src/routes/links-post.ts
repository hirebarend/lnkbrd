import { faker } from '@faker-js/faker';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Collection } from 'mongodb';
import { Link, getContainer } from '../core';
import { openGraph } from './open-graph-get';

export const LINKS_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: {
        code: string | null;
        expires: number | null;
        externalId: string | null;
        geoTargeting: Array<{ country: string; url: string }> | null;
        url: string;
        name: string | null;
        tags: Array<string> | null;
        webhook: string | null;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const container = await getContainer();

    const collection: Collection<Link> = container.db.collection<Link>('links');

    const consumer: string | null = '';

    if (!consumer) {
      reply.status(401).send();

      return;
    }

    const code: string =
      request.body.code ||
      faker.string.alphanumeric({
        casing: 'lower',
        length: 6,
      });

    if (await collection.findOne({ code })) {
      reply.status(409).send();

      return;
    }

    const link: Link = {
      clicks: {
        count: 0,
        timestamp: null,
      },
      code,
      consumer,
      created: new Date().getTime(),
      expires: request.body.expires,
      externalId: request.body.externalId,
      geoTargeting: request.body.geoTargeting || [],
      name: request.body.name,
      openGraph: await openGraph(request.body.url),
      status: 'active',
      tags: request.body.tags || [],
      url: request.body.url,
      updated: new Date().getTime(),
      webhook: request.body.webhook,
    };

    await collection.insertOne({
      ...link,
    });

    reply.status(200).send(link);
  },
  method: 'POST',
  url: '/api/v1/links',
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
        code: { type: 'string', nullable: true },
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
          nullable: true,
        },
        name: { type: 'string', nullable: true },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        },
        webhook: { type: 'string', nullable: true },
      },
    },
  },
};
