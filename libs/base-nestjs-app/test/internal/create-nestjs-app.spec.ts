import { createNestjsApp } from '../../src/internal/create-nestjs-app';

// Mock all dependencies
jest.mock('@nestjs/core');
jest.mock('../../src/internal/get-adapter');
jest.mock('../../src/internal/process-compression');
jest.mock('../../src/internal/create-module');

// Get mocked modules
const { NestFactory } = require('@nestjs/core');
const { getAdapter } = require('../../src/internal/get-adapter');
const {
	processCompression,
} = require('../../src/internal/process-compression');
const { createModule } = require('../../src/internal/create-module');

describe('createNestjsApp', () => {
	let mockApp: any;
	let mockAdapter: any;
	let mockAppModule: any;

	beforeEach(() => {
		jest.clearAllMocks();

		mockAdapter = { adapter: true };
		mockAppModule = { module: 'AppModule' };
		mockApp = {
			useGlobalFilters: jest.fn(),
			useGlobalGuards: jest.fn(),
			useGlobalInterceptors: jest.fn(),
			get: jest.fn(),
		};

		(getAdapter as jest.Mock).mockReturnValue(mockAdapter);
		(createModule as jest.Mock).mockReturnValue(mockAppModule);
		(NestFactory.create as jest.Mock).mockResolvedValue(mockApp);
	});

	it('should be a function', () => {
		expect(typeof createNestjsApp).toBe('function');
	});

	it('should create app with basic options', async () => {
		const options = {
			server: { port: 3000 },
			loggingModule: { nestLogger: ['log'] },
			imports: [],
			providers: [],
		} as any;

		const result = await createNestjsApp(options);

		expect(getAdapter).toHaveBeenCalledWith(options.server);
		expect(processCompression).toHaveBeenCalledWith(
			mockAdapter,
			options.server,
		);
		expect(createModule).toHaveBeenCalledWith(options);
		expect(NestFactory.create).toHaveBeenCalledWith(
			mockAppModule,
			mockAdapter,
			{
				logger: options.loggingModule.nestLogger,
				bodyParser: false,
			},
		);
		expect(result).toBe(mockApp);
	});

	it('should apply global filters when provided', async () => {
		const mockFilter = jest.fn();
		const options = {
			server: {},
			loggingModule: { nestLogger: [] },
			imports: [],
			providers: [],
			globals: {
				filters: [mockFilter],
			},
		} as any;

		mockApp.get.mockReturnValue('resolved-filter');

		await createNestjsApp(options);

		expect(mockApp.get).toHaveBeenCalledWith(mockFilter);
		expect(mockApp.useGlobalFilters).toHaveBeenCalledWith('resolved-filter');
	});

	it('should apply global guards when provided', async () => {
		const mockGuard = jest.fn();
		const options = {
			server: {},
			loggingModule: { nestLogger: [] },
			imports: [],
			providers: [],
			globals: {
				guards: [mockGuard],
			},
		} as any;

		mockApp.get.mockReturnValue('resolved-guard');

		await createNestjsApp(options);

		expect(mockApp.get).toHaveBeenCalledWith(mockGuard);
		expect(mockApp.useGlobalGuards).toHaveBeenCalledWith('resolved-guard');
	});

	it('should apply global interceptors when provided', async () => {
		const mockInterceptor = jest.fn();
		const options = {
			server: {},
			loggingModule: { nestLogger: [] },
			imports: [],
			providers: [],
			globals: {
				interceptors: [mockInterceptor],
			},
		} as any;

		mockApp.get.mockReturnValue('resolved-interceptor');

		await createNestjsApp(options);

		expect(mockApp.get).toHaveBeenCalledWith(mockInterceptor);
		expect(mockApp.useGlobalInterceptors).toHaveBeenCalledWith(
			'resolved-interceptor',
		);
	});

	it('should apply multiple globals of the same type', async () => {
		const mockFilter1 = jest.fn();
		const mockFilter2 = jest.fn();
		const options = {
			server: {},
			loggingModule: { nestLogger: [] },
			imports: [],
			providers: [],
			globals: {
				filters: [mockFilter1, mockFilter2],
			},
		} as any;

		mockApp.get
			.mockReturnValueOnce('resolved-filter1')
			.mockReturnValueOnce('resolved-filter2');

		await createNestjsApp(options);

		expect(mockApp.useGlobalFilters).toHaveBeenCalledWith(
			'resolved-filter1',
			'resolved-filter2',
		);
	});

	it('should skip globals that are not provided', async () => {
		const options = {
			server: {},
			loggingModule: { nestLogger: [] },
			imports: [],
			providers: [],
			globals: {
				filters: [],
				guards: undefined,
			},
		} as any;

		await createNestjsApp(options);

		expect(mockApp.useGlobalFilters).toHaveBeenCalledWith(); // Called with empty array (no args)
		expect(mockApp.useGlobalGuards).not.toHaveBeenCalled();
		expect(mockApp.useGlobalInterceptors).not.toHaveBeenCalled();
	});

	it('should handle missing globals object', async () => {
		const options = {
			server: {},
			loggingModule: { nestLogger: [] },
			imports: [],
			providers: [],
		} as any;

		await createNestjsApp(options);

		expect(mockApp.useGlobalFilters).not.toHaveBeenCalled();
		expect(mockApp.useGlobalGuards).not.toHaveBeenCalled();
		expect(mockApp.useGlobalInterceptors).not.toHaveBeenCalled();
	});
});
