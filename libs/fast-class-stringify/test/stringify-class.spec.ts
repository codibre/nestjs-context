import { stringifyClass, registerClassSchema } from 'src';

describe('stringifyClass', () => {
	// Arrange
	class Dummy {
		foo = 'bar';
		bar = 1;
	}
	const schema = {
		type: 'object',
		properties: {
			foo: { type: 'string' },
			bar: { type: 'number' },
		},
	};

	it('returns vanilla JSON.stringify for unregistered class', () => {
		// Act
		const result = stringifyClass(new Dummy());
		// Assert
		expect(result).toContain('foo');
		expect(result).toContain('bar');
	});

	it('uses registered schema for class', () => {
		// Arrange
		registerClassSchema(Dummy, schema as any);
		const instance = new Dummy();
		// Act
		const result = stringifyClass(instance);
		// Assert
		expect(result).toContain('bar');
		expect(result).toContain('foo');
	});

	it('stringifies array using registered schema', () => {
		// Arrange
		registerClassSchema(Dummy, schema as any);
		const arr = [new Dummy(), new Dummy()];
		// Act
		const result = stringifyClass(arr);
		// Assert
		expect(result.startsWith('[')).toBe(true);
		expect(result).toContain('foo');
	});

	it('stringifies empty array as []', () => {
		// Act
		const result = stringifyClass([]);
		// Assert
		expect(result).toBe('[]');
	});
});
