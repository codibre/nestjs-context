import {
	registerSwaggerSchema,
	registerSwaggerSchemas,
	getClassStringify,
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
