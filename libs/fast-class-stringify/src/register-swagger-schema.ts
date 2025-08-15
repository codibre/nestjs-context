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
