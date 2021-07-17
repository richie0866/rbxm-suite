import type AbstractScript from "./AbstractScript";
import { AbstractScriptDependencyStore } from "./AbstractScriptStore";

/** Emits verbose errors for cyclic dependencies. */
export default class DependencyValidator {
	/** Maps scripts to the module they're loading, like a history of `[script who loaded]: module` */
	private readonly currentlyLoading = new AbstractScriptDependencyStore();

	/**
	 * Notes that `caller` loaded `module`, which gets checked in `validate`. Remember to call 'untrack' when the operation is done!
	 * @param caller The script requiring the module.
	 * @param module The module getting loaded.
	 */
	track(caller: AbstractScript, module: AbstractScript) {
		this.currentlyLoading.set(caller, module);
	}

	/**
	 * Removes the note that `caller` loaded `module`, indicating that `module` finished loading.
	 * @param caller The script requiring the module.
	 * @param module The module getting loaded.
	 */
	untrack(caller: AbstractScript, module: AbstractScript) {
		if (this.currentlyLoading.get(caller) === module) this.currentlyLoading.delete(caller);
	}

	/**
	 * Asserts the validity of the dependency chain by looking for cyclic references.
	 * @param abstractScript The module getting loaded.
	 * @returns The dependency chain starting with `abstractScript`.
	 */
	traceback(abstractScript: AbstractScript): AbstractScript[] {
		const chain: AbstractScript[] = [abstractScript];

		for (
			let current: AbstractScript | undefined = this.currentlyLoading.get(abstractScript);
			current;
			current = this.currentlyLoading.get(current)
		) {
			chain.push(current);

			if (abstractScript === current)
				throw [
					`Requested module '${abstractScript.identify()}' contains a cyclic reference`,
					`Traceback: ${chain.map((script) => script.identify()).join("\n\t⇒ ")}`,
				].join("\n");
		}

		return chain;
	}
}
