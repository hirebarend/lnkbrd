import { faker } from '@faker-js/faker';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Collection } from 'mongodb';
import { Link, getConsumerFromHeader, getContainer } from '../core';
import { openGraph } from './open-graph-get';

export const LINKS_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: {
        expires: number | null;
        externalId: string | null;
        geoTargeting: Array<{ country: string; url: string }> | null;
        metadata: Record<string, string> | null;
        name: string | null;
        openGraph: {
          description: string | null;
          image: string | null;
          title: string | null;
        } | null;
        tags: Array<string> | null;
        url: string;
        webhook: string | null;
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

    const code: string = faker.string.alphanumeric({
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
      metadata: request.body.metadata || {},
      name: request.body.name,
      openGraph: request.body.openGraph
        ? {
            ...(await openGraph(request.body.url)),
            ...request.body.openGraph,
          }
        : await openGraph(request.body.url),
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
        metadata: {
          type: 'object',
          nullable: true,
        },
        name: { type: 'string', nullable: true },
        openGraph: {
          type: 'object',
          properties: {
            description: { type: 'string', nullable: true },
            image: { type: 'string', nullable: true },
            title: { type: 'string', nullable: true },
          },
        },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        },
        url: { type: 'string' },
        webhook: { type: 'string', nullable: true },
      },
    },
  },
};
