import { fs, getCustomAsset } from "api";
import type { RobloxScript } from "helpers/AbstractScript";
import RbxModule from "./RbxModule";
import RbxScript from "./RbxScript";

/**
 * Checks whether the object is a script that can run on the client.
 */
function isScript(obj: Instance): obj is LocalScript | ModuleScript {
	return obj.IsA("LocalScript") || obj.IsA("ModuleScript");
}

/**
 * Handles script runtime in Roblox models.
 */
export default abstract class RbxModelBuilder {
	/**
	 * The Roblox object built from the rbxm file.
	 */
	readonly instance: Instance;

	/**
	 * A list of all abstract scripts
	 */
	protected rbxScripts: (RbxScript | RbxModule)[] = [];

	/**
	 * @param path A path to the `rbxm` or `rbxmx` file.
	 */
	constructor(public readonly path: string) {
		assert(fs.isFile(path), `File at '${path}' must be a file`);

		const models = game.GetObjects(getCustomAsset(path));

		if (models.size() !== 1)
			throw `Failed to build '${path}'; rbxm(x) files without exactly one instance are not supported`;

		this.instance = models[0];
	}

	/**
	 * Creates an abstract script for the object.
	 */
	protected createScript(object: RobloxScript): RbxScript | RbxModule {
		const rbxScript =
			(object.IsA("LocalScript") && new RbxScript(object)) ||
			(object.IsA("ModuleScript") && new RbxModule(object)) ||
			error(`Instance '${object.GetFullName()}' must be a client script`);

		this.rbxScripts.push(rbxScript);

		return rbxScript;
	}

	/**
	 * Creates and stores `RbxScript` and `RbxModule` objects for every descendant.
	 */
	protected init() {
		isScript(this.instance) && this.createScript(this.instance);

		this.instance.GetDescendants().forEach((obj) => isScript(obj) && this.createScript(obj));
	}
}
