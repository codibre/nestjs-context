jest.mock('@nestjs/platform-fastify', () => {
	return {
		FastifyAdapter: jest.fn().mockImplementation(function (opts) {
			this._opts = opts;
			this.getInstance = jest.fn().mockReturnValue({
				removeContentTypeParser: jest.fn(),
				addContentTypeParser: jest.fn(),
				initialConfig: {
					onProtoPoisoning: 'error',
					onConstructorPoisoning: 'error',
				},
			});
		}),
	};
});

jest.mock('../../src/internal/add-get-body-hook', () => ({
	addGetBodyHook: jest.fn(),
}));

jest.mock('../../src/internal/permissive-json-parser', () => ({
	permissiveJsonParserFactory: jest.fn().mockReturnValue('mockParserFunction'),
}));

import { getAdapter } from '../../src/internal/get-adapter';

describe('getAdapter', () => {
	const { FastifyAdapter } = require('@nestjs/platform-fastify');
	const { addGetBodyHook } = require('../../src/internal/add-get-body-hook');
	const {
		permissiveJsonParserFactory,
	} = require('../../src/internal/permissive-json-parser');

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should be a function', () => {
		expect(typeof getAdapter).toBe('function');
	});

	it('should construct FastifyAdapter with default values when options are not provided', () => {
		// Arrange

		// Act
		const result = getAdapter();

		// Assert
		expect(FastifyAdapter).toHaveBeenCalledWith({
			http2: false,
			maxParamLength: 65 * 1024,
			bodyLimit: 50 * 1024 * 1024,
		});
		expect(result).toBeInstanceOf(FastifyAdapter);
	});

	it('should construct FastifyAdapter with custom values from options', () => {
		// Arrange
		const options = {
			http2: true,
			maxParamLengthKb: 10,
			bodyLimitMb: 1,
		};

		// Act
		getAdapter(options);

		// Assert
		expect(FastifyAdapter).toHaveBeenCalledWith({
			http2: true,
			maxParamLength: 10 * 1024,
			bodyLimit: 1 * 1024 * 1024,
		});
	});

	it('should call addGetBodyHook with instance and options', () => {
		// Arrange
		const options = { allowGetBody: true };

		// Act
		getAdapter(options);

		// Assert
		expect(addGetBodyHook).toHaveBeenCalledWith(
			expect.objectContaining({
				removeContentTypeParser: expect.any(Function),
				addContentTypeParser: expect.any(Function),
				initialConfig: expect.any(Object),
			}),
			options,
		);
	});

	it('should configure custom JSON parser', () => {
		// Arrange

		// Act
		getAdapter();

		// Assert
		const mockInstance = FastifyAdapter.mock.instances[0].getInstance();
		expect(mockInstance.removeContentTypeParser).toHaveBeenCalledWith(
			'application/json',
		);
		expect(permissiveJsonParserFactory).toHaveBeenCalledWith('error', 'error');
		expect(mockInstance.addContentTypeParser).toHaveBeenCalledWith(
			'application/json',
			{ parseAs: 'buffer' },
			'mockParserFunction',
		);
	});

	it('should use HTTP2_SERVER environment variable when http2 option is not provided', () => {
		// Arrange
		const originalEnv = process.env.HTTP2_SERVER;
		process.env.HTTP2_SERVER = 'true';

		try {
			// Act
			getAdapter();

			// Assert
			expect(FastifyAdapter).toHaveBeenCalledWith({
				http2: true,
				maxParamLength: 65 * 1024,
				bodyLimit: 50 * 1024 * 1024,
			});
		} finally {
			// Cleanup
			if (originalEnv !== undefined) {
				process.env.HTTP2_SERVER = originalEnv;
			} else {
				delete process.env.HTTP2_SERVER;
			}
		}
	});
});
