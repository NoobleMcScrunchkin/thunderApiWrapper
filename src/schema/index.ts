import path from "node:path";
import fs from "node:fs";
import { makeSchema } from "nexus";
import * as RootTypes from "./rootTypes";

function resolveFilename(inPath: string): string {
	const part = "src";
	const extension = ".ts";
	const directoryPath = path.join(process.cwd(), part);
	const computedPath = path.join(directoryPath, inPath);

	if (fs.existsSync(computedPath)) return computedPath;

	return path.join(directoryPath, `${inPath}${extension}`);
}

const schema = makeSchema({
	features: {
		abstractTypeStrategies: {
			isTypeOf: false,
			resolveType: true,
		},
	},
	nonNullDefaults: {
		input: true,
		output: true,
	},
	outputs: {
		schema: resolveFilename("generated/schema.graphql"),
		typegen: resolveFilename("generated/nexus"),
	},
	types: [RootTypes],
});

export default schema;
