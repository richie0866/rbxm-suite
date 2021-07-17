import Object from "@rbxts/object-utils";

type PathMap = { [K in string]: string | PathMap };

/**
 * Reads the file at the give path.
 */
export const readFile = (path: string): string => readfile(path);

/**
 * Returns a list of paths to the children in a directory.
 */
export const readDir = (path: string): string[] => listfiles(path);

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
export const inferDir = (path: string): boolean => path.sub(-1) === "/";

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
export const createPathTree = (pathMap: PathMap) => {
	for (const [path, data] of Object.entries(pathMap))
		typeIs(data, "table") ? (createDirAll(path), createPathTree(data)) : writeFile(path, data);
};

/**
 * Removes leading and trailing slashes.
 */
export const trimSlashes = (path: string): string => path.gsub("^/*(.-)/*$", "%1")[0] as string;

/**
 * Replaces back-slashes with forward-slashes.
 */
export const normalize = (path: string) => path.gsub("/", "\\");
