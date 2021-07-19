import { defer } from "utils/defer";
import AbstractScriptStore from "./AbstractScriptStore";

export type RobloxScript = Script | LocalScript | ModuleScript;

export interface Environment {
	/** A reference to the script the AbstractScript extends. */
	script: RobloxScript;

	/** Wraps the `require` global for custom behavior with AbstractScripts. */
	require(module: ModuleScript): unknown;
}

/**
 * Loads a string as a Lua chunk. Throws an error if it failed to load.
 */
function loadString<F extends Callback = Callback>(chunk: string, chunkName: string): F {
	const [f, err] = loadstring(chunk, chunkName);
	assert(f, err);
	return f as F;
}

/**
 * Extends script objects to be fully-functional in an exploit.
 * @abstract
 */
export default abstract class AbstractScript<T extends RobloxScript = RobloxScript> {
	/**
	 * Maps AbstractScript objects to their script objects.
	 */
	protected static readonly fromInstance = new AbstractScriptStore();

	/**
	 * The global environment to apply to the executor.
	 */
	environment: Environment;

	/**
	 * @param instance The script object to extend.
	 * @param executor Optional function to call when running or requiring the object.
	 */
	constructor(
		public readonly instance: T,

		public executor: () => unknown = loadString(instance.Source, `=${instance.GetFullName()}`),
	) {
		this.environment = setmetatable<Environment>(
			{
				script: instance,
				require: (module: ModuleScript) => this.require(module).expect(),
			},
			{
				__index: getfenv(0) as never,
				__metatable: "This metatable is locked",
			},
		);
		setfenv(executor, this.environment);
		AbstractScript.fromInstance.set(instance, this);
	}

	/**
	 * Returns the AbstractScript associated with the given Roblox script.
	 */
	static getFromInstance(object: RobloxScript): AbstractScript | undefined {
		return this.fromInstance.get(object);
	}

	/**
	 * Gets the full name of the instance.
	 */
	identify(): string {
		return this.instance.GetFullName();
	}

	/**
	 * Tries to require an AbstractScript from the given Roblox script.
	 *
	 * Used when this script requires another module.
	 */
	async require(module: ModuleScript): Promise<unknown> {
		const abstract = AbstractScript.getFromInstance(module);
		if (abstract) return abstract.executeAsDependency(this);
		else return require(module);
	}

	/**
	 * Sets the executor function. Automatically updates the global environment for the executor.
	 */
	setExecutor(executor: () => unknown) {
		this.executor = setfenv(executor, this.environment);
	}

	/**
	 * Runs the executor function on a new thread.
	 * @returns What the executor returned.
	 */
	defer(): Promise<unknown> {
		return defer(() => this.execute()).timeout(
			10,
			`Script '${this.identify()}' timed out! Try not to yield the main thread in LocalScripts.`,
		);
	}

	/**
	 * Runs the executor function.
	 * @returns What the executor returned.
	 */
	abstract execute(): Promise<unknown>;

	/**
	 * Runs the executor function if not already run and returns results.
	 * @param caller The AbstractScript that required this module.
	 * @returns What the executor returned.
	 */
	protected abstract executeAsDependency(caller: AbstractScript): Promise<unknown>;
}
