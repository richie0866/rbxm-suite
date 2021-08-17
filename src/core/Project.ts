import type { RobloxScript } from "helpers/AbstractScript";
import AssetDownloader from "./AssetDownloader";
import RbxModelBuilder from "./RbxModelBuilder";
import RbxModule from "./RbxModule";
import RbxScript from "./RbxScript";

/**
 * Allows you to build and manage Roblox instances from a 'rbxm' or 'rbxmx' file.
 *
 * ## Example usage
 *
 * ``` lua
 * local project = Project.new("somewhere/Roact.rbxm")
 * project:start()
 * project:require(project.instance.Utils.Thread)
 * ```
 *
 * ## Import
 *
 * Roblox model files can be imported from GitHub releases, e.g.
 *
 * ```lua
 * Project.fromGitHub("Roblox/roact@v1.4.0")
 * Project.fromGitHub("Roblox/roact@latest")
 * ```
 *
 * To version check and update in a background process, append `#` and the `deferred` flag, e.g.
 *
 * ```lua
 * Project.fromGitHub("Roblox/roact@latest#deferred")
 * ```
 */
export default class Project extends RbxModelBuilder {
	/**
	 * A promise that resolves once all scripts finish executing. Only one instance of this field will ever exist.
	 */
	private runtimeJob?: Promise<RobloxScript[]>;

	/**
	 * @param path A path to the `rbxm` or `rbxmx` file.
	 * @param unsafe Whether cyclic dependencies should be checked against.
	 */
	constructor(path: string, unsafe = false) {
		super(path, unsafe);
		super.init();
	}

	/**
	 * Downloads a `rbxm` release asset with {@link AssetDownloader}. For simplicity, the `options` argument must be a string.
	 * @param options A string describing how to fetch the release.
	 * @param assetName The name of the asset file to download. The file type should be `rbxm` or `rbxmx`!
	 * @returns A Project object built from the downloaded asset.
	 */
	static readonly fromGitHub = async (options: string, assetName: string, unsafe = false): Promise<Project> => {
		assert(typeIs(options, "string"), "Release options must be a string");
		assert(typeIs(assetName, "string"), "Asset name must be a string");

		const path = await new AssetDownloader(options).retrieve(assetName);

		return new Project(path, unsafe);
	};

	/**
	 * Executes every `RbxScript` object in the model **once**. All future calls return the original Promise.
	 * @returns A promise that resolves when every script finishes running on the main thread.
	 */
	async start(): Promise<RobloxScript[]> {
		if (this.runtimeJob) {
			return await this.runtimeJob;
		} else {
			const jobs: Promise<RobloxScript>[] = [];

			this.rbxScripts.forEach(
				(rbxScript) =>
					RbxScript.is(rbxScript) && jobs.push(rbxScript.defer().finallyReturn(rbxScript.instance)),
			);

			return await (this.runtimeJob = Promise.all<typeof jobs>(jobs));
		}
	}

	/**
	 * Requires a ModuleScript object and returns the result. The object must be created by any {@link Project} object.
	 * @param object A ModuleScript object created by Project.
	 * @returns What the module returned.
	 */
	async require(object: ModuleScript): Promise<unknown> {
		const rbxModule = RbxModule.getFromInstance(object);
		assert(rbxModule, `Instance '${object.GetFullName()}' must be a module created by Project`);
		return await rbxModule.execute();
	}
}
