import { ZodAny } from 'zod';
import { FastifySchema } from 'fastify';
import zodToJsonSchema from 'zod-to-json-schema';

type FreeformRecord = Record<string, any>;
interface Schema extends FastifySchema {
    hide?: boolean;
    apiProperty?: {
        body: any;
    };
}

const defaultSkipList = [
    '/documentation/',
    '/documentation/initOAuth',
    '/documentation/json',
    '/documentation/uiConfig',
    '/documentation/yaml',
    '/documentation/*',
    '/documentation/static/*',
];

const zodToJsonSchemaOptions = {
    target: 'openApi3',
    $refStrategy: 'none',
} as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasOwnProperty<T, K extends PropertyKey>(obj: T, prop: K): obj is T & Record<K, any> {
    return Object.prototype.hasOwnProperty.call(obj, prop);
}

function resolveSchema(maybeSchema: ZodAny | { properties: ZodAny }): Pick<ZodAny, 'safeParse'> {
    if (hasOwnProperty(maybeSchema, 'safeParse')) {
        return maybeSchema;
    }
    if (hasOwnProperty(maybeSchema, 'properties')) {
        return maybeSchema.properties;
    }
    throw new Error(`Invalid schema passed: ${JSON.stringify(maybeSchema)}`);
}

export function createJsonSchemaTransform({ skipList }: { skipList: readonly string[] }) {
    return ({ schema, url }: { schema: Schema; url: string }) => {
        if (!schema) {
            return {
                schema,
                url,
            };
        }

        const { response, headers, querystring, body, params, apiProperty, hide, ...rest } = schema;

        const transformed: FreeformRecord = {};

        if (skipList.includes(url) || hide) {
            transformed.hide = true;
            return { schema: transformed, url };
        }

        const zodSchemas: FreeformRecord = {
            headers,
            querystring,
            body,
            params,
        };

        for (const prop in zodSchemas) {
            const zodSchema = zodSchemas[prop];
            if (zodSchema) {
                transformed[prop] = zodToJsonSchema(zodSchema);
            }
        }

        if (apiProperty?.body) {
            // console.log(JSON.stringify(apiProperty?.body['properties'], null, 2));
            for (const key in apiProperty?.body['properties']) {
                transformed['body']['properties'][key] = apiProperty?.body['properties'][key];
            }
            // transformed['body'] = apiProperty.body;
        }
        // console.log(JSON.stringify(transformed['body'], null, 2));

        if (response) {
            transformed.response = {};

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            for (const prop in response as any) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const schema = resolveSchema((response as any)[prop]);

                const transformedResponse = zodToJsonSchema(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    schema as any,
                    zodToJsonSchemaOptions,
                );
                transformed.response[prop] = transformedResponse;
            }
        }

        for (const prop in rest) {
            const meta = rest[prop as keyof typeof rest];
            if (meta) {
                transformed[prop] = meta;
            }
        }

        return { schema: transformed, url };
    };
}

export const jsonSchemaTransform = createJsonSchemaTransform({
    skipList: defaultSkipList,
});
