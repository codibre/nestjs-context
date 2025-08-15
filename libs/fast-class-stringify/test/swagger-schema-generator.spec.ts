import 'reflect-metadata';
import {
	ApiHideProperty,
	ApiProperty,
	ApiPropertyOptional,
} from '@nestjs/swagger';
import {
	generateSwaggerSchema,
	registerSwaggerSchema,
	stringifyClass,
} from 'src';

describe('generateSwaggerSchema', () => {
	it('generates schema from static _OPENAPI_METADATA_FACTORY', () => {
		class StaticPluginClass {
			static _OPENAPI_METADATA_FACTORY() {
				return {
					foo: { type: () => String, description: 'Foo property' },
					bar: { type: () => Number, description: 'Bar property' },
				};
			}
		}
		const schema: any = generateSwaggerSchema(StaticPluginClass);
		expect(schema.type).toBe('object');
		expect(schema.properties.foo).toEqual({
			type: 'string',
		});
		expect(schema.properties.bar).toEqual({
			type: 'number',
		});
	});

	it('handles missing _OPENAPI_METADATA_FACTORY gracefully', () => {
		class NoFactory {}
		const schema: any = generateSwaggerSchema(NoFactory);
		expect(schema.type).toBe('object');
		expect(schema.properties).toEqual({});
	});

	it('merges properties from base and child classes (manual merge)', () => {
		class Base {
			static _OPENAPI_METADATA_FACTORY() {
				return { baseProp: { type: () => String } };
			}
		}
		class Child {
			static _OPENAPI_METADATA_FACTORY() {
				return {
					...Base._OPENAPI_METADATA_FACTORY(),
					childProp: { type: () => Number },
				};
			}
		}
		const schema: any = generateSwaggerSchema(Child);
		expect(schema.type).toBe('object');
		expect(schema.properties.baseProp).toEqual({ type: 'string' });
		expect(schema.properties.childProp).toEqual({ type: 'number' });
	});

	it('generates schema for class with swagger decorators', () => {
		class Address {
			@ApiProperty() street!: string;
			@ApiProperty() city!: string;
			@ApiPropertyOptional() country?: string;
			@ApiHideProperty() hidden!: number;
		}
		const schema: any = generateSwaggerSchema(Address);
		expect(schema.type).toBe('object');
		expect(schema.properties.street).toEqual({ type: 'string' });
		expect(schema.properties.city).toEqual({ type: 'string' });
		expect(schema.properties.country).toEqual({ type: 'string' });
		expect(schema.properties.hidden).toBeUndefined();
	});

	it('handles arrays and enums', () => {
		enum Role {
			ADMIN = 'admin',
			USER = 'user',
		}
		class User {
			@ApiProperty() id!: number;
			@ApiProperty({ enum: Role }) role!: Role;
			@ApiProperty({ type: [String] }) tags!: string[];
		}
		const schema: any = generateSwaggerSchema(User);
		expect(schema.properties.id).toEqual({ type: 'number' });
		expect(schema.properties.role).toEqual({ type: 'string' });
		expect(schema.properties.tags).toEqual({
			type: 'array',
			items: { type: 'string' },
		});
	});

	it('handles nested objects', () => {
		class Address {
			@ApiProperty() street!: string;
		}
		class User {
			@ApiProperty({ type: Address }) address!: Address;
		}
		const schema: any = generateSwaggerSchema(User);
		expect(schema.properties.address).toEqual({
			type: 'object',
			properties: { street: { type: 'string' } },
		});
	});

	it('handles optional properties', () => {
		class User {
			@ApiPropertyOptional() bio?: string;
		}
		const schema: any = generateSwaggerSchema(User);
		expect(schema.properties.bio).toEqual({ type: 'string' });
	});

	it('handles Date types as ISO string', () => {
		class WithDate {
			@ApiProperty() createdAt!: Date;
		}
		const schema: any = generateSwaggerSchema(WithDate);
		expect(schema.properties.createdAt).toEqual({
			type: 'string',
			format: 'date-time',
		});
	});

	it('throws error for circular references', () => {
		class Circular {
			@ApiProperty({ type: () => Circular }) b!: any;
		}
		expect(() => generateSwaggerSchema(Circular)).toThrow(
			'Circular schemas not supported!',
		);
	});

	it('handles static plugin with array type (covers Array.isArray(typeResult))', () => {
		class ArrayStaticPlugin {
			static _OPENAPI_METADATA_FACTORY() {
				return {
					arr: { type: () => [String] },
				};
			}
		}
		const schema: any = generateSwaggerSchema(ArrayStaticPlugin);
		expect(schema.properties.arr).toEqual({
			type: 'array',
			items: { type: 'string' },
		});
	});

	it('handles @ApiProperty({ type: Array }) (covers buildTypeSchema Array branch)', () => {
		class WithArrayType {
			@ApiProperty({ type: Array }) arr!: any[];
		}
		const schema: any = generateSwaggerSchema(WithArrayType);
		expect(schema.properties.arr).toEqual({
			type: 'array',
			items: { type: 'array', items: {} },
		});
	});

	it('handles @ApiProperty({ type: Boolean }) (covers buildTypeSchema Boolean branch)', () => {
		class WithBooleanType {
			@ApiProperty({ type: Boolean }) flag!: boolean;
		}
		const schema: any = generateSwaggerSchema(WithBooleanType);
		expect(schema.properties.flag).toEqual({ type: 'boolean' });
	});

	it('handles @ApiProperty({ type: [Number] }) (covers extractArrayItemType branch)', () => {
		class WithTypedArray {
			@ApiProperty({ type: [Number] }) nums!: number[];
		}
		const schema: any = generateSwaggerSchema(WithTypedArray);
		expect(schema.properties.nums).toEqual({
			type: 'array',
			items: { type: 'number' },
		});
	});
});

describe('registerSwaggerSchema & stringifyClass integration', () => {
	it('registers a schema and stringifies an object', () => {
		class Address {
			@ApiProperty() street!: string;
			@ApiProperty() city!: string;
		}
		registerSwaggerSchema(Address);
		const address = { street: 'Main', city: 'NY' };
		const result = stringifyClass(address);
		expect(JSON.parse(result)).toEqual(address);
	});

	it('works with nested objects', () => {
		class Address {
			@ApiProperty() street!: string;
		}
		class User {
			@ApiProperty() name!: string;
			@ApiProperty({ type: Address }) address!: Address;
		}
		registerSwaggerSchema(Address);
		registerSwaggerSchema(User);
		const user = { name: 'John', address: { street: 'Main' } };
		const result = stringifyClass(user);
		expect(JSON.parse(result)).toEqual(user);
	});

	it('handles arrays', () => {
		class User {
			@ApiProperty() name!: string;
		}
		registerSwaggerSchema(User);
		const users = [{ name: 'A' }, { name: 'B' }];
		const result = stringifyClass(users[0]!);
		expect(JSON.parse(result)).toEqual(users[0]);
	});

	it('falls back to object schema for unknown type', () => {
		class WithUnknownType {
			// @ts-ignore
			@ApiProperty({ type: Symbol }) weird!: any;
		}
		const schema: any = generateSwaggerSchema(WithUnknownType);
		expect(schema.properties.weird).toEqual({
			type: 'object',
			additionalProperties: true,
		});
	});
});
