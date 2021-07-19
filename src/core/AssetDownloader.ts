import { HttpService } from "@rbxts/services";
import { fs } from "api";
import storage from "storage";
import * as http from "utils/http";

/**
 * Formats a special string to a `ReleaseOptions` object. The release is denoted by:
 * ```
 * "owner/repo@tag"
 * "owner/repo@tag#flag1+flag2"
 * ```
 *
 * ## Example options
 *
 * - ```
 * "Roblox/roact@v1.4.0"
 * ```
 * - ```
 * "Roblox/roact@latest"
 * ```
 * - ```
 * "Roblox/roact@latest#deferred"
 * ```
 *
 * @param options A string describing the release.
 * @returns A `ReleaseOptions` object configured to match the string.
 */
export function formatReleaseOptions(options: string): DefaultReleaseOptions {
	const [owner, repo, releaseTag, rest] = options.match("^([^/]+)/([^@]+)@([^#%+]+)#?([%+%w]-)$");
	const flags = typeIs(rest, "string") ? rest.split("+") : [];

	if (!typeIs(owner, "string") || !typeIs(repo, "string") || !typeIs(releaseTag, "string"))
		throw `Failed to format '${options}'; missing owner, repo, or release tag`;

	if (releaseTag !== "latest" && flags.includes("deferred"))
		throw `Failed to format '${options}'; 'deferred' flag can only be used with the 'latest' tag`;

	return {
		owner,
		repo,
		releaseTag: releaseTag === "latest" ? undefined : releaseTag,
		retrieveBy: releaseTag === "latest" ? "latest" : "tag",
		deferred: flags.includes("deferred"),
	};
}

type RetrieveBy = "tag" | "latest";

/**
 * A collection of options used as instructions to download the release.
 */
export interface ReleaseOptions {
	/**
	 * The owner of the repository.
	 */
	owner: string;

	/**
	 * The name of the repository.
	 */
	repo: string;

	/**
	 * The tag of the release to retrieve. Must be specified when `retrieveBy` = `tag`.
	 */
	releaseTag?: string;

	/**
	 * Describes how to fetch the release.
	 * @default "latest"
	 */
	retrieveBy?: RetrieveBy;

	/**
	 * Whether a download will be run in a background process when the asset was downloaded before.
	 * @default true
	 */
	deferred?: boolean;
}

type DefaultReleaseOptions = ReleaseOptions & { retrieveBy: RetrieveBy; deferred: boolean };

/**
 * Allows you to download and store GitHub release assets.
 *
 * ## Example usage
 *
 * ``` lua
 * local downloader = AssetDownloader.new("Roblox/roact@v1.4.0")
 *
 * downloader:retrieve("Roact.rbxm")
 *     :andThen(function(path)
 *         game:GetObjects(getcustomasset(path))
 *     end)
 * ```
 *
 * ## Latest
 *
 * The latest release can be fetched with the `latest` tag, e.g.
 *
 * ```lua
 * AssetDownloader.new("Roblox/roact@latest")
 * ```
 *
 * To version check and update in a background process, append `#` and the `deferred` flag, e.g.
 *
 * ```lua
 * AssetDownloader.new("Roblox/roact@latest#deferred")
 * ```
 */
export default class AssetDownloader {
	/**
	 * Whether the release was already fetched.
	 */
	fetchComplete = false;

	/**
	 * Instructions to download the release.
	 */
	readonly options: DefaultReleaseOptions;

	/**
	 * @param options Instructions to download the release.
	 */
	constructor(options: ReleaseOptions | string) {
		assert(typeIs(options, "string") || typeIs(options, "table"), "Release options must be a string or table");

		this.options = typeIs(options, "string")
			? formatReleaseOptions(options)
			: { retrieveBy: "latest", deferred: true, ...options };
	}

	/**
	 * Empties the storage.
	 */
	empty() {
		storage.modelStorage.empty();
	}

	/**
	 * Downloads an asset using the release options.
	 * @param assetName The name of the asset to download.
	 * @returns A path to the asset.
	 */
	async retrieve(assetName: string): Promise<string> {
		assert(typeIs(assetName, "string"), "Asset name must be a string");

		const { deferred, retrieveBy } = this.options;
		const location = this.location(assetName);

		const isInStorage = storage.modelStorage.has(location);

		if (retrieveBy === "latest" && isInStorage) {
			const job = this.download(assetName);
			!deferred && (await job);
		} else if (!isInStorage) {
			await this.download(assetName);
		}

		return storage.modelStorage.normalize(location);
	}

	/**
	 * Creates a unique identifier for the release. Used for asset storage.
	 */
	private identify(): string {
		const { owner, repo, releaseTag = "LATEST" } = this.options;
		return "%s-%s@%s".format(owner.lower(), repo.lower(), releaseTag);
	}

	/**
	 * Gets the *local* location of an asset in the release folder.
	 */
	private location(assetName: string): string {
		return `${this.identify()}/${assetName}`;
	}

	/**
	 * Downloads an asset and saves it to the model storage.
	 * @private
	 * @param assetName The name of the asset to download.
	 */
	private async download(assetName: string) {
		const { owner, repo, releaseTag = await this.getLatestTagName() } = this.options;
		const location = this.location(assetName);

		const response = await http.requestStrict({
			Url: `https://github.com/${owner}/${repo}/releases/download/${releaseTag}/${assetName}`,
			Method: "GET",
		});

		storage.modelStorage.stash(location, releaseTag, response.Body);
	}

	/**
	 * Gets the latest release tag for the repository.
	 */
	private async getLatestTagName(): Promise<string> {
		const { owner, repo } = this.options;

		const response = await http.requestStrict({
			Url: `https://api.github.com/repos/${owner}/${repo}/releases/latest`,
			Method: "GET",
		});
		const release = HttpService.JSONDecode<ReleaseFetchResult>(response.Body);

		return release.tag_name;
	}
}

/**
 * A release body returned by the GitHub API.
 */
export interface ReleaseFetchResult {
	/**
	 * Base URL of the release
	 */
	readonly url: string;
	/**
	 * URL of any associated assets with the release
	 */
	readonly assets_url: string;
	/**
	 * URL that can be used to upload Assets to the release
	 */
	readonly upload_url: string;
	/**
	 * URL directing to detailed information on the release
	 */
	readonly html_url: string;
	/**
	 * ID of the release
	 */
	readonly id: string;
	/**
	 * Information about the release author
	 */
	readonly author: object;
	/**
	 * Name of the release tag
	 */
	readonly tag_name: string;
	/**
	 * Commitish value that determines where the Git release is created from
	 */
	readonly target_commitish: string;
	/**
	 * Name of the release
	 */
	readonly name: string;
	/**
	 * Indicates whether the release is a draft
	 */
	readonly draft: boolean;
	/**
	 * Indicates whether the release is a prerelease
	 */
	readonly prerelease: boolean;
	/**
	 * Date of release creation
	 */
	readonly created_at: string;
	/**
	 * Date of release publishing
	 */
	readonly published_at: string;
	/**
	 * A list of assets
	 */
	readonly assets: object[];
	/**
	 * ID of release
	 */
	readonly release_id?: number;
	/**
	 * Download URL of the release source code in `tar.gz` format
	 */
	readonly tarball_url: string;
	/**
	 * Download URL of the release source code in `zip` format
	 */
	readonly zipball_url: string;
	/**
	 * Description of the release
	 */
	readonly body: string;
}
