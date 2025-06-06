import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ip3country from 'ip3country';
import { isbot } from 'isbot';
import { Collection } from 'mongodb';
import path from 'path';
import { UAParser } from 'ua-parser-js';
import { getContainer, Link, PixelEvent } from '../core';

export const CODE_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Headers: {
        'x-real-ip': string | null;
      };
      Params: { code: string };
    }>,
    reply: FastifyReply,
  ) => {
    if (request.params.code === 'privacy-policy') {
      return reply.view(path.join('public', 'privacy-policy.html'));
    }

    const timestamp: number = new Date().getTime();

    const ipAddress: string | null = request.headers['x-real-ip'] || null;

    const country: string | null = ipAddress
      ? ip3country.lookupStr(ipAddress)
      : null;

    const userAgent: string | null = request.headers['user-agent'] || null;

    const bot: boolean = isbot(userAgent);

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
      container.posthog?.capture({
        distinctId: faker.string.uuid(),
        event: 'code-get',
        groups: {
          code: request.params.code,
        },
        properties: {
          bot,
          code: request.params.code,
          country,
          ip_address: ipAddress,
          status: 404,
          url: null,
          user_agent: userAgent,
        },
      });

      reply.status(404).send();

      return;
    }

    const geoTargeting = link.geoTargeting.find((x) => x.country === country);

    const url: string = geoTargeting ? geoTargeting.url : link.url;

    if (userAgent && userAgent.startsWith('curl/')) {
      const response = await axios.get(url, {
        validateStatus: () => true,
      });

      return reply
        .status(response.status)
        .header('Content-Type', response.headers['Content-Type'])
        .send(response.data);
    }

    if (bot) {
      container.posthog?.capture({
        distinctId: faker.string.uuid(),
        event: 'code-get',
        groups: {
          code: request.params.code,
        },
        properties: {
          bot,
          code: request.params.code,
          country,
          ip_address: ipAddress,
          status: 200,
          url: null,
          user_agent: userAgent,
        },
      });

      return reply.view(path.join('public', 'index-static-bot.html'), link);
    }

    if (
      link.status !== 'active' ||
      (link.expires && link.expires < new Date().getTime())
    ) {
      container.posthog?.capture({
        distinctId: faker.string.uuid(),
        event: 'code-get',
        groups: {
          code: request.params.code,
        },
        properties: {
          bot,
          code: request.params.code,
          country,
          ip_address: ipAddress,
          status: 404,
          url: null,
          user_agent: userAgent,
        },
      });

      reply.status(404).send();

      return;
    }

    const pixelEvent: PixelEvent = {
      consumer: link.consumer,
      country,
      ipAddress: ipAddress || '',
      metadata: {
        code: link.code,
        url,
      },
      referrer: request.headers['referer'] || null,
      tags: link.tags,
      timestamp: new Date().getTime(),
      type: 'Click',
      userAgent: new UAParser(userAgent || '').getResult(),
    };

    await container.db
      .collection<PixelEvent>('pixel-events')
      .insertOne(pixelEvent);

    await collection.updateOne(
      {
        code: link.code,
        status: 'active',
      },
      {
        $set: {
          clicks: {
            count: link.clicks ? link.clicks.count + 1 : 1,
            timestamp,
          },
        },
      },
    );

    if (link.webhook) {
      // await BasicHttpGateway.post(link.webhook, {
      //   link,
      //   pixelEvent,
      // });
    }

    container.posthog?.capture({
      distinctId: faker.string.uuid(),
      event: 'code-get',
      groups: {
        code: request.params.code,
      },
      properties: {
        bot,
        code: request.params.code,
        country,
        ip_address: ipAddress,
        status: 302,
        url,
        user_agent: userAgent,
      },
    });

    reply.redirect(url, 302);
  },
  method: 'GET',
  url: '/:code',
};
