import autoLoad from '@fastify/autoload';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import fastify from 'fastify';

import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { jsonSchemaTransform } from './lib/swagger/json-schema-transform';

const app = fastify({
    logger: {
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                singleLine: true,
                colorizeObjects: false,
            },
        },
    },
});

app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(swagger, {
    openapi: {
        info: {
            title: 'SampleApi',
            description: 'Sample backend service',
            version: '1.0.0',
        },
        servers: [
            {
                url: 'http://localhost:{port}',
                description: 'Local Dev',
                variables: {
                    port: {
                        default: '3000',
                    },
                },
            },
        ],
        components: {
            securitySchemes: {
                'access-token': {
                    type: 'http',
                    scheme: 'bearer',
                },
                'refresh-token': {
                    type: 'http',
                    scheme: 'bearer',
                },
            },
        },
        security: [
            {
                'access-token': [],
            },
        ],
    },
    transform: jsonSchemaTransform,

    // You can also create transform with custom skiplist of endpoints that should not be included in the specification:
    //
    // transform: createJsonSchemaTransform({
    //   skipList: [ '/documentation/static/*' ]
    // })
});

app.register(swaggerUi, {
    routePrefix: '/swagger',
});

app.register(autoLoad, {
    dir: `${__dirname}/routes`,
});

app.listen({ port: 3000 }).then(() => {
    app.log.info('server is listing at http://localhost:' + 3000);
});
