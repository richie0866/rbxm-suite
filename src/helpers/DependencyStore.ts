import type AbstractScript from "./AbstractScript";
import Store from "./Store";

/**
 * Maps scripts to the module they're loading, like a history of `[script who loaded]: module`
 */
export class DependencyStore extends Store<AbstractScript, AbstractScript<ModuleScript>> {
	constructor() {
		super("AbstractScriptDependencyStore");
	}
}
