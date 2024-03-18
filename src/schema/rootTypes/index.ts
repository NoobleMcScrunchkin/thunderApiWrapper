import { objectType, stringArg, nullable, intArg, scalarType } from "nexus";
import prisma from "@/prisma";
import { PackageVersion, Prisma } from "@prisma/client";
import { generateQueueFromMod } from "@/services/db";
import { StoreInDB } from "@/services/thunderstore";
import { DefaultArgs } from "@prisma/client/runtime/library";

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
		t.int("downloads");
		t.nullable.list.field("versions", { type: "PackageVersion" });
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
		t.nullable.field("package", { type: "Package" });
	},
	name: "PackageVersion",
});

const packageQueryType = objectType({
	definition(t) {
		t.int("total");
		t.list.field("result", { type: "Package" });
	},
	name: "PackageQuery",
});

const dependencyQueryType = objectType({
	definition(t) {
		t.list.field("packages", { type: "PackageVersion" });
		t.list.string("missing");
	},
	name: "DependencyQuery",
});

const query = objectType({
	definition(t) {
		t.field("packages", {
			args: {
				search: nullable(stringArg()),
				category: nullable(stringArg()),
				limit: intArg({ default: 20 }),
				offset: intArg({ default: 0 }),
			},
			async resolve(_root, { search, category, limit, offset }) {
				console.log(StoreInDB.updating ? "USING DUPE" : "NOT USING DUPE");

				const where = {
					AND: [{ name: { not: { contains: "BepInExPack" } } }, { name: { not: { contains: "r2modman" } } }],
					categories: category
						? {
								has: category,
								mode: "insensitive",
						  }
						: undefined,
					OR: [
						{
							name: search
								? {
										contains: search,
										mode: "insensitive",
								  }
								: undefined,
						},
						{
							full_name: search
								? {
										contains: search,
										mode: "insensitive",
								  }
								: undefined,
						},
						{
							versions: {
								some: {
									description: search
										? {
												contains: search,
												mode: "insensitive",
										  }
										: undefined,
								},
							},
						},
					],
				} as Prisma.PackageWhereInput;

				const model = (StoreInDB.updating ? prisma.packageDupe : prisma.package) as Prisma.PackageDelegate<DefaultArgs>;

				const total = await model.count({ where });

				const result = await model.findMany({
					take: limit,
					skip: offset,
					where,
					include: {
						versions: {
							orderBy: {
								date_created: "desc",
							},
						},
					},
					orderBy: [
						{
							is_deprecated: "asc",
						},
						{
							is_pinned: "desc",
						},
						{
							rating_score: "desc",
						},
					],
				});

				const downloadsAdded = result.map((pack) => {
					const downloads = pack.versions.reduce((prev, curr) => prev + curr.downloads, 0);
					return { ...pack, downloads };
				});

				return { result: downloadsAdded, total };
			},
			type: "PackageQuery",
		});
		t.nullable.field("version", {
			args: {
				full_name: stringArg(),
			},
			async resolve(_root, { full_name }) {
				console.log(StoreInDB.updating ? "USING DUPE" : "NOT USING DUPE");

				const model = (StoreInDB.updating ? prisma.packageVersionDupe : prisma.packageVersion) as Prisma.PackageVersionDelegate<DefaultArgs>;

				const result = await model.findFirst({
					where: {
						full_name,
					},
					include: {
						package: true,
					},
					orderBy: [
						{
							date_created: "desc",
						},
					],
				});

				if (result === null) return null;

				const modelPack = (StoreInDB.updating ? prisma.package : prisma.package) as Prisma.PackageDelegate<DefaultArgs>;

				const resultPack = await modelPack.findFirst({
					where: {
						id: result.package_id,
					},
					include: {
						versions: true,
					},
				});

				if (resultPack === null) return null;

				const downloads = resultPack.versions.reduce((prev, curr) => prev + curr.downloads, 0);

				return { ...result, package: { ...result.package, downloads } };
			},
			type: "PackageVersion",
		});
		t.field("dependencyList", {
			args: {
				full_name: stringArg(),
			},
			async resolve(_root, { full_name }) {
				console.log(StoreInDB.updating ? "USING DUPE" : "NOT USING DUPE");
				const modelPack = (StoreInDB.updating ? prisma.package : prisma.package) as Prisma.PackageDelegate<DefaultArgs>;

				const deps = await generateQueueFromMod(full_name);

				const downloadsAdded = await Promise.all(
					deps.packages.map(async (ver) => {
						const resultPack = await modelPack.findFirst({
							where: {
								id: ver.package_id,
							},
							include: {
								versions: true,
							},
						});

						if (resultPack === null) return { ...ver, package: null };

						const downloads = resultPack.versions.reduce((prev, curr) => prev + curr.downloads, 0);

						return { ...ver, package: { ...resultPack, downloads } };
					})
				);

				return { packages: downloadsAdded, missing: deps.missing };
			},
			type: "DependencyQuery",
		});
	},
	name: "Query",
});

export default query;
export { packageType, packageVersionType, packageQueryType, dependencyQueryType };
