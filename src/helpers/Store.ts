import Object from "@rbxts/object-utils";

const stores: Map<string, Map<unknown, unknown>> = "__RBXM_SUITE_STORES" in getgenv()
	? getgenv().__RBXM_SUITE_STORES
	: (getgenv().__RBXM_SUITE_STORES = new Map());

/**
 * A persistent data store. Only creates one state per game instance.
 * @abstract
 */
export default abstract class Store<K extends unknown, V extends unknown> {
	/** The internal state of the store. */
	protected state: Map<K, V>;

	constructor(
		/** A global identifier for the store. */
		public id: string,
	) {
		this.state = stores.has(id) ? (stores.get(id) as Map<K, V>) : new Map();

		stores.set(id, this.state);
	}

	/** Returns the value associated with the given key. */
	get(key: K): V | undefined {
		return this.state.get(key);
	}

	/** Saves a value to the store. */
	set(key: K, value: V) {
		this.state.set(key, value);
	}

	/** Deletes a key from the store. */
	delete(key: K): boolean {
		return this.state.delete(key);
	}

	/** Checks whether the store has the key. */
	has(key: K): boolean {
		return this.state.has(key);
	}

	/** Gets the current state of the store. */
	getState(): Map<K, V> {
		return Object.copy(this.state);
	}

	/** Clears the store. */
	clear() {
		this.state.clear();
	}

	/** Clears the store and removes it from the `stores` reference. */
	destruct() {
		this.state.clear();
		stores.delete(this.id);
	}
}
