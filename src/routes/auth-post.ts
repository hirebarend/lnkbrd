import { createHash } from 'crypto';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import * as jsonwebtoken from 'jsonwebtoken';
import { Collection } from 'mongodb';
import { getContainer } from '../core';

export const AUTH_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: {
        password: string;
        username: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const container = await getContainer();

    const collection: Collection<{ password: string; username: string }> =
      container.db.collection<{ password: string; username: string }>(
        'consumers',
      );

    const password: string = createHash('sha256')
      .update(request.body.password)
      .digest('hex');

    let consumer = await collection.findOne({
      password,
      username: request.body.username,
    });

    if (!consumer) {
      await collection.insertOne({
        password,
        username: request.body.username,
      });

      consumer = await collection.findOne({
        password,
        username: request.body.username,
      });
    }

    if (!consumer) {
      reply.status(400).send();

      return;
    }

    reply.status(200).send({
      token: jsonwebtoken.sign({}, process.env.SECRET || 'P@ssword!', {
        expiresIn: '365d',
        subject: consumer.username,
      }),
    });
  },
  method: 'POST',
  url: '/api/v1/auth',
  schema: {
    tags: ['auth'],
    security: [
      {
        apiKey: [],
      },
    ],
    body: {
      type: 'object',
      properties: {
        password: { type: 'string' },
        username: { type: 'string' },
      },
    },
  },
};
