import { monkeyPatchStringify } from 'src';
import * as stringifyClassLib from 'src/stringify-class';

describe('monkeyPatchStringify', () => {
	// Arrange
	const originalStringify = JSON.stringify;
	afterEach(() => {
		JSON.stringify = originalStringify;
	});

	it('should patch JSON.stringify to use stringifyClass when no replacer/space', () => {
		// Arrange
		const spy = jest.spyOn(stringifyClassLib, 'stringifyClass');
		monkeyPatchStringify();
		const obj = { foo: 'bar' };
		// Act
		JSON.stringify(obj);
		// Assert
		expect(spy).toHaveBeenCalledWith(obj);
	});

	it('should fallback to original stringify if replacer or space is provided', () => {
		// Arrange
		monkeyPatchStringify();
		const obj = { foo: 'bar' };
		// Act
		const result = JSON.stringify(obj, null, 2);
		// Assert
		expect(result).toContain('\n');
	});
});
