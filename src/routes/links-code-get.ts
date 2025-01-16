import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Collection } from 'mongodb';
import { Link, getConsumerFromHeader, getContainer } from '../core';

export const LINKS_CODE_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { code: string };
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

    const link: Link | null = await collection.findOne(
      {
        consumer,
        code: request.params.code,
      },
      {
        projection: {
          _id: 0,
        },
      },
    );

    if (!link || link.status !== 'active') {
      reply.status(404).send();

      return;
    }

    reply.status(200).send(link);
  },
  method: 'GET',
  url: '/api/v1/links/:code',
  schema: {
    tags: ['links'],
    security: [
      {
        apiKey: [],
      },
    ],
  },
};
