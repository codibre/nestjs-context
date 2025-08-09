jest.mock('@nestjs/platform-fastify', () => {
	return {
		FastifyAdapter: jest.fn().mockImplementation(function (opts) {
			this._opts = opts;
		}),
	};
});

import { getAdapter } from '../../src/internal/get-adapter';

describe('getAdapter', () => {
	const { FastifyAdapter } = require('@nestjs/platform-fastify');

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be a function', () => {
		expect(typeof getAdapter).toBe('function');
	});

	it('should construct FastifyAdapter with default values when options are not provided', () => {
		getAdapter();
		expect(FastifyAdapter).toHaveBeenCalledWith({
			http2: false,
			maxParamLength: 65 * 1024,
			bodyLimit: 50 * 1024 * 1024,
		});
	});

	it('should construct FastifyAdapter with custom values from options', () => {
		getAdapter({
			http2: true,
			maxParamLengthKb: 10,
			bodyLimitMb: 1,
		});
		expect(FastifyAdapter).toHaveBeenCalledWith({
			http2: true,
			maxParamLength: 10 * 1024,
			bodyLimit: 1 * 1024 * 1024,
		});
	});
});
