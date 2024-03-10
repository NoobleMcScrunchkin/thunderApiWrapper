import { z } from "zod";

const graphqlSchema = z.object({
	hostname: z.string(),
	mustEnableGraphiql: z.boolean(),
	port: z.coerce.number(),
});

const thunderstoreSchema = z.object({
	url: z.string(),
	apiUrl: z.string(),
	lethalCompanyApiUrl: z.string(),
});

const isDevelopmentMode = z.boolean();

export const schemaDefinitions = {
	graphql: graphqlSchema,
	thunderstore: thunderstoreSchema,
	isDevelopmentMode,
};

export const configSchema = z.object(schemaDefinitions);

export type GraphQL = z.infer<typeof graphqlSchema>;
export type Thunderstore = z.infer<typeof thunderstoreSchema>;
export type IsDevelopmentMode = z.infer<typeof isDevelopmentMode>;
export type Config = z.infer<typeof configSchema>;
