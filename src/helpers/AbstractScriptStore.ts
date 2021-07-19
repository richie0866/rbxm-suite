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
