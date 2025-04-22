import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { Collection } from 'mongodb';
import qrcode from 'qrcode';
import { getContainer, Link, PixelEvent } from '../core';

export const CODE_QRCODE_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Params: { code: string };
    }>,
    reply: FastifyReply,
  ) => {
    const container = await getContainer();

    const collection: Collection<Link> = container.db.collection<Link>('links');

    const link: Link | null = await collection.findOne(
      {
        code: request.params.code,
      },
      {
        projection: {
          _id: 0,
        },
      },
    );

    if (!link) {
      reply.status(404).send();

      return;
    }

    const buffer: Buffer = await qrcode.toBuffer(
      `https://${process.env.HOST || 'localhost:8080'}/${request.params.code}`,
      {
        color: {
          dark: '#000000',
          light: '#0000',
        },
        scale: 8,
      },
    );

    reply.header('Content-Type', 'image/png').status(200).send(buffer);
  },
  method: 'GET',
  url: '/:code/qrcode',
};
