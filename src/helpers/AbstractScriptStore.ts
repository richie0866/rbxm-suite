import type AbstractScript from "./AbstractScript";
import Store from "./Store";

/**
 * Maps AbstractScript objects to their script objects.
 */
export default class AbstractScriptStore extends Store<LuaSourceContainer, AbstractScript> {
	constructor() {
		super("AbstractScriptStore");
	}
}

/**
 * Maps scripts to the module they're loading, like a history of `[script who loaded]: module`
 */
export class AbstractScriptDependencyStore extends Store<AbstractScript, AbstractScript> {
	constructor() {
		super("AbstractScriptDependencyStore");
	}
}
