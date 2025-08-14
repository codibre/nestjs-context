import { stringifyClass } from './stringify-class';

/**
 * Monkey-patches the global JSON.stringify method to use `stringifyClass` for objects/classes
 * registered with this library, unless a replacer or space argument is provided.
 * Falls back to the original JSON.stringify for all other cases.
 */
export function monkeyPatchStringify() {
	const originalStringify = JSON.stringify.bind(JSON);
	Object.assign(JSON, {
		stringify: (...args: Parameters<typeof JSON.stringify>) => {
			const [value, replacer, space] = args;
			if (replacer !== undefined || space !== undefined) {
				return originalStringify(value, replacer, space);
			}
			return stringifyClass(value);
		},
	});
}
