import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import axios from 'axios';
import { faker } from '@faker-js/faker';
import ip3country from 'ip3country';
import { isbot } from 'isbot';
import { Collection } from 'mongodb';
import path from 'path';
import { UAParser } from 'ua-parser-js';
import { getContainer, Link, PixelEvent, TokenBucket } from '../core';

const TOKEN_BUCKETS: { [key: string]: TokenBucket } = {};

export async function getAutonomousSystem(
  ipAddress: string | null,
): Promise<{ name: string; number: number }> {
  try {
    const response = await axios.get(
      `https://asnguard.lnkbrd.com/api/${ipAddress}`,
    );

    return {
      name: response.data.as_name,
      number: response.data.as_number,
    };
  } catch {
    return {
      name: 'Unknown',
      number: -1,
    };
  }
}

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

    if (request.params.code === 'robots.txt') {
      reply.type('text/plain').send(`User-agent: *\nDisallow:`);

      return;
    }

    const timestamp: number = new Date().getTime();

    const ipAddress: string = request.headers['x-real-ip'] || 'unknown';

    const autonomousSystem = await getAutonomousSystem(ipAddress);

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
      if (!TOKEN_BUCKETS[ipAddress]) {
        TOKEN_BUCKETS[ipAddress] = new TokenBucket(5, 5);
      }

      const rateLimitExceeded: boolean = await TOKEN_BUCKETS[ipAddress].get();

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

          autonomous_system_name: autonomousSystem.name,
          autonomous_system_number: autonomousSystem.number,

          rateLimitExceeded,
        },
      });

      reply.status(404).send();

      await container.db.collection<any>('autonomous-systems').insertOne({
        autonomous_system_name: autonomousSystem.name,
        autonomous_system_number: autonomousSystem.number,
        bot,
        code: request.params.code,
        country,
        ip_address: ipAddress,
        rateLimitExceeded,
        user_agent: userAgent,
      });

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

          autonomous_system_name: autonomousSystem.name,
          autonomous_system_number: autonomousSystem.number,
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

          autonomous_system_name: autonomousSystem.name,
          autonomous_system_number: autonomousSystem.number,
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

        autonomous_system_name: autonomousSystem.name,
        autonomous_system_number: autonomousSystem.number,
      },
    });

    reply.redirect(url, 302);
  },
  method: 'GET',
  url: '/:code',
};
