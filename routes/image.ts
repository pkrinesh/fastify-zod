import { z } from 'zod';
import { FastifyPluginAsyncZod } from './root';

const routes: FastifyPluginAsyncZod = async (app, opts) => {
  app.post('/images', {
    schema: {
      tags: ['images'],
      consumes: ['multipart/form-data'],
      apiProperty: {
        body: {
          type: 'object',
          properties: {
            images: {
              type: 'array',
              items: { type: 'string', format: 'binary' },
            },
          },
        },
      },
      body: z.object({
        name: z.string(),
        images: z.array(
          z.object({
            type: z.string(),
            format: z.custom(() => z.literal('binary')),
          }),
        ),
      }),
    },
    handler: async (req, res) => {
      return {
        message: '',
      };
    },
  });
};

export default routes;
