import { objectType, stringArg, nullable, intArg, scalarType } from "nexus";
import prisma from "@/prisma";

const packageType = objectType({
	definition(t) {
		t.string("id");
		t.string("name");
		t.string("full_name");
		t.string("owner");
		t.string("package_url");
		t.nullable.string("donation_link");
		t.string("date_created");
		t.string("date_updated");
		t.nullable.string("uuidv4");
		t.int("rating_score");
		t.boolean("is_pinned");
		t.boolean("is_deprecated");
		t.boolean("has_nsfw_content");
		t.list.string("categories");
		t.list.field("versions", { type: "PackageVersion" });
	},
	name: "Package",
});

const packageVersionType = objectType({
	definition(t) {
		t.string("id");
		t.string("name");
		t.string("full_name");
		t.string("description");
		t.string("icon");
		t.string("version_number");
		t.list.string("dependencies");
		t.string("download_url");
		t.int("downloads");
		t.string("date_created");
		t.string("website_url");
		t.boolean("is_active");
		t.nullable.string("uuid4");
		t.int("file_size");
	},
	name: "PackageVersion",
});

const query = objectType({
	definition(t) {
		t.list.field("packages", {
			args: {
				search: nullable(stringArg()),
				category: nullable(stringArg()),
				limit: intArg({ default: 0 }),
				offset: intArg({ default: 0 }),
			},
			async resolve(_root, { search, category, limit, offset }) {
				const result = await prisma.package.findMany({
					take: limit,
					skip: offset,
					where: {
						categories: {
							has: category ?? undefined,
						},
						OR: [
							{
								name: search
									? {
											contains: search,
									  }
									: undefined,
							},
							{
								full_name: search
									? {
											contains: search,
									  }
									: undefined,
							},
							{
								versions: {
									some: {
										description: search
											? {
													contains: search,
											  }
											: undefined,
									},
								},
							},
						],
					},
					include: {
						versions: true,
					},
					orderBy: [
						{
							rating_score: "desc",
						},
					],
				});

				return result;
			},
			type: "Package",
		});
		t.list.field("versions", {
			args: {
				package_id: stringArg(),
			},
			async resolve(_root, { package_id }) {
				const result = await prisma.packageVersion.findMany({
					where: {
						package_id,
					},
					orderBy: [
						{
							date_created: "desc",
						},
					],
				});

				return result;
			},
			type: "PackageVersion",
		});
	},
	name: "Query",
});

export default query;
export { packageType, packageVersionType };
