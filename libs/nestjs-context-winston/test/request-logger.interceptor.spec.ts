import { ExecutionContext, CallHandler, Type } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { RequestLoggerInterceptor } from '../src/request-logger.interceptor';
import { BaseContextLogger } from '../src/base-context-logger';

describe('HttpRequestLoggerInterceptor', () => {
	let interceptor: RequestLoggerInterceptor;
	let mockLogger: jest.Mocked<BaseContextLogger<object>>;
	let mockExecutionContext: jest.Mocked<ExecutionContext>;
	let mockCallHandler: jest.Mocked<CallHandler>;
	let mockRequest: any;
	let mockResponse: any;
	let statusCodeCallback: jest.Mock;

	beforeEach(() => {
		// Mock logger
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn(),
			debug: jest.fn(),
			addDurationMeta: jest.fn(),
		} as any;

		// Mock request
		mockRequest = {
			method: 'GET',
			url: '/api/users/123',
			protocol: 'http',
			httpVersionMajor: 1,
		};

		// Mock response
		mockResponse = {
			statusCode: 200,
		};

		// Mock execution context
		mockExecutionContext = {
			getType: jest.fn().mockReturnValue('http'),
			switchToHttp: jest.fn().mockReturnValue({
				getRequest: jest.fn().mockReturnValue(mockRequest),
				getResponse: jest.fn().mockReturnValue(mockResponse),
			}),
			getClass: jest.fn(),
			getHandler: jest.fn(),
		} as any;

		// Mock call handler
		mockCallHandler = {
			handle: jest.fn().mockReturnValue(of('test response')),
		};

		// Mock statusCodeCallback
		statusCodeCallback = jest.fn().mockReturnValue(500);

		interceptor = new RequestLoggerInterceptor(mockLogger, {
			statusCodeCallback,
		} as any);

		// Reset mocks
		jest.clearAllMocks();
	});

	describe('intercept', () => {
		it('should intercept HTTP requests and log response information', (done) => {
			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
					expect(mockLogger.info).toHaveBeenCalledWith(
						expect.stringMatching(
							/^GET \/api\/users\/123 HTTP\/1 200 \d+(\.\d+)?ms$/,
						),
						{
							requestPath: '/api/users/123',
							responseStatusCode: 200,
							errorMessage: undefined,
						},
					);
					done();
				},
			});
		});

		it('should not intercept non-HTTP contexts', (done) => {
			// Arrange
			mockExecutionContext.getType.mockReturnValue('ws');
			mockExecutionContext.getClass.mockReturnValue(undefined as any);
			mockExecutionContext.getHandler.mockReturnValue({
				name: undefined,
			} as any);

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
					expect(mockLogger.info).toHaveBeenCalledWith(
						expect.stringMatching(/^RPC Call RPC 0 \d+(\.\d+)?ms$/),
						{
							requestPath: 'Call',
							responseStatusCode: 0,
							errorMessage: undefined,
						},
					);
					done();
				},
			});
		});

		it('should log error responses correctly', (done) => {
			// Arrange
			mockResponse.statusCode = 500;

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockLogger.error).toHaveBeenCalledWith(
						expect.stringMatching(
							/^GET \/api\/users\/123 HTTP\/1 500 \d+(\.\d+)?ms$/,
						),
						{
							requestPath: '/api/users/123',
							responseStatusCode: 500,
							errorMessage: undefined,
						},
					);
					done();
				},
			});
		});

		it('should log warning for 4xx status codes', (done) => {
			// Arrange
			mockResponse.statusCode = 404;

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockLogger.warn).toHaveBeenCalledWith(
						expect.stringMatching(
							/^GET \/api\/users\/123 HTTP\/1 404 \d+(\.\d+)?ms$/,
						),
						{
							requestPath: '/api/users/123',
							responseStatusCode: 404,
							errorMessage: undefined,
						},
					);
					done();
				},
			});
		});

		it('should log even when handler throws error', (done) => {
			// Arrange
			const testError = new Error('Test error');
			mockCallHandler.handle.mockReturnValue(throwError(() => testError));
			mockResponse.statusCode = 500;

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				error: (error) => {
					expect(error).toBe(testError);
					expect(mockLogger.error).toHaveBeenCalledWith(
						expect.stringMatching(
							/^GET \/api\/users\/123 HTTP\/1 500 \d+(\.\d+)?ms$/,
						),
						{
							requestPath: '/api/users/123',
							responseStatusCode: 500,
							errorMessage: 'Test error',
						},
					);
					done();
				},
			});
		});

		it('should handle different HTTP methods correctly', (done) => {
			// Arrange
			mockRequest.method = 'POST';
			mockRequest.url = '/api/orders';
			mockResponse.statusCode = 201;

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockLogger.info).toHaveBeenCalledWith(
						expect.stringMatching(
							/^POST \/api\/orders HTTP\/1 201 \d+(\.\d+)?ms$/,
						),
						{
							requestPath: '/api/orders',
							responseStatusCode: 201,
							errorMessage: undefined,
						},
					);
					done();
				},
			});
		});

		it('should handle HTTPS protocol correctly', (done) => {
			// Arrange
			mockRequest.protocol = 'https';

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockLogger.info).toHaveBeenCalledWith(
						expect.stringMatching(
							/^GET \/api\/users\/123 HTTPS\/1 200 \d+(\.\d+)?ms$/,
						),
						{
							requestPath: '/api/users/123',
							responseStatusCode: 200,
							errorMessage: undefined,
						},
					);
					done();
				},
			});
		});

		it('should handle HTTP/2 correctly', (done) => {
			// Arrange
			mockRequest.httpVersionMajor = 2;

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockLogger.info).toHaveBeenCalledWith(
						expect.stringMatching(
							/^GET \/api\/users\/123 HTTP\/2 200 \d+(\.\d+)?ms$/,
						),
						{
							requestPath: '/api/users/123',
							responseStatusCode: 200,
							errorMessage: undefined,
						},
					);
					done();
				},
			});
		});
	});

	describe('AUTO_REQUEST_LOG environment variable', () => {
		let originalRequestLog: boolean;

		beforeEach(() => {
			// Store original value
			originalRequestLog = (RequestLoggerInterceptor as any).REQUEST_LOG;
		});

		afterEach(() => {
			// Restore original value
			(RequestLoggerInterceptor as any).REQUEST_LOG = originalRequestLog;
		});

		it('should log when REQUEST_LOG is true (default behavior)', (done) => {
			// Arrange
			(RequestLoggerInterceptor as any).REQUEST_LOG = true;

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockLogger.info).toHaveBeenCalledWith(
						expect.stringMatching(
							/^GET \/api\/users\/123 HTTP\/1 200 \d+(\.\d+)?ms$/,
						),
						{
							requestPath: '/api/users/123',
							responseStatusCode: 200,
							errorMessage: undefined,
						},
					);
					done();
				},
			});
		});

		it('should not log when REQUEST_LOG is false', (done) => {
			// Arrange
			(RequestLoggerInterceptor as any).REQUEST_LOG = false;

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockCallHandler.handle).toHaveBeenCalledTimes(1);
					// Should not call any logging methods
					expect(mockLogger.info).not.toHaveBeenCalled();
					expect(mockLogger.warn).not.toHaveBeenCalled();
					expect(mockLogger.error).not.toHaveBeenCalled();
					done();
				},
			});
		});

		it('should not log HTTP responses when REQUEST_LOG is false', (done) => {
			// Arrange
			(RequestLoggerInterceptor as any).REQUEST_LOG = false;
			mockResponse.statusCode = 500;

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					// Should not call any logging methods even for errors
					expect(mockLogger.info).not.toHaveBeenCalled();
					expect(mockLogger.warn).not.toHaveBeenCalled();
					expect(mockLogger.error).not.toHaveBeenCalled();
					done();
				},
			});
		});

		it('should not log RPC responses when REQUEST_LOG is false', (done) => {
			// Arrange
			(RequestLoggerInterceptor as any).REQUEST_LOG = false;
			mockExecutionContext.getType.mockReturnValue('rpc');
			mockExecutionContext.getClass.mockReturnValue({
				name: 'TestService',
			} as any);
			mockExecutionContext.getHandler.mockReturnValue({
				name: 'testMethod',
			} as any);

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					// Should not call any logging methods
					expect(mockLogger.info).not.toHaveBeenCalled();
					expect(mockLogger.warn).not.toHaveBeenCalled();
					expect(mockLogger.error).not.toHaveBeenCalled();
					done();
				},
			});
		});

		it('should not log when REQUEST_LOG is false', (done) => {
			// Arrange
			(RequestLoggerInterceptor as any).REQUEST_LOG = false;
			const testError = new Error('Test error');
			mockCallHandler.handle.mockReturnValue(throwError(() => testError));

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				error: (error) => {
					expect(error).toBe(testError);
					// Should not log the error
					expect(mockLogger.error).not.toHaveBeenCalled();
					// But should still finish transaction
					done();
				},
			});
		});
	});

	describe('edge cases', () => {
		it('should handle URLs with query parameters', (done) => {
			// Arrange
			mockRequest.url = '/api/users?page=1&limit=10';

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockLogger.info).toHaveBeenCalledWith(
						expect.stringMatching(
							/^GET \/api\/users\?page=1&limit=10 HTTP\/1 200 \d+(\.\d+)?ms$/,
						),
						{
							requestPath: '/api/users?page=1&limit=10',
							responseStatusCode: 200,
							errorMessage: undefined,
						},
					);
					done();
				},
			});
		});

		it('should handle missing httpVersionMajor property', (done) => {
			// Arrange
			delete mockRequest.httpVersionMajor;

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockLogger.info).toHaveBeenCalledWith(
						expect.stringMatching(
							/^GET \/api\/users\/123 HTTP\/x 200 \d+(\.\d+)?ms$/,
						),
						{
							requestPath: '/api/users/123',
							responseStatusCode: 200,
							errorMessage: undefined,
						},
					);
					done();
				},
			});
		});

		it('should handle missing httpVersionMajor but with raw.httpVersionMajor', (done) => {
			// Arrange
			delete mockRequest.httpVersionMajor;
			mockRequest.raw = { httpVersionMajor: 2 };

			// Act
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockLogger.info).toHaveBeenCalledWith(
						expect.stringMatching(
							/^GET \/api\/users\/123 HTTP\/2 200 \d+(\.\d+)?ms$/,
						),
						{
							requestPath: '/api/users/123',
							responseStatusCode: 200,
							errorMessage: undefined,
						},
					);
					done();
				},
			});
		});
	});

	describe('RPC context', () => {
		beforeEach(() => {
			mockExecutionContext.getType.mockReturnValue('rpc');
			mockExecutionContext.getClass.mockReturnValue({
				name: 'TestService',
			} as Type);
			mockExecutionContext.getHandler.mockReturnValue({
				name: 'testMethod',
			} as Type);
		});

		it('should log info for successful RPC call', (done) => {
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);
			result$.subscribe({
				next: (value) => {
					expect(value).toBe('test response');
					expect(mockLogger.info).toHaveBeenCalledWith(
						expect.stringMatching(
							/^TestService testMethod RPC 0 \d+(\.\d+)?ms$/,
						),
						expect.objectContaining({
							requestPath: 'testMethod',
							responseStatusCode: 0,
							errorMessage: undefined,
						}),
					);
					done();
				},
			});
		});

		it('should log error for failed RPC call', (done) => {
			const testError = new Error('RPC error');
			mockCallHandler.handle.mockReturnValue(throwError(() => testError));
			const result$ = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);
			result$.subscribe({
				error: (err) => {
					expect(err).toBe(testError);
					expect(mockLogger.error).toHaveBeenCalledWith(
						expect.stringMatching(
							/^TestService testMethod RPC 1 \d+(\.\d+)?ms$/,
						),
						expect.objectContaining({
							requestPath: 'testMethod',
							responseStatusCode: 1,
							errorMessage: 'RPC error',
						}),
					);
					done();
				},
			});
		});
	});

	it('should use statusCodeCallback for error to determine status code and log type', (done) => {
		// Arrange
		const testError = new Error('Test error');
		statusCodeCallback.mockReturnValue(503);
		mockCallHandler.handle.mockReturnValue(throwError(() => testError));
		mockResponse.statusCode = 500;

		// Act
		const result$ = interceptor.intercept(
			mockExecutionContext,
			mockCallHandler,
		);

		// Assert
		result$.subscribe({
			error: (error) => {
				expect(error).toBe(testError);
				expect(statusCodeCallback).toHaveBeenCalledWith(testError);
				expect(mockLogger.error).toHaveBeenCalledWith(
					expect.stringMatching(
						/^GET \/api\/users\/123 HTTP\/1 503 \d+(\.\d+)?ms$/,
					),
					{
						requestPath: '/api/users/123',
						responseStatusCode: 503,
						errorMessage: 'Test error',
					},
				);
				done();
			},
		});
	});

	describe('RPC context edge cases', () => {
		beforeEach(() => {
			mockExecutionContext.getType.mockReturnValue('rpc');
		});

		it('should handle RPC context with null class name', (done) => {
			// Arrange
			mockExecutionContext.getClass.mockReturnValue(undefined as any);
			const mockHandler = function testMethod() {
				// Mock function
			};
			mockExecutionContext.getHandler.mockReturnValue(mockHandler);

			// Act
			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result.subscribe({
				next: () => {
					expect(mockLogger.info).toHaveBeenCalledWith(
						expect.stringMatching(/^RPC testMethod RPC 0 \d+(\.\d+)?ms$/),
						expect.any(Object),
					);
					done();
				},
			});
		});

		it('should handle RPC context with null handler name', (done) => {
			// Arrange
			class TestService {}
			mockExecutionContext.getClass.mockReturnValue(TestService as any);
			mockExecutionContext.getHandler.mockReturnValue(undefined as any);

			// Act
			const result = interceptor.intercept(
				mockExecutionContext,
				mockCallHandler,
			);

			// Assert
			result.subscribe({
				next: () => {
					expect(mockLogger.info).toHaveBeenCalledWith(
						expect.stringMatching(/^TestService Call RPC 0 \d+(\.\d+)?ms$/),
						expect.any(Object),
					);
					done();
				},
			});
		});
	});
});
