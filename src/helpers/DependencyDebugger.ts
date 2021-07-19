import type AbstractScript from "./AbstractScript";
import { DependencyStore } from "./DependencyStore";

type AbstractModule = AbstractScript<ModuleScript>;

/**
 * Emits verbose errors for cyclic dependencies.
 */
export default class DependencyDebugger {
	/**
	 * Maps scripts to the module they're loading, like a history of `[script who loaded]: module`
	 */
	private static readonly currentlyLoading = new DependencyStore();

	/**
	 * @param dependency The module this class should handle.
	 */
	constructor(private dependency: AbstractModule) {}

	/**
	 * Notes that `caller` loaded this module, which gets checked in {@link DependencyHelper.traceback}. Remember to call 'untrack' when the operation is done!
	 * @param caller The script requiring the module.
	 */
	track(caller: AbstractScript) {
		const { currentlyLoading } = DependencyDebugger;
		currentlyLoading.set(caller, this.dependency);
	}

	/**
	 * Removes the note that `caller` loaded `module`, indicating that `module` finished loading.
	 * @param caller The script requiring the module.
	 * @param targetModule The module getting loaded.
	 */
	untrack(caller: AbstractScript) {
		const { currentlyLoading } = DependencyDebugger;
		currentlyLoading.get(caller) === this.dependency && currentlyLoading.delete(caller);
	}

	/**
	 * Asserts the validity of the dependency chain by looking for cyclic references.
	 * @param targetModule The module getting loaded.
	 * @returns The dependency chain starting with `abstractScript`.
	 */
	traceback(): AbstractModule[] {
		const { currentlyLoading } = DependencyDebugger;
		const chain: AbstractModule[] = [this.dependency];

		for (
			let current: AbstractModule | undefined = currentlyLoading.get(this.dependency);
			current;
			current = currentlyLoading.get(current)
		) {
			chain.push(current);

			if (this.dependency === current)
				throw [
					`Requested module '${this.dependency.identify()}' contains a cyclic reference`,
					``,
					`Traceback: ${chain.map((rbxModule) => rbxModule.identify()).join("\n\t⇒ ")}`,
				].join("\n");
		}

		return chain;
	}
}
