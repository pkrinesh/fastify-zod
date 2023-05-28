import { FastifyPluginAsync, FastifyPluginOptions, RawServerBase, RawServerDefault } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export type FastifyPluginAsyncZod<
    Options extends FastifyPluginOptions = Record<never, never>,
    Server extends RawServerBase = RawServerDefault,
> = FastifyPluginAsync<Options, Server, ZodTypeProvider>;

const route: FastifyPluginAsyncZod = async (app, opt) => {
    app.get('/name/:age', {
        schema: {
            tags: ['name'],
            consumes: ['application/x-www-form-urlencoded'],
            produces: ['application/json'],
            params: z.object({
                age: z.string(),
            }),
            querystring: z.object({
                name: z.string().optional(),
            }),
            response: {
                200: z.object({
                    name: z.string(),
                    success: z.string(),
                    age: z.string(),
                }),
            },
        },
        handler: async (req, reply) => {
            console.log(req);
            return {
                name: req.query.name ?? 'World',
                success: 'ok',
                age: req.params.age ?? 18,
            };
        },
    });

    app.post('/name', {
        schema: {
            tags: ['name'],
            security: [
                {
                    'refresh-token': [],
                },
            ],
            body: z.object({
                name: z.string(),
            }),
            response: {
                201: z.object({
                    success: z.string(),
                    name: z.string(),
                }),
                401: z.object({
                    success: z.boolean().default(false),
                }),
            },
        },
        handler: async (req) => {
            const { name } = req.body;
            return {
                success: 'ok',
                name,
            };
        },
    });
};

export default route;
