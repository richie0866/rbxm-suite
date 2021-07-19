import Object from "@rbxts/object-utils";

type PathMap = { [K in string]: string | PathMap };

/**
 * Reads the file at the givem path.
 */
export const readFile = (path: string): string => readfile(path);

/**
 * Returns a list of paths to the children in a directory.
 */
export const readDir = (path: string): string[] => listfiles(path);

/**
 * Deletes the file at the given path. Throws an error if no file exists.
 */
// export const deleteFile = (path: string) => delfile(path);

/**
 * Deletes the directory at the given path. Throws an error if no directory exists.
 */
export const deleteDir = (path: string) => delfolder(path);

/**
 * Checks whether the given path is a file.
 */
export const isFile = (path: string): boolean => isfile(path);

/**
 * Checks whether the given path is a directory.
 */
export const isDir = (path: string): boolean => isfolder(path);

/**
 * Infers whether the given path is a directory by looking for a trailing slash.
 */
export const inferIsDir = (path: string): boolean => path.sub(-1) === "/";

/**
 * Writes to the file at the given path.
 */
export const writeFile = (path: string, content = "") => {
	createDirAll(path, true);
	writefile(path, content);
};

/**
 * Makes a directory at the given path, as well as all parent directories that do not yet exist.
 */
export const createDirAll = (path: string, requireTrailingSlash = false) => {
	let currentPath = "";

	// If 'requireTrailingSlash' is true, append the string pattern with '/+',
	// which makes it only match tokens ending with a forward-slash.
	for (const [token] of path.gmatch(requireTrailingSlash ? "([^/]+)/+" : "([^/]+)"))
		makefolder((currentPath += token + "/"));
};

/**
 * Creates files and folders with the given path tree.
 *
 * @example
 * ``` ts
 * createPathTree({
 *     "file.json": "{'foo': 'bar'}",
 *     "folder": {
 *         "child.txt": "Hello, world!",
 *     },
 * });
 * ```
 */
export const createPathTree = (pathMap: PathMap, root = "") => {
	for (const [path, data] of Object.entries(pathMap))
		if (typeIs(data, "table")) {
			createDirAll(root + path);
			createPathTree(data, root + addTrailing(path));
		} else {
			writeFile(root + path, data);
		}
};

/**
 * Removes leading and trailing slashes.
 */
export const trimSlashes = (path: string): string => path.gsub("^/*(.-)/*$", "%1")[0] as string;

/**
 * Replaces back-slashes with forward-slashes.
 */
export const normalize = (path: string): string => path.gsub("\\", "/")[0] as string;

/**
 * Adds a trailing slash to the path if one doesn't already exist.
 */
export const addTrailing = (path: string): string => (path.sub(-1) === "/" ? path + "/" : path);
