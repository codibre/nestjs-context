export class ExMap<K, V> extends Map<K, V> {
	getOrSet(key: K, create: () => V): V {
		let value = this.get(key);
		if (value === undefined) {
			value = create();
			this.set(key, value);
		}
		return value;
	}
}
