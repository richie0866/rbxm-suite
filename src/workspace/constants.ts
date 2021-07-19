/**
 * References to common storage files.
 */
export const FILE_REFS = {
	root: ".rbxm-suite",
	modelStorage: ".rbxm-suite/rbxm/",
	modelStorageData: ".rbxm-suite/rbxm.lock.json",
} as const;

export type FILE_REFS = typeof FILE_REFS;

/**
 * The rbxmSuite storage structure.
 */
export const FILE_STRUCTURE = {
	".rbxm-suite/": {
		"rbxm/": {},
		"rbxm.lock.json": "{}",
	},
} as const;
