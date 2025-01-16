import axios from 'axios';
import { load } from 'cheerio';
import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';

export async function openGraph(url: string) {
  try {
    const response = await axios.get(url);

    const $ = load(response.data);

    const title = $('title').html();

    const result: { [key: string]: string | null } = {};

    const keys = [
      'description',
      'og:description',
      'og:image',
      'og:site_name',
      'og:title',
      'og:type',
      'og:url',
      'title',
    ];

    for (const key of keys) {
      const element = $(`head meta[name=${key}]`);

      if (!element) {
        continue;
      }

      result[key] = element.attr('content') || null;
    }

    for (const key of keys) {
      const element = $(`head meta[property=${key}]`);

      if (!element) {
        continue;
      }

      result[key] = element.attr('content') || null;
    }

    return {
      description: result['og:description'],

      image: result['og:image'],

      title: result['og:title'] || title,
    };
  } catch {
    return null;
  }
}

export const OPEN_GRAPH_GET: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Querystring: {
        url: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    try {
      const response = await axios.get(request.query.url);

      const $ = load(response.data);

      const title = $('title').html();

      const result: { [key: string]: string | null } = {};

      const keys = [
        'description',
        'og:description',
        'og:image',
        'og:site_name',
        'og:title',
        'og:type',
        'og:url',
        'title',
      ];

      for (const key of keys) {
        const element = $(`head meta[name=${key}]`);

        if (!element) {
          continue;
        }

        result[key] = element.attr('content') || null;
      }

      for (const key of keys) {
        const element = $(`head meta[property=${key}]`);

        if (!element) {
          continue;
        }

        result[key] = element.attr('content') || null;
      }

      reply.status(200).send({
        description: result['og:description'],

        image: result['og:image'],

        title: result['og:title'] || title,
      });
    } catch {
      reply.status(200).send(null);
    }
  },
  method: 'GET',
  url: '/api/v1/open-graph',
  schema: {
    tags: ['X-HIDDEN'],
    querystring: {
      type: 'object',
      properties: {
        url: { type: 'string' },
      },
    },
  },
};
