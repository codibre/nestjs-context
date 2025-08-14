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
	SwaggerSchemaGenerator,
} from 'src';

// Test enum (simple for type inference)
enum TestRole {
	ADMIN = 'admin',
	USER = 'user',
}

// Test nested class
class TestAddress {
	@ApiProperty({ description: 'Street address' })
	street!: string;

	@ApiProperty({ description: 'City name' })
	city!: string;

	@ApiPropertyOptional({ description: 'Country code' })
	country?: string;

	@ApiHideProperty()
	hiddenTest: number;
}

// Test main class
class TestUser {
	@ApiProperty({ description: 'User ID' })
	id!: number;

	@ApiProperty({ description: 'User name' })
	name!: string;

	@ApiProperty({ description: 'User email' })
	email!: string;

	@ApiProperty({ description: 'User role', enum: TestRole })
	role!: TestRole;

	@ApiProperty({ description: 'User age' })
	age!: number;

	@ApiProperty({ description: 'Is user active' })
	isActive!: boolean;

	@ApiProperty({ type: TestAddress })
	address!: TestAddress;

	@ApiProperty({ type: [String] })
	tags!: string[];

	@ApiPropertyOptional({ description: 'User bio' })
	bio?: string;
}

const proto = SwaggerSchemaGenerator.prototype;

describe(SwaggerSchemaGenerator.name, () => {
	let generator: SwaggerSchemaGenerator;

	beforeEach(() => {
		generator = new SwaggerSchemaGenerator();
	});

	afterEach(() => {
		generator.clearCache();
	});

	describe(proto.generateSchema.name, () => {
		it('should generate basic schema for a simple class with swagger decorators', () => {
			const schema: any = generator.generateSchema(TestAddress);

			expect(schema.type).toBe('object');
			expect(schema.properties).toBeDefined();
			expect(schema.properties?.street).toEqual({
				type: 'string',
			});
			expect(schema.properties?.city).toEqual({
				type: 'string',
			});
			expect(schema.properties?.country).toEqual({
				type: 'string',
			});
		});

		it('should generate schema for a complex class with nested objects', () => {
			const schema: any = generator.generateSchema(TestUser);

			expect(schema.type).toBe('object');
			expect(schema.properties).toBeDefined();

			// Check basic types
			expect(schema.properties?.id).toEqual({
				type: 'number',
			});
			expect(schema.properties?.name).toEqual({
				type: 'string',
			});
			expect(schema.properties?.email).toEqual({
				type: 'string',
			});
			expect(schema.properties?.age).toEqual({
				type: 'number',
			});
			expect(schema.properties?.isActive).toEqual({
				type: 'boolean',
			});

			// Check nested object
			expect(schema.properties?.address).toEqual({
				type: 'object',
				properties: {
					street: {
						type: 'string',
					},
					city: {
						type: 'string',
					},
					country: {
						type: 'string',
					},
				},
			});
		});

		it('should handle arrays correctly', () => {
			const schema: any = generator.generateSchema(TestUser);

			expect(schema.properties?.tags).toEqual({
				type: 'array',
				items: { type: 'string' },
			});
		});

		it('should handle string enum as basic string type', () => {
			const schema: any = generator.generateSchema(TestUser);

			// Since validation is removed, enum should just be treated as a string
			expect(schema.properties?.role).toEqual({
				type: 'string',
			});
		});

		it('should cache schemas to prevent infinite recursion', () => {
			const schema1: any = generator.generateSchema(TestUser);
			const schema2: any = generator.generateSchema(TestUser);

			expect(schema1).toBe(schema2);
		});

		it('should handle Date types as ISO string', () => {
			class TestWithDate {
				@ApiProperty()
				createdAt!: Date;
			}

			const schema: any = generator.generateSchema(TestWithDate);

			expect(schema.properties?.createdAt).toEqual({
				type: 'string',
				format: 'date-time',
			});
		});

		it('should throw error for circular references', () => {
			class CircularA {
				@ApiProperty({ type: () => CircularA })
				b!: any;
			}

			expect(() => {
				const result = generator.generateSchema(CircularA);
				console.log('Result:', JSON.stringify(result, null, 2));
			}).toThrow('Circular schemas not supported!');
		});
	});

	describe(`${registerSwaggerSchema.name} and ${stringifyClass.name} integration`, () => {
		it('should register a schema and enable fast stringify', () => {
			registerSwaggerSchema(TestAddress);

			const address: TestAddress = {
				street: '123 Main St',
				city: 'New York',
				country: 'US',
				hiddenTest: 123,
			};

			const result = stringifyClass(address);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual(address);
		});

		it('should work with nested objects', () => {
			registerSwaggerSchema(TestAddress);
			registerSwaggerSchema(TestUser);

			const user: TestUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				role: TestRole.USER,
				age: 30,
				isActive: true,
				address: {
					street: '123 Main St',
					city: 'New York',
					country: 'US',
					hiddenTest: 123,
				},
				tags: ['developer', 'typescript'],
				bio: 'A developer',
			};

			const result = stringifyClass(user);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual(user);
		});

		it('should handle arrays in stringification', () => {
			registerSwaggerSchema(TestUser);

			const users: TestUser[] = [
				{
					id: 1,
					name: 'John',
					email: 'john@example.com',
					role: TestRole.USER,
					age: 30,
					isActive: true,
					address: { street: '123 St', city: 'NY', hiddenTest: 123 },
					tags: ['dev'],
				},
				{
					id: 2,
					name: 'Jane',
					email: 'jane@example.com',
					role: TestRole.ADMIN,
					age: 25,
					isActive: false,
					address: { street: '456 Ave', city: 'LA', hiddenTest: 123 },
					tags: ['manager'],
				},
			];

			// Test individual object stringify
			const result1 = stringifyClass(users[0]!);
			const parsed1 = JSON.parse(result1);
			expect(parsed1).toEqual(users[0]);

			const result2 = stringifyClass(users[1]!);
			const parsed2 = JSON.parse(result2);
			expect(parsed2).toEqual(users[1]);
		});
	});

	describe(`${generateSwaggerSchema.name} utility`, () => {
		it('should generate schema using the default instance', () => {
			const schema: any = generateSwaggerSchema(TestAddress);

			expect(schema.type).toBe('object');
			expect(schema.properties).toBeDefined();
		});
	});
});

