import Store from "./Store";
import { fs } from "api";
import { HttpService } from "@rbxts/services";

type JsonPrimitive = string | number | boolean | Map<string, JsonPrimitive>;

/**
 * Thread-safe JSON file modification.
 */
export default class JsonStore<T extends JsonPrimitive = JsonPrimitive> extends Store<string, T> {
	/**
	 * @param path A path to the JSON file.
	 */
	constructor(public path: string) {
		assert(fs.isFile(path), `File at '${path}' must be a JSON file`);

		super(fs.trimSlashes(fs.normalize(path)), HttpService.JSONDecode(fs.readFile(path)));

		this.onChange.Connect(() => this.sync());
	}

	/**
	 * Stores the current state to the JSON file.
	 */
	sync() {
		fs.writeFile(this.path, HttpService.JSONEncode(this.state));
	}

	/**
	 * Reverts the state state to the JSON file.
	 */
	revert() {
		const newState = HttpService.JSONDecode<Map<string, T>>(fs.readFile(this.path));
		this.state.clear();
		newState.forEach((value, key) => this.state.set(key, value));
	}
}
