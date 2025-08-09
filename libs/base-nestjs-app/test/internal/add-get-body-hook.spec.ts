import { addGetBodyHook } from '../../src/internal/add-get-body-hook';

describe('addGetBodyHook', () => {
	it('should be a function', () => {
		expect(typeof addGetBodyHook).toBe('function');
	});

	it('should add hook if allowGetBody is true', async () => {
		const addHook = jest.fn();
		const adapter = { getInstance: () => ({ addHook }) } as any;
		const options = { allowGetBody: true };
		addGetBodyHook(options as any, adapter);
		expect(addHook).toHaveBeenCalledWith('onRequest', expect.any(Function));
		// Simulate Fastify calling the hook with a GET request
		const hookFn = addHook.mock.calls[0][1];
		const request = { method: 'GET', body: Promise.resolve('body') };
		await hookFn(request);
		// If request.method is not GET, body should not be awaited
		const notGetRequest = { method: 'POST', body: Promise.resolve('body') };
		await hookFn(notGetRequest);
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
