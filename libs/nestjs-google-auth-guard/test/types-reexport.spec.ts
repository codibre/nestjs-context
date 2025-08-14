// Arrange
import * as index from '../src';
describe('types re-export', () => {
	// Act & Assert
	it('should export OptRequired and OptPromise from types', () => {
		// These types are not available at runtime, so this is a type-only test
		type T1 = index.OptRequired<true, string>;
		type T2 = index.OptPromise<string>;
		const value: T1 = 'abc';
		expect(value).toBe('abc');
		const fn = (): T2 => 'abc';
		expect(fn()).toBe('abc');
	});
});
