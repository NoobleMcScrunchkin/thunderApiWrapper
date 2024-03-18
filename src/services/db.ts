import prisma from "@/prisma";
import { Prisma } from "@prisma/client";
import { compareVersions } from "compare-versions";
import { StoreInDB } from "./thunderstore";
import { DefaultArgs } from "@prisma/client/runtime/library";
import { NexusGenFieldTypes } from "@/generated/nexus";

type PackageVersion = NexusGenFieldTypes["PackageVersion"];

async function generateQueueFromMod(full_name: string): Promise<{ packages: Array<PackageVersion>; missing: Array<string> }> {
	const model = (StoreInDB.updating ? prisma.packageVersionDupe : prisma.packageVersion) as Prisma.PackageVersionDelegate<DefaultArgs>;

	const primary = await model.findFirst({
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

	if (!primary) {
		return { packages: [], missing: [full_name] };
	}

	const packages = [];
	const missing = [];

	for (const dependency of primary.dependencies) {
		if (dependency.includes("BepInEx-BepInExPack")) continue;

		const dependencyQueue = await generateQueueFromMod(dependency);

		packages.push(...dependencyQueue.packages);
		missing.push(...dependencyQueue.missing);
	}

	packages.push(primary);

	const queueFiltered = packages.filter((value, index, self) => index === self.findIndex((t) => t.id === value.id));
	const missingFiltered = missing.filter((value, index, self) => index === self.findIndex((t) => t === value));

	const queueFilteredHighestVersion = Object.values(
		queueFiltered.reduce((acc, pack) => {
			if (!acc[pack.name] || compareVersions(pack.version_number, acc[pack.name].version_number) === 1) {
				acc[pack.name] = pack;
			}
			return acc;
		}, {} as Record<string, PackageVersion>)
	);

	return { packages: queueFilteredHighestVersion, missing: missingFiltered };
}

export { generateQueueFromMod };
