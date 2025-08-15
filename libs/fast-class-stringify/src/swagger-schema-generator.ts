import 'reflect-metadata';
import { Type } from '@nestjs/common';
import {
	AnySchema,
	ArraySchema,
	BooleanSchema,
	NumberSchema,
	ObjectSchema,
	StringSchema,
} from 'fast-json-stringify';
import { Cls } from './types';
import { ExMap } from './internal';

// Constants from @nestjs/swagger
const DECORATORS = {
	API_MODEL_PROPERTIES: 'swagger/apiModelProperties',
	API_MODEL_PROPERTIES_ARRAY: 'swagger/apiModelPropertiesArray',
	API_PROPERTY: 'swagger/apiModelProperties',
	API_RESPONSE: 'swagger/apiResponse',
	API_HIDE_PROPERTY: 'swagger/apiHideProperty',
} as const;

type TypeFunc = () => Type<Cls> | string;

interface ApiPropertyMetadata {
	type?: Type<unknown> | TypeFunc | [TypeFunc] | string;
	isArray?: boolean;
	format?: string;
	allOf?: unknown[];
	oneOf?: unknown[];
	anyOf?: unknown[];
	not?: unknown;
	discriminator?: unknown;
	externalDocs?: unknown;
	additionalProperties?: boolean | Record<string, unknown>;
	default?: unknown;
	title?: string;
}

interface PropertySchema extends ApiPropertyMetadata {
	name: string;
	designType?: unknown;
}

type SwaggerPluginType = Record<string, PropertySchema>;

function isTypeFunc(type: unknown): type is TypeFunc {
	return typeof type === 'function';
}

/**
 * Generates a fast-json-stringify schema from NestJS Swagger decorators
 */
export class SwaggerSchemaGenerator {
	private schemaCache = new Map<Type<unknown>, AnySchema>();
	private processingStack = new Set<Type<unknown>>();

	/**
	 * Generate JSON schema from a class decorated with @nestjs/swagger decorators
	 */
	generateSchema(target: Cls): AnySchema {
		if (this.schemaCache.has(target)) {
			const cachedSchema = this.schemaCache.get(target);
			if (cachedSchema) {
				return cachedSchema;
			}
		}

		// Prevent circular references
		if (this.processingStack.has(target)) {
			throw new Error('Circular schemas not supported!');
		}

		this.processingStack.add(target);

		try {
			const schema = this.buildClassSchema(target);
			this.schemaCache.set(target, schema);
			return schema;
		} finally {
			this.processingStack.delete(target);
		}
	}

	/**
	 * Clear the schema cache
	 */
	clearCache(): void {
		this.schemaCache.clear();
	}

	private buildClassSchema(target: Cls): AnySchema {
		const properties = this.getClassProperties(target);
		const schemaProperties: ObjectSchema['properties'] = {};

		for (const property of properties) {
			const propertySchema = this.buildPropertySchema(property);
			if (propertySchema) {
				schemaProperties[property.name] = propertySchema;
			}
		}

		const schema: ObjectSchema = {
			type: 'object',
			properties: schemaProperties,
		};

		return schema;
	}

	private getClassProperties(target: Cls): PropertySchema[] {
		const properties: PropertySchema[] = [];
		const seen = new Set<string>();
		let current: Cls & { _OPENAPI_METADATA_FACTORY?: () => SwaggerPluginType } =
			target;

		while (current && current.prototype && current !== Object) {
			// 1. Collect property keys from swagger metadata (legacy/decorator-based)
			const propertyKeys = this.getPropertyKeys(current);
			for (const propertyKey of propertyKeys) {
				if (!seen.has(propertyKey)) {
					const metadata = this.getPropertyMetadata(current, propertyKey);
					const designType = Reflect.getMetadata(
						'design:type',
						current.prototype,
						propertyKey,
					);
					properties.push({
						name: propertyKey,
						designType,
						...metadata,
					});
					seen.add(propertyKey);
				}
			}

			// 2. Collect property keys from _OPENAPI_METADATA_FACTORY if present
			if (typeof current._OPENAPI_METADATA_FACTORY === 'function') {
				const factoryProps = current._OPENAPI_METADATA_FACTORY();
				for (const [key, meta] of Object.entries(factoryProps)) {
					if (!seen.has(key)) {
						const designType = Reflect.getMetadata(
							'design:type',
							current.prototype,
							key,
						);
						const resolvedMeta = { ...meta };
						if (isTypeFunc(resolvedMeta.type)) {
							const typeResult = resolvedMeta.type();
							if (Array.isArray(typeResult)) {
								resolvedMeta.type = typeResult[0];
								resolvedMeta.isArray = true;
							} else {
								resolvedMeta.type = typeResult;
							}
						}
						properties.push({
							designType,
							...resolvedMeta,
							name: key,
						});
						seen.add(key);
					}
				}
			}

			current = Object.getPrototypeOf(current);
		}

		return properties;
	}

