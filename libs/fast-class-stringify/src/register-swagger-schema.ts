import { registerClassSchema } from './class-schema-register';
import { Cls } from './types';
import { generateSwaggerSchema } from './swagger-schema-generator';

/**
 * Registers a class schema for a NestJS Swagger-decorated class.
 * @param cls - The class constructor (NestJS type) to register.
 */
export function registerSwaggerSchema(cls: Cls, swaggerCls: Cls = cls): void {
	const schema = generateSwaggerSchema(swaggerCls);
	registerClassSchema(cls, schema);
}

/**
 * Registers multiple class schemas for an array of NestJS Swagger-decorated classes.
 * @param classes - Array of class constructors (NestJS types) to register.
 */
export function registerSwaggerSchemas(classes: Array<Cls | [Cls, Cls]>): void {
	for (const cls of classes) {
		if (Array.isArray(cls)) {
			registerSwaggerSchema(cls[0], cls[1]);
		} else {
			registerSwaggerSchema(cls);
		}
	}
}

function isClass(value: unknown): value is Cls {
	return typeof value === 'function';
}

/**
 * Convenient method to register a import * as object.
 * How to use:
 * ```ts
 * import * as MySchemas from './my-schemas';
 * registerSchemaRecord(MySchemas);
 * ```
 * @param clsRecord
 */
export function registerSchemaRecord(clsRecord: object): void {
	for (const key in clsRecord) {
		if (!Object.prototype.hasOwnProperty.call(clsRecord, key)) continue;
		const swaggerCls = (clsRecord as Record<string, unknown>)[key];
		if (!isClass(swaggerCls)) continue;
		try {
			const schema = generateSwaggerSchema(swaggerCls);
			registerClassSchema(swaggerCls, schema);
		} catch {
			// Just ignore error
		}
	}
}
