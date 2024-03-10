/* eslint-disable prefer-destructuring */
import dotenv from "dotenv";
import type { Config, GraphQL, Thunderstore } from "@/configSchema";
import { schemaDefinitions } from "@/configSchema";

dotenv.config();

const configDefaults: Config = {
	graphql: {
		hostname: "localhost",
		mustEnableGraphiql: false,
		port: 4000,
	},
	thunderstore: {
		url: "https://thunderstore.io",
		apiUrl: "https://thunderstore.io/api",
		lethalCompanyApiUrl: "https://thunderstore.io/c/lethal-company/api/v1",
	},
	isDevelopmentMode: true,
};

function getGraphqlConfig(): GraphQL {
	return schemaDefinitions.graphql.parse({
		hostname: getEnvironmentVariable("PUBLIC_HOSTNAME", configDefaults.graphql.hostname),
		mustEnableGraphiql: getEnvironmentVariable("GRAPHQL_ENABLE_GRAPHIQL", configDefaults.graphql.mustEnableGraphiql.toString()) === "true",
		port: getEnvironmentVariable("GRAPHQL_PORT", configDefaults.graphql.port.toString()),
	});
}

const graphqlConfig = getGraphqlConfig();

function getThunderstoreConfig(): Thunderstore {
	return schemaDefinitions.thunderstore.parse({
		url: getEnvironmentVariable("THUNDERSTORE_URL", configDefaults.thunderstore.url),
		apiUrl: getEnvironmentVariable("THUNDERSTORE_API", configDefaults.thunderstore.apiUrl),
		lethalCompanyApiUrl: getEnvironmentVariable("THUNDERSTORE_LETHALCOMPANY_API", configDefaults.thunderstore.lethalCompanyApiUrl),
	});
}

const thunderstoreConfig = getThunderstoreConfig();

const config: Config = {
	graphql: graphqlConfig,
	thunderstore: thunderstoreConfig,
	isDevelopmentMode: process.env.NODE_ENV !== "production",
};

function getEnvironmentVariable(key: string, defaultValue: string): string {
	const value = process.env[key];

	if (value === "" || value === undefined) {
		console.warn({ [key]: defaultValue }, "Environment variable [%s] is not defined, using default value", key);

		return defaultValue;
	}

	return value;
}

console.debug({ config }, "Loaded configuration");

export default config;
