import {
	registerSwaggerSchema,
	registerSwaggerSchemas,
	getClassStringify,
	registerSchemaRecord,
} from 'src';

describe('register-swagger-schema', () => {
	// Arrange
	class Dummy {}
	class Dummy2 {}
	beforeEach(() => {
		// Clear registry by re-registering with a unique class
		registerSwaggerSchema(Dummy);
		registerSwaggerSchema(Dummy2);
	});

	it('registerSwaggerSchema registers a class', () => {
		// Act
		registerSwaggerSchema(Dummy);
		// Assert
		expect(typeof getClassStringify(Dummy)).toBe('function');
	});

	it('registerSwaggerSchemas registers multiple classes', () => {
		// Act
		registerSwaggerSchemas([Dummy, Dummy2]);
		// Assert
		expect(typeof getClassStringify(Dummy)).toBe('function');
		expect(typeof getClassStringify(Dummy2)).toBe('function');
	});
});

describe('registerSchemaRecord', () => {
	// Arrange
	class A {}
	class B {}
	const record = { A, B };

	it('registers all classes in a record', () => {
		// Act
		registerSchemaRecord(record);
		// Assert
		// Use the public API
		expect(typeof getClassStringify(A)).toBe('function');
		expect(typeof getClassStringify(B)).toBe('function');
	});

	it('ignores falsy values in the record', () => {
		const badRecord = { A, B: undefined };
		registerSchemaRecord(badRecord as any);
		expect(typeof getClassStringify(A)).toBe('function');
		expect(getClassStringify(undefined as any)).toBeUndefined();
	});

	class C {}
	class D {}
	it('registers [Cls, Cls] tuple', () => {
		// Act
		registerSwaggerSchemas([[C, D]]);
		// Assert
		expect(typeof getClassStringify(C)).toBe('function');
		expect(getClassStringify(D)).toBeUndefined();
	});
});
