import prisma from "@/prisma";
import { ApiPackage } from "@/types";
import config from "@/config";

async function storeGamePackagesInDB(): Promise<void> {
	const { lethalCompanyApiUrl } = config.thunderstore;

	const res = await fetch(`${lethalCompanyApiUrl}/package/`);

	const data = (await res.json()) as Array<ApiPackage>;

	await prisma.$transaction(
		async (tx) => {
			console.log("Start DB Clear");
			await tx.$executeRaw`TRUNCATE "PackageVersion" CASCADE`;
			await tx.$executeRaw`TRUNCATE "Package" CASCADE`;

			console.log("Start DB Insert");
			for (const modPackage of data) {
				await tx.package.create({
					data: {
						name: modPackage.name,
						full_name: modPackage.full_name,
						owner: modPackage.owner,
						package_url: modPackage.package_url,
						donation_link: modPackage.donation_link,
						date_created: modPackage.date_created,
						date_updated: modPackage.date_updated,
						uuidv4: modPackage.uuidv4 ?? modPackage.uuid4,
						rating_score: modPackage.rating_score,
						is_pinned: modPackage.is_pinned,
						is_deprecated: modPackage.is_deprecated,
						has_nsfw_content: modPackage.has_nsfw_content,
						categories: modPackage.categories,
						versions: { create: modPackage.versions },
					},
				});
			}
		},
		{
			maxWait: 300000, // default: 2000
			timeout: 300000, // default: 5000
		}
	);

	console.log("Done DB Insert");
}

export { storeGamePackagesInDB };
