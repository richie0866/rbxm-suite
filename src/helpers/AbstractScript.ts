import AbstractScriptStore from "./AbstractScriptStore";
import DependencyValidator from "./DependencyValidator";

type RobloxScript = Script | LocalScript | ModuleScript;

interface Environment {
	/** A reference to the script the AbstractScript extends. */
	script: RobloxScript;

	/** Wraps the `require` global for custom behavior with AbstractScripts. */
	require(module: ModuleScript): unknown;
}

/** Loads a string as a Lua chunk. Throws an error if it failed to load. */
function loadString<F extends Callback = Callback>(chunk: string, chunkName: string): F {
	const [f, err] = loadstring(chunk, chunkName);
	assert(f, err);
	return f as F;
}

/**
 * Extends script objects to be fully-functional in an exploit.
 */
export default class AbstractScript {
	/** Maps AbstractScript objects to their script objects. */
	private static readonly fromInstance = new AbstractScriptStore();

	/** Emits verbose errors for cyclic dependencies. */
	private static readonly dependencyValidator = new DependencyValidator();

	/** Whether the `execute` function was already called. */
	didExecute = false;

	/** Stores the result of `executor()` after being called. */
	result?: unknown;

	/** The global environment to apply to the executor. */
	environment: Environment;

	constructor(
		/** The script object to extend. */
		public readonly instance: RobloxScript,

		/** Optional function to call when running or requiring the object. */
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
	 * Tries to require an AbstractScript from the given Roblox script.
	 */
	async require(module: ModuleScript) {
		const abstract = AbstractScript.getFromInstance(module);
		if (abstract) return abstract.executeAsDependency(this);
		else return require(module);
	}

	/**
	 * Sets the executor function. Automatically updates the global environment for the executor.
	 */
	setExecutor(executor: () => unknown) {
		this.executor = executor;
		setfenv(executor, this.environment);
	}

	/**
	 * Runs the executor function if not already run and returns results.
	 *
	 * Detects recursive references using roblox-ts's RuntimeLib solution.
	 * The original source of this module can be found in the link below, as well as the license:
	 * - Source: https://github.com/roblox-ts/roblox-ts/blob/master/lib/RuntimeLib.lua
	 * - License: https://github.com/roblox-ts/roblox-ts/blob/master/LICENSE
	 *
	 * @param caller The AbstractScript that required this module.
	 * @returns What the executor returned.
	 */
	async executeAsDependency(caller: AbstractScript): Promise<unknown> {
		const { dependencyValidator: validator } = AbstractScript;

		// Note that 'caller' required this module, and check for a cyclic dependency
		validator.track(caller, this);
		validator.validate(this);

		const result = await this.execute();

		validator.untrack(caller, this);

		return result;
	}

	/**
	 * Runs the executor function if not already run and returns results.
	 * @returns What the executor returned.
	 */
	async execute(): Promise<unknown> {
		if (this.didExecute) return this.result;

		const result = this.executor();
		this.didExecute = true;

		if (this.instance.IsA("ModuleScript") && result === undefined)
			throw `Module '${this.instance.GetFullName()}' did not return any value`;

		return result;
	}

	/**
	 * Runs the executor function on a new thread.
	 * @returns What the executor returned.
	 */
	async defer(): Promise<unknown> {
		return Promise.defer((resolve) => this.execute().andThen(resolve)).timeout(
			30,
			`Script '${this.instance.GetFullName()}' reached execution timeout! Try not to yield the main thread in LocalScripts.`,
		);
	}
}