describe(SwaggerSchemaGenerator.name, () => {
	let generator: SwaggerSchemaGenerator;

	beforeEach(() => {
		generator = new SwaggerSchemaGenerator();
	});

	afterEach(() => {
		generator.clearCache();
	});

	describe(proto.generateSchema.name, () => {
		it('should generate schema for a simple class with swagger decorators', () => {
			const schema: any = generator.generateSchema(TestAddress);

			expect(schema).toEqual({
				type: 'object',
				properties: {
					street: {
						type: 'string',
					},
					city: {
						type: 'string',
					},
					country: {
						type: 'string',
					},
				},
			});
		});

		it('should generate schema for a complex class with nested objects', () => {
			const schema: any = generator.generateSchema(TestUser);

			expect(schema.type).toBe('object');
			expect(schema.properties).toBeDefined();
			expect(schema.properties?.id).toEqual({
				type: 'number',
			});
			expect(schema.properties?.name).toEqual({
				type: 'string',
			});
			expect(schema.properties?.email).toEqual({
				type: 'string',
			});
			expect(schema.properties?.role).toEqual({
				type: 'string',
			});
			expect(schema.properties?.address).toEqual({
				type: 'object',
				properties: {
					street: {
						type: 'string',
					},
					city: {
						type: 'string',
					},
					country: {
						type: 'string',
					},
				},
			});
			expect(schema.properties?.tags).toEqual({
				type: 'array',
				items: { type: 'string' },
			});
		});

		it('should handle arrays correctly', () => {
			const schema: any = generator.generateSchema(TestUser);

			expect(schema.properties?.tags).toEqual({
				type: 'array',
				items: { type: 'string' },
			});
		});

		it('should handle enums correctly', () => {
			const schema: any = generator.generateSchema(TestUser);

			expect(schema.properties?.role).toEqual({
				type: 'string',
			});
		});

		it('should handle optional properties correctly', () => {
			const schema: any = generator.generateSchema(TestUser);

			expect(schema.properties?.bio).toEqual({
				type: 'string',
			});
		});

		it('should cache schemas to prevent infinite recursion', () => {
			const schema1: any = generator.generateSchema(TestUser);
			const schema2: any = generator.generateSchema(TestUser);

			expect(schema1).toBe(schema2);
		});
	});

	describe('registerSwaggerSchema', () => {
		it('should register a schema and enable fast stringify', () => {
			registerSwaggerSchema(TestAddress);

			const address: TestAddress = {
				street: '123 Main St',
				city: 'New York',
				country: 'US',
				hiddenTest: 123,
			};

			const result = stringifyClass(address);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual(address);
		});

		it('should work with nested objects', () => {
			registerSwaggerSchema(TestAddress);
			registerSwaggerSchema(TestUser);

			const user: TestUser = {
				id: 1,
				name: 'John Doe',
				email: 'john@example.com',
				role: TestRole.USER,
				age: 30,
				isActive: true,
				address: {
					street: '123 Main St',
					city: 'New York',
					country: 'US',
					hiddenTest: 123,
				},
				tags: ['developer', 'typescript'],
				bio: 'A developer',
			};

			const result = stringifyClass(user);
			const parsed = JSON.parse(result);

			expect(parsed).toEqual(user);
		});
	});

	describe('generateSwaggerSchema utility', () => {
		it('should generate schema using the default instance', () => {
			const schema: any = generateSwaggerSchema(TestAddress);

			expect(schema.type).toBe('object');
			expect(schema.properties).toBeDefined();
		});
	});
});
