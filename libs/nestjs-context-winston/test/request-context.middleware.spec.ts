import { NestJsContextLoggerMiddleware } from '../src/nestjs-context-logger.middleware';
import { Request, Response, NextFunction } from 'express';
import { BaseContextLogger } from '../src/base-context-logger';
import { ContextLoggingOptions } from '../src/context-logging-options';

// Mock functions for the internal module
const mockGetLogExecutionMeta = jest.fn();
const mockLogHttpResponse = jest.fn();

jest.mock('../src/internal', () => ({
	...jest.requireActual('../src/internal'),
	getLogExecutionMeta: () => mockGetLogExecutionMeta(),
	logHttpResponse: (...args: unknown[]) => mockLogHttpResponse(...args),
}));

describe(NestJsContextLoggerMiddleware.name, () => {
	let middleware: NestJsContextLoggerMiddleware;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockNext: jest.MockedFunction<NextFunction>;
	let mockLogger: BaseContextLogger<object>;
	let mockOptions: ContextLoggingOptions<BaseContextLogger<object>>;

	beforeEach(() => {
		// Reset mocks
		mockGetLogExecutionMeta.mockReset();
		mockLogHttpResponse.mockReset();

		// Default implementation - no interceptor called
		mockGetLogExecutionMeta.mockReturnValue({ loggerInterceptorCalled: false });

		// Arrange
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			addDurationMeta: jest.fn(),
		} as unknown as BaseContextLogger<object>;

		mockOptions = {
			logClass: class extends BaseContextLogger<object> {},
		};

		middleware = new NestJsContextLoggerMiddleware(mockLogger, mockOptions);

		mockRequest = {
			url: '/test',
			method: 'GET',
		};

		const eventListeners: Record<string, Function> = {};
		mockResponse = {
			once: jest.fn((event: string, handler: Function) => {
				eventListeners[event] = handler;
				return mockResponse as Response;
			}),
			emit: jest.fn((event: string, ...args: unknown[]) => {
				if (eventListeners[event]) {
					eventListeners[event](...args);
				}
				return true;
			}),
		};

		mockNext = jest.fn();
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('should call next() to continue the request', () => {
		// Act
		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		// Assert
		expect(mockNext).toHaveBeenCalledTimes(1);
	});

	it('should register finish event listener', () => {
		// Act
		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		// Assert
		expect(mockResponse.once).toHaveBeenCalledWith(
			'finish',
			expect.any(Function),
		);
	});

	it('should execute cleanup when response finishes', () => {
		// Arrange
		let cleanupCalled = false;
		const eventListeners: Record<string, Function> = {};
		mockResponse.once = jest.fn((event: string, handler: Function) => {
			eventListeners[event] = () => {
				cleanupCalled = true;
				handler();
			};
			return mockResponse as Response;
		});

		// Act
		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		// Simulate response finish
		mockResponse.statusCode = 200;
		if (eventListeners['finish']) {
			eventListeners['finish']();
		}

		// Assert
		expect(cleanupCalled).toBe(true);
	});

	it('should not fail if response does not have event methods', () => {
		// Arrange
		const responseWithoutEvents = {};

		// Act & Assert - should not throw
		expect(() => {
			middleware.use(
				mockRequest as Request,
				responseWithoutEvents as Response,
				mockNext,
			);
		}).not.toThrow();

		expect(mockNext).toHaveBeenCalledTimes(1);
	});

	it('should log error using logger.error when cleanup throws', () => {
		// Arrange
		const eventListeners: Record<string, Function> = {};
		mockResponse.once = jest.fn((event: string, handler: Function) => {
			eventListeners[event] = handler;
			return mockResponse as Response;
		});

		// Mock logHttpResponse to throw an error
		mockLogHttpResponse.mockImplementation(() => {
			throw new Error('Logging failed');
		});

		// Act
		middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

		// Simulate response finish
		mockResponse.statusCode = 200;
		if (eventListeners['finish']) {
			eventListeners['finish']();
		}

		// Assert
		expect(mockLogger.error).toHaveBeenCalledWith(
			'Error in middleware logging: Logging failed',
		);
	});
});
