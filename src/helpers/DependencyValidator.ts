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
	 * Checks the validity of the dependency chain by looking for cyclic references.
	 * @param abstractScript The module getting loaded.
	 */
	validate(abstractScript: AbstractScript) {
		let currentModule: AbstractScript | undefined = abstractScript;

		for (let depth = 0; currentModule; depth++) {
			currentModule = this.currentlyLoading.get(currentModule);

			if (abstractScript === currentModule)
				throw [
					`Requested module '${abstractScript.instance.GetFullName()}' contains a cyclic reference`,
					`\tTraceback: ${this.getTraceback(abstractScript, depth)}`,
				].join("\n");
		}
	}

	/**
	 * Returns a string used to debug a dependency chain.
	 * @param abstractScript The module getting loaded.
	 * @param depth The depth of the dependency chain.
	 */
	private getTraceback(abstractScript: AbstractScript, depth: number) {
		let traceback = abstractScript.instance.GetFullName();
		let currentModule = abstractScript;
		for (let i = 0; i < depth; i++) {
			currentModule = this.currentlyLoading.get(currentModule)!;
			traceback += `\n\t\t⇒ ${currentModule.instance.GetFullName()}`;
		}
		return traceback;
	}
}
