import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Collection } from 'mongodb';
import { Link, getContainer } from '../core';

export const ADMIN_LINKS_GET: RouteOptions<any, any, any, any> = {
  handler: async (request: FastifyRequest<{}>, reply: FastifyReply) => {
    const container = await getContainer();

    const collection: Collection<Link> = container.db.collection<Link>('links');

    const count: number = await collection.countDocuments({
      status: 'active',
    });

    const links: Array<Link> = await collection
      .find(
        {
          status: 'active',
        },
        {
          limit: count,
          projection: {
            _id: 0,
          },
          sort: {
            created: -1,
          },
        },
      )
      .toArray();

    reply.status(200).send({
      data: links,
      meta: {
        page: 1,
        pageSize: count,
        total: count,
      },
    });
  },
  method: 'GET',
  url: '/api/v1/admin/links',
  schema: {
    tags: ['links'],
    security: [
      {
        apiKey: [],
      },
    ],
  },
};
