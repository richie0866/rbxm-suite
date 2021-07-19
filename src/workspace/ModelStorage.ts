import { fs } from "api";
import JsonStore from "helpers/JsonStore";
import { FILE_REFS } from "./constants";

/**
 * Layer of abstraction for model storage and version checking.
 */
export default class ModelStorage {
	/**
	 * A reference to the storage location.
	 */
	location = FILE_REFS.modelStorage;

	/**
	 * Stores version tags for model files.
	 */
	private modelTagStore = new JsonStore<string>(FILE_REFS.modelStorageData);

	/**
	 * Saves a Roblox model file to the storage.
	 * @param fileName The name of the model, including file type.
	 * @param tag The version of the model.
	 * @param data The model data.
	 */
	stash(path: string, tag: string, data: string) {
		fs.writeFile(FILE_REFS.modelStorage + path, data);
		this.modelTagStore.set(path, tag);
	}

	/**
	 * Checks whether the model storage contains the given file.
	 */
	has(path: string): boolean {
		return fs.isFile(FILE_REFS.modelStorage + path);
	}

	/**
	 * Appends the model storage location to the start of the path.
	 */
	normalize(path: string): string {
		return FILE_REFS.modelStorage + path;
	}

	/**
	 * Gets the current version of the model file stashed, if it exists.
	 */
	getTag(fileName: string): string | undefined {
		return this.modelTagStore.get(fileName);
	}

	/**
	 * Empties the storage.
	 */
	empty() {
		this.modelTagStore.clear();
		fs.deleteDir(FILE_REFS.modelStorage);
	}
}
