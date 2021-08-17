import AbstractScript from "helpers/AbstractScript";

/**
 * A runnable Roblox script.
 */
export default class RbxScript extends AbstractScript<LocalScript> {
	/**
	 * Returns whether the abstract script is a `RbxScript`.
	 */
	static is(obj: AbstractScript): obj is RbxScript {
		return obj.instance.IsA("LocalScript");
	}

	/**
	 * Returns the RbxScript associated with the given Roblox script.
	 */
	static getFromInstance(object: LocalScript): RbxScript | undefined {
		const rbxScript = this.fromInstance.get(object);
		return rbxScript && this.is(rbxScript) ? rbxScript : undefined;
	}

	/**
	 * Runs the executor function.
	 * @returns What the executor returned.
	 */
	async execute(): Promise<unknown> {
		return this.createExecutor()();
	}

	/**
	 * #### LocalScripts cannot be required.
	 */
	protected async executeAsDependency(): Promise<unknown> {
		throw `No require implementation (${this.identify()})`;
	}

	/**
	 * #### LocalScripts cannot be required.
	 */
	protected async executeAsDependencyUnsafe(): Promise<unknown> {
		throw `No require implementation (${this.identify()})`;
	}
}
