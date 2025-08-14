import { ObjectSchema } from 'fast-json-stringify';
import {
	Cls,
	registerClassSchema,
	getClassStringify,
	getArrayClassStringify,
} from 'src';

// Dummy schema for testing
const dummySchema: ObjectSchema = {
	type: 'object',
	properties: {
		foo: { type: 'string' },
		bar: { type: 'number' },
	},
};

class DummyClass {
	foo = 'hello';
	bar = 42;
}

describe('class-schema-register', () => {
	// Arrange
	const cls: Cls = DummyClass;

	it('registers and retrieves class schema stringify', () => {
		// Act
		registerClassSchema(cls, dummySchema);
		const stringify = getClassStringify(cls);
		// Assert
		expect(typeof stringify).toBe('function');
		expect(stringify!({ foo: 'test', bar: 1 })).toContain('test');
	});

	it('registers and retrieves array class schema stringify', () => {
		// Act
		registerClassSchema(cls, dummySchema);
		const arrStringify = getArrayClassStringify(cls);
		// Assert
		expect(typeof arrStringify).toBe('function');
		expect(arrStringify!([{ foo: 'a', bar: 2 }])).toContain('a');
	});

	it('returns undefined for unregistered class', () => {
		// Arrange
		class Unregistered {}
		// Act & Assert
		expect(getClassStringify(Unregistered)).toBeUndefined();
		expect(getArrayClassStringify(Unregistered)).toBeUndefined();
	});
});
