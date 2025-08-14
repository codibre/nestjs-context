import build, { AnySchema } from 'fast-json-stringify';

export type Cls = new () => object;

type Stringify = (c: unknown) => string;
const schemaRegistry = new Map<Cls, Stringify>();
const arraySchemaRegistry = new Map<Cls, Stringify>();

/**
 * Registers a class and its schema for fast serialization.
 * Also registers an array schema for the same class.
 * @param cls - The class constructor to register.
 * @param schema - The fast-json-stringify schema for the class.
 */
export function registerClassSchema(cls: Cls, schema: AnySchema) {
	schemaRegistry.set(cls, build(schema));
	arraySchemaRegistry.set(
		cls,
		build({
			type: 'array',
			items: schema,
		}),
	);
}

/**
 * Gets the stringifier function for a registered class.
 * @param cls - The class constructor.
 * @returns The stringifier function, or undefined if not registered.
 */
export function getClassStringify(cls: Cls): Stringify | undefined {
	return schemaRegistry.get(cls);
}

/**
 * Gets the stringifier function for an array of a registered class.
 * @param cls - The class constructor.
 * @returns The stringifier function for arrays, or undefined if not registered.
 */
export function getArrayClassStringify(cls: Cls): Stringify | undefined {
	return arraySchemaRegistry.get(cls);
}
