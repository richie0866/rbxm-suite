import { fs } from "api";
import { FILE_REFS, FILE_STRUCTURE } from "./constants";
import ModelStorage from "./ModelStorage";

/**
 * Handles rbxmSuite file storage in workspace.
 */
export default class StorageManager {
	/**
	 * Layer of abstraction for model storage and version checking.
	 */
	modelStorage: ModelStorage;

	constructor() {
		fs.createPathTree(FILE_STRUCTURE);
		this.modelStorage = new ModelStorage();
	}

	/**
	 * Gets the full path of the given file reference. Equivalent to `FILE_REFS[ref]`.
	 */
	pathTo<K extends keyof FILE_REFS>(ref: K): FILE_REFS[K] {
		return FILE_REFS[ref];
	}
}
