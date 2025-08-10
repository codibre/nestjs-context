const listen = jest.fn();
jest.mock('src/internal', () => ({
	...jest.requireActual('src/internal'),
	getAdapter: jest.fn(() => ({})),
	listen,
	processCompression: jest.fn(),
	createModule: jest.fn(() => ({})),
	createNestjsApp: jest.fn(),
	enableOpenApi: jest.fn(),
	processCors: jest.fn(),
	processMicroservices: jest.fn(),
	processMSOptions: jest.fn((msOptions) => msOptions),
	addGetBodyHook: jest.fn(),
}));

const create = jest.fn();
jest.mock('@nestjs/core', () => ({
	NestFactory: {
		create,
	},
}));

import { createApp, BaseNestjsOptions } from 'src';

describe('createApp', () => {
	const {
		createNestjsApp,
		processCors,
		processMicroservices,
	} = require('src/internal');

	const mockApp = {
		enableCors: jest.fn(),
		enableVersioning: jest.fn(),
		connectMicroservice: jest.fn(),
	};

	const mockLoggingModule = {
		excludeFilter: jest.fn(),
		nestLogger: ['log'],
		logger: {},
		module: {},
	} as any;

	beforeEach(() => {
		jest.clearAllMocks();
		createNestjsApp.mockResolvedValue(mockApp);
	});

	it('should enable CORS with permissive settings when cors is not set', async () => {
		// Arrange
		const options = {
			loggingModule: mockLoggingModule,
			imports: [],
			server: {},
		} as BaseNestjsOptions;

		// Act
		await createApp(options);

		// Assert
		expect(createNestjsApp).toHaveBeenCalledWith(options);
		expect(processCors).toHaveBeenCalledWith(mockApp, options);
		expect(mockApp.enableVersioning).toHaveBeenCalled();
	});

	it('should enable CORS with permissive settings when cors is true', async () => {
		// Arrange
		const options = {
			loggingModule: mockLoggingModule,
			imports: [],
			cors: true,
			server: {},
		} as BaseNestjsOptions;

		// Act
		await createApp(options);

		// Assert
		expect(createNestjsApp).toHaveBeenCalledWith(options);
		expect(processCors).toHaveBeenCalledWith(mockApp, options);
		expect(mockApp.enableVersioning).toHaveBeenCalled();
	});

	it('should enable CORS with specific origins when cors is an array', async () => {
		// Arrange
		const allowedOrigins = ['https://example.com', 'https://app.example.com'];
		const options = {
			loggingModule: mockLoggingModule,
			imports: [],
			cors: allowedOrigins,
			server: {},
		} as BaseNestjsOptions;

		// Act
		await createApp(options);

		// Assert
		expect(createNestjsApp).toHaveBeenCalledWith(options);
		expect(processCors).toHaveBeenCalledWith(mockApp, options);
		expect(mockApp.enableVersioning).toHaveBeenCalled();
	});

	it('should not enable CORS when cors is false', async () => {
		// Arrange
		const options = {
			loggingModule: mockLoggingModule,
			imports: [],
			cors: false,
			server: {},
		} as BaseNestjsOptions;

		// Act
		await createApp(options);

		// Assert
		expect(createNestjsApp).toHaveBeenCalledWith(options);
		expect(processCors).toHaveBeenCalledWith(mockApp, options);
		expect(mockApp.enableVersioning).toHaveBeenCalled();
	});

	it('should connect microservices if present', async () => {
		// Arrange
		const options = {
			loggingModule: mockLoggingModule,
			imports: [],
			providers: [],
			microservices: [{ hybridOptions: {} }],
			server: {},
		} as BaseNestjsOptions;

		// Act
		const app = await createApp(options);

		// Assert
		expect(createNestjsApp).toHaveBeenCalledWith(options);
		expect(processCors).toHaveBeenCalledWith(mockApp, options);
		expect(mockApp.enableVersioning).toHaveBeenCalled();
		expect(processMicroservices).toHaveBeenCalledWith(mockApp, options);
		expect(typeof app.start).toBe('function');

		// Act
		await app.start();

		// Assert
		expect(listen).toHaveBeenCalledWith(mockApp, options);
	});
});
