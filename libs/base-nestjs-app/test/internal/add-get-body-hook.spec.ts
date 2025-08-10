import { addGetBodyHook } from '../../src/internal/add-get-body-hook';

describe('addGetBodyHook', () => {
	it('should be a function', () => {
		expect(typeof addGetBodyHook).toBe('function');
	});

	it('should call addHttpMethod with GET and hasBody:true if allowGetBody is true', () => {
		// Arrange
		const addHttpMethod = jest.fn();
		const instance = { addHttpMethod } as any;
		const options = { allowGetBody: true };

		// Act
		addGetBodyHook(instance, options);

		// Assert
		expect(addHttpMethod).toHaveBeenCalledWith('GET', { hasBody: true });
	});

	it('should not call addHttpMethod if allowGetBody is false', () => {
		// Arrange
		const addHttpMethod = jest.fn();
		const instance = { addHttpMethod } as any;
		const options = { allowGetBody: false };

		// Act
		addGetBodyHook(instance, options);

		// Assert
		expect(addHttpMethod).not.toHaveBeenCalled();
	});

	it('should not call addHttpMethod if allowGetBody is undefined', () => {
		// Arrange
		const addHttpMethod = jest.fn();
		const instance = { addHttpMethod } as any;
		const options = {};

		// Act
		addGetBodyHook(instance, options);

		// Assert
		expect(addHttpMethod).not.toHaveBeenCalled();
	});
});
