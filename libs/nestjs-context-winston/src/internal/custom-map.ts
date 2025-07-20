export class CustomMap<K, V> extends Map<K, V> {
	/**
	 * Retrieves the value associated with the specified key, or returns a default value if the key does not exist.
	 *
	 * @param key - The key to search for in the map.
	 * @param defaultValue - The value to return if the key is not found.
	 * @returns The value associated with the key, or the default value if the key does not exist.
	 */
	getOrDefault(key: K, defaultValue: () => V): V {
		let result = this.get(key);
		if (result === undefined) {
			result = defaultValue();
			this.set(key, result);
		}
		return result;
	}
}
