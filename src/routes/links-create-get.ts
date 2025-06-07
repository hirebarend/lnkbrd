import { faker } from '@faker-js/faker';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Collection } from 'mongodb';
import { Link, getContainer } from '../core';
import { openGraph } from './open-graph-get';

export const LINKS_CREATE_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Querystring: {
        description: string | undefined;
        image: string | undefined;
        title: string | undefined;
        url: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const container = await getContainer();

    const collection: Collection<Link> = container.db.collection<Link>('links');

    const consumer: string | null = 'default';

    if (!consumer) {
      reply.status(401).send();

      return;
    }

    let link: Link | null = await collection.findOne({
      url: request.query.url,
    });

    if (link) {
      reply.status(200).send({
        clicks: link.clicks,
        url: `https://${process.env.HOST}/${link.code}`,
      });

      return;
    }

    const code: string = faker.string.alphanumeric({
      casing: 'lower',
      length: 6,
    });

    link = {
      clicks: {
        count: 0,
        timestamp: null,
      },
      code,
      consumer,
      created: new Date().getTime(),
      expires: null,
      externalId: null,
      geoTargeting: [],
      name: null,
      openGraph:
        request.query.description || request.query.image || request.query.title
          ? {
              description: request.query.description || '',
              image: request.query.image || '',
              title: request.query.title || '',
            }
          : await openGraph(request.query.url),
      status: 'active',
      tags: [],
      url: request.query.url,
      updated: new Date().getTime(),
      webhook: null,
    };

    await collection.insertOne({
      ...link,
    });

    reply.status(200).send({
      clicks: link.clicks,
      url: `https://${process.env.HOST}/${link.code}`,
    });
  },
  method: 'GET',
  url: '/api/v1/links/create',
  schema: {
    tags: ['links'],
    security: [
      {
        apiKey: [],
      },
    ],
    querystring: {
      type: 'object',
      properties: {
        description: { type: 'string', nullable: true },
        image: { type: 'string', nullable: true },
        title: { type: 'string', nullable: true },
        url: { type: 'string' },
      },
    },
  },
};
