/**
 * Defers a task to be executed later.
 */
export function defer<T extends Callback>(task: T): Promise<ReturnType<T>> {
	return Promise.defer(async (resolve) => resolve(await task()));
}
