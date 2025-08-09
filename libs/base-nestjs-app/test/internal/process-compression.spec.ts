import { processCompression } from '../../src/internal/process-compression';

describe('processCompression', () => {
	it('should be a function', () => {
		expect(typeof processCompression).toBe('function');
	});

	it('should return early if compression is undefined or none', async () => {
		const adapter = { register: jest.fn() };
		await processCompression(adapter as any, undefined);
		await processCompression(adapter as any, { compression: 'none' } as any);
		expect(adapter.register).not.toHaveBeenCalled();
	});

	it('should register min compression', async () => {
		const adapter = { register: jest.fn() };
		jest.mock('@fastify/compress', () => ({ fastifyCompress: jest.fn() }), {
			virtual: true,
		});
		await processCompression(adapter as any, { compression: 'min' } as any);
		expect(adapter.register).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ zlibOptions: { level: 2 } }),
		);
	});

	it('should register average compression', async () => {
		const adapter = { register: jest.fn() };
		jest.mock('@fastify/compress', () => ({ fastifyCompress: jest.fn() }), {
			virtual: true,
		});
		await processCompression(adapter as any, { compression: 'average' } as any);
		expect(adapter.register).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ zlibOptions: { level: 6 } }),
		);
	});

	it('should register max compression', async () => {
		const adapter = { register: jest.fn() };
		jest.mock('@fastify/compress', () => ({ fastifyCompress: jest.fn() }), {
			virtual: true,
		});
		await processCompression(adapter as any, { compression: 'max' } as any);
		expect(adapter.register).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ zlibOptions: { level: 9 } }),
		);
	});

	it('should throw error for unknown compression option', async () => {
		const adapter = { register: jest.fn() };
		await expect(
			processCompression(adapter as any, { compression: 'invalid' } as any),
		).rejects.toThrow('Unknown compression option: invalid');
	});
});
