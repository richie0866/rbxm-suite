import Object from "@rbxts/object-utils";
import Signal from "@rbxts/signal";

const stores: Map<string, Map<unknown, unknown>> = "__RBXM_SUITE_STORES" in getgenv()
	? getgenv().__RBXM_SUITE_STORES
	: (getgenv().__RBXM_SUITE_STORES = new Map());

/**
 * A persistent data store. Only one state per id may exist in a game instance.
 * @abstract
 */
export default abstract class Store<K extends unknown, V extends unknown> {
	/**
	 * Signal that fires when the store changes.
	 */
	readonly onChange = new Signal();

	/**
	 * The internal state of the store.
	 */
	protected state: Map<K, V>;

	/**
	 * @param id A unique identifier for the store.
	 * @param initialValue Optional initial value to create the store with, if it doesn't already exist.
	 */
	constructor(public id: string, initialValue?: Map<K, V>) {
		this.state = stores.has(id) ? (stores.get(id) as Map<K, V>) : initialValue || new Map();

		stores.set(id, this.state);
	}

	/**
	 * Returns the value associated with the given key.
	 */
	get(key: K): V | undefined {
		return this.state.get(key);
	}

	/**
	 * Saves a value to the store.
	 */
	set(key: K, value: V) {
		this.state.set(key, value);
		this.onChange.Fire();
	}

	/**
	 * Deletes a key from the store.
	 */
	delete(key: K): boolean {
		const exists = this.state.delete(key);
		this.onChange.Fire();
		return exists;
	}

	/**
	 * Clears the store.
	 */
	clear() {
		this.state.clear();
		this.onChange.Fire();
	}

	/**
	 * Checks whether the store has the key.
	 */
	has(key: K): boolean {
		return this.state.has(key);
	}

	/**
	 * Gets the current state of the store.
	 */
	getState(): Map<K, V> {
		return Object.copy(this.state);
	}

	/**
	 * Clears the store and removes it from the `stores` reference.
	 */
	destruct() {
		this.state.clear();
		stores.delete(this.id);
		this.onChange.Fire();
	}
}
