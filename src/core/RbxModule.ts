import AbstractScript from "helpers/AbstractScript";
import DependencyDebugger from "helpers/DependencyDebugger";

/**
 * A requirable Roblox module.
 */
export default class RbxModule extends AbstractScript<ModuleScript> {
	/**
	 * Whether the `execute` function was already called.
	 */
	didExecute = false;

	/**
	 * Stores the first result of `executor()` once.
	 */
	result?: unknown;

	/**
	 * Emits verbose errors for cyclic dependencies.
	 */
	private readonly dependencyDebugger = new DependencyDebugger(this);

	/**
	 * Returns whether the abstract script is a `RbxModule`.
	 */
	static is(obj: AbstractScript): obj is RbxModule {
		return obj.instance.IsA("ModuleScript");
	}

	/**
	 * Returns the RbxModule associated with the given Roblox module.
	 */
	static getFromInstance(object: ModuleScript): RbxModule | undefined {
		const rbxModule = this.fromInstance.get(object);
		return rbxModule && this.is(rbxModule) ? rbxModule : undefined;
	}

	/**
	 * Runs the executor function if not already run and returns results.
	 * @returns What the executor returned.
	 */
	async execute(): Promise<unknown> {
		if (this.didExecute) return this.result;

		const result = this.createExecutor()();

		this.didExecute = true;

		assert(result, `Module '${this.identify()}' did not return any value`);

		return (this.result = result);
	}

	/**
	 * Runs the executor function if not already run and returns results. Detects cyclic dependencies using the {@link DependencyHelper} object.
	 * @param caller The AbstractScript that required this module.
	 * @returns What the executor returned.
	 */
	protected async executeAsDependency(caller: AbstractScript): Promise<unknown> {
		const { dependencyDebugger } = this;

		// Note that 'caller' required this module, and check for a cyclic dependency
		dependencyDebugger.track(caller);
		dependencyDebugger.traceback();

		const result = await this.execute();

		dependencyDebugger.untrack(caller);

		return result;
	}
}
