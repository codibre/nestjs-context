const listen = jest.fn();
jest.mock('../src/internal', () => ({
	getAdapter: jest.fn(() => ({})),
	listen,
	processCompression: jest.fn(),
	createModule: jest.fn(() => ({})),
	enableOpenApi: jest.fn(),
	processMSOptions: jest.fn((msOptions) => msOptions),
	addGetBodyHook: jest.fn(),
}));

const create = jest.fn();
jest.mock('@nestjs/core', () => ({
	NestFactory: {
		create,
	},
}));

import { createApp, DEFAULT_PORT } from '../src';
import { BaseNestjsOptions } from '../src';

describe('createApp', () => {
	const mockApp = {
		enableCors: jest.fn(),
		enableVersioning: jest.fn(),
		connectMicroservice: jest.fn(),
	};

	beforeEach(() => {
		jest.clearAllMocks();
		create.mockResolvedValue(mockApp);
	});

	it('should export DEFAULT_PORT', () => {
		expect(DEFAULT_PORT).toBe(3000);
	});

	it('should enable CORS with permissive settings when cors is not set', async () => {
		// Arrange
		const options = {
			loggingModule: {} as any,
			imports: [],
			server: {},
		} as BaseNestjsOptions;

		// Act
		await createApp(options);

		// Assert
		expect(mockApp.enableCors).toHaveBeenCalledWith({
			origin: true,
			credentials: true,
		});
	});

	it('should enable CORS with permissive settings when cors is true', async () => {
		// Arrange
		const options = {
			loggingModule: {} as any,
			imports: [],
			cors: true,
			server: {},
		} as BaseNestjsOptions;

		// Act
		await createApp(options);

		// Assert
		expect(mockApp.enableCors).toHaveBeenCalledWith({
			origin: true,
			credentials: true,
		});
	});

	it('should enable CORS with specific origins when cors is an array', async () => {
		// Arrange
		const allowedOrigins = ['https://example.com', 'https://app.example.com'];
		const options = {
			loggingModule: {} as any,
			imports: [],
			cors: allowedOrigins,
			server: {},
		} as BaseNestjsOptions;

		// Act
		await createApp(options);

		// Assert
		expect(mockApp.enableCors).toHaveBeenCalledWith({
			origin: allowedOrigins,
			credentials: true,
		});
	});

	it('should not enable CORS when cors is false', async () => {
		// Arrange
		const options = {
			loggingModule: {} as any,
			imports: [],
			cors: false,
			server: {},
		} as BaseNestjsOptions;

		// Act
		await createApp(options);

		// Assert
		expect(mockApp.enableCors).not.toHaveBeenCalled();
	});

	it('should connect microservices if present', async () => {
		// Arrange
		const options = {
			loggingModule: {} as any,
			imports: [],
			providers: [],
			microservices: [{ hybridOptions: {} }],
			server: {},
		} as BaseNestjsOptions;

		// Act
		const app = await createApp(options);

		// Assert
		expect(mockApp.connectMicroservice).toHaveBeenCalledWith(
			{ hybridOptions: {} },
			{ inheritAppConfig: true },
		);
		expect(typeof app.start).toBe('function');

		// Act
		await app.start();

		// Assert
		expect(listen).toHaveBeenCalledWith(mockApp, options);
	});
});
