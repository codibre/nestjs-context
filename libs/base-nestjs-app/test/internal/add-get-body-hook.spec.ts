import { addGetBodyHook } from '../../src/internal/add-get-body-hook';

describe('addGetBodyHook', () => {
	it('should be a function', () => {
		expect(typeof addGetBodyHook).toBe('function');
	});

	it('should call addHttpMethod with GET and hasBody:true if allowGetBody is true', () => {
		// Arrange
		const addHttpMethod = jest.fn();
		const adapter = { getInstance: () => ({ addHttpMethod }) } as any;
		const options = { allowGetBody: true };

		// Act
		addGetBodyHook(adapter, options);

		// Assert
		expect(addHttpMethod).toHaveBeenCalledWith('GET', { hasBody: true });
	});

	it('should not add hook if allowGetBody is false', () => {
		const addHook = jest.fn();
		const adapter = { getInstance: () => ({ addHook }) } as any;
		const options = { allowGetBody: false };
		addGetBodyHook(options as any, adapter);
		expect(addHook).not.toHaveBeenCalled();
	});

	it('should not add hook if allowGetBody is undefined', () => {
		const addHook = jest.fn();
		const adapter = { getInstance: () => ({ addHook }) } as any;
		const options = {};
		addGetBodyHook(options as any, adapter);
		expect(addHook).not.toHaveBeenCalled();
	});
});