	private getPropertyKeys(target: Type<unknown>): string[] {
		const keys: string[] = [];
		let proto = target.prototype;

		// Get from API_MODEL_PROPERTIES_ARRAY metadata for all prototypes in the chain
		while (proto && proto !== Object.prototype) {
			const propertyArray =
				Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES_ARRAY, proto) || [];

			for (const key of propertyArray) {
				const cleanKey =
					typeof key === 'string' && key.startsWith(':') ? key.slice(1) : key;
				if (cleanKey && !keys.includes(cleanKey)) {
					keys.push(cleanKey);
				}
			}

			// Add all own property names from the prototype (excluding constructor)
			for (const key of Object.getOwnPropertyNames(proto)) {
				if (key !== 'constructor' && !keys.includes(key)) {
					keys.push(key);
				}
			}

			proto = Object.getPrototypeOf(proto);
		}

		return keys;
	}

	private getPropertyMetadata(
		target: Type<unknown>,
		propertyKey: string,
	): ApiPropertyMetadata {
		const metadata = Reflect.getMetadata(
			DECORATORS.API_PROPERTY,
			target.prototype,
			propertyKey,
		);
		return metadata ? (metadata as ApiPropertyMetadata) : {};
	}

	private buildPropertySchema(property: PropertySchema): AnySchema | null {
		const { type, isArray, designType, ...metadata } = property;

		// Determine the actual type to process
		let actualType = type || designType;

		// Handle function types (like () => SomeClass) - commonly used for circular references
		if (typeof actualType === 'function' && actualType.length === 0) {
			try {
				const resolvedType = (actualType as () => unknown)();
				actualType = resolvedType;
			} catch {
				// If function call fails, use the function itself
			}
		}

		if (!actualType) return null; // Ignore property if type cannot be resolved

		let baseSchema = this.buildTypeSchema(actualType, metadata);

		// Handle arrays
		if (isArray || this.isArrayType(actualType)) {
			const itemType = this.extractArrayItemType(actualType);
			const itemSchema = itemType
				? this.buildTypeSchema(itemType, {})
				: baseSchema;

			const schema: ArraySchema = {
				type: 'array',
				items: itemSchema,
			};

			baseSchema = schema;
		}

		// Apply common metadata
		this.applyCommonMetadata(baseSchema, metadata);

		return baseSchema;
	}

	private buildTypeSchema(
		type: unknown,
		metadata: ApiPropertyMetadata,
	): AnySchema {
		// Handle primitive types
		if (type === String || type === 'string') {
			const schema: StringSchema = { type: 'string' };
			return schema;
		}

		if (type === Number || type === 'number') {
			const schema: NumberSchema = { type: 'number' };
			return schema;
		}

		if (type === Boolean || type === 'boolean') {
			const schema: BooleanSchema = { type: 'boolean' };
			return schema;
		}

		if (type === Array || type === 'array') {
			const schema: ArraySchema = { type: 'array', items: {} };
			return schema;
		}

		if (type === Date) {
			const schema: StringSchema = {
				type: 'string',
				format: metadata.format || 'date-time',
			};
			return schema;
		}

		// Handle object types (classes) - this is the key fix!
		if (typeof type === 'function' && type.prototype) {
			// Check if it's an enum
			if (this.isEnum(type)) {
				const schema: StringSchema = { type: 'string' };
				return schema;
			}

			// Recursively build schema for nested classes
			return this.generateSchema(type as Cls);
		}

		// Default fallback
		const schema: ObjectSchema = { type: 'object', additionalProperties: true };
		return schema;
	}

	private applyCommonMetadata(
		schema: AnySchema,
		metadata: ApiPropertyMetadata,
	): void {
		if (metadata.default !== undefined) schema.default = metadata.default;
		if (metadata.title) schema.title = metadata.title;
	}

	private isArrayType(type: unknown): boolean {
		return (
			Array.isArray(type) ||
			(typeof type === 'function' && type.name === 'Array')
		);
	}

	private extractArrayItemType(type: unknown): unknown {
		if (Array.isArray(type) && type.length === 1) {
			return type[0];
		}
		return undefined;
	}

	private isEnum(type: unknown): boolean {
		if (typeof type !== 'object' || type === null) return false;

		const values = Object.values(type as Record<string, unknown>);
		const keys = Object.keys(type as Record<string, unknown>);

		// Check if it looks like an enum (string keys mapping to primitive values)
		return (
			values.every(
				(value) => typeof value === 'string' || typeof value === 'number',
			) && keys.length > 0
		);
	}
}

/**
 * Default instance of the schema generator
 */
const swaggerSchemaGenerator = new SwaggerSchemaGenerator();

const schemasMemo = new ExMap<Cls, AnySchema>();

/**
 * Generates a fast-json-stringify schema from a NestJS Swagger-decorated class.
 * @param target - The class constructor (NestJS type) to generate the schema for.
 * @returns The generated fast-json-stringify schema.
 */
export function generateSwaggerSchema(target: Cls): AnySchema {
	return schemasMemo.getOrSet(target, () =>
		swaggerSchemaGenerator.generateSchema(target),
	);
}
