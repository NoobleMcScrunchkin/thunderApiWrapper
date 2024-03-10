import type { FastifyReply, FastifyRequest } from "fastify";
import createFastify from "fastify";
import { createYoga } from "graphql-yoga";
import config from "@/config";
import schema from "@/schema";
import "@/cron";

const app = createFastify({
	logger: {
		level: "error",
	},
});

const yoga = createYoga<{
	req: FastifyRequest;
	reply: FastifyReply;
}>({
	cors: {
		credentials: true,
		methods: ["POST"],
		origin: "*",
	},
	graphiql: config.graphql.mustEnableGraphiql,
	graphqlEndpoint: "/api/graphql",
	schema: schema,
});

//
// We pass the incoming HTTP request to GraphQL Yoga
// and handle the response using Fastify's `reply` API
// Learn more about `reply` https://www.fastify.io/docs/latest/Reply/
//
app.route({
	handler: async (request, reply) => {
		// Second parameter adds Fastify's `req` and `reply` to the GraphQL Context
		const response = await yoga.handleNodeRequest(request, {
			reply,
			req: request,
		});

		response.headers.forEach((value, key) => {
			void reply.header(key, value);
		});

		void reply.status(response.status);

		void reply.send(response.body);

		return reply;
	},

	method: ["GET", "POST", "OPTIONS"],
	// Bind to the Yoga's endpoint to avoid rendering on any path
	url: yoga.graphqlEndpoint,
});

void app.listen({
	host: config.graphql.hostname,
	port: config.graphql.port,
});
