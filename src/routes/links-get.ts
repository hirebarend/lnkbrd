import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Collection } from 'mongodb';
import { Link, getConsumerFromHeader, getContainer } from '../core';

export const LINKS_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Querystring: {
        page: number | undefined;
        pageSize: number | undefined;
        tags: Array<string> | null;
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

    const count: number = await collection.countDocuments({
      consumer,
      status: 'active',
    });

    const links: Array<Link> = await collection
      .find(
        {
          consumer,
          ...(request.query.tags ? { tags: { $in: request.query.tags } } : {}),
          status: 'active',
        },
        {
          limit: request.query.pageSize || 50,
          projection: {
            _id: 0,
          },
          skip:
            ((request.query.page || 1) - 1) * (request.query.pageSize || 50),
          sort: {
            created: -1,
          },
        },
      )
      .toArray();

    reply.status(200).send({
      data: links,
      meta: {
        page: request.query.page || 1,
        pageSize: request.query.pageSize || 50,
        total: count,
      },
    });
  },
  method: 'GET',
  url: '/api/v1/links',
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
        page: { type: 'number', nullable: true },
        pageSize: { type: 'number', nullable: true },
        tags: {
          type: 'array',
          items: {
            type: 'string',
          },
          nullable: true,
        },
      },
    },
  },
};
