import {
	getArrayClassStringify,
	getClassStringify as getClassStringify,
} from './class-schema-register';
import { Cls } from './types';

const vanillaStringify = JSON.stringify.bind(JSON);

function stringifyArray(
	instances: Array<InstanceType<Cls>>,
	cls?: Cls,
): string {
	if (instances.length === 0) return '[]';
	cls ??= instances[0]?.constructor as Cls | undefined;
	if (!cls) return vanillaStringify(instances);
	const stringify = getArrayClassStringify(cls) ?? vanillaStringify;
	return stringify(instances);
}

/**
 * Stringifies a class instance or array of class instances using a registered fast-json-stringify schema.
 * Falls back to vanilla JSON.stringify if no schema is registered.
 * @param instance - The class instance or array of instances to stringify.
 * @returns The JSON string representation.
 */
export function stringifyClass(
	instance: InstanceType<Cls> | Array<InstanceType<Cls>>,
): string {
	if (Array.isArray(instance)) return stringifyArray(instance);
	if (!instance || typeof instance !== 'object') {
		return vanillaStringify(instance);
	}
	const stringify =
		getClassStringify(instance.constructor as Cls) ?? vanillaStringify;
	return stringify(instance);
}
