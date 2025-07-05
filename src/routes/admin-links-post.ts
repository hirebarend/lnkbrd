import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Collection } from 'mongodb';
import { Link, getContainer } from '../core';

export const ADMIN_LINKS_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: Array<any>;
    }>,
    reply: FastifyReply,
  ) => {
    const container = await getContainer();

    const collection: Collection<Link> = container.db.collection<Link>('links');

    await collection.insertMany(request.body);

    reply.status(200).send();
  },
  method: 'POST',
  url: '/api/v1/admin/links',
  schema: {
    tags: ['links'],
    security: [
      {
        apiKey: [],
      },
    ],
    body: {
      type: 'array',
    },
  },
};
