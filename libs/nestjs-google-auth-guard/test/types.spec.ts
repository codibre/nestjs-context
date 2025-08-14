// Arrange
import { OptRequired, OptPromise } from '../src/types';
describe('types', () => {
	// Act & Assert
	it('OptRequired should require type if true', () => {
		type T = OptRequired<true, string>;
		const value: T = 'abc';
		expect(value).toBe('abc');
	});
	it('OptRequired should allow undefined if false', () => {
		type T = OptRequired<false, string>;
		const value: T = undefined;
		expect(value).toBeUndefined();
	});
	it('OptPromise should allow value or promise', async () => {
		const fn = (): OptPromise<string> => 'abc';
		const fnAsync = (): OptPromise<string> => Promise.resolve('abc');
		expect(fn()).toBe('abc');
		await expect(fnAsync()).resolves.toBe('abc');
	});
});
