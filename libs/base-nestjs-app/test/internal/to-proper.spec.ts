import { toProperCase } from '../../src/internal/to-proper';

describe('toProperCase', () => {
	it('should be a function', () => {
		expect(typeof toProperCase).toBe('function');
	});

	it('should capitalize the first letter of a string', () => {
		expect(toProperCase('hello')).toBe('Hello');
		expect(toProperCase('world')).toBe('World');
	});

	it('should handle single character strings', () => {
		expect(toProperCase('a')).toBe('A');
		expect(toProperCase('z')).toBe('Z');
	});

	it('should handle empty strings', () => {
		expect(toProperCase('')).toBe('');
	});

	it('should preserve the rest of the string', () => {
		expect(toProperCase('hello world')).toBe('Hello world');
		expect(toProperCase('testString')).toBe('TestString');
	});

	it('should handle strings that are already capitalized', () => {
		expect(toProperCase('Hello')).toBe('Hello');
		expect(toProperCase('WORLD')).toBe('WORLD');
	});
});
