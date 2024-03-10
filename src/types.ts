export interface ApiPackageVersion {
	name: string;
	full_name: string;
	description: string;
	icon: string;
	version_number: string;
	dependencies: Array<string>;
	download_url: string;
	downloads: number;
	date_created: string;
	website_url: string;
	is_active: boolean;
	uuid4: string;
	file_size: number;
}

export interface ApiPackage {
	name: string;
	full_name: string;
	owner: string;
	package_url: string;
	donation_link?: string;
	date_created: string;
	date_updated: string;
	uuidv4?: string;
	uuid4?: string;
	rating_score: number;
	is_pinned: boolean;
	is_deprecated: boolean;
	has_nsfw_content: boolean;
	categories: Array<string>;
	versions: Array<ApiPackageVersion>;
}
