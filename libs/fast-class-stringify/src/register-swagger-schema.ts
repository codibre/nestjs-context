import { Type } from '@nestjs/common';
import { registerClassSchema, Cls } from './class-schema-register';
import { generateSwaggerSchema } from './swagger-schema-generator';

/**
 * Registers a class schema for a NestJS Swagger-decorated class.
 * @param cls - The class constructor (NestJS type) to register.
 */
export function registerSwaggerSchema(cls: Type<unknown>): void {
	const schema = generateSwaggerSchema(cls);
	registerClassSchema(cls as Cls, schema);
}

/**
 * Registers multiple class schemas for an array of NestJS Swagger-decorated classes.
 * @param classes - Array of class constructors (NestJS types) to register.
 */
export function registerSwaggerSchemas(classes: Type<unknown>[]): void {
	for (const cls of classes) {
		registerSwaggerSchema(cls);
	}
}
